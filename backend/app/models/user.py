from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from passlib.context import CryptContext
import enum

from app.core.database import Base

# Password hashing context - using pbkdf2_sha256 which is built-in
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class UserRole(enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=True)  # Made optional
    email = Column(String(255), unique=True, index=True, nullable=True)  # Made optional for ID-based auth
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), nullable=False)  # Force string storage for SQLite
    status = Column(Enum(UserStatus, native_enum=False), default=UserStatus.ACTIVE)  # Force string storage for SQLite
    
    # ID-based authentication fields
    student_id = Column(String(50), unique=True, index=True)  # For students
    employee_id = Column(String(50), unique=True, index=True)  # For teachers/staff
    password_hash = Column(String(255), nullable=False)  # Hashed password
    
    # Profile fields
    phone_number = Column(String(20))
    avatar_url = Column(Text)
    department = Column(String(100))
    campus = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    @property
    def user_id(self):
        """Returns the appropriate ID based on user role"""
        if self.role == UserRole.STUDENT:
            return self.student_id
        else:
            return self.employee_id

    def set_password(self, password: str):
        """Hash and set password"""
        self.password_hash = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(password, self.password_hash)

    def __repr__(self):
        return f"<User(id={self.id}, user_id='{self.user_id}', role='{self.role.value}')>"