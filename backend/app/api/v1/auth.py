from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta

from app.core.database import get_db
from app.schemas.user import Token, UserResponse, LoginRequest, RegisterRequest
from app.services.user_service import UserService
from app.models.user import User
from app.core.security import verify_password, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register new user with ID and password"""
    try:
        user_service = UserService(db)
        
        # Check if user ID already exists
        existing_user = user_service.get_user_by_user_id(user_data.user_id, user_data.role)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with ID {user_data.user_id} already exists"
            )
        
        # Create user
        user = user_service.create_user_with_password(user_data)
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with User ID and password"""
    try:
        user_service = UserService(db)
        
        # Try to find user by student_id or employee_id
        user = user_service.get_user_by_user_id(credentials.user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID or password"
            )
        
        # Verify password
        if not user.verify_password(credentials.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID or password"
            )
        
        # Check if user is active
        if user.status.value != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is not active"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=30)  # 30 minutes
        access_token = create_access_token(
            data={"sub": user.user_id, "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        # Update last login
        user_service.update_last_login(user.id)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=1800,  # 30 minutes in seconds
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user profile from JWT token"""
    try:
        # Verify JWT token
        token_data = verify_token(credentials.credentials)
        user_id = token_data.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_service = UserService(db)
        user = user_service.get_user_by_user_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )