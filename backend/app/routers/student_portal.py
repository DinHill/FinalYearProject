"""
Student Portal Router
Provides student-facing endpoints for courses, grades, schedules, and documents
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, case
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import logging

from app.core.database import get_db
from app.models.academic import (
    Enrollment, CourseSection as Section, Course, SectionSchedule, 
    Grade, Attendance, Semester
)
from app.models import Document
from app.models.user import User, Major
from app.core.security import verify_firebase_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/student-portal", tags=["Student Portal"])

# ============================================================================
# Response Models
# ============================================================================

class StudentDashboardStats(BaseModel):
    total_courses: int
    completed_courses: int
    in_progress_courses: int
    pending_enrollments: int
    current_gpa: Optional[float]
    total_credits: int

class EnrolledCourseInfo(BaseModel):
    enrollment_id: int
    course_id: int
    course_code: str
    course_name: str
    course_credits: int
    section_id: int
    section_code: str
    teacher_name: Optional[str]
    enrollment_status: str
    current_grade: Optional[str]
    grade_score: Optional[float]
    attendance_rate: Optional[float]
    schedule_summary: str  # e.g., "Mon/Wed 9:00-10:30"

class CourseDetailInfo(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    course_description: Optional[str]
    credits: int
    section_id: int
    section_code: str
    teacher_name: Optional[str]
    teacher_email: Optional[str]
    enrollment_status: str
    current_grade: Optional[str]
    grade_score: Optional[float]
    schedules: List[dict]
    materials: List[dict]
    attendance_summary: Optional[dict]

class GradeSummary(BaseModel):
    course_code: str
    course_name: str
    section_code: str
    grade_score: Optional[float]
    max_score: float
    grade_letter: Optional[str]
    status: str
    semester: Optional[str]
    academic_year: Optional[str]

class UpcomingClass(BaseModel):
    course_code: str
    course_name: str
    section_code: str
    day_of_week: int
    start_time: str
    end_time: str
    room: Optional[str]
    building: Optional[str]
    teacher_name: Optional[str]
    next_occurrence: str  # ISO datetime

# ============================================================================
# Helper Functions
# ============================================================================

async def get_student_id(db: AsyncSession, firebase_uid: str) -> int:
    """Get student ID from Firebase UID"""
    stmt = select(User).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or user.role != 'student':
        raise HTTPException(status_code=403, detail="User is not a student")
    
    return user.id

def calculate_gpa(grades: List[Grade]) -> Optional[float]:
    """Calculate GPA from grades (simple average for now)"""
    if not grades:
        return None
    
    valid_grades = [g for g in grades if g.grade_value is not None and g.max_grade]
    if not valid_grades:
        return None
    
    # Convert Decimal to float to avoid type errors
    total_percentage = sum((float(g.grade_value) / float(g.max_grade)) * 100 for g in valid_grades)
    avg_percentage = total_percentage / len(valid_grades)
    
    # Convert to 4.0 scale
    if avg_percentage >= 90:
        return 4.0
    elif avg_percentage >= 80:
        return 3.0 + (avg_percentage - 80) / 10
    elif avg_percentage >= 70:
        return 2.0 + (avg_percentage - 70) / 10
    elif avg_percentage >= 60:
        return 1.0 + (avg_percentage - 60) / 10
    else:
        return 0.0

def get_letter_grade(score: float, max_score: float) -> str:
    """Convert numeric score to letter grade"""
    # Convert Decimal to float to avoid type errors
    percentage = (float(score) / float(max_score)) * 100
    
    if percentage >= 90:
        return 'A'
    elif percentage >= 80:
        return 'B'
    elif percentage >= 70:
        return 'C'
    elif percentage >= 60:
        return 'D'
    else:
        return 'F'

def format_schedule_summary(schedules: List[SectionSchedule]) -> str:
    """Format schedules into readable summary"""
    if not schedules:
        return "No schedule"
    
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    schedule_parts = []
    
    for schedule in schedules:
        day = days[schedule.day_of_week]
        time = f"{schedule.start_time}-{schedule.end_time}"
        schedule_parts.append(f"{day} {time}")
    
    return ", ".join(schedule_parts)

def get_next_occurrence(schedule: SectionSchedule) -> datetime:
    """Get next occurrence of a scheduled class"""
    today = date.today()
    current_day = today.weekday()
    
    # Calculate days until next occurrence
    days_ahead = schedule.day_of_week - current_day
    if days_ahead <= 0:
        days_ahead += 7
    
    next_date = today + timedelta(days=days_ahead)
    
    # Parse time
    hours, minutes = map(int, schedule.start_time.split(':'))
    return datetime.combine(next_date, datetime.min.time().replace(hour=hours, minute=minutes))

# ============================================================================
# Endpoints
# ============================================================================

@router.get("/dashboard", response_model=StudentDashboardStats)
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get student dashboard statistics
    """
    try:
        student_id = await get_student_id(db, current_user['uid'])
        
        # Get all enrollments with sections and courses eagerly loaded
        stmt = (
            select(Enrollment)
            .options(
                joinedload(Enrollment.section).joinedload(Section.course)
            )
            .where(Enrollment.student_id == student_id)
        )
        result = await db.execute(stmt)
        enrollments = result.unique().scalars().all()
        
        # Count by status
        total_enrolled = len([e for e in enrollments if e.status in ['enrolled', 'completed']])
        completed = len([e for e in enrollments if e.status == 'completed'])
        in_progress = len([e for e in enrollments if e.status == 'enrolled'])
        pending = 0  # Enrollment has no approval_status field
        
        # Get grades for GPA calculation (from completed enrollments with final grades)
        gpa = None
        completed_enrollments = [e for e in enrollments if e.status == 'completed' and e.grade is not None]
        if completed_enrollments:
            # Calculate GPA as weighted average based on course credits
            total_grade_points = 0
            total_credits_for_gpa = 0
            
            for enrollment in completed_enrollments:
                if enrollment.section and enrollment.section.course:
                    course_credits = enrollment.section.course.credits or 0
                    # enrollment.grade is already on 4.0 scale (Numeric(3, 2))
                    grade_points = float(enrollment.grade) * course_credits
                    total_grade_points += grade_points
                    total_credits_for_gpa += course_credits
            
            if total_credits_for_gpa > 0:
                gpa = total_grade_points / total_credits_for_gpa
        
        # Calculate total credits (from enrolled and completed courses)
        enrolled_or_completed_ids = [e.id for e in enrollments if e.status in ['enrolled', 'completed']]
        if enrolled_or_completed_ids:
            credit_stmt = (
                select(func.sum(Course.credits))
                .select_from(Enrollment)
                .join(Section, Enrollment.course_section_id == Section.id)
                .join(Course, Section.course_id == Course.id)
                .where(Enrollment.id.in_(enrolled_or_completed_ids))
            )
            credit_result = await db.execute(credit_stmt)
            total_credits = credit_result.scalar() or 0
        else:
            total_credits = 0
        
        return StudentDashboardStats(
            total_courses=total_enrolled,
            completed_courses=completed,
            in_progress_courses=in_progress,
            pending_enrollments=pending,
            current_gpa=round(gpa, 2) if gpa else None,
            total_credits=total_credits
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-courses", response_model=List[EnrolledCourseInfo])
async def get_my_courses(
    status: Optional[str] = Query(None, description="Filter by enrollment status"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get list of student's enrolled courses with details
    """
    try:
        student_id = await get_student_id(db, current_user['uid'])
        
        # Build query
        stmt = (
            select(Enrollment, Section, Course, User)
            .join(Section, Enrollment.course_section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .outerjoin(User, Section.instructor_id == User.id)
            .where(Enrollment.student_id == student_id)
        )
        
        if status:
            stmt = stmt.where(Enrollment.status == status)
        
        stmt = stmt.order_by(desc(Enrollment.created_at))
        
        result = await db.execute(stmt)
        rows = result.all()
        
        courses = []
        for enrollment, section, course, teacher in rows:
            # Parse schedule from JSONB in course_sections table
            import json
            schedule_data = section.schedule
            if isinstance(schedule_data, str):
                try:
                    schedule_data = json.loads(schedule_data)
                except:
                    schedule_data = None
            
            # Format schedule summary
            schedule_summary = ""
            if schedule_data and isinstance(schedule_data, dict):
                sessions = schedule_data.get('sessions', [])
                schedule_parts = []
                for sess in sessions:
                    day = sess.get('day', '')
                    start = sess.get('start_time', '').split('.')[0] if sess.get('start_time') else ''
                    schedule_parts.append(f"{day[:3]} {start}")
                schedule_summary = ", ".join(schedule_parts)
            
            # Get current grade
            grade_stmt = select(Grade).where(
                and_(
                    Grade.enrollment_id == enrollment.id,
                    Grade.approval_status == 'published'
                )
            ).order_by(desc(Grade.updated_at)).limit(1)
            grade_result = await db.execute(grade_stmt)
            grade = grade_result.scalar_one_or_none()
            
            # Get attendance rate
            attendance_stmt = (
                select(
                    func.count(Attendance.id).label('total'),
                    func.sum(case((Attendance.status == 'present', 1), else_=0)).label('present')
                )
                .where(Attendance.enrollment_id == enrollment.id)
            )
            attendance_result = await db.execute(attendance_stmt)
            attendance_data = attendance_result.first()
            
            attendance_rate = None
            if attendance_data and attendance_data.total > 0:
                attendance_rate = (attendance_data.present / attendance_data.total) * 100
            
            courses.append(EnrolledCourseInfo(
                enrollment_id=enrollment.id,
                course_id=course.id,
                course_code=course.course_code,
                course_name=course.name,
                course_credits=course.credits,
                section_id=section.id,
                section_code=section.section_code,
                teacher_name=teacher.full_name if teacher else None,
                enrollment_status=enrollment.status,
                current_grade=enrollment.grade,
                grade_score=grade.grade_value if grade else None,
                attendance_rate=round(attendance_rate, 1) if attendance_rate is not None else None,
                schedule_summary=schedule_summary
            ))
        
        return courses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student courses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/course/{course_id}", response_model=CourseDetailInfo)
async def get_course_details(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get detailed information about a specific enrolled course
    """
    try:
        student_id = await get_student_id(db, current_user['uid'])
        
        # First check if course exists
        course_check = await db.scalar(select(Course.id).where(Course.id == course_id))
        if not course_check:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get enrollment
        stmt = (
            select(Enrollment, Section, Course, User)
            .join(Section, Enrollment.course_section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .outerjoin(User, Section.instructor_id == User.id)
            .where(
                and_(
                    Enrollment.student_id == student_id,
                    Course.id == course_id
                )
            )
        )
        
        result = await db.execute(stmt)
        row = result.first()
        
        if not row:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
        
        enrollment, section, course, teacher = row
        
        # Get schedules
        schedule_stmt = select(SectionSchedule).where(SectionSchedule.section_id == section.id)
        schedule_result = await db.execute(schedule_stmt)
        schedules = schedule_result.scalars().all()
        
        schedule_list = [
            {
                'day_of_week': s.day_of_week,
                'start_time': s.start_time,
                'end_time': s.end_time,
                'room': s.room,
                'building': s.building
            }
            for s in schedules
        ]
        
        # Get course materials (public documents)
        # Using document_type instead of category since that's what exists in DB
        material_stmt = (
            select(Document)
            .where(Document.document_type == 'course_materials')
            .order_by(desc(Document.created_at))  # Use created_at instead of uploaded_at
            .limit(10)
        )
        material_result = await db.execute(material_stmt)
        materials = material_result.scalars().all()
        
        material_list = [
            {
                'id': m.id,
                'title': m.title,
                'file_size': m.file_size,
                'uploaded_at': m.uploaded_at.isoformat()
            }
            for m in materials
        ]
        
        # Get grade
        grade_stmt = select(Grade).where(
            and_(
                Grade.enrollment_id == enrollment.id,
                Grade.approval_status == 'published'
            )
        ).order_by(desc(Grade.updated_at)).limit(1)
        grade_result = await db.execute(grade_stmt)
        grade = grade_result.scalar_one_or_none()
        
        # Get attendance summary
        attendance_stmt = (
            select(
                func.count(Attendance.id).label('total'),
                func.sum(case((Attendance.status == 'present', 1), else_=0)).label('present'),
                func.sum(case((Attendance.status == 'absent', 1), else_=0)).label('absent'),
                func.sum(case((Attendance.status == 'late', 1), else_=0)).label('late')
            )
            .where(Attendance.enrollment_id == enrollment.id)
        )
        attendance_result = await db.execute(attendance_stmt)
        attendance_data = attendance_result.first()
        
        attendance_summary = None
        if attendance_data and attendance_data.total > 0:
            attendance_summary = {
                'total_sessions': attendance_data.total,
                'present': attendance_data.present or 0,
                'absent': attendance_data.absent or 0,
                'late': attendance_data.late or 0,
                'attendance_rate': round((attendance_data.present / attendance_data.total) * 100, 1)
            }
        
        return CourseDetailInfo(
            enrollment_id=enrollment.id,
            course_id=course.id,
            course_code=course.course_code,
            course_name=course.name,
            course_description=course.description,
            credits=course.credits,
            section_id=section.id,
            section_code=section.section_code,
            teacher_name=teacher.full_name if teacher else None,
            teacher_email=teacher.email if teacher else None,
            enrollment_status=enrollment.status,
            current_grade=enrollment.grade,
            grade_score=grade.score if grade else None,
            schedules=schedule_list,
            materials=material_list,
            attendance_summary=attendance_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/grades", response_model=List[GradeSummary])
async def get_my_grades(
    semester: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get student's grades across all courses
    """
    try:
        student_id = await get_student_id(db, current_user['uid'])
        
        # Get enrollments with grades
        stmt = (
            select(Enrollment, Section, Course, Grade, Semester)
            .join(Section, Enrollment.course_section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .join(Semester, Section.semester_id == Semester.id)
            .outerjoin(Grade, and_(
                Grade.enrollment_id == Enrollment.id,
                Grade.approval_status == 'published'
            ))
            .where(Enrollment.student_id == student_id)
        )
        
        if semester:
            stmt = stmt.where(Semester.code == semester)
        
        stmt = stmt.order_by(desc(Semester.academic_year), desc(Semester.code))
        
        result = await db.execute(stmt)
        rows = result.all()
        
        grades = []
        for enrollment, section, course, grade, semester_obj in rows:
            grade_letter = None
            if grade and grade.grade_value and grade.max_grade:
                grade_letter = get_letter_grade(grade.grade_value, grade.max_grade)
            
            grades.append(GradeSummary(
                course_code=course.course_code,
                course_name=course.name,
                section_code=section.section_code,
                grade_score=grade.grade_value if grade else None,
                max_score=grade.max_grade if grade else 100.0,
                grade_letter=grade_letter,
                status=grade.approval_status if grade else 'pending',
                semester=semester_obj.name if semester_obj else None,
                academic_year=semester_obj.academic_year if semester_obj else None
            ))
        
        return grades
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student grades: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/upcoming-classes", response_model=List[UpcomingClass])
async def get_upcoming_classes(
    days: int = Query(7, ge=1, le=30, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get upcoming classes for the next N days
    """
    try:
        student_id = await get_student_id(db, current_user['uid'])
        
        # Get active enrollments with schedule from JSONB column
        stmt = (
            select(Enrollment, Section, Course, User)
            .join(Section, Enrollment.course_section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .outerjoin(User, Section.instructor_id == User.id)
            .where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.status == 'enrolled'
                )
            )
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        upcoming = []
        today = date.today()
        
        for enrollment, section, course, teacher in rows:
            # Parse schedule from JSONB
            if not section.schedule:
                continue
            
            # Handle schedule as dict or string
            import json
            schedule_data = section.schedule
            if isinstance(schedule_data, str):
                try:
                    schedule_data = json.loads(schedule_data)
                except:
                    continue
            
            # Schedule format: {"sessions": [{"day": "Monday", "start_time": "09:00:00", "end_time": "10:30:00"}]}
            sessions = schedule_data.get('sessions', []) if isinstance(schedule_data, dict) else []
            
            for schedule_item in sessions:
                day_name = schedule_item.get('day', '')
                start_time_str = schedule_item.get('start_time', '')
                end_time_str = schedule_item.get('end_time', '')
                room = section.room or 'TBA'
                
                if not (day_name and start_time_str and end_time_str):
                    continue
                
                # Convert day name to day_of_week number (0=Monday, 6=Sunday)
                day_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
                day_num = day_map.get(day_name)
                
                if day_num is None:
                    continue
                
                # Find next occurrence
                days_ahead = (day_num - today.weekday()) % 7
                if days_ahead == 0:
                    days_ahead = 7  # Next week if it's today
                next_date = today + timedelta(days=days_ahead)
                
                # Only include if within the specified days
                if (next_date - today).days <= days:
                    upcoming.append(UpcomingClass(
                        course_code=course.course_code,
                        course_name=course.name,
                        section_code=section.section_code,
                        day_of_week=day_num,
                        start_time=start_time_str,
                        end_time=end_time_str,
                        room=room,
                        building=None,  # Not in JSONB schedule
                        teacher_name=teacher.full_name if teacher else None,
                        next_occurrence=datetime.combine(next_date, datetime.strptime(start_time_str, '%H:%M').time()).isoformat()
                    ))
        
        # Sort by next occurrence
        upcoming.sort(key=lambda x: x.next_occurrence)
        
        return upcoming
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upcoming classes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


