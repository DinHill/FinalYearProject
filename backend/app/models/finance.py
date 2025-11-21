"""
Financial models - fees, invoices, payments
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text, Boolean, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship, column_property
from sqlalchemy import select
from app.models.base import BaseModel
import enum


class InvoiceStatus(str, enum.Enum):
    """Invoice status enum"""
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Payment method enum"""
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    MOMO = "momo"
    VNPAY = "vnpay"


class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class FeeStructure(BaseModel):
    """Fee structure model - defines fees for campus/major/semester combinations"""
    
    __tablename__ = "fee_structures"
    
    # Scope - what this fee applies to
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    major_id = Column(Integer, ForeignKey("majors.id"), index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), index=True)
    
    # Academic year
    academic_year = Column(String(20))  # e.g., "2024-2025"
    
    # Fee details
    fee_type = Column(String(50), nullable=False)  # tuition, lab_fee, library_fee, etc.
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="VND")
    description = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    effective_from = Column(Date)
    effective_to = Column(Date)  # Changed from effective_until to match schema
    
    # Relationships
    campus = relationship("Campus")
    major = relationship("Major")
    semester = relationship("Semester")
    invoice_lines = relationship("InvoiceLine", back_populates="fee_structure")
    
    def __repr__(self):
        return f"<FeeStructure {self.fee_type} - {self.academic_year}>"


class Invoice(BaseModel):
    """Invoice model"""
    
    __tablename__ = "invoices"
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), index=True)
    
    # Invoice Info
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    issued_date = Column(Date)  # Changed from issue_date to match database
    due_date = Column(Date, index=True)
    
    # Amounts
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)
    # balance calculated as computed column
    
    # Status
    status = Column(String(20), default="pending", index=True)
    
    # Payment Details
    notes = Column(Text)
    
    # Relationships
    student = relationship("User", back_populates="invoices")
    semester = relationship("Semester")
    payments = relationship("Payment", back_populates="invoice")
    invoice_lines = relationship("InvoiceLine", back_populates="invoice")
    
    @property
    def balance(self):
        """Calculate balance"""
        return float(self.total_amount) - float(self.paid_amount)
    
    def __repr__(self):
        return f"<Invoice {self.invoice_number}>"


class InvoiceLine(BaseModel):
    """Invoice line item model"""
    
    __tablename__ = "invoice_lines"
    
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"))
    
    # Line Item Details
    description = Column(String(200), nullable=False)
    qty = Column(Integer, default=1)  # Changed from quantity to match schema
    unit_price = Column(Numeric(12, 2), nullable=False)  # Added - required by schema
    amount = Column(Numeric(12, 2), nullable=False)  # Total amount (qty * unit_price)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_lines")
    fee_structure = relationship("FeeStructure", back_populates="invoice_lines")
    
    def __repr__(self):
        return f"<InvoiceLine Invoice{self.invoice_id} - {self.description}>"
    
    @property
    def line_total(self):
        """Calculate line total"""
        return float(self.amount) * self.quantity
    
    def __repr__(self):
        return f"<InvoiceLine {self.description}>"


class Payment(BaseModel):
    """Payment model"""
    
    __tablename__ = "payments"
    
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    
    # Payment Info
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50))  # Changed from SQLEnum to String to be more flexible
    transaction_id = Column(String(100), index=True)  # Changed from reference_number
    
    # Transaction
    payment_date = Column(DateTime(timezone=True), index=True)  # Changed from paid_at
    
    # Status
    status = Column(String(20), default="completed", index=True)  # Changed from SQLEnum to String
    
    notes = Column(Text)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment {self.transaction_id}>"
