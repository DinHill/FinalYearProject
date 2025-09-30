from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SemesterType(str, Enum):
    FALL = "fall"
    SPRING = "spring"
    SUMMER = "summer"

class CourseStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Semester schemas
class SemesterBase(BaseModel):
    name: str = Field(..., max_length=100)
    year: int = Field(..., ge=2000, le=2100)
    type: SemesterType
    start_date: datetime
    end_date: datetime
    is_current: bool = False

class SemesterCreate(SemesterBase):
    pass

class SemesterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None

class SemesterResponse(SemesterBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Course schemas
class CourseBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    credits: int = Field(default=3, ge=1, le=10)
    department: str = Field(..., max_length=100)
    prerequisite_codes: Optional[str] = None  # JSON string

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    credits: Optional[int] = Field(None, ge=1, le=10)
    department: Optional[str] = Field(None, max_length=100)
    prerequisite_codes: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Course Section schemas
class CourseSectionBase(BaseModel):
    course_id: int
    semester_id: int
    section_number: str = Field(..., max_length=10)
    teacher_id: int
    max_students: int = Field(default=30, ge=1, le=200)
    status: CourseStatus = CourseStatus.DRAFT

class CourseSectionCreate(CourseSectionBase):
    pass

class CourseSectionUpdate(BaseModel):
    section_number: Optional[str] = Field(None, max_length=10)
    teacher_id: Optional[int] = None
    max_students: Optional[int] = Field(None, ge=1, le=200)
    status: Optional[CourseStatus] = None

class CourseSectionResponse(CourseSectionBase):
    id: int
    enrolled_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested relationships
    course: Optional[CourseResponse] = None
    semester: Optional[SemesterResponse] = None

    class Config:
        from_attributes = True

class CourseSectionListResponse(BaseModel):
    sections: List[CourseSectionResponse]
    total: int
    page: int
    size: int
    total_pages: int