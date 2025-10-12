"""
Academic models - courses, enrollments, grades, attendance
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, Time, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
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
    """Grade status enum"""
    PENDING = "pending"
    GRADED = "graded"
    RETURNED = "returned"


class Semester(BaseModel):
    """Semester model"""
    
    __tablename__ = "semesters"
    
    code = Column(String(20), unique=True, nullable=False)  # "2024_FALL"
    name = Column(String(100), nullable=False)  # "Fall 2024"
    type = Column(SQLEnum(SemesterType), nullable=False)
    academic_year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_start = Column(Date)
    registration_end = Column(Date)
    is_current = Column(Boolean, default=False, index=True)
    
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
        UniqueConstraint('course_id', 'semester_id', 'section_number', 'campus_id', name='uq_section'),
        CheckConstraint('enrolled_count <= max_students', name='chk_enrollment_capacity'),
    )
    
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False, index=True)
    section_number = Column(String(10), nullable=False)  # "01", "02"
    
    # Instructor
    instructor_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Location
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False, index=True)
    room = Column(String(50))
    building = Column(String(100))
    
    # Capacity
    max_students = Column(Integer, default=40)
    enrolled_count = Column(Integer, default=0)
    
    # Resources
    syllabus_url = Column(String(500))
    meeting_link = Column(String(500))
    
    # Status
    status = Column(SQLEnum(SectionStatus), default=SectionStatus.ACTIVE, index=True)
    
    # Relationships
    course = relationship("Course", back_populates="sections")
    semester = relationship("Semester", back_populates="course_sections")
    campus = relationship("Campus", back_populates="course_sections")
    instructor = relationship("User", back_populates="taught_sections")
    enrollments = relationship("Enrollment", back_populates="section")
    schedules = relationship("Schedule", back_populates="section")
    assignments = relationship("Assignment", back_populates="section")
    attendance_records = relationship("Attendance", back_populates="section")
    
    def __repr__(self):
        return f"<CourseSection {self.course.course_code}-{self.section_number}>"


class Schedule(BaseModel):
    """Class schedule/timetable model"""
    
    __tablename__ = "schedules"
    __table_args__ = (
        CheckConstraint('end_time > start_time', name='chk_time_order'),
        CheckConstraint('day_of_week BETWEEN 1 AND 7', name='chk_day_of_week'),
    )
    
    section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 1=Monday, 7=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50))
    building = Column(String(100))
    session_type = Column(String(20), default="lecture")  # lecture, lab, seminar
    effective_from = Column(Date)
    effective_until = Column(Date)
    recurrence_pattern = Column(JSONB)
    
    # Relationship
    section = relationship("CourseSection", back_populates="schedules")
    
    def __repr__(self):
        return f"<Schedule {self.section_id} Day{self.day_of_week} {self.start_time}>"


class Enrollment(BaseModel):
    """Student enrollment model"""
    
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint('student_id', 'section_id', name='uq_student_section'),
    )
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED, index=True)
    enrolled_at = Column(DateTime(timezone=True))
    dropped_at = Column(DateTime(timezone=True))
    
    # Final Grade
    final_grade = Column(String(5))  # A+, A, A-, B+, B, B-, C+, C, D, F
    grade_points = Column(Numeric(3, 2))  # 4.00, 3.70, etc.
    credits_earned = Column(Integer)
    
    # Midterm Grade
    midterm_grade = Column(String(5))
    
    # Notes
    notes = Column(Text)
    
    # Relationships
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    section = relationship("CourseSection", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment Student{self.student_id} Section{self.section_id}>"


class Assignment(BaseModel):
    """Assignment model"""
    
    __tablename__ = "assignments"
    __table_args__ = (
        CheckConstraint('weight_percent >= 0 AND weight_percent <= 100', name='chk_weight_percent'),
    )
    
    section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)
    
    # Assignment Info
    title = Column(String(200), nullable=False)
    description = Column(Text)
    type = Column(SQLEnum(AssignmentType), nullable=False)
    
    # Grading
    max_points = Column(Numeric(6, 2), nullable=False)
    weight_percent = Column(Numeric(5, 2), nullable=False)  # 30.00 = 30%
    
    # Deadlines
    published_at = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    late_submission_allowed = Column(Boolean, default=False)
    late_penalty_percent = Column(Numeric(5, 2))
    
    # Submission
    submission_type = Column(String(50))  # file, text, link
    attachment_url = Column(String(500))
    
    # Status
    is_published = Column(Boolean, default=False, index=True)
    
    # Creator
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    section = relationship("CourseSection", back_populates="assignments")
    grades = relationship("Grade", back_populates="assignment")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<Assignment {self.title}>"


class Grade(BaseModel):
    """Grade model"""
    
    __tablename__ = "grades"
    __table_args__ = (
        UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student'),
    )
    
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Score
    points_earned = Column(Numeric(6, 2))
    max_points = Column(Numeric(6, 2), nullable=False)
    percentage = Column(Numeric(5, 2))
    
    # Submission
    submitted_at = Column(DateTime(timezone=True))
    submission_url = Column(String(500))
    submission_text = Column(Text)
    is_late = Column(Boolean, default=False)
    late_days = Column(Integer, default=0)
    
    # Grading
    graded_at = Column(DateTime(timezone=True))
    graded_by = Column(Integer, ForeignKey("users.id"))
    feedback = Column(Text)
    status = Column(SQLEnum(GradeStatus), default=GradeStatus.PENDING, index=True)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="grades")
    student = relationship("User", back_populates="grades", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[graded_by])
    
    def __repr__(self):
        return f"<Grade Student{self.student_id} Assignment{self.assignment_id}>"


class Attendance(BaseModel):
    """Attendance model"""
    
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint('section_id', 'student_id', 'attendance_date', name='uq_attendance'),
    )
    
    section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(AttendanceStatus), nullable=False, index=True)
    
    # Metadata
    marked_by = Column(Integer, ForeignKey("users.id"))
    marked_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    
    # Relationships
    section = relationship("CourseSection", back_populates="attendance_records")
    student = relationship("User", back_populates="attendance_records", foreign_keys=[student_id])
    marker = relationship("User", foreign_keys=[marked_by])
    
    def __repr__(self):
        return f"<Attendance Student{self.student_id} {self.attendance_date}>"
