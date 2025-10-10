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
    """Fee structure model"""
    
    __tablename__ = "fee_structures"
    
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    
    # Scope
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    major_id = Column(Integer, ForeignKey("majors.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    
    # Fees
    tuition_amount = Column(Numeric(12, 2), nullable=False)
    lab_fee = Column(Numeric(12, 2), default=0)
    library_fee = Column(Numeric(12, 2), default=0)
    registration_fee = Column(Numeric(12, 2), default=0)
    other_fees = Column(Text)  # JSON string for additional fees
    
    # Currency
    currency = Column(String(3), default="VND")
    
    # Status
    is_active = Column(Boolean, default=True)
    effective_from = Column(Date)
    effective_until = Column(Date)
    
    # Creator
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    campus = relationship("Campus")
    major = relationship("Major")
    semester = relationship("Semester")
    invoice_lines = relationship("InvoiceLine", back_populates="fee_structure")
    
    def __repr__(self):
        return f"<FeeStructure {self.code}>"


class Invoice(BaseModel):
    """Invoice model"""
    
    __tablename__ = "invoices"
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), index=True)
    
    # Invoice Info
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    
    # Amounts
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)
    # balance calculated as computed column
    
    # Status
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING, index=True)
    
    # Payment Details
    currency = Column(String(3), default="VND")
    notes = Column(Text)
    
    # Relationships
    student = relationship("User", back_populates="invoices")
    semester = relationship("Semester")
    invoice_lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")
    
    @property
    def balance(self):
        """Calculate balance"""
        return float(self.total_amount) - float(self.paid_amount)
    
    def __repr__(self):
        return f"<Invoice {self.invoice_number}>"


class InvoiceLine(BaseModel):
    """Invoice line item model"""
    
    __tablename__ = "invoice_lines"
    
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"))
    
    # Line Item
    description = Column(String(200), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    quantity = Column(Integer, default=1)
    # line_total calculated as computed column
    
    # Order
    line_order = Column(Integer)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_lines")
    fee_structure = relationship("FeeStructure", back_populates="invoice_lines")
    
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
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    reference_number = Column(String(100), index=True)  # Bank transaction ID
    
    # Transaction
    paid_at = Column(DateTime(timezone=True), index=True)
    processed_by = Column(Integer, ForeignKey("users.id"))
    
    # Receipt
    receipt_number = Column(String(50), unique=True)
    receipt_url = Column(String(500))
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.COMPLETED, index=True)
    
    notes = Column(Text)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    processor = relationship("User")
    
    def __repr__(self):
        return f"<Payment {self.receipt_number}>"
