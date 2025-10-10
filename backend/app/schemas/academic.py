"""
Academic domain schemas - courses, enrollments, grades, attendance
"""
from pydantic import Field, field_validator
from app.schemas.base import BaseSchema
from datetime import datetime, date as date_type, time
from typing import Optional, List
from decimal import Decimal


# ============================================================================
# Semester Schemas
# ============================================================================

class SemesterBase(BaseSchema):
    """Base semester schema"""
    name: str = Field(..., description="Semester name", example="Fall 2024")
    code: str = Field(..., description="Unique semester code", example="FA24", pattern=r"^(SP|SU|FA|WI)\d{2}$")
    start_date: date_type = Field(..., description="Semester start date")
    end_date: date_type = Field(..., description="Semester end date")
    is_active: bool = Field(True, description="Whether semester is currently active")


class SemesterCreate(SemesterBase):
    """Create semester request"""
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v, info):
        """Validate end date is after start date"""
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError("End date must be after start date")
        return v


class SemesterUpdate(BaseSchema):
    """Update semester request"""
    name: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    is_active: Optional[bool] = None


class SemesterResponse(SemesterBase):
    """Semester response"""
    id: int
    created_at: datetime


# ============================================================================
# Course Schemas
# ============================================================================

class CourseBase(BaseSchema):
    """Base course schema"""
    code: str = Field(..., description="Course code", example="COMP1640", pattern=r"^[A-Z]{4}\d{4}$")
    name: str = Field(..., description="Course name", example="Enterprise Web Software Development")
    description: Optional[str] = Field(None, description="Course description")
    credits: int = Field(..., description="Credit hours", ge=1, le=6)
    major_id: Optional[int] = Field(None, description="Major ID (null for common courses)")


class CourseCreate(CourseBase):
    """Create course request"""
    pass


class CourseUpdate(BaseSchema):
    """Update course request"""
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = Field(None, ge=1, le=6)
    major_id: Optional[int] = None


class CourseResponse(CourseBase):
    """Course response"""
    id: int
    created_at: datetime


# ============================================================================
# Course Section Schemas
# ============================================================================

class CourseSectionBase(BaseSchema):
    """Base course section schema"""
    course_id: int = Field(..., description="Course ID")
    semester_id: int = Field(..., description="Semester ID")
    section_number: str = Field(..., description="Section number", example="01", pattern=r"^\d{2}$")
    teacher_id: int = Field(..., description="Teacher user ID")
    campus_id: int = Field(..., description="Campus ID")
    max_students: int = Field(..., description="Maximum student capacity", ge=1, le=100)
    room: Optional[str] = Field(None, description="Room number", example="A101")
    status: str = Field("open", description="Section status", pattern="^(open|closed|cancelled)$")


class CourseSectionCreate(CourseSectionBase):
    """Create course section request"""
    pass


class CourseSectionUpdate(BaseSchema):
    """Update course section request"""
    teacher_id: Optional[int] = None
    max_students: Optional[int] = Field(None, ge=1, le=100)
    room: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(open|closed|cancelled)$")


class CourseSectionResponse(CourseSectionBase):
    """Course section response"""
    id: int
    enrolled_count: int = Field(..., description="Current enrollment count")
    created_at: datetime


# ============================================================================
# Schedule Schemas
# ============================================================================

class ScheduleBase(BaseSchema):
    """Base schedule schema"""
    section_id: int = Field(..., description="Course section ID")
    day_of_week: int = Field(..., description="Day of week (0=Monday, 6=Sunday)", ge=0, le=6)
    start_time: time = Field(..., description="Class start time")
    end_time: time = Field(..., description="Class end time")


class ScheduleCreate(ScheduleBase):
    """Create schedule request"""
    
    @field_validator('end_time')
    @classmethod
    def validate_time_range(cls, v, info):
        """Validate end time is after start time"""
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError("End time must be after start time")
        return v


class ScheduleUpdate(BaseSchema):
    """Update schedule request"""
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class ScheduleResponse(ScheduleBase):
    """Schedule response"""
    id: int
    created_at: datetime


# ============================================================================
# Enrollment Schemas
# ============================================================================

class EnrollmentBase(BaseSchema):
    """Base enrollment schema"""
    section_id: int = Field(..., description="Course section ID")
    student_id: int = Field(..., description="Student user ID")
    status: str = Field("enrolled", description="Enrollment status", pattern="^(enrolled|dropped|withdrawn|completed)$")


