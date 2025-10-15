"""
Security utilities - authentication and authorization
"""
from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from app.core.firebase import FirebaseService
from app.core.settings import settings
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token security
security = HTTPBearer()


class SecurityUtils:
    """Security utility functions"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decode JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )


async def verify_firebase_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Verify Firebase ID token OR JWT token (for admin login)
    
    This is the main authentication dependency for all API endpoints
    Supports both Firebase tokens and JWT tokens from admin-login
    
    Usage:
        @app.get("/protected")
        async def protected_route(current_user: dict = Depends(verify_firebase_token)):
            user_id = current_user['uid']
            role = current_user.get('role')
            ...
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # First, try to decode as JWT token (for admin login)
        try:
            decoded_token = SecurityUtils.decode_token(token)
            # JWT token successfully decoded
            # Add user info to request state for logging
            request.state.user_id = decoded_token.get('uid') or decoded_token.get('sub')
            request.state.user_email = decoded_token.get('email')
            request.state.user_role = decoded_token.get('role')
            return decoded_token
        except:
            # Not a JWT token, try Firebase token
            pass
        
        # Try to verify as Firebase token
        decoded_token = FirebaseService.verify_id_token(token, check_revoked=True)
        
        # Add user info to request state for logging
        request.state.user_id = decoded_token.get('uid')
        request.state.user_email = decoded_token.get('email')
        request.state.user_role = decoded_token.get('role')
        
        return decoded_token
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory to enforce role-based access control
    
    Usage:
        @app.get("/admin/users")
        async def admin_only(current_user: dict = Depends(require_roles(["admin"]))):
            ...
        
        @app.get("/academic")
        async def academic_access(
            current_user: dict = Depends(require_roles(["admin", "teacher"]))
        ):
            ...
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(verify_firebase_token)
    ) -> Dict[str, Any]:
        user_role = current_user.get('role')
        
        # Super admin has access to everything
        if user_role == 'admin' and current_user.get('admin_type') == 'super':
            return current_user
        
        # Check if user role is in allowed roles
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


def require_permissions(required_permissions: List[str]):
    """
    Dependency factory to check specific permissions
    
    Usage:
        @app.post("/grades")
        async def create_grade(
            current_user: dict = Depends(require_permissions(["write:grades"]))
        ):
            ...
    """
    async def permission_checker(
        current_user: Dict[str, Any] = Depends(verify_firebase_token)
    ) -> Dict[str, Any]:
        user_permissions = current_user.get('permissions', [])
        
        # Check if user has all required permissions
        missing_permissions = [
            perm for perm in required_permissions 
            if perm not in user_permissions
        ]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join(missing_permissions)}"
            )
        
        return current_user
    
    return permission_checker


def require_same_user_or_admin(user_id_param: str = "user_id"):
    """
    Dependency factory to allow access only to own data or admins
    
    Usage:
        @app.get("/users/{user_id}")
        async def get_user(
            user_id: int,
            current_user: dict = Depends(require_same_user_or_admin("user_id"))
        ):
            ...
    """
    async def checker(
        request: Request,
        current_user: Dict[str, Any] = Depends(verify_firebase_token)
    ) -> Dict[str, Any]:
        # Get user_id from path parameters
        path_params = request.path_params
        target_user_id = path_params.get(user_id_param)
        
        # Allow if admin
        if current_user.get('role') == 'admin':
            return current_user
        
        # Allow if accessing own data
        # Note: This assumes user_id in DB matches the one in the path
        # You may need to fetch from DB to compare firebase_uid
        current_db_user_id = current_user.get('db_user_id')  # Set this during auth
        
        if target_user_id and str(current_db_user_id) == str(target_user_id):
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own data"
        )
    
    return checker


def require_campus_access(campus_id_param: str = "campus_id"):
    """
    Dependency to enforce campus-level access control
    
    Usage:
        @app.get("/campuses/{campus_id}/users")
        async def get_campus_users(
            campus_id: int,
            current_user: dict = Depends(require_campus_access("campus_id"))
        ):
            ...
    """
    async def checker(
        request: Request,
        current_user: Dict[str, Any] = Depends(verify_firebase_token)
    ) -> Dict[str, Any]:
        # Get campus_id from path parameters
        path_params = request.path_params
        target_campus_id = path_params.get(campus_id_param)
        
        # Super admin and admins with 'all' campus access can access any campus
        user_campus = current_user.get('campus')
        if user_campus == 'all' or current_user.get('admin_type') == 'super':
            return current_user
        
        # Check if user's campus matches
        if target_campus_id and str(user_campus) == str(target_campus_id):
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this campus"
        )
    
    return checker


# Optional token (for public endpoints that work better with auth)
async def optional_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - doesn't fail if no token provided
    
    Usage:
        @app.get("/public-data")
        async def public_with_optional_auth(
            current_user: Optional[dict] = Depends(optional_firebase_token)
        ):
            if current_user:
                # Authenticated user - show personalized data
                ...
            else:
                # Anonymous user - show public data
                ...
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        decoded_token = FirebaseService.verify_id_token(token, check_revoked=True)
        return decoded_token
    except Exception:
        return None
