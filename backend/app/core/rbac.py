"""
Role-Based Access Control (RBAC) utilities
"""
from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from app.core.security import verify_firebase_token
from app.core.firebase import FirebaseService
import logging

logger = logging.getLogger(__name__)


class RBACUtils:
    """Utilities for role-based access control"""
    
    @staticmethod
    def has_role(user_roles: List[str], required_roles: List[str]) -> bool:
        """
        Check if user has any of the required roles
        
        Args:
            user_roles: List of user's roles
            required_roles: List of roles required to access resource
            
        Returns:
            True if user has at least one required role
        """
        # super_admin has access to everything
        if "super_admin" in user_roles:
            return True
        
        # Check for specific role matches
        for required_role in required_roles:
            if required_role in user_roles:
                return True
        
        return False
    
    @staticmethod
    def has_all_roles(user_roles: List[str], required_roles: List[str]) -> bool:
        """
        Check if user has all of the required roles
        
        Args:
            user_roles: List of user's roles
            required_roles: List of roles required to access resource
            
        Returns:
            True if user has all required roles
        """
        # super_admin has access to everything
        if "super_admin" in user_roles:
            return True
        
        # Check if user has all required roles
        return all(role in user_roles for role in required_roles)
    
    @staticmethod
    def is_admin(user_roles: List[str]) -> bool:
        """Check if user has any admin role"""
        admin_roles = ["super_admin", "academic_admin", "finance_admin", "support_admin"]
        return any(role in user_roles for role in admin_roles)
    
    @staticmethod
    def is_teacher(user_roles: List[str]) -> bool:
        """Check if user is a teacher"""
        return "teacher" in user_roles
    
    @staticmethod
    def is_student(user_roles: List[str]) -> bool:
        """Check if user is a student"""
        return "student" in user_roles
    
    @staticmethod
    async def set_user_roles_in_firebase(uid: str, roles: List[str]) -> None:
        """
        Set user roles in Firebase custom claims
        
        Args:
            uid: Firebase user ID
            roles: List of role names to set
        """
        try:
            firebase_service = FirebaseService()
            await firebase_service.set_custom_claims(uid, {"roles": roles})
            logger.info(f"Updated Firebase custom claims for user {uid}: {roles}")
        except Exception as e:
            logger.error(f"Failed to set Firebase custom claims: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user roles in authentication system"
            )


