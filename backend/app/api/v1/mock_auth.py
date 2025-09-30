"""
Mock data endpoints for testing ID-based authentication
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.user import UserResponse, LoginRequest
from app.models.user import UserRole, UserStatus
from datetime import datetime

router = APIRouter(prefix="/mock-auth", tags=["mock-authentication"])

# Mock users for testing
MOCK_USERS = [
    {
        "id": 1,
        "student_id": "2024001",
        "employee_id": None,
        "email": "john.doe@student.edu",
        "full_name": "John Doe",
        "role": UserRole.STUDENT,
        "status": UserStatus.ACTIVE,
        "phone_number": "0123456789",
        "department": "Computer Science",
        "campus": "Main Campus",
        "avatar_url": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "last_login": None,
        "password": "student123"  # This would be hashed in real system
    },
    {
        "id": 2,
        "student_id": "2024002",
        "employee_id": None,
        "email": "jane.smith@student.edu",
        "full_name": "Jane Smith",
        "role": UserRole.STUDENT,
        "status": UserStatus.ACTIVE,
        "phone_number": "0987654321",
        "department": "Business Administration",
        "campus": "Downtown Campus",
        "avatar_url": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "last_login": None,
        "password": "student123"
    },
    {
        "id": 3,
        "student_id": None,
        "employee_id": "T001",
        "email": "prof.johnson@university.edu",
        "full_name": "Prof. Michael Johnson",
        "role": UserRole.TEACHER,
        "status": UserStatus.ACTIVE,
        "phone_number": "0111222333",
        "department": "Computer Science",
        "campus": "Main Campus",
        "avatar_url": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "last_login": None,
        "password": "teacher123"
    },
    {
        "id": 4,
        "student_id": None,
        "employee_id": "A001",
        "email": "admin@university.edu",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
        "status": UserStatus.ACTIVE,
        "phone_number": "0999888777",
        "department": "IT Services",
        "campus": "Main Campus",
        "avatar_url": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "last_login": None,
        "password": "admin123"
    }
]

@router.get("/users", response_model=List[UserResponse])
async def get_mock_users():
    """Get all mock users for testing"""
    return [
        UserResponse(**{k: v for k, v in user.items() if k != "password"})
        for user in MOCK_USERS
    ]

@router.post("/test-login")
async def test_login_credentials(credentials: LoginRequest):
    """Test login credentials against mock users"""
    for user in MOCK_USERS:
        user_id = user.get("student_id") or user.get("employee_id")
        if user_id == credentials.user_id and user["password"] == credentials.password:
            return {
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "user_id": user_id,
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "department": user["department"]
                }
            }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid user ID or password"
    )

@router.get("/sample-credentials")
async def get_sample_credentials():
    """Get sample login credentials for testing"""
    return {
        "student_credentials": [
            {"user_id": "2024001", "password": "student123", "role": "student", "name": "John Doe"},
            {"user_id": "2024002", "password": "student123", "role": "student", "name": "Jane Smith"}
        ],
        "teacher_credentials": [
            {"user_id": "T001", "password": "teacher123", "role": "teacher", "name": "Prof. Michael Johnson"}
        ],
        "admin_credentials": [
            {"user_id": "A001", "password": "admin123", "role": "admin", "name": "System Administrator"}
        ],
        "note": "These are sample credentials for testing the authentication system"
    }