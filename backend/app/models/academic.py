"""
Academic models - courses, enrollments, grades, attendance
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, Time, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum, CheckConstraint, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, validates
from datetime import time as pytime
from app.models.base import BaseModel
import enum


class SemesterType(str, enum.Enum):
    """Semester type enum"""
    FALL = "fall"
    SPRING = "spring"
    SUMMER = "summer"


class CourseLevel(str, enum.Enum):
    """Course level enum"""
    UNDERGRADUATE = "undergraduate"
    GRADUATE = "graduate"


class SectionStatus(str, enum.Enum):
    """Course section status enum"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status enum"""
    ENROLLED = "enrolled"
    DROPPED = "dropped"
    WITHDRAWN = "withdrawn"
    COMPLETED = "completed"


class AttendanceStatus(str, enum.Enum):
    """Attendance status enum"""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class AssignmentType(str, enum.Enum):
    """Assignment type enum"""
    HOMEWORK = "homework"
    QUIZ = "quiz"
    MIDTERM = "midterm"
    FINAL = "final"
    PROJECT = "project"


class GradeStatus(str, enum.Enum):
    """Grade approval workflow status enum"""
    DRAFT = "draft"              # Teacher still editing
    SUBMITTED = "submitted"      # Awaiting review
    UNDER_REVIEW = "under_review" # Admin checking
    REJECTED = "rejected"        # Sent back with comments
    APPROVED = "approved"        # Valid but not published
    PUBLISHED = "published"      # Visible to students
    ARCHIVED = "archived"        # Past term, locked


class AttendanceComplianceLevel(str, enum.Enum):
    """Attendance compliance level thresholds"""
    COMPLIANT = "compliant"        # ≥ 75%
    AT_RISK = "at_risk"           # 50-74%
    EXAM_INELIGIBLE = "ineligible" # 25-49%
    AUTO_FAIL = "auto_fail"        # < 25%


class Semester(BaseModel):
    """Semester model"""
    
    __tablename__ = "semesters"
    
    code = Column(String(20), unique=True, nullable=False)  # "2024_FALL"
    name = Column(String(100), nullable=False)  # "Fall 2024"
    type = Column(String(10))  # Changed from Enum to String to match schema: fall, spring, summer
    academic_year = Column(String(20))  # Changed from Integer to String to match schema: "2024-2025"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_start = Column(Date)
    registration_end = Column(Date)
    is_current = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)  # Added to match database
    
    # Relationships
    course_sections = relationship("CourseSection", back_populates="semester")
    
    def __repr__(self):
        return f"<Semester {self.code}>"


class Course(BaseModel):
    """Course catalog model"""
    
    __tablename__ = "courses"
    
    course_code = Column(String(20), unique=True, nullable=False, index=True)  # "CS101"
    name = Column(String(200), nullable=False)
    description = Column(Text)
    credits = Column(Integer, nullable=False)
    major_id = Column(Integer, ForeignKey("majors.id"), index=True)
    level = Column(Integer, default=1)  # 1=Freshman, 2=Sophomore, etc.
    prerequisites = Column(JSONB)  # ["CS100", "MATH101"]
    is_active = Column(Boolean, default=True)
    
    # Relationships
    major = relationship("Major", back_populates="courses")
    sections = relationship("CourseSection", back_populates="course")
    
    def __repr__(self):
        return f"<Course {self.course_code} - {self.name}>"


class CourseSection(BaseModel):
    """Course section (offering) model"""
    
    __tablename__ = "course_sections"
    __table_args__ = (
        UniqueConstraint('course_id', 'semester_id', 'section_code', name='uq_section'),
        CheckConstraint('enrolled_count <= max_students', name='chk_enrollment_capacity'),
    )
    
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False, index=True)
    section_code = Column(String(10))  # Changed from section_number to match database
    
    # Instructor
    instructor_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Location - simplified to match database
    room = Column(String(50))
    
    # Capacity
    max_students = Column(Integer, default=30)  # Changed default from 40 to 30
    enrolled_count = Column(Integer, default=0)
    
    # Schedule - database uses JSONB
    schedule = Column(JSONB)
    
    # Status
    is_active = Column(Boolean, default=True)  # Changed from status enum to match database
    
    # Relationships
    course = relationship("Course", back_populates="sections")
    semester = relationship("Semester", back_populates="course_sections")
    instructor = relationship("User", back_populates="taught_sections")
    enrollments = relationship("Enrollment", back_populates="section")
    assignments = relationship("Assignment", back_populates="section")
    
    def __repr__(self):
        return f"<CourseSection {self.course.course_code if self.course else 'Unknown'}-{self.section_code}>"