def require_roles(*allowed_roles: str):
    """
    Dependency to require specific roles for endpoint access
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles("admin:all"))])
        @router.get("/teachers", dependencies=[Depends(require_roles("teacher", "admin:academic"))])
    
    Args:
        *allowed_roles: Variable number of role names that are allowed
        
    Returns:
        Dependency function that validates user roles
    """
    async def dependency(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        """Check if user has required roles"""
        
        # Get user roles from custom claims - check both 'roles' (array) and 'role' (single)
        user_roles = user.get("roles", [])
        
        # If roles array is empty, check for single 'role' claim
        if not user_roles:
            single_role = user.get("role")
            if single_role:
                user_roles = [single_role]
        
        # Convert single role to list for backward compatibility
        if isinstance(user_roles, str):
            user_roles = [user_roles]
        
        # Debug: Log what we're checking
        logger.info(f"🔐 Role check - User: {user.get('email')}, Roles: {user_roles}, Required: {allowed_roles}, All claims: {user}")
        
        # Check if user has any of the required roles
        if not RBACUtils.has_role(user_roles, list(allowed_roles)):
            logger.warning(
                f"Access denied for user {user.get('uid')} "
                f"with roles {user_roles}. Required: {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        
        return user
    
    return dependency


def require_all_roles(*required_roles: str):
    """
    Dependency to require ALL specified roles for endpoint access
    
    Usage:
        @router.post("/special", dependencies=[Depends(require_all_roles("teacher", "admin:academic"))])
    
    Args:
        *required_roles: Variable number of role names that are all required
        
    Returns:
        Dependency function that validates user has all roles
    """
    async def dependency(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        """Check if user has all required roles"""
        
        # Get user roles from custom claims - check both 'roles' (array) and 'role' (single)
        user_roles = user.get("roles", [])
        
        # If roles array is empty, check for single 'role' claim
        if not user_roles:
            single_role = user.get("role")
            if single_role:
                user_roles = [single_role]
        
        # Convert single role to list for backward compatibility
        if isinstance(user_roles, str):
            user_roles = [user_roles]
        
        # Check if user has all required roles
        if not RBACUtils.has_all_roles(user_roles, list(required_roles)):
            logger.warning(
                f"Access denied for user {user.get('uid')} "
                f"with roles {user_roles}. Required all: {required_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required all roles: {', '.join(required_roles)}"
            )
        
        return user
    
    return dependency


def require_admin():
    """
    Dependency that allows any authenticated admin to access (READ operations)
    
    Usage:
        @router.get("/dashboard/stats", dependencies=[Depends(require_admin())])
        
    This allows all admin roles to READ data, while specific roles are required
    for CREATE/UPDATE/DELETE operations using require_roles()
    """
    async def dependency(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        """Check if user is an authenticated admin"""
        
        # Get user roles from custom claims - check both 'roles' (array) and 'role' (single)
        user_roles = user.get("roles", [])
        
        # If roles array is empty, check for single 'role' claim
        if not user_roles:
            single_role = user.get("role")
            if single_role:
                user_roles = [single_role]
        
        # Convert single role to list for backward compatibility
        if isinstance(user_roles, str):
            user_roles = [user_roles]
        
        # Check if user has any admin role
        admin_roles = ["super_admin", "academic_admin", "finance_admin", "admin"]
        has_admin_role = any(role in user_roles for role in admin_roles)
        
        if not has_admin_role:
            logger.warning(
                f"Access denied for user {user.get('uid')} "
                f"with roles {user_roles}. Admin access required."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        return user
    
    return dependency


def require_admin():
    """Dependency to require any admin role"""
    return require_roles("super_admin", "academic_admin", "finance_admin", "support_admin")


def require_teacher_or_admin():
    """Dependency to require teacher or admin role"""
    return require_roles("teacher", "super_admin", "academic_admin")


def require_student():
    """Dependency to require student role"""
    return require_roles("student")


async def get_user_campus_access(user: Dict[str, Any], db) -> Optional[List[int]]:
    """
    Get list of campus IDs the user has access to
    
    Args:
        user: User dict from Firebase token
        db: Database session
        
    Returns:
        None if user has cross-campus access (super_admin with no campus)
        List of campus IDs if user is campus-scoped
    """
    from sqlalchemy import select
    from app.models.user_role import UserRole
    from app.models.user import User
    
    # Get user roles from Firebase token
    user_roles = user.get("roles", [])
    
    # super_admin with no campus_id in token has FULL access to all campuses
    # This allows testing and super admin operations without database user record
    if "super_admin" in user_roles:
        token_campus_id = user.get("campus_id")
        if token_campus_id is None:
            logger.debug(f"Super admin with cross-campus access: {user.get('uid')}")
            return None  # Full cross-campus access - no database check needed
    
    # Get user from database by Firebase UID
    firebase_uid = user.get("uid")
    stmt = select(User.id).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        # User not in database yet - return empty (no campus access)
        # This can happen for newly created Firebase users
        logger.warning(f"User {firebase_uid} not found in database")
        return []
    
    # Get campus IDs from user_roles table
    stmt = select(UserRole.campus_id).where(
        UserRole.user_id == db_user,
        UserRole.campus_id.isnot(None)
    ).distinct()
    result = await db.execute(stmt)
    campus_ids = [row[0] for row in result.fetchall()]
    
    return campus_ids if campus_ids else []


async def check_campus_access(
    user: Dict[str, Any],
    campus_id: int,
    db,
    raise_error: bool = True
) -> bool:
    """
    Check if user has access to a specific campus
    
    Args:
        user: User dict from Firebase token
        campus_id: Campus ID to check access for
        db: Database session
        raise_error: Whether to raise HTTPException on access denied
        
    Returns:
        True if user has access, False otherwise
        
    Raises:
        HTTPException: If raise_error=True and access is denied
    """
    campus_ids = await get_user_campus_access(user, db)
    
    # None means access to all campuses
    if campus_ids is None:
        return True
    
    # Check if campus_id is in user's campus list
    has_access = campus_id in campus_ids
    
    if not has_access and raise_error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have access to campus {campus_id}"
        )
    
    return has_access
