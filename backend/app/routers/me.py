"""
"Me" endpoints - User-scoped data endpoints for mobile app
These endpoints return data for the currently authenticated user
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.models import (
    User, UserRole, Enrollment, Grade, Attendance, Invoice, 
    DocumentRequest, CourseSection, Assignment, DeviceToken,
    Course, SectionSchedule, Document
)
from app.schemas.auth import UserProfileResponse
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me", tags=["My Data"])


# Schema for profile updates
class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    avatar_url: str | None = None


# Schema for device token registration
class DeviceTokenRequest(BaseModel):
    token: str
    device_type: str  # ios, android, web
    device_name: str | None = None
    
    class Config:
        from_attributes = True


@router.get("/profile", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's profile
    
    Returns complete user profile information
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.campus),
            selectinload(User.major),
            selectinload(User.user_roles).selectinload(UserRole.role)
        )
        .where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return user


@router.patch("/profile")
async def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile
    
    Users can update their own basic information
    (excluding role, campus, major which require admin)
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update allowed fields
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return {"success": True, "message": "Profile updated successfully"}


@router.post("/device-token", status_code=status.HTTP_201_CREATED)
async def register_device_token(
    token_data: DeviceTokenRequest,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Register device token for push notifications
    
    This endpoint allows users to register their device tokens
    for receiving push notifications.
    """
    uid = current_user['uid']
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if token already exists
    existing_token = await db.execute(
        select(DeviceToken).where(DeviceToken.push_token == token_data.token)
    )
    existing = existing_token.scalar_one_or_none()
    
    if existing:
        # Update existing token
        existing.user_id = user.id
        existing.platform = token_data.device_type
        existing.is_active = True
    else:
        # Create new token
        device_token = DeviceToken(
            user_id=user.id,
            push_token=token_data.token,
            platform=token_data.device_type,
            is_active=True
        )
        db.add(device_token)
    
    await db.commit()
    
    logger.info(f"Device token registered for user {user.username} ({token_data.device_type})")
    
    return {
        "success": True,
        "message": "Device token registered successfully"
    }


@router.get("/schedule")
async def get_my_schedule(
    days: int = Query(7, ge=1, le=30),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my class schedule as a list of upcoming classes
    
    Returns schedule entries (not sections) for the next N days
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from datetime import datetime, timedelta, timezone
    
    logger.info(f"📅 Schedule request for user: {user.username} (role: {user.role}, days: {days})")
    
    # Build query based on user role
    if user.role == 'student':
        # Get student's enrolled sections
        sections_query = select(CourseSection).join(
            Enrollment, Enrollment.course_section_id == CourseSection.id
        ).where(
            Enrollment.student_id == user.id,
            Enrollment.status == 'enrolled'
        ).options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.semester)
        )
    elif user.role == 'teacher':
        # Get teacher's teaching sections
        sections_query = select(CourseSection).where(
            CourseSection.instructor_id == user.id
        ).options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.semester)
        )
    else:
        return {"success": True, "data": []}
    
    result = await db.execute(sections_query)
    sections = result.scalars().all()
    section_ids = [s.id for s in sections]
    
    logger.info(f"📚 Found {len(sections)} sections: {section_ids}")
    
    if not section_ids:
        return {"success": True, "data": []}
    
    # Get schedules for these sections
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days)
    
    schedule_stmt = (
        select(SectionSchedule)
        .where(
            SectionSchedule.section_id.in_(section_ids),
            SectionSchedule.start_ts >= now,
            SectionSchedule.start_ts <= end_date,
            SectionSchedule.canceled == False
        )
        .order_by(SectionSchedule.start_ts)
    )
    schedule_result = await db.execute(schedule_stmt)
    schedules = schedule_result.scalars().all()
    
    logger.info(f"🗓️ Found {len(schedules)} schedule entries between {now} and {end_date}")
    
    # Build response
    upcoming_classes = []
    sections_by_id = {s.id: s for s in sections}
    
    for schedule in schedules:
        section = sections_by_id.get(schedule.section_id)
        if not section:
            continue
            
        upcoming_classes.append({
            "id": section.id,
            "section_id": section.id,
            "course_code": section.course.course_code if section.course else "N/A",
            "course_name": section.course.name if section.course else "Unknown",
            "section_code": section.section_code,
            "day": schedule.start_ts.weekday(),
            "day_name": schedule.start_ts.strftime("%A"),
            "start_time": schedule.start_ts.strftime("%H:%M"),
            "end_time": schedule.end_ts.strftime("%H:%M") if schedule.end_ts else "",
            "room": schedule.room,
            "date": schedule.start_ts.date().isoformat(),
            "semester": section.semester.name if section.semester else None
        })
    
    logger.info(f"✅ Returning {len(upcoming_classes)} schedule items")
    
    return {
        "success": True,
        "data": upcoming_classes
    }


