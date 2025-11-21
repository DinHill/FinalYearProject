"""
User and authentication models
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class UserRole(str, enum.Enum):
    """User role enum"""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    ACADEMIC_ADMIN = "academic_admin"
    FINANCE_ADMIN = "finance_admin"
    SUPPORT_ADMIN = "support_admin"
    REGISTRAR = "registrar"
    PARENT = "parent"


class UserStatus(str, enum.Enum):
    """User status enum"""
    PENDING = "pending"      # Awaiting approval, not in Firebase yet
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    GRADUATED = "graduated"


class Gender(str, enum.Enum):
    """Gender enum"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class User(BaseModel):
    """User model"""
    
    __tablename__ = "users"
    
    # Identity
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)  # Nullable for pending users
    username = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Basic Information
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255))  # For student login flow
    
    # Role & Status
    role = Column(String(20), nullable=False, index=True)  # Changed from Enum for compatibility
    status = Column(String(20), default="active", index=True)  # Changed from Enum for compatibility
    
    # Profile
    phone_number = Column(String(20))
    avatar_url = Column(String(500))
    date_of_birth = Column(Date)
    gender = Column(String(10))  # Changed from Enum to String to match database
    
    # Academic Context
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    major_id = Column(Integer, ForeignKey("majors.id"), index=True)
    year_entered = Column(Integer)  # For students
    
    # Activity
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    campus = relationship("Campus", back_populates="users")
    major = relationship("Major", back_populates="users", foreign_keys=[major_id])
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="[Enrollment.student_id]")
    taught_sections = relationship("CourseSection", back_populates="instructor")
    # grades relationship removed - Grade model uses enrollment_id, not student_id
    # attendance_records = relationship("Attendance", back_populates="student", foreign_keys="[Attendance.student_id]")  # Removed: attendance references enrollment_id, not student_id
    invoices = relationship("Invoice", back_populates="student", foreign_keys="[Invoice.student_id]")
    document_requests = relationship("DocumentRequest", back_populates="student", foreign_keys="[DocumentRequest.student_id]")
    support_tickets = relationship("SupportTicket", back_populates="user", foreign_keys="[SupportTicket.user_id]")  # Changed from requester_id to user_id
    chat_participations = relationship("ChatParticipant", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class Campus(BaseModel):
    """Campus model"""
    
    __tablename__ = "campuses"
    
    code = Column(String(3), unique=True, nullable=False)  # H, D, C, S
    name = Column(String(100), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    timezone = Column(String(50), default="Asia/Ho_Chi_Minh")
    phone = Column(String(20))
    email = Column(String(255))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    users = relationship("User", back_populates="campus")
    # course_sections relationship removed - course_sections table doesn't have campus_id
    # announcements relationship removed - announcements table doesn't have campus_id
    
    def __repr__(self):
        return f"<Campus {self.code} - {self.name}>"


class Major(BaseModel):
    """Major/Program model"""
    
    __tablename__ = "majors"
    
    code = Column(String(3), unique=True, nullable=False)  # C, B, D
    name = Column(String(100), nullable=False)
    # degree_type = Column(String(20))  # BSc, BA - Column doesn't exist in database yet
    # credits_required = Column(Integer, default=120)  # Column doesn't exist in database yet
    description = Column(String(1000))
    is_active = Column(Boolean, default=True)
    coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="major", foreign_keys="[User.major_id]")
    courses = relationship("Course", back_populates="major")
    coordinator = relationship("User", foreign_keys=[coordinator_id], uselist=False)
    
    def __repr__(self):
        return f"<Major {self.code} - {self.name}>"


class UsernameSequence(BaseModel):
    """Username sequence tracking for collision avoidance"""
    
    __tablename__ = "username_sequences"
    
    base_username = Column(String(20), nullable=False)
    user_type = Column(String(20), nullable=False)
    count = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<UsernameSequence {self.base_username} ({self.count})>"


class StudentSequence(BaseModel):
    """Student ID sequence tracking"""
    
    __tablename__ = "student_sequences"
    
    major_code = Column(String(3), nullable=False)
    campus_code = Column(String(3), nullable=False)
    year_entered = Column(Integer, nullable=False)
    last_sequence = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<StudentSequence {self.major_code}{self.campus_code}{self.year_entered} ({self.last_sequence})>"


class DeviceToken(BaseModel):
    """FCM device tokens for push notifications"""
    
    __tablename__ = "device_tokens"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Token and device info
    push_token = Column(Text, unique=True, nullable=False)  # Changed from token to match schema, changed to Text
    platform = Column(String(20), nullable=False)  # ios, android, web
    device_info = Column(Text)  # Additional device information
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationship
    user = relationship("User")
    
    def __repr__(self):
        return f"<DeviceToken {self.platform} for user {self.user_id}>"
