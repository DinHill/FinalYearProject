"""
Dashboard statistics and analytics endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import require_roles
from app.models import User
from app.models.user import Campus, Major
from app.models.academic import (
    Course, CourseSection, Enrollment, Assignment, Grade, Attendance, Semester,
    EnrollmentStatus, AttendanceStatus
)
from app.models.finance import Invoice, Payment, PaymentStatus
from app.models.document import DocumentRequest, DocumentRequestStatus, Announcement
from app.models.communication import SupportTicket, TicketStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Get comprehensive dashboard statistics
    
    Access: admin only
    
    Returns:
    - Total counts for users, courses, enrollments
    - Active semester info
    - Recent activity
    - Financial summary
    - Pending items
    """
    
    # User statistics
    total_students_query = select(func.count(User.id)).where(User.role == "student")
    total_teachers_query = select(func.count(User.id)).where(User.role == "teacher")
    total_staff_query = select(func.count(User.id)).where(User.role.in_(["admin", "staff"]))
    
    total_students = (await db.execute(total_students_query)).scalar() or 0
    total_teachers = (await db.execute(total_teachers_query)).scalar() or 0
    total_staff = (await db.execute(total_staff_query)).scalar() or 0
    
    # Course statistics
    total_courses_query = select(func.count(Course.id))
    active_courses_query = select(func.count(Course.id)).where(Course.is_active == True)
    
    total_courses = (await db.execute(total_courses_query)).scalar() or 0
    active_courses = (await db.execute(active_courses_query)).scalar() or 0
    
    # Enrollment statistics
    total_enrollments_query = select(func.count(Enrollment.id))
    active_enrollments_query = select(func.count(Enrollment.id)).where(
        Enrollment.status == EnrollmentStatus.ENROLLED
    )
    
    total_enrollments = (await db.execute(total_enrollments_query)).scalar() or 0
    active_enrollments = (await db.execute(active_enrollments_query)).scalar() or 0
    
    # Attendance statistics (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_attendance_query = select(func.count(Attendance.id)).where(
        Attendance.date >= thirty_days_ago
    )
    present_attendance_query = select(func.count(Attendance.id)).where(
        and_(
            Attendance.date >= thirty_days_ago,
            Attendance.status == AttendanceStatus.PRESENT
        )
    )
    
    total_attendance = (await db.execute(total_attendance_query)).scalar() or 0
    present_attendance = (await db.execute(present_attendance_query)).scalar() or 0
    attendance_rate = (present_attendance / total_attendance * 100) if total_attendance > 0 else 0
    
    # Financial statistics
    total_revenue_query = select(func.sum(Payment.amount)).where(
        Payment.status == PaymentStatus.COMPLETED
    )
    pending_invoices_query = select(func.count(Invoice.id)).where(
        Invoice.status.in_(["pending", "overdue"])
    )
    
    total_revenue = (await db.execute(total_revenue_query)).scalar() or 0
    pending_invoices = (await db.execute(pending_invoices_query)).scalar() or 0
    
    # Pending document requests
    pending_documents_query = select(func.count(DocumentRequest.id)).where(
        DocumentRequest.status == DocumentRequestStatus.PENDING
    )
    pending_documents = (await db.execute(pending_documents_query)).scalar() or 0
    
    # Pending support tickets
    pending_tickets_query = select(func.count(SupportTicket.id)).where(
        SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    )
    pending_tickets = (await db.execute(pending_tickets_query)).scalar() or 0
    
    # Recent announcements
    recent_announcements_query = select(func.count(Announcement.id)).where(
        Announcement.created_at >= thirty_days_ago
    )
    recent_announcements = (await db.execute(recent_announcements_query)).scalar() or 0
    
    # Campus and major counts
    total_campuses = (await db.execute(select(func.count(Campus.id)))).scalar() or 0
    total_majors = (await db.execute(select(func.count(Major.id)))).scalar() or 0
    
    return {
        "users": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_staff": total_staff,
            "total_users": total_students + total_teachers + total_staff
        },
        "academics": {
            "total_courses": total_courses,
            "active_courses": active_courses,
            "total_enrollments": total_enrollments,
            "active_enrollments": active_enrollments,
            "attendance_rate": round(attendance_rate, 2)
        },
        "finance": {
            "total_revenue": float(total_revenue),
            "pending_invoices": pending_invoices
        },
        "pending": {
            "documents": pending_documents,
            "tickets": pending_tickets
        },
        "system": {
            "campuses": total_campuses,
            "majors": total_majors,
            "recent_announcements": recent_announcements
        }
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Get recent activity across the system
    
    Access: admin only
    """
    
    activities = []
    
    # Recent user registrations
    recent_users_query = select(User).order_by(User.created_at.desc()).limit(5)
    recent_users = (await db.execute(recent_users_query)).scalars().all()
    
    for user in recent_users:
        activities.append({
            "type": "user_created",
            "description": f"New {user.role} registered: {user.full_name}",
            "timestamp": user.created_at.isoformat(),
            "user_id": user.id
        })
    
    # Recent enrollments
    recent_enrollments_query = (
        select(Enrollment)
        .order_by(Enrollment.created_at.desc())
        .limit(5)
    )
    recent_enrollments = (await db.execute(recent_enrollments_query)).scalars().all()
    
    for enrollment in recent_enrollments:
        activities.append({
            "type": "enrollment",
            "description": f"Student enrolled in course",
            "timestamp": enrollment.created_at.isoformat(),
            "enrollment_id": enrollment.id
        })
    
    # Recent announcements
    recent_announcements_query = (
        select(Announcement)
        .order_by(Announcement.created_at.desc())
        .limit(5)
    )
    recent_announcements = (await db.execute(recent_announcements_query)).scalars().all()
    
    for announcement in recent_announcements:
        activities.append({
            "type": "announcement",
            "description": f"New announcement: {announcement.title}",
            "timestamp": announcement.created_at.isoformat(),
            "announcement_id": announcement.id
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activities = activities[:limit]
    
    return {
        "activities": activities,
        "total": len(activities)
    }
