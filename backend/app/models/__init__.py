# Import all models to ensure they are registered with SQLAlchemy
from .user import User, UserRole, UserStatus, Base
from .academic import Semester, Course, CourseSection, SemesterType, CourseStatus
from .schedule import Schedule, SpecialEvent, DayOfWeek, ScheduleType
from .enrollment import Enrollment, Assignment, Grade, EnrollmentStatus, GradeStatus
from .chat import ChatRoom, ChatParticipant, Message, MessageType, MessageStatus

# Export all models for easy importing
__all__ = [
    # Base
    "Base",
    
    # User models
    "User", "UserRole", "UserStatus",
    
    # Academic models
    "Semester", "Course", "CourseSection", "SemesterType", "CourseStatus",
    
    # Schedule models
    "Schedule", "SpecialEvent", "DayOfWeek", "ScheduleType",
    
    # Enrollment and grading models
    "Enrollment", "Assignment", "Grade", "EnrollmentStatus", "GradeStatus",
    
    # Chat models
    "ChatRoom", "ChatParticipant", "Message", "MessageType", "MessageStatus",
]