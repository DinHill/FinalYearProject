from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logging.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logging.error(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing password"
        )

def create_access_token(data: Dict[Any, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logging.error(f"Token creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating access token"
        )

def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except PyJWTError as e:
        logging.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def create_refresh_token(data: Dict[Any, Any]) -> str:
    """Create a refresh token (longer expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)  # 7 days for refresh token
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logging.error(f"Refresh token creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating refresh token"
        )

def verify_refresh_token(token: str) -> Dict[str, Any]:
    """Verify a refresh token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        return payload
    except PyJWTError as e:
        logging.error(f"Refresh token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
        )

# Role-based access control
def check_permissions(user_role: str, required_permissions: list) -> bool:
    """Check if user role has required permissions"""
    role_permissions = {
        "super_admin": ["read", "write", "delete", "admin", "system"],
        "academic_admin": ["read", "write", "academic"],
        "content_admin": ["read", "write", "content"],
        "finance_admin": ["read", "write", "finance"],
        "support_admin": ["read", "write", "support"],
        "faculty": ["read", "write_own", "academic_limited"],
        "student": ["read_own"],
    }
    
    user_permissions = role_permissions.get(user_role, [])
    return all(perm in user_permissions for perm in required_permissions)

def validate_user_role(role: str) -> bool:
    """Validate if role is a valid user role"""
    valid_roles = ["super_admin", "academic_admin", "content_admin", 
                   "finance_admin", "support_admin", "faculty", "student"]
    return role in valid_roles

# Security dependencies
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)  # Will be fixed when we resolve imports
) -> Any:
    """Get current user from Firebase token"""
    try:
        # Import here to avoid circular imports
        from app.services.firebase_service import firebase_service
        from app.services.user_service import UserService
        from app.core.database import get_db
        
        # Re-inject proper db dependency
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection not available"
            )
        
        # Verify Firebase token
        decoded_token = firebase_service.verify_token(credentials.credentials)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        firebase_uid = decoded_token.get('uid')
        if not firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user_service = UserService(db)
        user = user_service.get_user_by_firebase_uid(firebase_uid)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )