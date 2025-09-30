from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.user import Token, UserResponse, UserCreate
from app.services.user_service import UserService
from app.services.firebase_service import firebase_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Login with Firebase ID token"""
    try:
        # Verify Firebase token
        decoded_token = firebase_service.verify_token(credentials.credentials)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        firebase_uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        
        if not firebase_uid or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get or create user in database
        user_service = UserService(db)
        user = user_service.get_user_by_firebase_uid(firebase_uid)
        
        if not user:
            # Auto-create user from Firebase token
            firebase_user = firebase_service.get_user_by_uid(firebase_uid)
            if not firebase_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Firebase user not found"
                )
            
            # Create user with basic info (admin needs to complete profile)
            user_data = UserCreate(
                firebase_uid=firebase_uid,
                email=email,
                full_name=firebase_user.display_name or email.split('@')[0],
                role="student",  # Default role
                avatar_url=firebase_user.photo_url
            )
            user = user_service.create_user(user_data)
        
        # Update last login
        user_service.update_last_login(user.id)
        
        # Create custom token with user claims
        custom_claims = {
            "role": user.role.value,
            "user_id": user.id,
            "status": user.status.value
        }
        
        # Set custom claims in Firebase
        firebase_service.set_custom_claims(firebase_uid, custom_claims)
        
        return Token(
            access_token=credentials.credentials,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Register new user (requires Firebase token)"""
    try:
        # Verify Firebase token
        decoded_token = firebase_service.verify_token(credentials.credentials)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        firebase_uid = decoded_token.get('uid')
        if firebase_uid != user_data.firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token UID does not match user data"
            )
        
        # Create user
        user_service = UserService(db)
        user = user_service.create_user(user_data)
        
        # Set custom claims in Firebase
        custom_claims = {
            "role": user.role.value,
            "user_id": user.id,
            "status": user.status.value
        }
        firebase_service.set_custom_claims(firebase_uid, custom_claims)
        
        return user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Logout (client should discard token)"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    try:
        # Verify Firebase token
        decoded_token = firebase_service.verify_token(credentials.credentials)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        firebase_uid = decoded_token.get('uid')
        
        # Get user from database
        user_service = UserService(db)
        user = user_service.get_user_by_firebase_uid(firebase_uid)
        
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