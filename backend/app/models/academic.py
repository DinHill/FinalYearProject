from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base
import enum

class SemesterType(enum.Enum):
    FALL = "fall"
    SPRING = "spring"
    SUMMER = "summer"

class CourseStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Fall 2024"
    year = Column(Integer, nullable=False)
    type = Column(Enum(SemesterType), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., "CS101"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    credits = Column(Integer, default=3)
    department = Column(String(100), nullable=False)
    prerequisite_codes = Column(Text)  # JSON array of course codes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CourseSection(Base):
    __tablename__ = "course_sections"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    section_number = Column(String(10), nullable=False)  # e.g., "01", "02"
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    max_students = Column(Integer, default=30)
    enrolled_count = Column(Integer, default=0)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course = relationship("Course", backref="sections")
    semester = relationship("Semester", backref="course_sections")
    teacher = relationship("User", backref="teaching_sections")