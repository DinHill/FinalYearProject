"""
Models package - imports all models
"""
from app.models.base import BaseModel
from app.models.user import (
    User, Campus, Major, UsernameSequence, StudentSequence, DeviceToken,
    UserRole as UserRoleEnum, UserStatus, Gender  # Renamed enum to avoid conflict
)
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.academic import (
    Semester, Course, CourseSection, SectionSchedule, Enrollment, Assignment, Grade, Attendance,
    SemesterType, CourseLevel, SectionStatus, EnrollmentStatus, AttendanceStatus,
    AssignmentType, GradeStatus
)
from app.models.finance import (
    FeeStructure, Invoice, InvoiceLine, Payment,
    InvoiceStatus, PaymentMethod, PaymentStatus
)
from app.models.document import (
    Document, DocumentRequest, Announcement,
    DocumentCategory, DocumentVisibility, DocumentRequestType, DocumentRequestStatus,
    DeliveryMethod, AnnouncementCategory, Priority
)
from app.models.communication import (
    ChatRoom, ChatParticipant, SupportTicket, TicketEvent, Notification,
    RoomType, ParticipantRole, TicketCategory, TicketPriority, TicketStatus, EventType,
    NotificationType, NotificationPriority
)
from app.models.settings import SystemSetting

__all__ = [
    # Base
    "BaseModel",
    
    # User models
    "User", "Campus", "Major", "UsernameSequence", "StudentSequence", "DeviceToken",
    "UserRoleEnum", "UserStatus", "Gender",
    
    # RBAC models
    "Role", "UserRole",
    
    # Academic models
    "Semester", "Course", "CourseSection", "SectionSchedule", "Enrollment", "Assignment", "Grade", "Attendance",
    "SemesterType", "CourseLevel", "SectionStatus", "EnrollmentStatus", "AttendanceStatus",
    "AssignmentType", "GradeStatus",
    
    # Finance models
    "FeeStructure", "Invoice", "InvoiceLine", "Payment",
    "InvoiceStatus", "PaymentMethod", "PaymentStatus",
    
    # Document models
    "Document", "DocumentRequest", "Announcement",
    "DocumentCategory", "DocumentVisibility", "DocumentRequestType", "DocumentRequestStatus",
    "DeliveryMethod", "AnnouncementCategory", "Priority",
    
    # Communication models
    "ChatRoom", "ChatParticipant", "SupportTicket", "TicketEvent", "Notification",
    "RoomType", "ParticipantRole", "TicketCategory", "TicketPriority", "TicketStatus", "EventType",
    "NotificationType", "NotificationPriority",
    
    # Settings
    "SystemSetting",
]
