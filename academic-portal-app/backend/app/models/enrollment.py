from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base
import enum

class EnrollmentStatus(enum.Enum):
    ENROLLED = "enrolled"
    DROPPED = "dropped"
    COMPLETED = "completed"
    FAILED = "failed"

class GradeStatus(enum.Enum):
    PENDING = "pending"
    GRADED = "graded"
    PUBLISHED = "published"

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    drop_date = Column(DateTime(timezone=True))
    final_grade = Column(String(5))  # A+, A, B+, B, etc.
    grade_points = Column(Float)  # 4.0, 3.7, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("User", backref="enrollments")
    course_section = relationship("CourseSection", backref="enrollments")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assignment_type = Column(String(50))  # homework, quiz, exam, project
    total_points = Column(Float, default=100.0)
    due_date = Column(DateTime(timezone=True))
    is_published = Column(Boolean, default=False)
    allow_late_submission = Column(Boolean, default=False)
    late_penalty_percent = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_section = relationship("CourseSection", backref="assignments")
    creator = relationship("User", backref="created_assignments")

class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points_earned = Column(Float)
    status = Column(Enum(GradeStatus), default=GradeStatus.PENDING)
    feedback = Column(Text)
    submission_date = Column(DateTime(timezone=True))
    graded_date = Column(DateTime(timezone=True))
    graded_by = Column(Integer, ForeignKey("users.id"))
    is_late = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    assignment = relationship("Assignment", backref="grades")
    student = relationship("User", foreign_keys=[student_id], backref="received_grades")
    grader = relationship("User", foreign_keys=[graded_by], backref="graded_assignments")