class EnrollmentCreate(BaseSchema):
    """Create enrollment request (simplified - student_id from token)"""
    section_id: int = Field(..., description="Course section ID to enroll in")


class EnrollmentUpdate(BaseSchema):
    """Update enrollment request"""
    status: str = Field(..., description="New enrollment status", pattern="^(enrolled|dropped|withdrawn|completed)$")


class EnrollmentResponse(EnrollmentBase):
    """Enrollment response"""
    id: int
    enrolled_at: datetime
    dropped_at: Optional[datetime] = None
    created_at: datetime


class EnrollmentWithCourseResponse(EnrollmentResponse):
    """Enrollment response with course details"""
    course_code: str
    course_name: str
    section_number: str
    teacher_name: str
    credits: int
    semester_name: str


# ============================================================================
# Assignment Schemas
# ============================================================================

class AssignmentBase(BaseSchema):
    """Base assignment schema"""
    section_id: int = Field(..., description="Course section ID")
    title: str = Field(..., description="Assignment title", max_length=200)
    description: Optional[str] = Field(None, description="Assignment description")
    due_date: datetime = Field(..., description="Due date and time")
    max_score: Decimal = Field(..., description="Maximum score", ge=0, le=100)
    weight: Decimal = Field(..., description="Weight in final grade (%)", ge=0, le=100)


class AssignmentCreate(AssignmentBase):
    """Create assignment request"""
    pass


class AssignmentUpdate(BaseSchema):
    """Update assignment request"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_score: Optional[Decimal] = Field(None, ge=0, le=100)
    weight: Optional[Decimal] = Field(None, ge=0, le=100)


class AssignmentResponse(AssignmentBase):
    """Assignment response"""
    id: int
    created_at: datetime


# ============================================================================
# Grade Schemas
# ============================================================================

class GradeBase(BaseSchema):
    """Base grade schema"""
    assignment_id: int = Field(..., description="Assignment ID")
    student_id: int = Field(..., description="Student user ID")
    score: Optional[Decimal] = Field(None, description="Score earned", ge=0)
    feedback: Optional[str] = Field(None, description="Teacher feedback")


class GradeCreate(BaseSchema):
    """Create grade request"""
    student_id: int = Field(..., description="Student user ID")
    score: Decimal = Field(..., description="Score earned", ge=0)
    feedback: Optional[str] = None


class GradeUpdate(BaseSchema):
    """Update grade request"""
    score: Optional[Decimal] = Field(None, ge=0)
    feedback: Optional[str] = None


class GradeResponse(GradeBase):
    """Grade response"""
    id: int
    graded_at: Optional[datetime] = None
    created_at: datetime


class GradeWithAssignmentResponse(GradeResponse):
    """Grade response with assignment details"""
    assignment_title: str
    assignment_max_score: Decimal
    assignment_weight: Decimal
    course_code: str
    course_name: str


# ============================================================================
# Attendance Schemas
# ============================================================================

class AttendanceBase(BaseSchema):
    """Base attendance schema"""
    section_id: int = Field(..., description="Course section ID")
    student_id: int = Field(..., description="Student user ID")
    date: date_type = Field(..., description="Attendance date")
    status: str = Field(..., description="Attendance status", pattern="^(present|absent|late|excused)$")
    notes: Optional[str] = Field(None, description="Attendance notes")


class AttendanceCreate(BaseSchema):
    """Create attendance record"""
    student_id: int = Field(..., description="Student user ID")
    status: str = Field(..., description="Attendance status", pattern="^(present|absent|late|excused)$")
    notes: Optional[str] = None


class AttendanceBulkCreate(BaseSchema):
    """Bulk create attendance records"""
    section_id: int = Field(..., description="Course section ID")
    date: date_type = Field(..., description="Attendance date")
    records: List[AttendanceCreate] = Field(..., description="List of attendance records")


class AttendanceUpdate(BaseSchema):
    """Update attendance record"""
    status: str = Field(..., description="Attendance status", pattern="^(present|absent|late|excused)$")
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    """Attendance response"""
    id: int
    created_at: datetime


class AttendanceSummary(BaseSchema):
    """Attendance summary for a student in a section"""
    section_id: int
    student_id: int
    total_sessions: int
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    attendance_rate: Decimal = Field(..., description="Attendance percentage")
