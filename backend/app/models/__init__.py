"""
Models package - imports all models
"""
from app.models.base import BaseModel
from app.models.user import (
    User, Campus, Major, UsernameSequence, StudentSequence, DeviceToken,
    UserRole, UserStatus, Gender
)
from app.models.academic import (
    Semester, Course, CourseSection, Schedule, Enrollment, Assignment, Grade, Attendance,
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
    ChatRoom, ChatParticipant, SupportTicket, TicketEvent,
    RoomType, ParticipantRole, TicketCategory, TicketPriority, TicketStatus, EventType
)

__all__ = [
    # Base
    "BaseModel",
    
    # User models
    "User", "Campus", "Major", "UsernameSequence", "StudentSequence", "DeviceToken",
    "UserRole", "UserStatus", "Gender",
    
    # Academic models
    "Semester", "Course", "CourseSection", "Schedule", "Enrollment", "Assignment", "Grade", "Attendance",
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
    "ChatRoom", "ChatParticipant", "SupportTicket", "TicketEvent",
    "RoomType", "ParticipantRole", "TicketCategory", "TicketPriority", "TicketStatus", "EventType",
]
