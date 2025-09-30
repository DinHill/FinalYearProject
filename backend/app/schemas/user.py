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
    email: Optional[str] = Field(None, description="Optional email for notifications")
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    phone_number: Optional[str] = Field(None, max_length=20)
    student_id: Optional[str] = Field(None, max_length=50)
    employee_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)

class UserCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    email: Optional[str] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None

class UserResponse(BaseModel):
    id: int
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[str] = None
    full_name: str
    role: UserRole
    status: UserStatus
    phone_number: Optional[str] = None
    department: Optional[str] = None
    campus: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    @property
    def user_id(self) -> str:
        """Returns the appropriate ID based on user role"""
        if self.role == UserRole.STUDENT:
            return self.student_id or ""
        else:
            return self.employee_id or ""

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    size: int
    total_pages: int

# Authentication schemas
class LoginRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=50, description="Student ID or Employee ID")
    password: str = Field(..., min_length=6, max_length=100)

class RegisterRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=50, description="Student ID or Employee ID")
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: UserRole
    phone_number: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, description="Optional email for notifications")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None