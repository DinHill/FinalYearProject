"""
Custom exception classes
"""
from fastapi import HTTPException, status
from typing import Optional, Dict, Any


class APIException(HTTPException):
    """Base API exception"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        fields: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code or "API_ERROR"
        self.fields = fields


class ValidationError(APIException):
    """Validation error"""
    
    def __init__(self, detail: str, fields: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            code="VALIDATION_ERROR",
            fields=fields
        )


class NotFoundError(APIException):
    """Resource not found error"""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id {identifier} not found",
            code="NOT_FOUND"
        )


class AuthenticationError(APIException):
    """Authentication error"""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIException):
    """Authorization error"""
    
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code="AUTHORIZATION_ERROR"
        )


class ConflictError(APIException):
    """Conflict error (e.g., duplicate resource)"""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code="CONFLICT"
        )


class BusinessLogicError(APIException):
    """Business logic error"""
    
    def __init__(self, detail: str, code: str = "BUSINESS_LOGIC_ERROR"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            code=code
        )


# Specific business logic errors
class EnrollmentLimitExceededError(BusinessLogicError):
    """Section has reached maximum enrollment"""
    
    def __init__(self):
        super().__init__(
            detail="Section has reached maximum enrollment capacity",
            code="ENROLLMENT_LIMIT_EXCEEDED"
        )


class PrerequisiteNotMetError(BusinessLogicError):
    """Prerequisites not satisfied"""
    
    def __init__(self, missing_courses: list):
        super().__init__(
            detail=f"Prerequisites not met. Missing: {', '.join(missing_courses)}",
            code="PREREQUISITE_NOT_MET"
        )


class ScheduleConflictError(BusinessLogicError):
    """Schedule conflict detected"""
    
    def __init__(self, conflicting_course: str):
        super().__init__(
            detail=f"Schedule conflict with course: {conflicting_course}",
            code="SCHEDULE_CONFLICT"
        )


class InsufficientPaymentError(BusinessLogicError):
    """Payment required or insufficient"""
    
    def __init__(self, amount_due: float):
        super().__init__(
            detail=f"Insufficient payment. Amount due: {amount_due}",
            code="INSUFFICIENT_PAYMENT"
        )


class GradingPeriodClosedError(BusinessLogicError):
    """Grading period has closed"""
    
    def __init__(self):
        super().__init__(
            detail="Grading period for this assignment has closed",
            code="GRADING_PERIOD_CLOSED"
        )


class DocumentNotReadyError(BusinessLogicError):
    """Document is not ready yet"""
    
    def __init__(self):
        super().__init__(
            detail="Document is still being processed",
            code="DOCUMENT_NOT_READY"
        )
