"""
User schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime
from app.schemas.base import BaseSchema


class UserBase(BaseSchema):
    """Base user schema"""
    username: str
    email: EmailStr
    full_name: str
    role: str
    campus_id: Optional[int] = None
    major_id: Optional[int] = None


class UserCreate(BaseModel):
    """Create user request"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., pattern="^(student|teacher|admin)$")
    
    # Academic Context
    campus_id: int = Field(..., gt=0)
    major_id: Optional[int] = Field(None, gt=0)
    year_entered: Optional[int] = None
    
    # Profile
    phone_number: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    
    # Password (for students)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name"""
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        
        # Check for Vietnamese characters
        import re
        if not re.match(r'^[a-zA-ZÀ-ỹ\s]+$', v):
            raise ValueError("Name contains invalid characters")
        
        return v.title()
    
    @field_validator('year_entered')
    @classmethod
    def validate_year(cls, v: Optional[int]) -> Optional[int]:
        """Validate year entered"""
        if v is not None:
            current_year = datetime.now().year
            if v < 2000 or v > current_year + 1:
                raise ValueError(f"Year must be between 2000 and {current_year + 1}")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "hieund@student.greenwich.edu.vn",
                "full_name": "Nguyen Dinh Hieu",
                "role": "student",
                "campus_id": 2,
                "major_id": 1,
                "year_entered": 2022,
                "phone_number": "0123456789",
                "date_of_birth": "2002-01-15",
                "gender": "male",
                "password": "SecurePass123"
            }
        }
    }


class UserUpdate(BaseModel):
    """Update user request"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    avatar_url: Optional[str] = None


class UserResponse(BaseSchema):
    """User response"""
    id: int
    firebase_uid: str
    username: str
    email: str
    full_name: str
    role: str
    status: str
    
    # Profile
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    
    # Academic Context
    campus_id: Optional[int] = None
    major_id: Optional[int] = None
    year_entered: Optional[int] = None
    
    # Timestamps
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CampusResponse(BaseSchema):
    """Campus response"""
    id: int
    code: str
    name: str
    city: Optional[str] = None
    is_active: bool
    created_at: datetime


class MajorResponse(BaseSchema):
    """Major response"""
    id: int
    code: str
    name: str
    degree_type: Optional[str] = None
    credits_required: int
    is_active: bool
    created_at: datetime
