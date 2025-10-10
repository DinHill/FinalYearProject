"""
Authentication service
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, Campus, Major
from app.core.firebase import FirebaseService
from app.core.security import SecurityUtils
from app.core.exceptions import AuthenticationError, NotFoundError
from app.schemas.auth import UserProfileResponse
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service"""
    
    @staticmethod
    async def student_login(
        db: AsyncSession,
        student_id: str,
        password: str
    ) -> tuple[str, Dict[str, Any]]:
        """
        Student login flow
        
        1. Verify student_id and password in PostgreSQL
        2. Create Firebase custom token with claims
        3. Return custom token and user info
        
        Args:
            db: Database session
            student_id: Student username (e.g., HieuNDGCD220033)
            password: Student password
        
        Returns:
            tuple: (custom_token, user_dict)
        
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Find user by username
        stmt = select(User).where(
            User.username == student_id,
            User.role == "student",
            User.status == "active"
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"Login attempt with invalid student ID: {student_id}")
            raise AuthenticationError("Invalid student ID or password")
        
        # Verify password
        if not user.password_hash:
            logger.error(f"User {student_id} has no password hash")
            raise AuthenticationError("Account not properly configured")
        
        if not SecurityUtils.verify_password(password, user.password_hash):
            logger.warning(f"Failed login attempt for user: {student_id}")
            raise AuthenticationError("Invalid student ID or password")
        
        # Get campus and major info
        campus = await db.get(Campus, user.campus_id) if user.campus_id else None
        major = await db.get(Major, user.major_id) if user.major_id else None
        
        # Create custom claims for Firebase
        custom_claims = {
            "role": user.role,
            "campus": campus.code if campus else None,
            "major": major.code if major else None,
            "db_user_id": user.id,
            "username": user.username
        }
        
        # Create Firebase custom token
        try:
            custom_token = FirebaseService.create_custom_token(
                uid=user.firebase_uid,
                additional_claims=custom_claims
            )
        except Exception as e:
            logger.error(f"Failed to create custom token: {e}")
            raise AuthenticationError("Failed to create authentication token")
        
        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
        
        # Build user info
        user_info = {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "campus_id": user.campus_id,
            "campus_code": campus.code if campus else None,
            "campus_name": campus.name if campus else None,
            "major_id": user.major_id,
            "major_code": major.code if major else None,
            "major_name": major.name if major else None,
            "year_entered": user.year_entered
        }
        
        logger.info(f"Successful login for student: {student_id}")
        return custom_token, user_info
    
    @staticmethod
    async def verify_and_get_user(
        db: AsyncSession,
        firebase_uid: str
    ) -> User:
        """
        Get user by Firebase UID
        
        Args:
            db: Database session
            firebase_uid: Firebase user ID
        
        Returns:
            User object
        
        Raises:
            NotFoundError: If user not found
        """
        stmt = select(User).where(User.firebase_uid == firebase_uid)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundError("User", firebase_uid)
        
        return user
    
    @staticmethod
    async def get_user_profile(
        db: AsyncSession,
        firebase_uid: str
    ) -> UserProfileResponse:
        """
        Get complete user profile with campus and major info
        
        Args:
            db: Database session
            firebase_uid: Firebase user ID
        
        Returns:
            UserProfileResponse
        """
        user = await AuthService.verify_and_get_user(db, firebase_uid)
        
        # Get campus info
        campus = await db.get(Campus, user.campus_id) if user.campus_id else None
        major = await db.get(Major, user.major_id) if user.major_id else None
        
        # Get permissions from Firebase custom claims
        try:
            firebase_user = FirebaseService.get_user(firebase_uid)
            custom_claims = firebase_user.custom_claims or {}
            permissions = custom_claims.get("permissions", [])
            admin_type = custom_claims.get("admin_type")
        except Exception as e:
            logger.warning(f"Failed to get Firebase custom claims: {e}")
            permissions = []
            admin_type = None
        
        return UserProfileResponse(
            id=user.id,
            firebase_uid=user.firebase_uid,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            status=user.status,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            date_of_birth=user.date_of_birth.isoformat() if user.date_of_birth else None,
            gender=user.gender,
            campus_id=user.campus_id,
            campus_code=campus.code if campus else None,
            campus_name=campus.name if campus else None,
            major_id=user.major_id,
            major_code=major.code if major else None,
            major_name=major.name if major else None,
            year_entered=user.year_entered,
            permissions=permissions,
            admin_type=admin_type,
            last_login=user.last_login,
            created_at=user.created_at
        )
    
    @staticmethod
    async def create_session_token(
        db: AsyncSession,
        id_token: str
    ) -> Dict[str, Any]:
        """
        Create session from Firebase ID token (for admin web)
        
        Args:
            db: Database session
            id_token: Firebase ID token
        
        Returns:
            User info dict
        
        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            # Verify ID token
            decoded_token = FirebaseService.verify_id_token(id_token, check_revoked=True)
            firebase_uid = decoded_token['uid']
            
            # Get or create user
            user = await AuthService.verify_and_get_user(db, firebase_uid)
            
            # Update last login
            user.last_login = datetime.utcnow()
            await db.commit()
            
            # Get campus and major
            campus = await db.get(Campus, user.campus_id) if user.campus_id else None
            major = await db.get(Major, user.major_id) if user.major_id else None
            
            return {
                "id": user.id,
                "firebase_uid": user.firebase_uid,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "campus_code": campus.code if campus else None,
                "major_code": major.code if major else None
            }
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise AuthenticationError("Invalid authentication token")
    
    @staticmethod
    async def change_password(
        db: AsyncSession,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change user password
        
        Args:
            db: Database session
            user_id: User ID
            current_password: Current password
            new_password: New password
        
        Returns:
            True if successful
        
        Raises:
            AuthenticationError: If current password is invalid
        """
        user = await db.get(User, user_id)
        if not user:
            raise NotFoundError("User", user_id)
        
        # Verify current password
        if not user.password_hash or not SecurityUtils.verify_password(current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")
        
        # Hash new password
        user.password_hash = SecurityUtils.hash_password(new_password)
        await db.commit()
        
        logger.info(f"Password changed for user: {user.username}")
        return True
