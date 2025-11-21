"""
Schemas package initialization
"""
from app.schemas.base import (
    BaseSchema,
    PaginationParams,
    PaginatedResponse,
    SuccessResponse,
    ErrorResponse
)
from app.schemas.auth import (
    StudentLoginRequest,
    StudentLoginResponse,
    SessionCreateRequest,
    UserProfileResponse,
    ChangePasswordRequest
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    CampusResponse,
    MajorResponse
)
from app.schemas.academic import (
    SemesterCreate,
    SemesterUpdate,
    SemesterResponse,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseSectionCreate,
    CourseSectionUpdate,
    CourseSectionResponse,
    # ScheduleCreate,  # Removed - Schedule model removed
    # ScheduleUpdate,
    # ScheduleResponse,
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
    EnrollmentWithCourseResponse,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    GradeCreate,
    GradeUpdate,
    GradeResponse,
    GradeWithAssignmentResponse,
    AttendanceCreate,
    AttendanceBulkCreate,
    AttendanceUpdate,
    AttendanceResponse,
    AttendanceSummary
)
from app.schemas.finance import (
    FeeStructureCreate,
    FeeStructureUpdate,
    FeeStructureResponse,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceWithLinesResponse,
    InvoiceLineCreate,
    InvoiceLineResponse,
    PaymentCreate,
    PaymentResponse,
    PaymentWithInvoiceResponse,
    StudentFinancialSummary,
    SemesterFinancialSummary
)

__all__ = [
    # Base
    "BaseSchema",
    "PaginationParams",
    "PaginatedResponse",
    "SuccessResponse",
    "ErrorResponse",
    # Auth
    "StudentLoginRequest",
    "StudentLoginResponse",
    "SessionCreateRequest",
    "UserProfileResponse",
    "ChangePasswordRequest",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "CampusResponse",
    "MajorResponse",
    # Academic
    "SemesterCreate",
    "SemesterUpdate",
    "SemesterResponse",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseSectionCreate",
    "CourseSectionUpdate",
    "CourseSectionResponse",
    # "ScheduleCreate",  # Removed - Schedule model removed
    # "ScheduleUpdate",
    # "ScheduleResponse",
    "EnrollmentCreate",
    "EnrollmentUpdate",
    "EnrollmentResponse",
    "EnrollmentWithCourseResponse",
    "AssignmentCreate",
    "AssignmentUpdate",
    "AssignmentResponse",
    "GradeCreate",
    "GradeUpdate",
    "GradeResponse",
    "GradeWithAssignmentResponse",
    "AttendanceCreate",
    "AttendanceBulkCreate",
    "AttendanceUpdate",
    "AttendanceResponse",
    "AttendanceSummary",
    # Finance
    "FeeStructureCreate",
    "FeeStructureUpdate",
    "FeeStructureResponse",
    "InvoiceCreate",
    "InvoiceUpdate",
    "InvoiceResponse",
    "InvoiceWithLinesResponse",
    "InvoiceLineCreate",
    "InvoiceLineResponse",
    "PaymentCreate",
    "PaymentResponse",
    "PaymentWithInvoiceResponse",
    "StudentFinancialSummary",
    "SemesterFinancialSummary"
]
