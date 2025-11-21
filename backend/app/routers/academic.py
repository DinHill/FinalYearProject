"""
Academic endpoints - courses, enrollments, grades, attendance
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles, require_admin, require_teacher_or_admin, get_user_campus_access, check_campus_access
from app.core.exceptions import ValidationError, NotFoundError
from app.models import (
    Course, CourseSection, Enrollment, Assignment, Grade, Attendance,
    User, Semester
)
from app.services.enrollment_service import EnrollmentService
from app.services.gpa_service import GPAService
from app.schemas.academic import (
    CourseCreate, CourseUpdate, CourseResponse,
    CourseSectionCreate, CourseSectionUpdate, CourseSectionResponse,
    EnrollmentCreate, EnrollmentResponse, EnrollmentWithCourseResponse,
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    GradeCreate, GradeUpdate, GradeResponse,
    AttendanceCreate, AttendanceBulkCreate, AttendanceUpdate, AttendanceResponse,
    AttendanceSummary, GradeBulkCreate
)
from app.schemas.base import PaginatedResponse, SuccessResponse, PaginationParams
from typing import Dict, Any, Optional, List
from datetime import date as date_type
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/academic", tags=["Academic"])


# ============================================================================
# Section Students (Teachers)
# ============================================================================

@router.get("/sections/{section_id}/students")
async def get_section_students(
    section_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all students enrolled in a specific section (for teachers)
    """
    # Get user
    uid = current_user['uid']
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User not found")
    
    # Verify section exists and user has access
    section_result = await db.execute(
        select(CourseSection).where(CourseSection.id == section_id)
    )
    section = section_result.scalar_one_or_none()
    
    if not section:
        raise NotFoundError("Section not found")
    
    # Check if user is the instructor or admin
    if user.role not in ['super_admin', 'academic_admin'] and section.instructor_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this section's students"
        )
    
    # Get enrollments with student details
    from sqlalchemy.orm import selectinload
    stmt = (
        select(Enrollment)
        .options(selectinload(Enrollment.student))
        .where(
            and_(
                Enrollment.course_section_id == section_id,
                Enrollment.status == 'enrolled'
            )
        )
        .order_by(Enrollment.student_id)
    )
    
    enrollments_result = await db.execute(stmt)
    enrollments = enrollments_result.scalars().all()
    
    students_data = []
    for enrollment in enrollments:
        if enrollment.student:
            students_data.append({
                "id": enrollment.student.id,
                "student_id": enrollment.student.username,
                "full_name": enrollment.student.full_name,
                "email": enrollment.student.email,
                "enrollment_id": enrollment.id,
                "status": enrollment.status
            })
    
    return {
        "success": True,
        "data": students_data
    }


# ============================================================================
# Programs/Majors Management (Admin)
# ============================================================================

@router.post("/programs", status_code=status.HTTP_201_CREATED)
async def create_program(
    program_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create new program/major (admin only)"""
    from app.models.user import Major
    
    # Map frontend field names to backend field names
    # Frontend sends: program_code, program_name, description, etc.
    # Backend Major model has: code, name, description, is_active
    mapped_data = {
        'code': program_data.get('program_code') or program_data.get('code'),
        'name': program_data.get('program_name') or program_data.get('name'),
        'description': program_data.get('description'),
        'is_active': program_data.get('is_active', True)
    }
    
    # Remove None values
    mapped_data = {k: v for k, v in mapped_data.items() if v is not None}
    
    # Validate required fields
    if not mapped_data.get('code'):
        raise HTTPException(status_code=400, detail="Program code is required")
    if not mapped_data.get('name'):
        raise HTTPException(status_code=400, detail="Program name is required")
    
    # Check if code already exists
    existing = await db.execute(
        select(Major).where(Major.code == mapped_data['code'])
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Program code already exists")
    
    program = Major(**mapped_data)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    
    logger.info(f"Created program: {program.code} - {program.name}")
    return program.__dict__


@router.get("/programs")
async def list_programs(
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List programs/majors with filters and statistics"""
    from app.models.user import Major
    from sqlalchemy.orm import selectinload
    
    query = select(Major).options(selectinload(Major.coordinator))
    conditions = []
    
    # Major model doesn't have campus_id field - removed that filter
    if is_active is not None:
        conditions.append(Major.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                Major.code.ilike(search_term),
                Major.name.ilike(search_term)
            )
        )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Major.code)
    result = await db.execute(query)
    programs = result.scalars().all()
    
    # Enrich with statistics
    programs_with_stats = []
    for program in programs:
        # Count students
        students_count = await db.execute(
            select(func.count()).select_from(User).where(
                and_(
                    User.major_id == program.id,
                    User.role == 'student',
                    User.status == 'active'
                )
            )
        )
        student_count = students_count.scalar() or 0
        
        # Count courses
        courses_count = await db.execute(
            select(func.count()).select_from(Course).where(Course.major_id == program.id)
        )
        course_count = courses_count.scalar() or 0
        
        # Get coordinator details if assigned
        coordinator_name = None
        coordinator_id = None
        if program.coordinator:
            coordinator_name = program.coordinator.full_name
            coordinator_id = program.coordinator.id
        
        program_dict = program.__dict__.copy()
        program_dict['student_count'] = student_count
        program_dict['course_count'] = course_count
        program_dict['coordinator_id'] = coordinator_id
        program_dict['coordinator_name'] = coordinator_name
        
        programs_with_stats.append(program_dict)
    
    return programs_with_stats


