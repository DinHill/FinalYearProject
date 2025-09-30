from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    phone_number: Optional[str] = Field(None, max_length=20)
    student_id: Optional[str] = Field(None, max_length=50)
    employee_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    firebase_uid: str = Field(..., max_length=128)
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None

class UserResponse(UserBase):
    id: int
    firebase_uid: str
    status: UserStatus
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    size: int
    total_pages: int

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    firebase_uid: Optional[str] = None
    email: Optional[str] = None