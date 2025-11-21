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
    email: Optional[EmailStr] = None
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., pattern="^(student|teacher|admin|super_admin|academic_admin|content_admin|finance_admin|support_admin|registrar)$")
    
    # Academic Context - Using business key codes instead of IDs
    campus_code: Optional[str] = Field(None, max_length=10, description="Campus code (H, D, C, S)")
    major_code: Optional[str] = Field(None, max_length=10, description="Major code (C, B, D, etc.)")
    year_entered: Optional[int] = None
    
    # Profile
    phone_number: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    
    # Password (for students)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    
    # Approval workflow
    auto_approve: bool = Field(
        default=True,
        description="If True, user is created as 'active' and synced to Firebase immediately. "
                    "If False, user is created as 'pending' and requires admin approval."
    )
    
    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name"""
        import re
        import logging
        logger = logging.getLogger(__name__)
        
        v = v.strip()
        logger.info(f"Validating name: '{v}' (length: {len(v)}, repr: {repr(v)})")
        
        if not v:
            raise ValueError("Full name cannot be empty")
        
        # Block only obviously invalid characters (numbers, special symbols)
        invalid_chars = re.findall(r'[0-9!@#$%^&*()+=\[\]{};:"|<>?/\\]', v)
        if invalid_chars:
            logger.error(f"Found invalid characters in name: {invalid_chars}")
            raise ValueError("Name contains invalid characters")
        
        return v
    
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
                "campus_code": "H",
                "major_code": "C",
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
    status: Optional[str] = Field(None, pattern="^(pending|active|inactive|suspended|graduated)$")


class CampusSimple(BaseSchema):
    """Simple campus info for nested responses"""
    id: int
    code: str
    name: str
    city: Optional[str] = None


class MajorSimple(BaseSchema):
    """Simple major info for nested responses"""
    id: int
    code: str
    name: str


class UserResponse(BaseSchema):
    """User response"""
    id: int
    firebase_uid: Optional[str] = None  # Nullable for pending users
    username: str
    email: Optional[str] = None  # Personal email is optional
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
    campus: Optional[CampusSimple] = None  # Nested campus object
    major: Optional[MajorSimple] = None    # Nested major object
    
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