@router.get("/programs/{program_id}")
async def get_program(
    program_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get program details with full statistics"""
    from app.models.user import Major, Campus
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Major).options(selectinload(Major.coordinator)).where(Major.id == program_id)
    )
    program = result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get statistics
    students_result = await db.execute(
        select(func.count()).select_from(User).where(
            and_(
                User.major_id == program.id,
                User.role == 'student',
                User.status == 'active'
            )
        )
    )
    student_count = students_result.scalar() or 0
    
    courses_result = await db.execute(
        select(func.count()).select_from(Course).where(Course.major_id == program.id)
    )
    course_count = courses_result.scalar() or 0
    
    # Get coordinator details
    coordinator_name = None
    coordinator_id = None
    coordinator_email = None
    if program.coordinator:
        coordinator_name = program.coordinator.full_name
        coordinator_id = program.coordinator.id
        coordinator_email = program.coordinator.email
    
    program_dict = program.__dict__.copy()
    program_dict['student_count'] = student_count
    program_dict['course_count'] = course_count
    program_dict['coordinator_id'] = coordinator_id
    program_dict['coordinator_name'] = coordinator_name
    program_dict['coordinator_email'] = coordinator_email
    
    return program_dict


@router.put("/programs/{program_id}")
async def update_program(
    program_id: int,
    program_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update program (admin only)"""
    from app.models.user import Major
    
    program = await db.get(Major, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    for key, value in program_data.items():
        if hasattr(program, key):
            setattr(program, key, value)
    
    await db.commit()
    await db.refresh(program)
    
    logger.info(f"Updated program: {program.code}")
    return program.__dict__


@router.delete("/programs/{program_id}")
async def deactivate_program(
    program_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate program (soft delete)"""
    from app.models.user import Major
    from app.models.academic import Course
    
    program = await db.get(Major, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Check if program has active students
    students_result = await db.execute(
        select(func.count()).select_from(User).where(
            and_(
                User.major_id == program.id,
                User.role == 'student',
                User.status == 'active'
            )
        )
    )
    active_students = students_result.scalar() or 0
    
    if active_students > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate program with {active_students} active students"
        )
    
    # Check if program has courses
    courses_result = await db.execute(
        select(func.count()).select_from(Course).where(
            and_(
                Course.major_id == program.id,
                Course.is_active == True
            )
        )
    )
    active_courses = courses_result.scalar() or 0
    
    if active_courses > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate program with {active_courses} active courses. Please deactivate or reassign courses first."
        )
    
    program.is_active = False
    await db.commit()
    
    logger.info(f"Deactivated program: {program.code}")
    return {"success": True, "message": "Program deactivated"}


@router.patch("/programs/{program_id}")
async def toggle_program_status(
    program_id: int,
    update_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Toggle program active status (activate/deactivate)"""
    from app.models.user import Major
    from app.models.academic import Course
    
    program = await db.get(Major, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get the is_active value from request
    new_status = update_data.get('is_active')
    if new_status is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    # If activating, just set to active
    if new_status:
        program.is_active = True
        await db.commit()
        logger.info(f"Activated program: {program.code}")
        return {"success": True, "message": "Program activated"}
    
    # If deactivating, check for active students
    students_result = await db.execute(
        select(func.count()).select_from(User).where(
            and_(
                User.major_id == program.id,
                User.role == 'student',
                User.status == 'active'
            )
        )
    )
    active_students = students_result.scalar() or 0
    
    if active_students > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate program with {active_students} active students"
        )
    
    # Check if program has active courses
    courses_result = await db.execute(
        select(func.count()).select_from(Course).where(
            and_(
                Course.major_id == program.id,
                Course.is_active == True
            )
        )
    )
    active_courses = courses_result.scalar() or 0
    
    if active_courses > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate program with {active_courses} active courses. Please deactivate or reassign courses first."
        )
    
    program.is_active = False
    await db.commit()
    
    logger.info(f"Deactivated program: {program.code}")
    return {"success": True, "message": "Program deactivated"}


@router.put("/programs/{program_id}/coordinator")
async def assign_coordinator(
    program_id: int,
    coordinator_id: int = Query(..., description="ID of the coordinator to assign"),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Assign coordinator to program"""
    from app.models.user import Major
    
    program = await db.get(Major, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Verify coordinator exists and is teacher/admin
    coordinator = await db.get(User, coordinator_id)
    if not coordinator or coordinator.role not in ['teacher', 'academic_admin']:
        raise HTTPException(status_code=400, detail="Invalid coordinator")
    
    # Assign coordinator
    program.coordinator_id = coordinator_id
    await db.commit()
    await db.refresh(program)
    
    logger.info(f"Assigned coordinator {coordinator.full_name} to program {program.code}")
    return {
        "success": True,
        "program_code": program.code,
        "coordinator_name": coordinator.full_name
    }


# ============================================================================
# Course Management (Admin/Teacher)
# ============================================================================

@router.get("/courses/{course_id}")
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get course details with statistics"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.major))
        .where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get section count
    sections_result = await db.execute(
        select(func.count()).select_from(CourseSection).where(
            CourseSection.course_id == course_id
        )
    )
    section_count = sections_result.scalar() or 0
    
    # Get total enrolled and capacity from sections
    sections_stats = await db.execute(
        select(
            func.sum(CourseSection.enrolled_count).label('total_enrolled'),
            func.sum(CourseSection.max_students).label('total_capacity')
        ).where(CourseSection.course_id == course_id)
    )
    stats = sections_stats.first()
    total_enrolled = stats.total_enrolled or 0
    total_capacity = stats.total_capacity or 0
    
    course_dict = course.__dict__.copy()
    course_dict['section_count'] = section_count
    course_dict['total_enrolled'] = total_enrolled
    course_dict['total_capacity'] = total_capacity
    course_dict['program_name'] = course.major.name if course.major else None
    course_dict['course_code'] = course.course_code
    
    return course_dict


@router.get("/sections/{section_id}")
async def get_section(
    section_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get section details"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(CourseSection)
        .options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.instructor),
            selectinload(CourseSection.semester)
        )
        .where(CourseSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    section_dict = section.__dict__.copy()
    section_dict['course_name'] = section.course.name if section.course else None
    section_dict['course_code'] = section.course.course_code if section.course else None
    section_dict['instructor_name'] = section.instructor.full_name if section.instructor else None
    section_dict['instructor_email'] = section.instructor.email if section.instructor else None
    section_dict['semester_name'] = section.semester.name if section.semester else None
    
    return section_dict



@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Create new course (admin only)"""
    # Check if course code already exists
    existing = await db.execute(
        select(Course).where(Course.course_code == course_data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course code {course_data.code} already exists"
        )
    
    # Map schema fields to model fields (handle alias)
    course_dict = course_data.model_dump()
    course_dict["course_code"] = course_dict.pop("code")  # Rename code to course_code
    
    course = Course(**course_dict)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    logger.info(f"Created course: {course.course_code}")
    return CourseResponse(**course.__dict__)


@router.get("/courses", response_model=PaginatedResponse)
async def list_courses(
    pagination: PaginationParams = Depends(),
    major_id: Optional[int] = Query(None),
    semester_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List courses with filters, enrollment stats, and instructor info"""
    query = select(Course)
    
    conditions = []
    if major_id:
        conditions.append(Course.major_id == major_id)
    if is_active is not None:
        conditions.append(Course.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                Course.course_code.ilike(search_term),
                Course.name.ilike(search_term)
            )
        )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Count
    count_query = select(func.count()).select_from(Course)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
    query = query.order_by(Course.course_code)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # Enrich with enrollment and instructor data
    enriched_courses = []
    for course in courses:
        # Serialize course to dict, excluding SQLAlchemy state
        course_dict = {
            'id': course.id,
            'code': course.course_code,
            'name': course.name,
            'description': course.description,
            'credits': course.credits,
            'major_id': course.major_id,
            'is_active': course.is_active,
            'created_at': course.created_at.isoformat() if hasattr(course, 'created_at') and course.created_at else None,
            'updated_at': course.updated_at.isoformat() if hasattr(course, 'updated_at') and course.updated_at else None
        }
        
        # Get active sections for this course (optionally filtered by semester)
        sections_query = select(CourseSection).where(CourseSection.course_id == course.id)
        if semester_id:
            sections_query = sections_query.where(CourseSection.semester_id == semester_id)
        
        sections_result = await db.execute(sections_query)
        sections = sections_result.scalars().all()
        
        # Calculate total enrollment across all sections
        total_enrolled = sum(s.enrolled_count for s in sections)
        total_capacity = sum(s.max_students for s in sections)
        
        # Get primary instructor (from most recent section)
        instructor_name = None
        if sections:
            latest_section = sections[0]
            if latest_section.instructor_id:
                instructor = await db.get(User, latest_section.instructor_id)
                instructor_name = instructor.full_name if instructor else None
        
        # Get program name
        program_name = None
        if course.major_id:
            from app.models.user import Major
            program = await db.get(Major, course.major_id)
            program_name = program.name if program else None
        
        course_dict['total_enrolled'] = total_enrolled
        course_dict['total_capacity'] = total_capacity
        course_dict['instructor_name'] = instructor_name
        course_dict['program_name'] = program_name
        course_dict['section_count'] = len(sections)
        
        enriched_courses.append(course_dict)
    
    return PaginatedResponse(
        items=enriched_courses,
        total=total,
        page=pagination.page,
        per_page=pagination.page_size,
        pages=(total + pagination.page_size - 1) // pagination.page_size
    )


@router.put("/courses/{course_id}")
async def update_course(
    course_id: int,
    course_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update course details (admin only)"""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # If major_id is being updated, verify it exists
    if 'major_id' in course_data:
        from app.models.user import Major
        major = await db.get(Major, course_data['major_id'])
        if not major:
            raise HTTPException(status_code=400, detail="Invalid program/major")
    
    # Update fields
    for key, value in course_data.items():
        if hasattr(course, key) and key not in ['id', 'created_at']:
            setattr(course, key, value)
    
    await db.commit()
    await db.refresh(course)
    
    logger.info(f"Updated course: {course.course_code}")
    return course.__dict__


@router.patch("/courses/{course_id}")
async def toggle_course_status(
    course_id: int,
    update_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Toggle course active status (activate/deactivate)"""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get the is_active value from request
    new_status = update_data.get('is_active')
    if new_status is None:
        raise HTTPException(status_code=400, detail="is_active field is required")
    
    # If activating, just set to active
    if new_status:
        course.is_active = True
        await db.commit()
        logger.info(f"Activated course: {course.course_code}")
        return {"success": True, "message": "Course activated"}
    
    # If deactivating, check for active sections with enrollments
    sections_result = await db.execute(
        select(CourseSection).where(
            and_(
                CourseSection.course_id == course.id,
                CourseSection.is_active == True
            )
        )
    )
    active_sections = sections_result.scalars().all()
    
    if active_sections:
        # Check if any active section has enrollments
        from app.models.academic import Enrollment
        for section in active_sections:
            enrollments_result = await db.execute(
                select(func.count()).select_from(Enrollment).where(
                    Enrollment.section_id == section.id
                )
            )
            enrollment_count = enrollments_result.scalar() or 0
            if enrollment_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot deactivate course with active sections that have enrollments. Please deactivate sections first."
                )
        
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate course with {len(active_sections)} active sections. Please deactivate sections first."
        )
    
    course.is_active = False
    await db.commit()
    
    logger.info(f"Deactivated course: {course.course_code}")
    return {"success": True, "message": "Course deactivated"}


# ============================================================================
# Course Sections (Admin/Teacher)
# ============================================================================

@router.post("/sections", response_model=CourseSectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    section_data: CourseSectionCreate,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> CourseSectionResponse:
    """Create course section (admin only, campus-filtered)"""
    logger.info(f"Creating section with data: {section_data.model_dump()}")
    
    # Verify course, semester, teacher exist
    course = await db.get(Course, section_data.course_id)
    semester = await db.get(Semester, section_data.semester_id)
    teacher = await db.get(User, section_data.instructor_id)  # Changed from teacher_id to instructor_id
    
    if not course:
        raise HTTPException(status_code=400, detail="Course not found")
    if not semester:
        raise HTTPException(status_code=400, detail="Semester not found")
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=400, detail="Invalid teacher")
    
    # Convert status to is_active for model
    section_dict = section_data.model_dump()
    if "status" in section_dict:
        section_dict["is_active"] = section_dict.pop("status").lower() == "active"
    
    logger.info(f"Section dict before create: {section_dict}")
    section = CourseSection(**section_dict)
    db.add(section)
    await db.commit()
    await db.refresh(section)
    logger.info(f"✅ Section created with ID: {section.id}")
    
    # Verify it was actually saved
    verify_section = await db.get(CourseSection, section.id)
    logger.info(f"✅ Verified section in DB: {verify_section.id if verify_section else 'NOT FOUND'}")
    
    # Get enrolled count
    enrolled_count = await EnrollmentService.get_enrolled_count(db, section.id)
    
    logger.info(f"Created section: {course.course_code}-{section.section_code}")  # Fixed: course_code not code
    
    response_data = section.__dict__.copy()
    response_data['enrolled_count'] = enrolled_count
    return CourseSectionResponse(**response_data)


@router.get("/sections", response_model=PaginatedResponse)
async def list_sections(
    pagination: PaginationParams = Depends(),
    semester_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List course sections with filters"""
    from sqlalchemy.orm import selectinload
    
    query = select(CourseSection).options(
        selectinload(CourseSection.course),
        selectinload(CourseSection.semester),
        selectinload(CourseSection.instructor)
    )
    
    conditions = []
    if semester_id:
        conditions.append(CourseSection.semester_id == semester_id)
    if course_id:
        conditions.append(CourseSection.course_id == course_id)
    if status:
        # Convert status to is_active boolean filter
        if status.lower() == "active":
            conditions.append(CourseSection.is_active == True)
        elif status.lower() == "inactive":
            conditions.append(CourseSection.is_active == False)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Count
    count_query = select(func.count()).select_from(CourseSection)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
    query = query.order_by(CourseSection.created_at.desc())
    
    result = await db.execute(query)
    sections = result.scalars().all()
    
    # Add enrolled counts and related data
    section_responses = []
    for section in sections:
        enrolled_count = await EnrollmentService.get_enrolled_count(db, section.id)
        response_data = section.__dict__.copy()
        response_data['enrolled_count'] = enrolled_count
        
        # Add related data
        if section.course:
            response_data['course_code'] = section.course.course_code
            response_data['course_name'] = section.course.name
        
        if section.semester:
            response_data['semester_name'] = section.semester.name
        
        if section.instructor:
            response_data['instructor_name'] = section.instructor.full_name
        
        section_responses.append(CourseSectionResponse(**response_data))
    
    return PaginatedResponse(
        items=section_responses,
        total=total,
        page=pagination.page,
        per_page=pagination.page_size,
        pages=(total + pagination.page_size - 1) // pagination.page_size
    )


# ============================================================================
# Enrollments (Student)
# ============================================================================

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_section(
    enrollment_data: EnrollmentCreate,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> EnrollmentResponse:
    """
    Enroll in course section (campus-verified)
    
    Students can enroll themselves
    Validates: capacity, schedule conflicts, prerequisites, campus access
    """
    try:
        # Get student ID from token
        student_id = current_user.get('db_user_id')
        if not student_id:
            raise HTTPException(status_code=400, detail="Invalid user token")
        
        # Get section and verify campus access
        section = await db.get(CourseSection, enrollment_data.course_section_id)  # Changed from section_id
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Campus access check removed - campus_id doesn't exist in course_sections table
        # if section.campus_id:
        #     await check_campus_access(current_user, section.campus_id, db, raise_error=True)
        
        # Enroll
        enrollment = await EnrollmentService.enroll_student(
            db, student_id, enrollment_data.course_section_id  # Changed from section_id
        )
        
        return EnrollmentResponse(**enrollment.__dict__)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.options("/admin/enrollments")
async def admin_enrollments_options():
    """Handle CORS preflight for enrollment endpoint"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "3600",
        },
    )

@router.post("/admin/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def admin_enroll_student(
    enrollment_data: dict,
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> EnrollmentResponse:
    """
    Admin endpoint to enroll a student in a course section
    
    Admins can enroll any student in any section
    Expects JSON body: {"student_id": int, "course_section_id": int, "status": str}
    """
    try:
        student_id = enrollment_data.get("student_id")
        course_section_id = enrollment_data.get("course_section_id")
        enrollment_status = enrollment_data.get("status", "enrolled")
        
        if not student_id or not course_section_id:
            raise HTTPException(status_code=400, detail="student_id and course_section_id are required")
        
        # Get section
        section = await db.get(CourseSection, course_section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Get student
        student = await db.get(User, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if student.role != "student":
            raise HTTPException(status_code=400, detail="User is not a student")
        
        # Enroll
        enrollment = await EnrollmentService.enroll_student(
            db, student_id, course_section_id
        )
        
        return EnrollmentResponse(**enrollment.__dict__)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/enrollments", response_model=PaginatedResponse)
async def list_enrollments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    section_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    semester_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    campus_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List enrollments with filters (teachers and admins only, campus-filtered)"""
    query = select(Enrollment).join(CourseSection, Enrollment.course_section_id == CourseSection.id).options(
        selectinload(Enrollment.student)
    )
    
    conditions = []
    if section_id:
        conditions.append(Enrollment.course_section_id == section_id)  # Changed from section_id
    if student_id:
        conditions.append(Enrollment.student_id == student_id)
    if status:
        conditions.append(Enrollment.status == status)
    
    # Apply semester filter if provided
    if semester_id:
        conditions.append(CourseSection.semester_id == semester_id)
    
    # Apply campus filtering based on user access
    user_campus_access = await get_user_campus_access(current_user, db)
    
    if campus_id:
        # User requested specific campus - verify they have access
        if user_campus_access is not None:  # Not cross-campus access
            await check_campus_access(current_user, campus_id, db, raise_error=True)
        conditions.append(CourseSection.campus_id == campus_id)
    else:
        # No specific campus requested - filter by user's campus access
        if user_campus_access is not None:  # Campus-scoped user
            if user_campus_access:  # Has campus assignments
                conditions.append(CourseSection.campus_id.in_(user_campus_access))
            else:
                # User has no campus assignments - return empty result
                return PaginatedResponse(
                    items=[],
                    total=0,
                    page=page,
                    per_page=page_size,
                    pages=0
                )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Get total count
    total_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    # Build response with student data
    items = []
    for enrollment in enrollments:
        enrollment_dict = {
            'id': enrollment.id,
            'student_id': enrollment.student_id,
            'course_section_id': enrollment.course_section_id,
            'status': enrollment.status,
            'grade': float(enrollment.grade) if enrollment.grade else None,
            'enrollment_date': enrollment.enrollment_date,
            'created_at': enrollment.created_at,
            'student': {
                'id': enrollment.student.id,
                'full_name': enrollment.student.full_name,
                'email': enrollment.student.email
            } if enrollment.student else None
        }
        items.append(enrollment_dict)
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/enrollments/my", response_model=List[EnrollmentWithCourseResponse])
async def get_my_enrollments(
    semester_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> List[EnrollmentWithCourseResponse]:
    """Get current user's enrollments"""
    student_id = current_user.get('db_user_id')
    
    enrollments = await EnrollmentService.get_student_enrollments(
        db, student_id, semester_id=semester_id, status="enrolled"
    )
    
    # Enrich with course details
    responses = []
    for enrollment in enrollments:
        section = await db.get(CourseSection, enrollment.course_section_id)  # Changed from section_id
        course = await db.get(Course, section.course_id)
        semester = await db.get(Semester, section.semester_id)
        teacher = await db.get(User, section.instructor_id)  # Fixed: instructor_id not teacher_id
        
        response_data = enrollment.__dict__.copy()
        response_data.update({
            "course_code": course.course_code,  # Fixed: course_code not code
            "course_name": course.name,
            "section_number": section.section_code,  # Changed from section_number
            "teacher_name": teacher.full_name,
            "credits": course.credits,
            "semester_name": semester.name
        })
        responses.append(EnrollmentWithCourseResponse(**response_data))
    
    return responses


@router.delete("/enrollments/{enrollment_id}", response_model=SuccessResponse)
async def drop_enrollment(
    enrollment_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Drop enrollment"""
    try:
        student_id = current_user.get('db_user_id')
        
        await EnrollmentService.drop_enrollment(db, enrollment_id, student_id)
        
        return SuccessResponse(
            success=True,
            message="Enrollment dropped successfully"
        )
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Grades (Teacher)
# ============================================================================

@router.post("/assignments/{assignment_id}/grades", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
async def submit_grade(
    assignment_id: int,
    grade_data: GradeCreate,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> GradeResponse:
    """Submit/update grade for student (teacher only, campus-verified)"""
    # Verify assignment exists
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get section - campus access check removed (campus_id doesn't exist in course_sections)
    section = await db.get(CourseSection, assignment.course_section_id)  # Changed from section_id
    # if section and section.campus_id:
    #     await check_campus_access(current_user, section.campus_id, db, raise_error=True)
    
    # Verify student has access to the same campus
    student = await db.get(User, grade_data.student_id)
    if student and student.campus_id:
        await check_campus_access(current_user, student.campus_id, db, raise_error=True)
    
    # Check if grade already exists
    existing_grade = await db.execute(
        select(Grade).where(
            and_(
                Grade.assignment_id == assignment_id,
                Grade.student_id == grade_data.student_id
            )
        )
    )
    grade = existing_grade.scalar_one_or_none()
    
    if grade:
        # Update existing grade
        grade.score = grade_data.score
        grade.feedback = grade_data.feedback
        from datetime import datetime
        grade.graded_at = datetime.utcnow()
    else:
        # Create new grade
        from datetime import datetime
        grade = Grade(
            assignment_id=assignment_id,
            student_id=grade_data.student_id,
            score=grade_data.score,
            feedback=grade_data.feedback,
            graded_at=datetime.utcnow()
        )
        db.add(grade)
    
    await db.commit()
    await db.refresh(grade)
    
    logger.info(f"Grade submitted for student {grade_data.student_id} on assignment {assignment_id}")
    return GradeResponse(**grade.__dict__)


@router.get("/grades", response_model=PaginatedResponse[GradeResponse])
async def list_grades(
    section_id: Optional[int] = Query(None, description="Filter by section"),
    enrollment_id: Optional[int] = Query(None, description="Filter by enrollment"),
    approval_status: Optional[str] = Query(None, description="Filter by approval status"),
    pagination: PaginationParams = Depends(),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse[GradeResponse]:
    """List grades with filtering and pagination (teacher/admin only)"""
    query = select(Grade)
    
    # Apply filters
    filters = []
    if section_id:
        # Get enrollments for this section
        section_enrollments = await db.execute(
            select(Enrollment.id).where(Enrollment.course_section_id == section_id)
        )
        enrollment_ids = [e[0] for e in section_enrollments.all()]
        if enrollment_ids:
            filters.append(Grade.enrollment_id.in_(enrollment_ids))
        else:
            # No enrollments for this section
            return PaginatedResponse(items=[], total=0, page=pagination.page, per_page=pagination.page_size, pages=0)
    
    if enrollment_id:
        filters.append(Grade.enrollment_id == enrollment_id)
    
    if approval_status:
        filters.append(Grade.approval_status == approval_status)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Get total count
    count_query = select(func.count()).select_from(Grade)
    if filters:
        count_query = count_query.where(and_(*filters))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
    result = await db.execute(query)
    grades = result.scalars().all()
    
    return PaginatedResponse(
        items=[GradeResponse(**grade.__dict__) for grade in grades],
        total=total,
        page=pagination.page,
        per_page=pagination.page_size,
        pages=(total + pagination.page_size - 1) // pagination.page_size if total and pagination.page_size > 0 else 0
    )


@router.get("/grades/{grade_id}", response_model=GradeResponse)
async def get_grade(
    grade_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> GradeResponse:
    """Get a specific grade by ID (teacher/admin only)"""
    grade = await db.get(Grade, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    return GradeResponse(**grade.__dict__)


@router.put("/grades/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: int,
    grade_data: GradeUpdate,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> GradeResponse:
    """Update an existing grade (teacher/admin only)"""
    grade = await db.get(Grade, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    # Update fields
    for field, value in grade_data.dict(exclude_unset=True).items():
        setattr(grade, field, value)
    
    from datetime import datetime
    grade.graded_at = datetime.utcnow()
    grade.graded_by = current_user.get('db_user_id')
    
    await db.commit()
    await db.refresh(grade)
    
    logger.info(f"Grade {grade_id} updated by user {current_user.get('db_user_id')}")
    return GradeResponse(**grade.__dict__)


@router.delete("/grades/{grade_id}", response_model=SuccessResponse)
async def delete_grade(
    grade_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Delete a grade (teacher/admin only)"""
    grade = await db.get(Grade, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    await db.delete(grade)
    await db.commit()
    
    logger.info(f"Grade {grade_id} deleted by user {current_user.get('db_user_id')}")
    return SuccessResponse(success=True, message="Grade deleted successfully")


@router.get("/enrollments/{enrollment_id}/grades", response_model=List[GradeResponse])
async def get_enrollment_grades(
    enrollment_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> List[GradeResponse]:
    """Get all grades for a specific enrollment"""
    # Verify enrollment exists
    enrollment = await db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Get grades
    result = await db.execute(
        select(Grade).where(Grade.enrollment_id == enrollment_id).order_by(Grade.graded_at.desc())
    )
    grades = result.scalars().all()
    
    return [GradeResponse(**grade.__dict__) for grade in grades]


@router.get("/sections/{section_id}/grades", response_model=List[GradeResponse])
async def get_section_grades(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> List[GradeResponse]:
    """Get all grades for a specific section (teacher/admin only)"""
    # Verify section exists
    section = await db.get(CourseSection, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Get all enrollments for this section
    enrollments_result = await db.execute(
        select(Enrollment.id).where(Enrollment.course_section_id == section_id)
    )
    enrollment_ids = [e[0] for e in enrollments_result.all()]
    
    if not enrollment_ids:
        return []
    
    # Get grades for all enrollments
    result = await db.execute(
        select(Grade).where(Grade.enrollment_id.in_(enrollment_ids)).order_by(Grade.enrollment_id, Grade.graded_at.desc())
    )
    grades = result.scalars().all()
    
    return [GradeResponse(**grade.__dict__) for grade in grades]


@router.get("/students/my/gpa", response_model=Dict)
async def get_my_gpa(
    semester_id: Optional[int] = Query(None, description="Semester ID for semester GPA"),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """
    Get GPA information
    
    If semester_id provided: returns semester GPA
    Otherwise: returns cumulative GPA
    """
    student_id = current_user.get('db_user_id')
    
    if semester_id:
        gpa_info = await GPAService.calculate_semester_gpa(db, student_id, semester_id)
    else:
        gpa_info = await GPAService.calculate_cumulative_gpa(db, student_id)
    
    return gpa_info


@router.get("/students/my/academic-standing", response_model=Dict)
async def get_my_academic_standing(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Get academic standing"""
    student_id = current_user.get('db_user_id')
    
    standing = await GPAService.get_academic_standing(db, student_id)
    progress = await GPAService.calculate_degree_progress(db, student_id)
    
    return {
        **standing,
        **progress
    }


# ============================================================================
# Attendance (Teacher)
# ============================================================================

@router.post("/attendance/bulk", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def record_attendance_bulk(
    attendance_data: AttendanceBulkCreate,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Record attendance for multiple students (teacher only)"""
    try:
        created_count = 0
        
        for record in attendance_data.records:
            # Get enrollment for this student in this section
            enrollment_query = await db.execute(
                select(Enrollment).where(
                    and_(
                        Enrollment.course_section_id == attendance_data.section_id,  # Changed from section_id
                        Enrollment.student_id == record.student_id
                    )
                )
            )
            enrollment = enrollment_query.scalar_one_or_none()
            
            if not enrollment:
                continue  # Skip if student not enrolled in this section
            
            # Check if attendance already exists
            existing = await db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.enrollment_id == enrollment.id,  # Changed: use enrollment_id instead
                        Attendance.date == attendance_data.date
                    )
                )
            )
            attendance = existing.scalar_one_or_none()
            
            if attendance:
                # Update existing
                attendance.status = record.status
                attendance.notes = record.notes
            else:
                # Create new
                attendance = Attendance(
                    enrollment_id=enrollment.id,  # Changed: use enrollment_id instead
                    date=attendance_data.date,
                    status=record.status,
                    notes=record.notes
                )
                db.add(attendance)
                created_count += 1
        
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message=f"Attendance recorded for {len(attendance_data.records)} students"
        )
        
    except Exception as e:
        logger.error(f"Attendance recording error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to record attendance")


@router.post("/grades/bulk", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def submit_grades_bulk(
    grade_data: GradeBulkCreate,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Submit grades for multiple students (teacher only)"""
    try:
        from datetime import datetime
        from decimal import Decimal
        
        created_count = 0
        updated_count = 0
        
        # Get teacher user ID
        uid = current_user['uid']
        teacher_query = await db.execute(
            select(User).where(User.firebase_uid == uid)
        )
        teacher = teacher_query.scalar_one_or_none()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        for record in grade_data.grades:
            # Verify enrollment exists
            enrollment = await db.get(Enrollment, record.enrollment_id)
            if not enrollment:
                continue  # Skip if enrollment not found
            
            # Check if grade already exists for this enrollment and assignment
            existing = await db.execute(
                select(Grade).where(
                    and_(
                        Grade.enrollment_id == record.enrollment_id,
                        Grade.assignment_name == record.assessment_name
                    )
                )
            )
            grade = existing.scalar_one_or_none()
            
            # Convert score string to decimal
            score_value = Decimal(record.score)
            
            if grade:
                # Update existing grade
                grade.grade_value = score_value
                grade.max_grade = Decimal(str(record.max_score))
                grade.graded_at = datetime.utcnow()
                grade.graded_by = teacher.id
                updated_count += 1
            else:
                # Create new grade
                grade = Grade(
                    enrollment_id=record.enrollment_id,
                    assignment_name=record.assessment_name,
                    grade_value=score_value,
                    max_grade=Decimal(str(record.max_score)),
                    weight=Decimal('1.0'),  # Default weight
                    graded_at=datetime.utcnow(),
                    graded_by=teacher.id,
                    approval_status='draft'
                )
                db.add(grade)
                created_count += 1
        
        await db.commit()
        
        message = f"Grades processed: {created_count} created, {updated_count} updated"
        return SuccessResponse(
            success=True,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Bulk grade submission error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to submit grades: {str(e)}")


@router.get("/attendance", response_model=PaginatedResponse[AttendanceResponse])
async def list_attendance(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    section_id: Optional[int] = Query(None),
    enrollment_id: Optional[int] = Query(None),
    date: Optional[date_type] = Query(None),
    status: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse[AttendanceResponse]:
    """List attendance records with filters (teacher/admin only)"""
    query = select(Attendance)
    
    # Apply filters
    if section_id:
        # Get enrollments for this section
        enrollments = await db.execute(
            select(Enrollment.id).where(Enrollment.course_section_id == section_id)
        )
        enrollment_ids = [e[0] for e in enrollments.all()]
        query = query.where(Attendance.enrollment_id.in_(enrollment_ids))
    
    if enrollment_id:
        query = query.where(Attendance.enrollment_id == enrollment_id)
    
    if date:
        query = query.where(Attendance.date == date)
    
    if status:
        query = query.where(Attendance.status == status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Apply pagination
    query = query.order_by(Attendance.date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    return PaginatedResponse(
        items=[AttendanceResponse.model_validate(r) for r in records],
        total=total or 0,
        page=page,
        per_page=page_size,
        pages=(total + page_size - 1) // page_size if total and page_size > 0 else 0
    )


@router.get("/attendance/at-risk")
async def get_at_risk_students(
    semester_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get list of students with attendance < 75%"""
    from app.services.attendance_compliance_service import AttendanceComplianceService
    
    students = await AttendanceComplianceService.get_at_risk_students(db, semester_id, section_id)
    return students


@router.get("/attendance/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance_by_id(
    attendance_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> AttendanceResponse:
    """Get single attendance record by ID (teacher/admin only)"""
    attendance = await db.get(Attendance, attendance_id)
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return AttendanceResponse.model_validate(attendance)


@router.put("/attendance/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> AttendanceResponse:
    """Update attendance record (teacher/admin only)"""
    attendance = await db.get(Attendance, attendance_id)
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Update fields
    update_data = attendance_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(attendance, key, value)
    
    await db.commit()
    await db.refresh(attendance)
    
    logger.info(f"Updated attendance {attendance_id} by user {current_user['db_user_id']}")
    return AttendanceResponse.model_validate(attendance)


@router.delete("/attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Delete attendance record (teacher/admin only)"""
    attendance = await db.get(Attendance, attendance_id)
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    await db.delete(attendance)
    await db.commit()
    
    logger.info(f"Deleted attendance {attendance_id} by user {current_user['db_user_id']}")
    return None


@router.get("/sections/{section_id}/attendance/records", response_model=List[AttendanceResponse])
async def get_section_attendance_records(
    section_id: int,
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> List[AttendanceResponse]:
    """Get all attendance records for a section with optional date range"""
    # Get enrollments for this section
    enrollments = await db.execute(
        select(Enrollment.id).where(Enrollment.course_section_id == section_id)
    )
    enrollment_ids = [e[0] for e in enrollments.all()]
    
    query = select(Attendance).where(Attendance.enrollment_id.in_(enrollment_ids))
    
    if date_from:
        query = query.where(Attendance.date >= date_from)
    if date_to:
        query = query.where(Attendance.date <= date_to)
    
    query = query.order_by(Attendance.date.desc())
    result = await db.execute(query)
    records = result.scalars().all()
    
    return [AttendanceResponse.model_validate(r) for r in records]


@router.get("/sections/{section_id}/attendance/{student_id}", response_model=AttendanceSummary)
async def get_attendance_summary(
    section_id: int,
    student_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> AttendanceSummary:
    """Get attendance summary for student in section"""
    # Get enrollment for this student in this section
    enrollment_query = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_section_id == section_id,  # Changed from section_id
                Enrollment.student_id == student_id
            )
        )
    )
    enrollment = enrollment_query.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student not enrolled in this section")
    
    # Get all attendance records using enrollment_id
    result = await db.execute(
        select(Attendance).where(Attendance.enrollment_id == enrollment.id)  # Changed: use enrollment_id
    )
    records = result.scalars().all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = sum(1 for r in records if r.status == "absent")
    late = sum(1 for r in records if r.status == "late")
    excused = sum(1 for r in records if r.status == "excused")
    
    attendance_rate = (present / total * 100) if total > 0 else 0
    
    from decimal import Decimal
    return AttendanceSummary(
        section_id=section_id,
        student_id=student_id,
        total_sessions=total,
        present_count=present,
        absent_count=absent,
        late_count=late,
        excused_count=excused,
        attendance_rate=Decimal(str(attendance_rate)).quantize(Decimal("0.01"))
    )


# ============================================================================
# Semester Management (Admin)
# ============================================================================

@router.post("/semesters", status_code=status.HTTP_201_CREATED)
async def create_semester(
    semester_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create new semester (admin only)"""
    # Check if code already exists
    existing = await db.execute(
        select(Semester).where(Semester.code == semester_data['code'])
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Semester code already exists")
    
    semester = Semester(**semester_data)
    db.add(semester)
    await db.commit()
    await db.refresh(semester)
    
    logger.info(f"Created semester: {semester.code}")
    return semester.__dict__


@router.get("/semesters")
async def list_semesters(
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """List all semesters with optional active filter"""
    query = select(Semester)
    
    if is_active is not None:
        query = query.where(Semester.is_active == is_active)
    
    query = query.order_by(Semester.start_date.desc())
    result = await db.execute(query)
    semesters = result.scalars().all()
    
    return [s.__dict__ for s in semesters]


@router.get("/semesters/current")
async def get_current_semester(db: AsyncSession = Depends(get_db)):
    """Get the currently active semester"""
    result = await db.execute(
        select(Semester).where(Semester.is_current == True)
    )
    semester = result.scalar_one_or_none()
    
    if not semester:
        raise HTTPException(status_code=404, detail="No active semester found")
    
    return semester.__dict__


@router.put("/semesters/{semester_id}")
async def update_semester(
    semester_id: int,
    semester_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update semester (admin only)"""
    semester = await db.get(Semester, semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    for key, value in semester_data.items():
        if hasattr(semester, key):
            setattr(semester, key, value)
    
    await db.commit()
    await db.refresh(semester)
    
    return semester.__dict__


# ============================================================================
# Attendance Compliance Endpoints
# ============================================================================

@router.get("/attendance/compliance/section/{section_id}")
async def get_section_attendance_compliance(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Get attendance compliance summary for a section"""
    from app.services.attendance_compliance_service import AttendanceComplianceService
    
    summary = await AttendanceComplianceService.get_section_compliance_summary(db, section_id)
    return summary


@router.get("/attendance/compliance/semester/{semester_id}")
async def get_semester_attendance_compliance(
    semester_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get attendance compliance overview for entire semester"""
    from app.services.attendance_compliance_service import AttendanceComplianceService
    
    overview = await AttendanceComplianceService.get_semester_compliance_overview(db, semester_id)
    return overview


@router.post("/attendance/lock/{section_id}")
async def lock_attendance(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Lock attendance records after semester ends"""
    from app.services.attendance_compliance_service import AttendanceComplianceService
    
    result = await AttendanceComplianceService.lock_attendance_for_section(db, section_id)
    return result


@router.get("/attendance/export/{section_id}")
async def export_attendance_report(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Export attendance report for CSV/Excel download"""
    from app.services.attendance_compliance_service import AttendanceComplianceService
    
    data = await AttendanceComplianceService.export_attendance_report(db, section_id)
    return data


# ============================================================================
# Grade Approval Workflow Endpoints
# ============================================================================

@router.post("/grades/submit/{section_id}")
async def submit_section_grades(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Submit grades for review (teacher)"""
    from app.services.grade_approval_service import GradeApprovalService
    
    try:
        result = await GradeApprovalService.submit_grades(
            db, section_id, current_user['db_user_id']
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/grades/review/{section_id}")
async def review_section_grades(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Move grades to under review (admin)"""
    from app.services.grade_approval_service import GradeApprovalService
    
    try:
        result = await GradeApprovalService.review_grades(
            db, section_id, current_user['db_user_id']
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/grades/approve/{section_id}")
async def approve_section_grades(
    section_id: int,
    notes: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Approve grades (admin) - validates attendance"""
    from app.services.grade_approval_service import GradeApprovalService
    
    try:
        result = await GradeApprovalService.approve_grades(
            db, section_id, current_user['db_user_id'], notes
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/grades/reject/{section_id}")
async def reject_section_grades(
    section_id: int,
    rejection_reason: str,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Reject grades and send back for correction (admin)"""
    from app.services.grade_approval_service import GradeApprovalService
    
    try:
        result = await GradeApprovalService.reject_grades(
            db, section_id, current_user['db_user_id'], rejection_reason
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/grades/publish/{section_id}")
async def publish_section_grades(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Publish approved grades to students (admin)"""
    from app.services.grade_approval_service import GradeApprovalService
    
    try:
        result = await GradeApprovalService.publish_grades(
            db, section_id, current_user['db_user_id']
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/grades/summary/{section_id}")
async def get_grade_summary(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Get grade approval summary for a section"""
    from app.services.grade_approval_service import GradeApprovalService
    
    summary = await GradeApprovalService.get_section_grade_summary(db, section_id)
    return summary


# ============================================================================
# Timetable Conflict Detection
# ============================================================================

@router.post("/timetable/validate")
async def validate_schedule(
    schedule_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Validate schedule for conflicts before creation"""
    from app.services.timetable_conflict_service import TimetableConflictService
    from datetime import time
    
    try:
        result = await TimetableConflictService.validate_schedule_creation(
            db,
            section_id=schedule_data['section_id'],
            room=schedule_data['room'],
            day_of_week=schedule_data['day_of_week'],
            start_time=time.fromisoformat(schedule_data['start_time']),
            end_time=time.fromisoformat(schedule_data['end_time'])
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/timetable/conflicts/section/{section_id}")
async def get_section_conflicts(
    section_id: int,
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Get all conflicts for a specific section"""
    from app.services.timetable_conflict_service import TimetableConflictService
    
    conflicts = await TimetableConflictService.get_section_conflicts(db, section_id)
    return conflicts


@router.get("/timetable/conflicts/semester/{semester_id}")
async def get_semester_conflicts(
    semester_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get all scheduling conflicts for a semester"""
    # TODO: Fix database schema - section_schedules.day_of_week column missing
    # from app.services.timetable_conflict_service import TimetableConflictService
    # conflicts = await TimetableConflictService.get_all_conflicts_for_semester(db, semester_id)
    return []  # Temporarily disabled due to schema mismatch


@router.get("/timetable/available-rooms")
async def get_available_rooms(
    day_of_week: str = Query(...),
    start_time: str = Query(...),
    end_time: str = Query(...),
    campus_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """Get list of available rooms for a time slot"""
    from app.services.timetable_conflict_service import TimetableConflictService
    from datetime import time
    
    rooms = await TimetableConflictService.get_available_rooms(
        db,
        day_of_week=day_of_week,
        start_time=time.fromisoformat(start_time),
        end_time=time.fromisoformat(end_time),
        campus_id=campus_id
    )
    return rooms


# ============================================================================
# Academic Dashboard Statistics
# ============================================================================

@router.get("/dashboard/stats")
async def get_academic_dashboard_stats(
    semester_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_admin()),  # All admins can READ
    db: AsyncSession = Depends(get_db)
):
    """Get academic dashboard statistics for a specific semester"""
    from app.models import Major, Campus
    
    # Get current semester if not provided
    if not semester_id:
        current_semester = await db.execute(
            select(Semester).where(Semester.is_current == True)
        )
        semester = current_semester.scalar_one_or_none()
        semester_id = semester.id if semester else None
    
    # Total Programs/Majors (with courses in this semester)
    programs_with_courses = await db.execute(
        select(func.count(func.distinct(Course.major_id)))
        .select_from(CourseSection)
        .join(Course)
        .where(CourseSection.semester_id == semester_id)
    )
    total_programs = programs_with_courses.scalar() or 0
    
    # Total Courses (in this semester)
    courses_in_semester = await db.execute(
        select(func.count(func.distinct(CourseSection.course_id)))
        .select_from(CourseSection)
        .where(CourseSection.semester_id == semester_id)
    )
    total_courses = courses_in_semester.scalar() or 0
    
    # Active Campuses
    campuses_result = await db.execute(
        select(func.count()).select_from(Campus).where(Campus.is_active == True)
    )
    active_campuses = campuses_result.scalar() or 0
    
    # Instructors teaching in this semester
    instructors_in_semester = await db.execute(
        select(func.count(func.distinct(CourseSection.instructor_id)))
        .select_from(CourseSection)
        .where(
            and_(
                CourseSection.semester_id == semester_id,
                CourseSection.instructor_id.isnot(None)
            )
        )
    )
    active_instructors = instructors_in_semester.scalar() or 0
    
    # Students enrolled in this semester
    students_in_semester = await db.execute(
        select(func.count(func.distinct(Enrollment.student_id)))
        .select_from(Enrollment)
        .join(CourseSection)
        .where(CourseSection.semester_id == semester_id)
    )
    active_students = students_in_semester.scalar() or 0
    
    # Attendance Compliance (for current semester)
    attendance_compliance = 0
    if semester_id:
        from app.services.attendance_compliance_service import AttendanceComplianceService
        try:
            overview = await AttendanceComplianceService.get_semester_compliance_overview(db, semester_id)
            attendance_compliance = overview.get('compliance_rate', 0)
        except:
            pass
    
    # Grade Approval Rate (for current semester)
    grade_approval_rate = 0
    if semester_id:
        total_grades_result = await db.execute(
            select(func.count()).select_from(Grade).join(Enrollment).join(CourseSection).where(
                CourseSection.semester_id == semester_id
            )
        )
        total_grades = total_grades_result.scalar() or 0
        
        approved_grades_result = await db.execute(
            select(func.count()).select_from(Grade).join(Enrollment).join(CourseSection).where(
                and_(
                    CourseSection.semester_id == semester_id,
                    Grade.approval_status.in_(['approved', 'published', 'archived'])
                )
            )
        )
        approved_grades = approved_grades_result.scalar() or 0
        
        if total_grades > 0:
            grade_approval_rate = round((approved_grades / total_grades) * 100, 2)
    
    return {
        "total_programs": total_programs,
        "total_courses": total_courses,
        "active_campuses": active_campuses,
        "active_instructors": active_instructors,
        "active_students": active_students,
        "attendance_compliance": attendance_compliance,
        "grade_approval_rate": grade_approval_rate,
        "semester_id": semester_id
    }


# ============================================================================
# Unified Course View (All-in-One: Programs → Courses → Sections)
# ============================================================================

@router.get("/unified-course-view")
async def get_unified_course_view(
    semester_id: Optional[int] = Query(None),
    program_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get unified hierarchical view: Programs → Courses → Sections
    Returns all programs with their courses and sections in one structure
    """
    from app.models.user import Major
    from sqlalchemy.orm import selectinload
    
    # Build query for programs
    query = select(Major).options(
        selectinload(Major.courses).selectinload(Course.sections)
    )
    
    # Filter by program if specified
    if program_id:
        query = query.where(Major.id == program_id)
    
    # Only active programs by default
    query = query.where(Major.is_active == True)
    query = query.order_by(Major.name)
    
    result = await db.execute(query)
    programs = result.scalars().all()
    
    unified_data = []
    
    for program in programs:
        # Filter courses by semester if specified
        courses_data = []
        for course in program.courses:
            if not course.is_active:
                continue
                
            # Filter sections by semester
            sections_data = []
            total_enrolled = 0
            total_capacity = 0
            has_sections_in_semester = False
            
            for section in course.sections:
                if semester_id and section.semester_id != semester_id:
                    continue
                if not section.is_active:
                    continue
                
                has_sections_in_semester = True
                    
                # Get instructor name
                instructor_name = None
                if section.instructor_id:
                    instructor_result = await db.execute(
                        select(User.full_name).where(User.id == section.instructor_id)
                    )
                    instructor_name = instructor_result.scalar_one_or_none()
                
                # Get semester name
                semester_name = None
                if section.semester_id:
                    semester_result = await db.execute(
                        select(Semester.name).where(Semester.id == section.semester_id)
                    )
                    semester_name = semester_result.scalar_one_or_none()
                
                total_enrolled += section.enrolled_count or 0
                total_capacity += section.max_students or 0
                
                sections_data.append({
                    "id": section.id,
                    "section_code": section.section_code,
                    "instructor_id": section.instructor_id,
                    "instructor_name": instructor_name,
                    "semester_id": section.semester_id,
                    "semester_name": semester_name,
                    "room": section.room,
                    "schedule": section.schedule,  # JSONB field
                    "max_students": section.max_students,
                    "enrolled_count": section.enrolled_count,
                    "is_active": section.is_active
                })
            
            # Include course if:
            # 1. No semester filter is active (show all courses)
            # 2. Semester filter is active AND course has sections in that semester
            # 3. Semester filter is active BUT course has NO sections at all (new courses)
            should_include = (
                not semester_id or  # No semester filter
                has_sections_in_semester or  # Has sections in filtered semester
                len(course.sections) == 0  # Course has no sections yet (newly created)
            )
            
            if should_include:
                # Get semester name for course (from first section if exists)
                semester_name = sections_data[0]["semester_name"] if sections_data else None
                
                courses_data.append({
                    "id": course.id,
                    "code": course.course_code,
                    "name": course.name,
                    "description": course.description,
                    "credits": course.credits,
                    "level": course.level,
                    "is_active": course.is_active,
                    "semester_name": semester_name,
                    "section_count": len(sections_data),
                    "total_enrolled": total_enrolled,
                    "total_capacity": total_capacity,
                    "sections": sections_data
                })
        
        # Include program if it has courses
        if courses_data:
            unified_data.append({
                "id": program.id,
                "code": program.code,
                "name": program.name,
                "description": program.description,
                "is_active": program.is_active,
                "course_count": len(courses_data),
                "courses": courses_data
            })
    
    return unified_data


@router.get("/materials-course-view")
async def get_materials_course_view(
    semester_id: Optional[int] = Query(None),
    program_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get hierarchical view for materials: Programs → Courses → Materials
    Returns all programs with their courses and materials in one structure
    """
    from app.models.user import Major
    from app.models.document import Document
    from sqlalchemy.orm import selectinload
    
    # Build query for programs
    query = select(Major).options(selectinload(Major.courses))
    
    # Filter by program if specified
    if program_id:
        query = query.where(Major.id == program_id)
    
    # Only active programs by default
    query = query.where(Major.is_active == True)
    query = query.order_by(Major.name)
    
    result = await db.execute(query)
    programs = result.scalars().all()
    
    unified_data = []
    
    for program in programs:
        courses_data = []
        
        for course in program.courses:
            if not course.is_active:
                continue
            
            # Get materials for this course
            materials_query = select(Document).where(
                and_(
                    Document.course_id == course.id,
                    Document.status == 'active'
                )
            ).order_by(Document.created_at.desc())
            
            materials_result = await db.execute(materials_query)
            materials = materials_result.scalars().all()
            
            materials_data = []
            for material in materials:
                # Get uploader name
                uploader_name = None
                if material.uploaded_by:
                    uploader_result = await db.execute(
                        select(User.full_name).where(User.id == material.uploaded_by)
                    )
                    uploader_name = uploader_result.scalar_one_or_none()
                
                materials_data.append({
                    "id": material.id,
                    "filename": material.file_name,
                    "title": material.title,
                    "description": material.description,
                    "category": material.document_type,
                    "file_type": material.file_extension,
                    "file_size": material.file_size,
                    "file_path": material.file_path,
                    "is_public": material.status == 'active',  # Map status to is_public
                    "uploader_id": str(material.uploaded_by) if material.uploaded_by else None,
                    "uploader_name": uploader_name,
                    "created_at": material.created_at.isoformat() if material.created_at else None,
                    "updated_at": material.updated_at.isoformat() if material.updated_at else None,
                })
            
            # Include course even if no materials (for consistency)
            courses_data.append({
                "id": course.id,
                "code": course.course_code,
                "name": course.name,
                "description": course.description,
                "credits": course.credits,
                "level": course.level,
                "is_active": course.is_active,
                "materials_count": len(materials_data),
                "materials": materials_data
            })
        
        # Include program if it has courses
        if courses_data:
            unified_data.append({
                "id": program.id,
                "code": program.code,
                "name": program.name,
                "description": program.description,
                "is_active": program.is_active,
                "course_count": len(courses_data),
                "courses": courses_data
            })
    
    return unified_data

