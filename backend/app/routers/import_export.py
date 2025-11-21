"""
Import/Export API Router

Provides endpoints for bulk data import/export operations.
Supports Excel and CSV formats for users, students, courses, enrollments, and grades.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Literal
import io
from datetime import datetime

from app.core.database import get_db
from app.models import User, Campus, Major
from app.models.role import Role
from app.core.security import verify_firebase_token, require_roles
from app.services.import_export_service import import_export_service
from app.models.user import UserRole
from pydantic import BaseModel
from sqlalchemy import select


router = APIRouter(prefix="/import-export", tags=["Import/Export"])


# ==================== HELPER ENDPOINTS ====================

@router.get("/reference-data")
async def get_reference_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_firebase_token)
):
    """
    Get reference data for CSV imports (campus codes, major codes, role codes)
    
    Returns lists of valid campuses, majors, and roles with their codes for CSV import.
    All codes are stable business keys that won't change if data is recreated.
    """
    # Get campuses
    campus_result = await db.execute(
        select(Campus.id, Campus.code, Campus.name)
        .where(Campus.is_active == True)
        .order_by(Campus.code)
    )
    campuses = [
        {"id": row[0], "code": row[1], "name": row[2]}
        for row in campus_result.all()
    ]
    
    # Get majors
    major_result = await db.execute(
        select(Major.id, Major.code, Major.name)
        .where(Major.is_active == True)
        .order_by(Major.code)
    )
    majors = [
        {"id": row[0], "code": row[1], "name": row[2]}
        for row in major_result.all()
    ]
    
    # Get roles - only if code column exists
    try:
        role_result = await db.execute(
            select(Role.id, Role.code, Role.name, Role.description)
            .order_by(Role.code)
        )
        roles = [
            {"id": row[0], "code": row[1], "name": row[2], "description": row[3]}
            for row in role_result.all()
        ]
    except Exception:
        # Fallback if code column doesn't exist yet (migration not run)
        role_result = await db.execute(
            select(Role.id, Role.name, Role.description)
            .order_by(Role.name)
        )
        roles = [
            {"id": row[0], "code": "N/A", "name": row[1], "description": row[2]}
            for row in role_result.all()
        ]
    
    return {
        "campuses": campuses,
        "majors": majors,
        "roles": roles,
        "note": "Use codes (not IDs) in CSV imports for stability across environments"
    }


# ==================== REQUEST/RESPONSE MODELS ====================

class ValidationResponse(BaseModel):
    """Response model for validation results"""
    valid: bool
    errors: list[str]
    warnings: list[str]
    row_count: int


class ImportResponse(BaseModel):
    """Response model for import operations"""
    success: bool
    imported: int
    skipped: int
    errors: list[str]
    total_rows: int
    message: str


class ImportProgress(BaseModel):
    """Progress tracking for background imports"""
    task_id: str
    status: str
    progress: float
    message: str


# ==================== VALIDATION ENDPOINTS ====================

@router.post("/validate/{entity_type}", response_model=ValidationResponse)
async def validate_import_file(
    entity_type: Literal["users", "students", "courses", "enrollments", "grades"],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN]))
):
    """
    Validate import file before processing
    
    - **entity_type**: Type of data to validate (users, students, courses, enrollments, grades)
    - **file**: Excel (.xlsx) or CSV (.csv) file to validate
    
    Returns validation results with errors and warnings.
    """
    try:
        # Parse file
        df = import_export_service.parse_upload_file(file.file, file.filename)
        
        # Validate data
        validation_result = await import_export_service.validate_import_data(
            df, entity_type, db
        )
        
        return ValidationResponse(**validation_result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


# ==================== IMPORT ENDPOINTS ====================

@router.post("/import/users", response_model=ImportResponse)
async def import_users(
    file: UploadFile = File(...),
    skip_existing: bool = Query(True, description="Skip users with existing usernames"),
    validate_only: bool = Query(False, description="Only validate, do not import"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN]))
):
    """
    Import users from Excel or CSV file with automatic username generation
    
    **Required columns:** full_name, role
    **For students (additional required):** campus_id, major_id, year_entered
    **For teachers (additional required):** campus_id
    **Optional columns:** email (personal), phone_number
    
    **Valid roles:** student, teacher, admin, super_admin, academic_admin, 
    registrar, content_admin, finance_admin, support_admin
    
    **Note:** 
    - Usernames are automatically generated (e.g., NguyenVA250001)
    - Default password = username
    - Greenwich email auto-generated: username@greenwich.edu.vn
    - Firebase accounts created automatically
    """
    try:
        # Parse file
        df = import_export_service.parse_upload_file(file.file, file.filename)
        
        # Validate data
        validation = await import_export_service.validate_import_data(df, "users", db)
        
        if not validation["valid"]:
            return ImportResponse(
                success=False,
                imported=0,
                skipped=0,
                errors=validation["errors"],
                total_rows=validation["row_count"],
                message="Validation failed. Please fix errors and try again."
            )
        
        if validate_only:
            return ImportResponse(
                success=True,
                imported=0,
                skipped=0,
                errors=[],
                total_rows=validation["row_count"],
                message=f"Validation successful. {validation['row_count']} rows ready to import."
            )
        
        # Import users
        result = await import_export_service.import_users(df, db, skip_existing)
        
        return ImportResponse(
            success=True,
            imported=result["imported"],
            skipped=result["skipped"],
            errors=result["errors"],
            total_rows=result["total_rows"],
            message=f"Successfully imported {result['imported']} users. Skipped {result['skipped']}."
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/import/students", response_model=ImportResponse)
async def import_students(
    file: UploadFile = File(...),
    skip_existing: bool = Query(True, description="Skip students with existing student IDs"),
    validate_only: bool = Query(False, description="Only validate, do not import"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR]))
):
    """
    Import students from Excel or CSV file
    
    **Required columns:** user_id, student_id, date_of_birth
    **Optional columns:** gender, admission_date, graduation_date, status
    """
    try:
        # Parse file
        df = import_export_service.parse_upload_file(file.file, file.filename)
        
        # Validate data
        validation = await import_export_service.validate_import_data(df, "students", db)
        
        if not validation["valid"]:
            return ImportResponse(
                success=False,
                imported=0,
                skipped=0,
                errors=validation["errors"],
                total_rows=validation["row_count"],
                message="Validation failed. Please fix errors and try again."
            )
        
        if validate_only:
            return ImportResponse(
                success=True,
                imported=0,
                skipped=0,
                errors=[],
                total_rows=validation["row_count"],
                message=f"Validation successful. {validation['row_count']} rows ready to import."
            )
        
        # Import students
        result = await import_export_service.import_students(df, db, skip_existing)
        
        return ImportResponse(
            success=True,
            imported=result["imported"],
            skipped=result["skipped"],
            errors=result["errors"],
            total_rows=result["total_rows"],
            message=f"Successfully imported {result['imported']} students. Skipped {result['skipped']}."
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/import/courses", response_model=ImportResponse)
async def import_courses(
    file: UploadFile = File(...),
    skip_existing: bool = Query(True, description="Skip courses with existing course codes"),
    validate_only: bool = Query(False, description="Only validate, do not import"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN]))
):
    """
    Import courses from Excel or CSV file
    
    **Required columns:** course_code, course_name, credits, department_id
    **Optional columns:** description, is_active
    """
    try:
        # Parse file
        df = import_export_service.parse_upload_file(file.file, file.filename)
        
        # Validate data
        validation = await import_export_service.validate_import_data(df, "courses", db)
        
        if not validation["valid"]:
            return ImportResponse(
                success=False,
                imported=0,
                skipped=0,
                errors=validation["errors"],
                total_rows=validation["row_count"],
                message="Validation failed. Please fix errors and try again."
            )
        
        if validate_only:
            return ImportResponse(
                success=True,
                imported=0,
                skipped=0,
                errors=[],
                total_rows=validation["row_count"],
                message=f"Validation successful. {validation['row_count']} rows ready to import."
            )
        
        # Import courses
        result = await import_export_service.import_courses(df, db, skip_existing)
        
        return ImportResponse(
            success=True,
            imported=result["imported"],
            skipped=result["skipped"],
            errors=result["errors"],
            total_rows=result["total_rows"],
            message=f"Successfully imported {result['imported']} courses. Skipped {result['skipped']}."
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/import/enrollments", response_model=ImportResponse)
async def import_enrollments(
    file: UploadFile = File(...),
    skip_existing: bool = Query(True, description="Skip existing enrollments"),
    validate_only: bool = Query(False, description="Only validate, do not import"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR]))
):
    """
    Import enrollments from Excel or CSV file
    
    **Required columns:** student_id, schedule_id
    **Optional columns:** enrollment_date, status
    """
    try:
        # Parse file
        df = import_export_service.parse_upload_file(file.file, file.filename)
        
        # Validate data
        validation = await import_export_service.validate_import_data(df, "enrollments", db)
        
        if not validation["valid"]:
            return ImportResponse(
                success=False,
                imported=0,
                skipped=0,
                errors=validation["errors"],
                total_rows=validation["row_count"],
                message="Validation failed. Please fix errors and try again."
            )
        
        if validate_only:
            return ImportResponse(
                success=True,
                imported=0,
                skipped=0,
                errors=[],
                total_rows=validation["row_count"],
                message=f"Validation successful. {validation['row_count']} rows ready to import."
            )
        
        # Import enrollments
        result = await import_export_service.import_enrollments(df, db, skip_existing)
        
        return ImportResponse(
            success=True,
            imported=result["imported"],
            skipped=result["skipped"],
            errors=result["errors"],
            total_rows=result["total_rows"],
            message=f"Successfully imported {result['imported']} enrollments. Skipped {result['skipped']}."
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# ==================== EXPORT ENDPOINTS ====================

@router.get("/export/users")
async def export_users(
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Export format"),
    role_filter: Optional[str] = Query(None, description="Filter by role"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN]))
):
    """
    Export all users to Excel or CSV file
    
    - **format**: xlsx or csv
    - **role_filter**: Optional role filter (super_admin, academic_admin, teacher, student, parent)
    """
    try:
        # Export users
        file_content = await import_export_service.export_users(db, format, role_filter)
        
        # Prepare response
        filename = f"users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/students")
async def export_students(
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Export format"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR]))
):
    """
    Export all students to Excel or CSV file
    
    - **format**: xlsx or csv
    - **status_filter**: Optional status filter (active, graduated, suspended)
    """
    try:
        # Export students
        file_content = await import_export_service.export_students(db, format, status_filter)
        
        # Prepare response
        filename = f"students_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/courses")
async def export_courses(
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Export format"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.TEACHER]))
):
    """
    Export all courses to Excel or CSV file
    
    - **format**: xlsx or csv
    - **department_id**: Optional department filter
    """
    try:
        # Export courses
        file_content = await import_export_service.export_courses(db, format, department_id)
        
        # Prepare response
        filename = f"courses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/enrollments")
async def export_enrollments(
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Export format"),
    semester_id: Optional[int] = Query(None, description="Filter by semester ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR]))
):
    """
    Export all enrollments to Excel or CSV file
    
    - **format**: xlsx or csv
    - **semester_id**: Optional semester filter
    """
    try:
        # Export enrollments
        file_content = await import_export_service.export_enrollments(db, format, semester_id)
        
        # Prepare response
        filename = f"enrollments_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/grades")
async def export_grades(
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Export format"),
    semester_id: Optional[int] = Query(None, description="Filter by semester ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR, UserRole.TEACHER]))
):
    """
    Export all grades to Excel or CSV file
    
    - **format**: xlsx or csv
    - **semester_id**: Optional semester filter
    - **student_id**: Optional student filter
    """
    try:
        # Export grades
        file_content = await import_export_service.export_grades(db, format, semester_id, student_id)
        
        # Prepare response
        filename = f"grades_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# ==================== TEMPLATE ENDPOINTS ====================

@router.get("/templates/{entity_type}")
async def get_import_template(
    entity_type: Literal["users", "students", "courses", "enrollments", "grades"],
    format: Literal["xlsx", "csv"] = Query("xlsx", description="Template format"),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ACADEMIC_ADMIN, UserRole.REGISTRAR]))
):
    """
    Download import template with sample data and instructions
    
    - **entity_type**: Type of template (users, students, courses, enrollments, grades)
    - **format**: xlsx or csv
    
    Templates include:
    - Sample data row
    - Column headers with descriptions
    - Instructions sheet (Excel only)
    - Data format guidelines
    """
    try:
        # Generate template
        file_content = import_export_service.generate_import_template(entity_type, format)
        
        # Prepare response
        filename = f"{entity_type}_import_template.{format}"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")


@router.get("/templates")
async def list_available_templates(
    current_user: dict = Depends(verify_firebase_token)
):
    """
    List all available import templates
    
    Returns information about each template including:
    - Entity type
    - Required columns
    - Optional columns
    - Sample data
    """
    templates = [
        {
            "entity_type": "users",
            "description": "Import users (all roles)",
            "required_columns": ["email", "full_name", "role"],
            "optional_columns": ["password", "is_active", "phone_number", "address"],
            "valid_roles": ["super_admin", "academic_admin", "registrar", "teacher", "student", "parent"],
            "max_batch_size": 1000
        },
        {
            "entity_type": "students",
            "description": "Import student records",
            "required_columns": ["user_id", "student_id", "date_of_birth"],
            "optional_columns": ["gender", "admission_date", "graduation_date", "status"],
            "max_batch_size": 1000
        },
        {
            "entity_type": "courses",
            "description": "Import course catalog",
            "required_columns": ["course_code", "course_name", "credits", "department_id"],
            "optional_columns": ["description", "is_active"],
            "max_batch_size": 1000
        },
        {
            "entity_type": "enrollments",
            "description": "Import student enrollments",
            "required_columns": ["student_id", "schedule_id"],
            "optional_columns": ["enrollment_date", "status"],
            "max_batch_size": 1000
        },
        {
            "entity_type": "grades",
            "description": "Import student grades",
            "required_columns": ["enrollment_id", "grade_value"],
            "optional_columns": ["grade_type", "weight"],
            "max_batch_size": 1000
        }
    ]
    
    return {
        "templates": templates,
        "supported_formats": ["xlsx", "csv"],
        "max_batch_size": 1000
    }
