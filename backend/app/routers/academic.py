"""
Academic endpoints - courses, enrollments, grades, attendance
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles, require_admin, require_teacher_or_admin, get_user_campus_access, check_campus_access
from app.core.exceptions import ValidationError, NotFoundError
from app.models import (
    Course, CourseSection, Enrollment, Assignment, Grade, Attendance,
    User, Semester, Schedule
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
    AttendanceSummary
)
from app.schemas.base import PaginatedResponse, SuccessResponse, PaginationParams
from typing import Dict, Any, Optional, List
from datetime import date as date_type
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/academic", tags=["Academic"])


# ============================================================================
# Course Management (Admin/Teacher)
# ============================================================================

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Create new course (admin only)"""
    # Check if course code already exists
    existing = await db.execute(
        select(Course).where(Course.code == course_data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course code {course_data.code} already exists"
        )
    
    course = Course(**course_data.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    logger.info(f"Created course: {course.code}")
    return CourseResponse(**course.__dict__)


@router.get("/courses", response_model=PaginatedResponse)
async def list_courses(
    pagination: PaginationParams = Depends(),
    major_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List courses with filters"""
    query = select(Course)
    
    conditions = []
    if major_id:
        conditions.append(Course.major_id == major_id)
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                Course.code.ilike(search_term),
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
    
    # Convert to response - map course_code to code
    course_responses = []
    for c in courses:
        course_dict = c.__dict__.copy()
        course_dict['code'] = course_dict.pop('course_code')
        course_responses.append(CourseResponse(**course_dict))
    
    return PaginatedResponse(
        data=course_responses,
        pagination={
            "page": pagination.page,
            "page_size": pagination.page_size,
            "total": total,
            "total_pages": (total + pagination.page_size - 1) // pagination.page_size
        }
    )


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
    # Verify course, semester, teacher exist
    course = await db.get(Course, section_data.course_id)
    semester = await db.get(Semester, section_data.semester_id)
    teacher = await db.get(User, section_data.teacher_id)
    
    if not course:
        raise HTTPException(status_code=400, detail="Course not found")
    if not semester:
        raise HTTPException(status_code=400, detail="Semester not found")
    if not teacher or teacher.role != "teacher":
        raise HTTPException(status_code=400, detail="Invalid teacher")
    
    # Check campus access if section has campus_id
    if section_data.campus_id:
        await check_campus_access(current_user, section_data.campus_id, db, raise_error=True)
    
    section = CourseSection(**section_data.model_dump())
    db.add(section)
    await db.commit()
    await db.refresh(section)
    
    # Get enrolled count
    enrolled_count = await EnrollmentService.get_enrolled_count(db, section.id)
    
    logger.info(f"Created section: {course.code}-{section.section_number}")
    
    response_data = section.__dict__.copy()
    response_data['enrolled_count'] = enrolled_count
    return CourseSectionResponse(**response_data)


@router.get("/sections", response_model=PaginatedResponse)
async def list_sections(
    pagination: PaginationParams = Depends(),
    semester_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    campus_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List course sections with filters (campus-filtered)"""
    query = select(CourseSection)
    
    conditions = []
    if semester_id:
        conditions.append(CourseSection.semester_id == semester_id)
    if course_id:
        conditions.append(CourseSection.course_id == course_id)
    if status:
        conditions.append(CourseSection.status == status)
    
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
                    data=[],
                    pagination={
                        "page": pagination.page,
                        "page_size": pagination.page_size,
                        "total": 0,
                        "total_pages": 0
                    }
                )
    
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
    
    # Add enrolled counts
    section_responses = []
    for section in sections:
        enrolled_count = await EnrollmentService.get_enrolled_count(db, section.id)
        response_data = section.__dict__.copy()
        response_data['enrolled_count'] = enrolled_count
        section_responses.append(CourseSectionResponse(**response_data))
    
    return PaginatedResponse(
        data=section_responses,
        pagination={
            "page": pagination.page,
            "page_size": pagination.page_size,
            "total": total,
            "total_pages": (total + pagination.page_size - 1) // pagination.page_size
        }
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
        section = await db.get(CourseSection, enrollment_data.section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        # Verify student has access to the section's campus
        if section.campus_id:
            await check_campus_access(current_user, section.campus_id, db, raise_error=True)
        
        # Enroll
        enrollment = await EnrollmentService.enroll_student(
            db, student_id, enrollment_data.section_id
        )
        
        return EnrollmentResponse(**enrollment.__dict__)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/enrollments", response_model=PaginatedResponse)
async def list_enrollments(
    pagination: PaginationParams = Depends(),
    section_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    semester_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    campus_id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """List enrollments with filters (teachers and admins only, campus-filtered)"""
    query = select(Enrollment).join(CourseSection, Enrollment.section_id == CourseSection.id)
    
    conditions = []
    if section_id:
        conditions.append(Enrollment.section_id == section_id)
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
                    data=[],
                    pagination={
                        "page": pagination.page,
                        "page_size": pagination.page_size,
                        "total": 0,
                        "total_pages": 0
                    }
                )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Get total count
    total_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    return PaginatedResponse(
        data=[EnrollmentResponse(**enrollment.__dict__) for enrollment in enrollments],
        pagination={
            "page": pagination.page,
            "page_size": pagination.page_size,
            "total": total,
            "total_pages": (total + pagination.page_size - 1) // pagination.page_size
        }
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
        section = await db.get(CourseSection, enrollment.section_id)
        course = await db.get(Course, section.course_id)
        semester = await db.get(Semester, section.semester_id)
        teacher = await db.get(User, section.instructor_id)  # Fixed: instructor_id not teacher_id
        
        response_data = enrollment.__dict__.copy()
        response_data.update({
            "course_code": course.course_code,  # Fixed: course_code not code
            "course_name": course.name,
            "section_number": section.section_number,
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
    
    # Get section and verify campus access
    section = await db.get(CourseSection, assignment.section_id)
    if section and section.campus_id:
        await check_campus_access(current_user, section.campus_id, db, raise_error=True)
    
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
            # Check if attendance already exists
            existing = await db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.section_id == attendance_data.section_id,
                        Attendance.student_id == record.student_id,
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
                    section_id=attendance_data.section_id,
                    student_id=record.student_id,
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


@router.get("/sections/{section_id}/attendance/{student_id}", response_model=AttendanceSummary)
async def get_attendance_summary(
    section_id: int,
    student_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> AttendanceSummary:
    """Get attendance summary for student in section"""
    # Get all attendance records
    result = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.section_id == section_id,
                Attendance.student_id == student_id
            )
        )
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
