"""
Document and content models
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, BigInteger, text
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
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # File Info
    title = Column(String(200))
    document_type = Column(String(50))  # VARCHAR(50) in database
    file_url = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Course Material Linking
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20))  # VARCHAR(20) in database
    
    # Upload tracking
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])
    course = relationship("Course", foreign_keys=[course_id])
    
    def __repr__(self):
        return f"<Document {self.title}>"


class DocumentRequest(BaseModel):
    """Document request model"""
    
    __tablename__ = "document_requests"
    
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Request Info - using varchar to match database schema
    document_type = Column(String(50), nullable=False, index=True)  # Changed from Enum to String
    purpose = Column(Text)
    copies_requested = Column(Integer, default=1)
    
    # Status Workflow
    status = Column(String(20), default="pending", index=True)
    
    # Processing
    requested_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))
    processed_by = Column(Integer, ForeignKey("users.id"))
    ready_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    
    # Delivery - using varchar to match database schema
    delivery_method = Column(String(20))  # Changed from Enum to String
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
    content = Column(Text, nullable=False)  # Matches database 'content' column
    
    # Targeting - using database column names
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_audience = Column(String(50), default="all")  # Matches database column name
    
    # Publishing - using database column names
    is_published = Column(Boolean, default=False, index=True)
    publish_date = Column(DateTime(timezone=True), index=True)  # Matches database column name
    expire_date = Column(DateTime(timezone=True))  # Matches database column name
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), onupdate=text('now()'))
    
    # Relationships
    author = relationship("User", foreign_keys=[author_id])
    
    def __repr__(self):
        return f"<Announcement {self.title}>"



