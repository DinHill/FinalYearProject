"""
Authentication endpoints - Admin and Student login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_firebase_token, SecurityUtils
from app.core.firebase import FirebaseService
from app.core.exceptions import AuthenticationError, ValidationError
from app.services.auth_service import AuthService
from app.models import User
from app.schemas.auth import (
    StudentLoginRequest,
    StudentLoginResponse,
    SessionCreateRequest,
    UserProfileResponse,
    ChangePasswordRequest
)
from app.schemas.base import SuccessResponse
from pydantic import BaseModel
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Username to Email lookup schema
class UsernameToEmailRequest(BaseModel):
    username: str

class UsernameToEmailResponse(BaseModel):
    email: str
    full_name: str


@router.post(
    "/username-to-email",
    response_model=UsernameToEmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert username to email for Firebase login",
    description="""
    Lookup email address from username for Firebase authentication.
    
    Frontend flow:
    1. User enters username
    2. Call this endpoint to get email
    3. Use email with Firebase signInWithEmailAndPassword
    """
)
async def username_to_email(
    request: UsernameToEmailRequest,
    db: AsyncSession = Depends(get_db)
) -> UsernameToEmailResponse:
    """
    Convert username to email for Firebase login
    """
    try:
        # Find user by username
        result = await db.execute(
            select(User).where(User.username == request.username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no email address"
            )
        
        return UsernameToEmailResponse(
            email=user.email,
            full_name=user.full_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Username to email lookup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lookup failed"
        )


@router.post(
    "/student-login",
    response_model=StudentLoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Student login - Get custom token",
    description="""
    Student authentication flow for mobile app:
    
    1. Student enters student_id (username) and password
    2. Backend verifies credentials in PostgreSQL
    3. Backend creates Firebase custom token with claims
    4. Mobile app receives custom token
    5. Mobile app calls Firebase signInWithCustomToken()
    6. Mobile app gets Firebase ID token
    7. Mobile app uses ID token for API calls
    
    **Custom Claims Include:**
    - role: student
    - campus: Campus code (H, D, C, S)
    - major: Major code (C, B, D)
    - db_user_id: PostgreSQL user ID
    - username: Student username
    """
)
async def student_login(
    request: StudentLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> StudentLoginResponse:
    """
    Student login endpoint
    
    Returns custom token for Firebase signInWithCustomToken()
    """
    try:
        custom_token, user_info = await AuthService.student_login(
            db=db,
            student_id=request.student_id,
            password=request.password
        )
        
        return StudentLoginResponse(
            custom_token=custom_token,
            user=user_info
        )
        
    except AuthenticationError as e:
        logger.warning(f"Authentication failed: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post(
    "/session",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Create session from ID token (Admin web)",
    description="""
    Admin/Teacher web authentication flow:
    
    1. User signs in with Firebase Authentication (email/password)
    2. Firebase returns ID token
    3. Web app sends ID token to this endpoint
    4. Backend verifies token and creates session
    5. Backend returns user info
    
    **Note:** This endpoint is typically followed by setting a session cookie
    for subsequent requests.
    """
)
async def create_session(
    request: SessionCreateRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create session from Firebase ID token
    
    Used by admin web portal after Firebase Authentication
    """
    try:
        user_info = await AuthService.create_session_token(
            db=db,
            id_token=request.id_token
        )
        
        return {
            "success": True,
            "message": "Session created successfully",
            "user": user_info
        }
        
    except AuthenticationError as e:
        logger.warning(f"Session creation failed: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail
        )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="""
    Get complete profile of currently authenticated user
    
    **Requires:** Valid Firebase ID token in Authorization header
    
    **Returns:**
    - User information (id, username, email, full_name, role, status)
    - Campus information (id, code, name)
    - Major information (id, code, name)
    - Permissions list (for admin users)
    - Admin type (if applicable)
    """
)
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> UserProfileResponse:
    """
    Get current user's complete profile
    """
    try:
        firebase_uid = current_user['uid']
        profile = await AuthService.get_user_profile(db, firebase_uid)
        return profile
        
    except Exception as e:
        logger.error(f"Failed to get user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )


@router.post(
    "/logout",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    description="""
    Logout current user by revoking Firebase refresh tokens
    
    **Effect:**
    - Revokes all refresh tokens for the user
    - Existing ID tokens remain valid until expiry (typically 1 hour)
    - For immediate effect, client should delete stored tokens
    
    **Client Action Required:**
    - Clear local storage/secure storage
    - Redirect to login screen
    """
)
async def logout(
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
) -> SuccessResponse:
    """
    Logout user - revoke refresh tokens
    """
    try:
        firebase_uid = current_user['uid']
        
        # Revoke refresh tokens
        FirebaseService.revoke_refresh_tokens(firebase_uid)
        
        logger.info(f"User logged out: {firebase_uid}")
        
        return SuccessResponse(
            success=True,
            message="Logged out successfully"
        )
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
        )


@router.put(
    "/change-password",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="""
    Change current user's password
    
    **Requires:**
    - Current password (for verification)
    - New password (must meet strength requirements)
    
    **Password Requirements:**
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """
    Change user password
    """
    try:
        # Get user ID from custom claims
        user_id = current_user.get('db_user_id')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in token"
            )
        
        # Change password
        await AuthService.change_password(
            db=db,
            user_id=user_id,
            current_password=request.current_password,
            new_password=request.new_password
        )
        
        return SuccessResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.detail
        )
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