class SectionSchedule(BaseModel):
    """Section schedule model - stores class meeting times"""
    
    __tablename__ = "section_schedules"
    
    section_id = Column(Integer, ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Day and Time - using timestamps instead of day_of_week + time
    start_ts = Column(DateTime(timezone=True), nullable=False)  # Start timestamp
    end_ts = Column(DateTime(timezone=True), nullable=False)  # End timestamp
    
    # Location
    room = Column(String(50))
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    
    # Status
    canceled = Column(Boolean, default=False)
    
    # Relationships
    section = relationship("CourseSection")
    campus = relationship("Campus")
    
    def __repr__(self):
        return f"<SectionSchedule Section{self.section_id} {self.day_of_week} {self.start_time}-{self.end_time}>"
    
    @validates('start_time', 'end_time')
    def _validate_time(self, key, value):
        """Coerce string time values (HH:MM) to Python time objects so tests can insert strings."""
        if isinstance(value, str):
            try:
                hours, minutes = map(int, value.split(':'))
                return pytime(hour=hours, minute=minutes)
            except Exception:
                raise ValueError(f"Invalid time format for {key}: {value}. Expected HH:MM")
        return value
#     room = Column(String(50))
#     ...


class Enrollment(BaseModel):
    """Student enrollment model"""
    
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint('student_id', 'course_section_id', name='uq_student_section'),
    )
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)  # Changed from section_id
    
    # Status
    status = Column(String(20), default="enrolled", index=True)
    enrollment_date = Column(DateTime(timezone=True), server_default=text('now()'))  # Changed from enrolled_at
    
    # Final Grade
    grade = Column(Numeric(3, 2))  # Changed from final_grade
    
    # Relationships
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    section = relationship("CourseSection", back_populates="enrollments")
    attendance_records = relationship("Attendance", back_populates="enrollment")
    
    def __repr__(self):
        return f"<Enrollment Student{self.student_id} Section{self.course_section_id}>"


class Assignment(BaseModel):
    """Assignment model"""
    
    __tablename__ = "assignments"
    __table_args__ = (
        CheckConstraint('weight >= 0 AND weight <= 100', name='chk_weight_percent'),
    )
    
    course_section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)  # Changed from section_id
    
    # Assignment Info
    title = Column(String(200), nullable=False)
    description = Column(Text)
    assignment_type = Column(String(50))  # Changed from type to match database
    
    # Grading
    max_points = Column(Numeric(6, 2))
    weight = Column(Numeric(5, 2))  # Changed from weight_percent to match database
    
    # Deadline
    due_date = Column(DateTime(timezone=True), index=True)
    
    # Status
    is_published = Column(Boolean, default=False, index=True)
    
    # Relationships
    section = relationship("CourseSection", back_populates="assignments")
    
    def __repr__(self):
        return f"<Assignment {self.title}>"


class Grade(BaseModel):
    """Grade model with approval workflow"""
    
    __tablename__ = "grades"
    
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False, index=True)
    
    # Assignment
    assignment_name = Column(String(200))  # Changed from assignment_id to varchar
    
    # Score
    grade_value = Column(Numeric(6, 2))  # Changed from points_earned
    max_grade = Column(Numeric(6, 2))  # Changed from max_points
    weight = Column(Numeric(5, 2))  # Added to match database
    
    # Grading
    graded_at = Column(DateTime(timezone=True))
    graded_by = Column(Integer, ForeignKey("users.id"))
    
    # Approval Workflow (new fields)
    approval_status = Column(String(20), default="draft", index=True)  # draft, submitted, under_review, approved, rejected, published, archived
    submitted_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    rejection_reason = Column(Text)  # Mandatory when rejected
    approval_notes = Column(Text)
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    enrollment = relationship("Enrollment")
    grader = relationship("User", foreign_keys=[graded_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f"<Grade Enrollment{self.enrollment_id} {self.assignment_name} [{self.approval_status}]>"


class Attendance(BaseModel):
    """Attendance model with compliance tracking"""
    
    __tablename__ = "attendance"
    
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Status
    status = Column(String(20), default="present", index=True)
    notes = Column(Text)
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="attendance_records")
    
    def __repr__(self):
        return f"<Attendance Enrollment{self.enrollment_id} {self.date}>"


# Add helper methods for attendance compliance
def calculate_attendance_compliance(present_count: int, total_sessions: int) -> tuple:
    """
    Calculate attendance compliance level
    Returns: (percentage, compliance_level)
    """
    if total_sessions == 0:
        return (0.0, AttendanceComplianceLevel.AUTO_FAIL)
    
    percentage = (present_count / total_sessions) * 100
    
    if percentage >= 75:
        return (percentage, AttendanceComplianceLevel.COMPLIANT)
    elif percentage >= 50:
        return (percentage, AttendanceComplianceLevel.AT_RISK)
    elif percentage >= 25:
        return (percentage, AttendanceComplianceLevel.EXAM_INELIGIBLE)
    else:
        return (percentage, AttendanceComplianceLevel.AUTO_FAIL)
