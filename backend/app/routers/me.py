"""
"Me" endpoints - User-scoped data endpoints for mobile app
These endpoints return data for the currently authenticated user
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.models import (
    User, Enrollment, Grade, Attendance, Invoice, 
    DocumentRequest, CourseSection, Assignment
)
from app.schemas.auth import UserProfileResponse
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me", tags=["My Data"])


# Schema for profile updates
class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    
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
            selectinload(User.user_roles).selectinload('role')
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
    
    return user


@router.get("/schedule")
async def get_my_schedule(
    semester_id: int | None = None,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get my class schedule
    
    Returns all enrolled sections with schedule details
    """
    uid = current_user['uid']
    
    # Get user
    result = await db.execute(
        select(User).where(User.firebase_uid == uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query based on user role
    if user.role == 'student':
        # Get student's enrolled sections
        query = select(CourseSection).join(
            Enrollment, Enrollment.section_id == CourseSection.id
        ).where(
            Enrollment.student_id == user.id,
            Enrollment.status == 'enrolled'
        )
    elif user.role == 'teacher':
        # Get teacher's teaching sections
        query = select(CourseSection).where(
            CourseSection.instructor_id == user.id
        )
    else:
        return []
    
    # Filter by semester if provided
    if semester_id:
        query = query.where(CourseSection.semester_id == semester_id)
    
    # Load relationships
    query = query.options(
        selectinload(CourseSection.course),
        selectinload(CourseSection.semester),
        selectinload(CourseSection.campus),
        selectinload(CourseSection.instructor),
        selectinload(CourseSection.schedules)
    )
    
    result = await db.execute(query)
    sections = result.scalars().all()
    
    return sections


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
    
    # Get grades
    query = select(Grade).where(
        Grade.student_id == user.id
    ).options(
        selectinload(Grade.assignment).selectinload(Assignment.section).selectinload(CourseSection.course),
        selectinload(Grade.assignment).selectinload(Assignment.section).selectinload(CourseSection.semester)
    )
    
    # Filter by semester if provided
    if semester_id:
        query = query.join(
            Assignment, Assignment.id == Grade.assignment_id
        ).join(
            CourseSection, CourseSection.id == Assignment.section_id
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
    
    # Get attendance
    query = select(Attendance).where(
        Attendance.student_id == user.id
    ).options(
        selectinload(Attendance.section).selectinload(CourseSection.course),
        selectinload(Attendance.section).selectinload(CourseSection.semester)
    )
    
    # Filters
    if semester_id:
        query = query.join(
            CourseSection, CourseSection.id == Attendance.section_id
        ).where(
            CourseSection.semester_id == semester_id
        )
    
    if start_date:
        query = query.where(Attendance.attendance_date >= start_date)
    
    if end_date:
        query = query.where(Attendance.attendance_date <= end_date)
    
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
            CourseSection, CourseSection.id == Enrollment.section_id
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
