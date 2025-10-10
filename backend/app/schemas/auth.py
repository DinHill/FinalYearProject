"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime


class StudentLoginRequest(BaseModel):
    """Student login request"""
    student_id: str = Field(..., min_length=5, max_length=20, description="Student ID (e.g., HieuNDGCD220033)")
    password: str = Field(..., min_length=6, max_length=100, description="Student password")
    
    @field_validator('student_id')
    @classmethod
    def validate_student_id(cls, v: str) -> str:
        """Validate student ID format"""
        v = v.strip().upper()
        # Basic validation - more specific validation in service layer
        if not v:
            raise ValueError("Student ID cannot be empty")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "student_id": "HieuNDGCD220033",
                "password": "password123"
            }
        }
    }


class StudentLoginResponse(BaseModel):
    """Student login response"""
    custom_token: str = Field(..., description="Firebase custom token for signInWithCustomToken()")
    user: dict = Field(..., description="User information")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "custom_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "id": 1,
                    "username": "HieuNDGCD220033",
                    "email": "hieundgcd220033@student.greenwich.edu.vn",
                    "full_name": "Nguyen Dinh Hieu",
                    "role": "student",
                    "campus": "da_nang",
                    "major": "computing"
                }
            }
        }
    }


class SessionCreateRequest(BaseModel):
    """Create session request (admin web)"""
    id_token: str = Field(..., description="Firebase ID token")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    }


class SessionCreateResponse(BaseModel):
    """Session create response"""
    success: bool = True
    message: str = "Session created successfully"
    user: dict


class UserProfileResponse(BaseModel):
    """User profile response"""
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
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    
    # Academic Context
    campus_id: Optional[int] = None
    campus_code: Optional[str] = None
    campus_name: Optional[str] = None
    major_id: Optional[int] = None
    major_code: Optional[str] = None
    major_name: Optional[str] = None
    year_entered: Optional[int] = None
    
    # Effective Permissions
    permissions: List[str] = []
    admin_type: Optional[str] = None
    
    # Metadata
    last_login: Optional[datetime] = None
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": 1,
                "firebase_uid": "abc123xyz",
                "username": "HieuNDGCD220033",
                "email": "hieundgcd220033@student.greenwich.edu.vn",
                "full_name": "Nguyen Dinh Hieu",
                "role": "student",
                "status": "active",
                "campus_code": "D",
                "campus_name": "Da Nang Campus",
                "major_code": "C",
                "major_name": "Computing",
                "year_entered": 2022,
                "permissions": ["read:grades", "submit:assignments"],
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    }


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str = Field(..., min_length=6, max_length=100)
    new_password: str = Field(..., min_length=6, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError("Password must contain uppercase, lowercase, and digits")
        
        return v
