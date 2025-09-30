from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

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
    firebase_uid = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    phone_number = Column(String(20))
    avatar_url = Column(Text)
    student_id = Column(String(50), unique=True, index=True)  # For students
    employee_id = Column(String(50), unique=True, index=True)  # For teachers/staff
    department = Column(String(100))
    campus = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"