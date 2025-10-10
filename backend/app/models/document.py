"""
Document and content models
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, BigInteger
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class DocumentCategory(str, enum.Enum):
    """Document category enum"""
    SYLLABUS = "syllabus"
    ASSIGNMENT = "assignment"
    LECTURE_NOTE = "lecture_note"
    TRANSCRIPT = "transcript"
    CERTIFICATE = "certificate"
    OTHER = "other"


class DocumentVisibility(str, enum.Enum):
    """Document visibility enum"""
    PUBLIC = "public"
    PRIVATE = "private"
    RESTRICTED = "restricted"


class DocumentRequestType(str, enum.Enum):
    """Document request type enum"""
    TRANSCRIPT = "transcript"
    CERTIFICATE = "certificate"
    ENROLLMENT_LETTER = "enrollment_letter"
    RECOMMENDATION_LETTER = "recommendation_letter"


class DocumentRequestStatus(str, enum.Enum):
    """Document request status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    DELIVERED = "delivered"
    REJECTED = "rejected"


class DeliveryMethod(str, enum.Enum):
    """Delivery method enum"""
    PICKUP = "pickup"
    EMAIL = "email"
    POSTAL_MAIL = "postal_mail"


class AnnouncementCategory(str, enum.Enum):
    """Announcement category enum"""
    NEWS = "news"
    ACADEMIC = "academic"
    EVENT = "event"
    URGENT = "urgent"
    MAINTENANCE = "maintenance"


class Priority(str, enum.Enum):
    """Priority enum"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Document(BaseModel):
    """Document model"""
    
    __tablename__ = "documents"
    
    # Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    section_id = Column(Integer, ForeignKey("course_sections.id"), index=True)
    
    # File Info
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)  # GCS object key
    mime_type = Column(String(100), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_hash = Column(String(64), index=True)  # SHA-256
    
    # Classification
    category = Column(SQLEnum(DocumentCategory), index=True)
    visibility = Column(SQLEnum(DocumentVisibility), default=DocumentVisibility.PRIVATE)
    
    # Location Context
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    
    # Metadata
    uploaded_at = Column(DateTime(timezone=True))
    version = Column(Integer, default=1)
    
    # Relationships
    owner = relationship("User")
    section = relationship("CourseSection")
    campus = relationship("Campus")
    
    def __repr__(self):
        return f"<Document {self.title}>"


class DocumentRequest(BaseModel):
    """Document request model"""
    
    __tablename__ = "document_requests"
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Request Info
    document_type = Column(SQLEnum(DocumentRequestType), nullable=False, index=True)
    purpose = Column(Text)
    copies_requested = Column(Integer, default=1)
    
    # Status Workflow
    status = Column(SQLEnum(DocumentRequestStatus), default=DocumentRequestStatus.PENDING, index=True)
    
    # Processing
    requested_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))
    processed_by = Column(Integer, ForeignKey("users.id"))
    ready_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    
    # Delivery
    delivery_method = Column(SQLEnum(DeliveryMethod))
    delivery_address = Column(Text)
    tracking_number = Column(String(100))
    
    # Fee
    fee_amount = Column(Integer)
    fee_paid = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text)
    
    # Relationships
    student = relationship("User", back_populates="document_requests", foreign_keys=[student_id])
    processor = relationship("User", foreign_keys=[processed_by])
    
    def __repr__(self):
        return f"<DocumentRequest {self.document_type} for Student{self.student_id}>"


class Announcement(BaseModel):
    """Announcement model"""
    
    __tablename__ = "announcements"
    
    # Content
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    summary = Column(String(500))
    
    # Targeting
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    major_id = Column(Integer, ForeignKey("majors.id"))
    audience = Column(String(50), default="all")  # all, students, teachers, staff
    
    # Category
    category = Column(SQLEnum(AnnouncementCategory), index=True)
    priority = Column(SQLEnum(Priority), default=Priority.NORMAL)
    
    # Publishing
    is_published = Column(Boolean, default=False, index=True)
    is_pinned = Column(Boolean, default=False, index=True)
    publish_at = Column(DateTime(timezone=True), index=True)
    expire_at = Column(DateTime(timezone=True))
    
    # Author
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    campus = relationship("Campus", back_populates="announcements")
    major = relationship("Major")
    author = relationship("User")
    
    def __repr__(self):
        return f"<Announcement {self.title}>"
