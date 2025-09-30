from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users"
        )
    
    user_service = UserService(db)
    try:
        new_user = user_service.create_user(user_data)
        return new_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=UserListResponse)
def get_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of users to return"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    status: Optional[UserStatus] = Query(None, description="Filter by user status"),
    search: Optional[str] = Query(None, description="Search by name, email, or ID"),
    campus: Optional[str] = Query(None, description="Filter by campus"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get users with filtering and pagination"""
    # Only admins can see all users, teachers can see their students
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user_service = UserService(db)
    users, total = user_service.get_users(
        skip=skip,
        limit=limit,
        role=role,
        status=status,
        search=search,
        campus=campus,
        department=department
    )
    
    total_pages = math.ceil(total / limit) if total > 0 else 0
    page = (skip // limit) + 1
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        size=limit,
        total_pages=total_pages
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    # Users can see their own profile, admins can see any profile
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user"""
    # Users can update their own profile, admins can update any profile
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user_service = UserService(db)
    updated_user = user_service.update_user(user_id, user_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    user_service = UserService(db)
    success = user_service.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.post("/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Activate user (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can activate users"
        )
    
    user_service = UserService(db)
    activated_user = user_service.activate_user(user_id)
    
    if not activated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return activated_user

@router.get("/role/{role}", response_model=List[UserResponse])
def get_users_by_role(
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get users by role (Admin and Teacher access)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user_service = UserService(db)
    users = user_service.get_users_by_role(role)
    
    return users