"""
Core package initialization
"""
from app.core.settings import settings, get_settings
from app.core.database import Base, get_db, init_db, close_db
from app.core.firebase import initialize_firebase, FirebaseService, get_firestore_client
from app.core.security import (
    SecurityUtils, verify_firebase_token, require_roles, require_permissions,
    require_same_user_or_admin, require_campus_access, optional_firebase_token
)
from app.core.exceptions import (
    APIException, ValidationError, NotFoundError, AuthenticationError, AuthorizationError,
    ConflictError, BusinessLogicError, EnrollmentLimitExceededError, PrerequisiteNotMetError,
    ScheduleConflictError, InsufficientPaymentError, GradingPeriodClosedError, DocumentNotReadyError
)

__all__ = [
    # Settings
    "settings", "get_settings",
    
    # Database
    "Base", "get_db", "init_db", "close_db",
    
    # Firebase
    "initialize_firebase", "FirebaseService", "get_firestore_client",
    
    # Security
    "SecurityUtils", "verify_firebase_token", "require_roles", "require_permissions",
    "require_same_user_or_admin", "require_campus_access", "optional_firebase_token",
    
    # Exceptions
    "APIException", "ValidationError", "NotFoundError", "AuthenticationError", "AuthorizationError",
    "ConflictError", "BusinessLogicError", "EnrollmentLimitExceededError", "PrerequisiteNotMetError",
    "ScheduleConflictError", "InsufficientPaymentError", "GradingPeriodClosedError", "DocumentNotReadyError",
]