@router.get("/materials")
async def get_my_materials(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get course materials for student's enrolled courses
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != 'student':
        return {"success": True, "data": []}
    
    # Get student's enrolled sections
    enrollments_result = await db.execute(
        select(Enrollment)
        .options(
            selectinload(Enrollment.section).selectinload(CourseSection.course)
        )
        .where(
            Enrollment.student_id == user.id,
            Enrollment.status == 'enrolled'
        )
    )
    enrollments = enrollments_result.scalars().all()
    course_ids = [e.section.course_id for e in enrollments if e.section and e.section.course_id]
    
    if not course_ids:
        return {"success": True, "data": []}
    
    # Get materials for enrolled courses
    materials_result = await db.execute(
        select(Document)
        .where(
            and_(
                Document.document_type == 'course_materials',
                Document.course_id.in_(course_ids)
            )
        )
        .order_by(Document.created_at.desc())
    )
    materials = materials_result.scalars().all()
    
    materials_list = []
    for material in materials:
        # Find the course for this material
        course = next((e.section.course for e in enrollments if e.section and e.section.course_id == material.course_id), None)
        
        materials_list.append({
            "id": material.id,
            "title": material.title,
            "description": material.description,
            "file_url": material.file_url,
            "file_name": material.file_name,
            "file_size": material.file_size,
            "file_type": material.file_type,
            "document_type": material.document_type,
            "course_code": course.course_code if course else None,
            "course_name": course.name if course else None,
            "uploaded_at": material.created_at.isoformat() if material.created_at else None,
        })
    
    return {
        "success": True,
        "data": materials_list
    }


@router.get("/enrollments")
async def get_my_enrollments(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my enrollments
    
    Returns all course enrollments with section details
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get enrollments
    query = select(Enrollment).where(
        Enrollment.student_id == user.id
    ).options(
        selectinload(Enrollment.section).selectinload(CourseSection.course),
        selectinload(Enrollment.section).selectinload(CourseSection.semester),
        selectinload(Enrollment.section).selectinload(CourseSection.instructor)
    )
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    return enrollments


@router.get("/grades")
async def get_my_grades(
    semester_id: int | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my grades
    
    Returns all grades with assignment and course details
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get grades through enrollments
    query = select(Grade).join(
        Enrollment, Enrollment.id == Grade.enrollment_id
    ).where(
        Enrollment.student_id == user.id
    ).options(
        selectinload(Grade.enrollment).selectinload(Enrollment.section).selectinload(CourseSection.course),
        selectinload(Grade.enrollment).selectinload(Enrollment.section).selectinload(CourseSection.semester)
    )
    
    # Filter by semester if provided
    if semester_id:
        query = query.join(
            CourseSection, CourseSection.id == Enrollment.course_section_id
        ).where(
            CourseSection.semester_id == semester_id
        )
    
    result = await db.execute(query)
    grades = result.scalars().all()
    
    return grades


@router.get("/attendance")
async def get_my_attendance(
    semester_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my attendance records
    
    Returns all attendance records with optional filters
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get attendance - Attendance uses enrollment_id
    query = select(Attendance).join(
        Enrollment, Enrollment.id == Attendance.enrollment_id
    ).where(
        Enrollment.student_id == user.id
    ).options(
        selectinload(Attendance.enrollment).selectinload(Enrollment.section).selectinload(CourseSection.course),
        selectinload(Attendance.enrollment).selectinload(Enrollment.section).selectinload(CourseSection.semester)
    )
    
    # Filters
    if semester_id:
        query = query.join(
            CourseSection, CourseSection.id == Enrollment.course_section_id  # Changed from section_id
        ).where(
            CourseSection.semester_id == semester_id
        )
    
    if start_date:
        query = query.where(Attendance.date >= start_date)
    
    if end_date:
        query = query.where(Attendance.date <= end_date)
    
    result = await db.execute(query)
    attendance_records = result.scalars().all()
    
    return attendance_records


@router.get("/invoices")
async def get_my_invoices(
    status: str | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my invoices
    
    Returns all invoices with payment details
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get invoices
    query = select(Invoice).where(
        Invoice.student_id == user.id
    ).options(
        selectinload(Invoice.invoice_lines),
        selectinload(Invoice.payments)
    )
    
    if status:
        query = query.where(Invoice.status == status)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return invoices


@router.get("/documents")
async def get_my_documents(
    status: str | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my document requests
    
    Returns all document requests (transcripts, certificates, etc.)
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get document requests
    query = select(DocumentRequest).where(
        DocumentRequest.student_id == user.id
    )
    
    if status:
        query = query.where(DocumentRequest.status == status)
    
    query = query.order_by(DocumentRequest.created_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return documents


@router.get("/gpa")
async def get_my_gpa(
    semester_id: int | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate my GPA
    
    Returns GPA calculation for current or specific semester
    """
    uid = current_user['uid']
    
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get enrollments with grades
    query = select(Enrollment).where(
        Enrollment.student_id == user.id,
        Enrollment.status == 'completed',
        Enrollment.grade.isnot(None)
    ).options(
        selectinload(Enrollment.section).selectinload(CourseSection.course)
    )
    
    if semester_id:
        query = query.join(
            CourseSection, CourseSection.id == Enrollment.course_section_id  # Changed from section_id to course_section_id
        ).where(
            CourseSection.semester_id == semester_id
        )
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    # Calculate GPA
    grade_points = {
        'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0,
        'F': 0.0
    }
    
    total_credits = 0
    total_grade_points = 0
    
    for enrollment in enrollments:
        if enrollment.grade in grade_points:
            credits = enrollment.section.course.credits or 3  # Default 3 credits
            total_credits += credits
            total_grade_points += grade_points[enrollment.grade] * credits
    
    gpa = total_grade_points / total_credits if total_credits > 0 else 0.0
    
    return {
        "gpa": round(gpa, 2),
        "total_credits": total_credits,
        "courses_completed": len(enrollments)
    }


@router.get("/teaching-sections")
async def get_my_teaching_sections(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get sections taught by the current teacher
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != 'teacher':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )
    
    # Get all sections taught by this teacher with schedules
    stmt = (
        select(CourseSection)
        .options(
            selectinload(CourseSection.course)
        )
        .where(CourseSection.instructor_id == user.id)
    )
    result = await db.execute(stmt)
    sections = result.scalars().all()
    
    # Get schedules for these sections
    section_ids = [s.id for s in sections]
    schedules_by_section = {}
    
    if section_ids:
        schedule_stmt = select(SectionSchedule).where(SectionSchedule.section_id.in_(section_ids))
        schedule_result = await db.execute(schedule_stmt)
        all_schedules = schedule_result.scalars().all()
        
        for schedule in all_schedules:
            if schedule.section_id not in schedules_by_section:
                schedules_by_section[schedule.section_id] = []
            schedules_by_section[schedule.section_id].append(schedule)
    
    return {
        "success": True,
        "data": [
            {
                "id": section.id,
                "section_code": section.section_code,
                "course_id": section.course_id,
                "course_code": section.course.course_code if section.course else None,
                "course_name": section.course.name if section.course else None,
                "semester_id": section.semester_id,
                "max_students": section.max_students,
                "enrolled_count": section.enrolled_count or 0,
                "schedules": [
                    {
                        "id": schedule.id,
                        "start_ts": schedule.start_ts.isoformat() if schedule.start_ts else None,
                        "end_ts": schedule.end_ts.isoformat() if schedule.end_ts else None,
                        "room": schedule.room,
                        "canceled": schedule.canceled
                    }
                    for schedule in schedules_by_section.get(section.id, [])
                ]
            }
            for section in sections
        ]
    }


@router.get("/teaching-schedule")
async def get_my_teaching_schedule(
    days: int = Query(7, ge=1, le=30),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get upcoming teaching schedule for the teacher
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != 'teacher':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )
    
    from datetime import datetime, timedelta, timezone
    
    # Get all sections taught by this teacher
    stmt = (
        select(CourseSection)
        .options(
            selectinload(CourseSection.course)
        )
        .where(CourseSection.instructor_id == user.id)
    )
    result = await db.execute(stmt)
    sections = result.scalars().all()
    
    # Get schedules for these sections
    section_ids = [s.id for s in sections]
    schedules_by_section = {}
    
    if section_ids:
        schedule_stmt = select(SectionSchedule).where(SectionSchedule.section_id.in_(section_ids))
        schedule_result = await db.execute(schedule_stmt)
        all_schedules = schedule_result.scalars().all()
        
        for schedule in all_schedules:
            if schedule.section_id not in schedules_by_section:
                schedules_by_section[schedule.section_id] = []
            schedules_by_section[schedule.section_id].append(schedule)
    
    # Convert to upcoming classes format
    upcoming_classes = []
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days)
    
    for section in sections:
        schedules = schedules_by_section.get(section.id, [])
        for schedule in schedules:
            # Only include future classes that are not canceled
            if schedule.start_ts and schedule.start_ts >= now and schedule.start_ts <= end_date and not schedule.canceled:
                upcoming_classes.append({
                    "id": section.id,
                    "section_id": section.id,
                    "course_code": section.course.course_code if section.course else "N/A",
                    "course_name": section.course.name if section.course else "Unknown",
                    "section_code": section.section_code,
                    "day": schedule.start_ts.weekday(),
                    "day_name": schedule.start_ts.strftime("%A"),
                    "start_time": schedule.start_ts.strftime("%H:%M"),
                    "end_time": schedule.end_ts.strftime("%H:%M") if schedule.end_ts else "",
                    "room": schedule.room,
                    "date": schedule.start_ts.date().isoformat(),
                        "enrolled_count": section.enrolled_count or 0
                    })
    
    # Sort by date and time
    upcoming_classes.sort(key=lambda x: (x['date'], x['start_time']))
    
    return {
        "success": True,
        "data": upcoming_classes[:days * 5]  # Limit to reasonable amount
    }


@router.get("/teaching-stats")
async def get_my_teaching_stats(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get teaching statistics for teacher dashboard
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != 'teacher':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a teacher"
        )
    
    # Count active sections
    sections_stmt = (
        select(func.count(CourseSection.id))
        .where(
            and_(
                CourseSection.instructor_id == user.id,
                CourseSection.is_active == True
            )
        )
    )
    sections_result = await db.execute(sections_stmt)
    total_sections = sections_result.scalar() or 0
    
    # Count total students across all sections
    students_stmt = (
        select(func.sum(CourseSection.enrolled_count))
        .where(
            and_(
                CourseSection.instructor_id == user.id,
                CourseSection.is_active == True
            )
        )
    )
    students_result = await db.execute(students_stmt)
    total_students = students_result.scalar() or 0
    
    # Count pending assignments (assignments without grades)
    from datetime import datetime
    pending_assignments_stmt = (
        select(func.count(Assignment.id))
        .join(CourseSection, Assignment.course_section_id == CourseSection.id)
        .where(
            and_(
                CourseSection.instructor_id == user.id,
                Assignment.due_date >= datetime.now().date()
            )
        )
    )
    pending_result = await db.execute(pending_assignments_stmt)
    pending_assignments = pending_result.scalar() or 0
    
    # Get sections with enrollment info
    sections_info_stmt = (
        select(CourseSection)
        .options(selectinload(CourseSection.course))
        .where(
            and_(
                CourseSection.instructor_id == user.id,
                CourseSection.is_active == True
            )
        )
        .limit(5)
    )
    sections_info_result = await db.execute(sections_info_stmt)
    sections = sections_info_result.scalars().all()
    
    return {
        "success": True,
        "data": {
            "total_sections": total_sections,
            "total_students": int(total_students) if total_students else 0,
            "pending_assignments": pending_assignments,
            "recent_sections": [
                {
                    "id": section.id,
                    "course_code": section.course.course_code if section.course else "N/A",
                    "course_name": section.course.name if section.course else "Unknown",
                    "section_code": section.section_code,
                    "enrolled_count": section.enrolled_count or 0,
                    "max_students": section.max_students
                }
                for section in sections
            ]
        }
    }


@router.get("/transcript")
async def get_my_transcript(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get student's academic transcript grouped by semester
    
    Returns courses with final grades, credits, and GPA per semester
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != 'student':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access transcripts"
        )
    
    # Get all enrollments with grades, grouped by semester
    from app.models import Semester
    
    enrollments_stmt = (
        select(Enrollment)
        .options(
            selectinload(Enrollment.section).selectinload(CourseSection.course),
            selectinload(Enrollment.section).selectinload(CourseSection.semester),
        )
        .where(Enrollment.student_id == user.id)
        .order_by(Enrollment.created_at)
    )
    enrollments_result = await db.execute(enrollments_stmt)
    enrollments = enrollments_result.scalars().all()
    
    # Get grades for all enrollments
    grades_stmt = (
        select(Grade)
        .where(
            and_(
                Grade.enrollment_id.in_([e.id for e in enrollments]),
                Grade.approval_status == 'approved'
            )
        )
    )
    grades_result = await db.execute(grades_stmt)
    grades = grades_result.scalars().all()
    
    # Map grades by enrollment_id
    grades_by_enrollment = {}
    for grade in grades:
        if grade.enrollment_id not in grades_by_enrollment:
            grades_by_enrollment[grade.enrollment_id] = []
        grades_by_enrollment[grade.enrollment_id].append(grade)
    
    # Group enrollments by semester
    from collections import defaultdict
    semesters_data = defaultdict(list)
    
    for enrollment in enrollments:
        if not enrollment.section or not enrollment.section.semester:
            continue
            
        semester = enrollment.section.semester
        course = enrollment.section.course
        
        # Calculate course grade from approved grades
        enrollment_grades = grades_by_enrollment.get(enrollment.id, [])
        total_score = sum(float(g.grade_value) for g in enrollment_grades if g.grade_value)
        total_max = sum(float(g.max_grade) for g in enrollment_grades if g.max_grade)
        
        percentage = (total_score / total_max * 100) if total_max > 0 else 0
        
        # Convert percentage to letter grade and GPA
        if percentage >= 90:
            letter_grade = "A"
            gpa_points = 4.0
        elif percentage >= 85:
            letter_grade = "A-"
            gpa_points = 3.7
        elif percentage >= 80:
            letter_grade = "B+"
            gpa_points = 3.3
        elif percentage >= 75:
            letter_grade = "B"
            gpa_points = 3.0
        elif percentage >= 70:
            letter_grade = "B-"
            gpa_points = 2.7
        elif percentage >= 65:
            letter_grade = "C+"
            gpa_points = 2.3
        elif percentage >= 60:
            letter_grade = "C"
            gpa_points = 2.0
        elif percentage >= 55:
            letter_grade = "C-"
            gpa_points = 1.7
        elif percentage >= 50:
            letter_grade = "D"
            gpa_points = 1.0
        else:
            letter_grade = "F"
            gpa_points = 0.0
        
        course_data = {
            "course_code": course.course_code if course else "N/A",
            "course_name": course.name if course else "Unknown",
            "credits": float(course.credits) if course and course.credits else 3.0,
            "grade": letter_grade,
            "gpa_points": gpa_points,
            "percentage": round(percentage, 1),
            "section_code": enrollment.section.section_code
        }
        
        semesters_data[semester.id].append({
            "semester_name": semester.name,
            "semester_id": semester.id,
            "start_date": semester.start_date.isoformat() if semester.start_date else None,
            "end_date": semester.end_date.isoformat() if semester.end_date else None,
            "course": course_data
        })
    
    # Calculate GPA per semester and format response
    transcript = []
    cumulative_points = 0.0
    cumulative_credits = 0.0
    
    for semester_id, courses in semesters_data.items():
        if not courses:
            continue
            
        semester_info = courses[0]  # Get semester info from first course
        semester_points = sum(c["course"]["gpa_points"] * c["course"]["credits"] for c in courses)
        semester_credits = sum(c["course"]["credits"] for c in courses)
        semester_gpa = semester_points / semester_credits if semester_credits > 0 else 0.0
        
        cumulative_points += semester_points
        cumulative_credits += semester_credits
        
        transcript.append({
            "semester_id": semester_id,
            "semester_name": semester_info["semester_name"],
            "start_date": semester_info["start_date"],
            "end_date": semester_info["end_date"],
            "courses": [c["course"] for c in courses],
            "semester_credits": semester_credits,
            "semester_gpa": round(semester_gpa, 2),
            "cumulative_gpa": round(cumulative_points / cumulative_credits, 2) if cumulative_credits > 0 else 0.0
        })
    
    return {
        "success": True,
        "data": {
            "transcript": transcript,
            "total_credits": cumulative_credits,
            "cumulative_gpa": round(cumulative_points / cumulative_credits, 2) if cumulative_credits > 0 else 0.0
        }
    }
