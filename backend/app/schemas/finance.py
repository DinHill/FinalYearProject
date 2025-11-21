"""
Finance domain schemas - invoices, payments, fee structures
"""
from pydantic import Field, field_validator
from app.schemas.base import BaseSchema
from datetime import datetime, date as date_type
from typing import Optional, List
from decimal import Decimal


# ============================================================================
# Fee Structure Schemas
# ============================================================================

class FeeStructureBase(BaseSchema):
    """Base fee structure schema"""
    name: str = Field(..., description="Fee name", example="Tuition Fee - Computing")
    description: Optional[str] = Field(None, description="Fee description")
    amount: Decimal = Field(..., description="Fee amount in VND", ge=0)
    major_code: Optional[str] = Field(None, description="Major code (null for common fees)", max_length=10)
    campus_code: Optional[str] = Field(None, description="Campus code (null for all campuses)", max_length=10)
    year_applicable: Optional[int] = Field(None, description="Year applicable (null for all years)")
    is_active: bool = Field(True, description="Whether fee is currently active")


class FeeStructureCreate(FeeStructureBase):
    """Create fee structure request"""
    pass


class FeeStructureUpdate(BaseSchema):
    """Update fee structure request"""
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None


class FeeStructureResponse(FeeStructureBase):
    """Fee structure response"""
    id: int
    created_at: datetime


# ============================================================================
# Invoice Schemas
# ============================================================================

class InvoiceBase(BaseSchema):
    """Base invoice schema"""
    student_id: int = Field(..., description="Student user ID")
    semester_id: Optional[int] = Field(None, description="Semester ID")
    invoice_number: str = Field(..., description="Unique invoice number", example="INV202401001")
    total_amount: Decimal = Field(..., description="Total invoice amount", ge=0)
    paid_amount: Decimal = Field(0, description="Amount paid so far", ge=0)
    due_date: date_type = Field(..., description="Payment due date")
    status: str = Field("pending", description="Invoice status", pattern="^(pending|partial|paid|overdue|cancelled)$")


class InvoiceCreate(BaseSchema):
    """Create invoice request"""
    student_id: int
    semester_code: str = Field(..., description="Semester code (e.g., F2024, S2025)")
    invoice_number: str
    issue_date: date_type  # Keep as issue_date for input (router maps to issued_date in DB)
    due_date: date_type
    status: Optional[str] = Field("pending", pattern="^(pending|partial|paid|overdue|cancelled)$")
    notes: Optional[str] = None
    lines: List['InvoiceLineCreate'] = Field(..., description="Invoice line items")
    
    @field_validator('lines')
    @classmethod
    def validate_lines_not_empty(cls, v):
        """Validate at least one line item"""
        if not v:
            raise ValueError("Invoice must have at least one line item")
        return v


class InvoiceUpdate(BaseSchema):
    """Update invoice request"""
    due_date: Optional[date_type] = None
    status: Optional[str] = Field(None, pattern="^(pending|partial|paid|overdue|cancelled)$")
    notes: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    """Invoice response"""
    id: int
    issued_date: date_type  # Added issued_date field (database column name)
    balance: Decimal = Field(..., description="Remaining balance (total - paid)")
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InvoiceWithLinesResponse(InvoiceResponse):
    """Invoice response with line items"""
    lines: List['InvoiceLineResponse']
    student_name: str
    semester_name: str


# ============================================================================
# Invoice Line Schemas
# ============================================================================

class InvoiceLineBase(BaseSchema):
    """Base invoice line schema"""
    invoice_id: int = Field(..., description="Invoice ID")
    fee_structure_id: Optional[int] = Field(None, description="Fee structure ID")
    description: str = Field(..., description="Line item description")
    quantity: int = Field(1, description="Quantity", ge=1)
    unit_price: Decimal = Field(..., description="Unit price", ge=0)
    amount: Decimal = Field(..., description="Total amount (quantity * unit_price)", ge=0)


class InvoiceLineCreate(BaseSchema):
    """Create invoice line request (for nested creation)"""
    description: str
    quantity: int = 1
    unit_price: Decimal = Field(..., ge=0)
    amount: Decimal = Field(..., ge=0)
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v, info):
        """Validate amount matches quantity * unit_price"""
        data = info.data
        if 'quantity' in data and 'unit_price' in data:
            expected = Decimal(data['quantity']) * data['unit_price']
            if v != expected:
                return expected
        return v


class InvoiceLineResponse(InvoiceLineBase):
    """Invoice line response"""
    id: int
    created_at: datetime


# ============================================================================
# Payment Schemas
# ============================================================================

class PaymentBase(BaseSchema):
    """Base payment schema"""
    invoice_id: int = Field(..., description="Invoice ID")
    amount: Decimal = Field(..., description="Payment amount", gt=0)
    payment_method: str = Field(..., description="Payment method", 
                                 pattern="^(cash|bank_transfer|card|e_wallet|momo|vnpay)$")
    transaction_id: Optional[str] = Field(None, description="Payment transaction ID")
    status: str = Field("completed", description="Payment status")
    notes: Optional[str] = Field(None, description="Payment notes")


class PaymentCreate(BaseSchema):
    """Create payment request"""
    invoice_id: int
    amount: Decimal = Field(..., gt=0)
    payment_date: Optional[date_type] = None
    payment_method: str = Field(
        ...,
        description="Payment method",
        pattern="^(cash|bank_transfer|card|e_wallet|momo|vnpay)$"
    )
    transaction_id: Optional[str] = Field(None, description="Transaction ID")
    status: Optional[str] = Field("completed", description="Payment status", pattern="^(pending|completed|failed|refunded)$")
    notes: Optional[str] = Field(None, description="Payment notes")


class PaymentResponse(PaymentBase):
    """Payment response"""
    id: int
    payment_date: datetime = Field(..., description="Payment timestamp")  # Changed from paid_at to payment_date
    processed_by_id: Optional[int] = Field(None, description="Staff user ID who processed payment")
    created_at: datetime


class PaymentWithInvoiceResponse(PaymentResponse):
    """Payment response with invoice details"""
    invoice_number: str
    student_name: str
    semester_name: str


# ============================================================================
# Summary Schemas
# ============================================================================

class StudentFinancialSummary(BaseSchema):
    """Student financial summary"""
    student_id: int
    student_name: str
    total_invoiced: Decimal = Field(..., description="Total amount invoiced")
    total_paid: Decimal = Field(..., description="Total amount paid")
    outstanding_balance: Decimal = Field(..., description="Total outstanding balance")
    invoice_count: int = Field(..., description="Total number of invoices")
    status_breakdown: dict = Field(..., description="Invoice count by status")


class SemesterFinancialSummary(BaseSchema):
    """Semester financial summary"""
    semester_id: int
    semester_name: str
    total_invoiced: Decimal = Field(..., description="Total amount invoiced")
    total_collected: Decimal = Field(..., description="Total amount collected")
    outstanding_balance: Decimal = Field(..., description="Total outstanding balance")
    collection_rate: Decimal = Field(..., description="Collection rate percentage")
    student_count: int = Field(..., description="Number of students with invoices")
    invoice_count: int = Field(..., description="Total number of invoices")


class InvoiceDetailResponse(InvoiceResponse):
    """Invoice with full details including lines and payments"""
    lines: List['InvoiceLineResponse']
    payments: List['PaymentResponse']


# Forward references resolution
InvoiceCreate.model_rebuild()
InvoiceDetailResponse.model_rebuild()
