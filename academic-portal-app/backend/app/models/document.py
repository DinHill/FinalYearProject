from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base
import enum

class DocumentType(enum.Enum):
    SYLLABUS = "syllabus"
    LECTURE_NOTES = "lecture_notes"
    ASSIGNMENT = "assignment"
    RESOURCE = "resource"
    EXAM = "exam"
    OTHER = "other"

class DocumentStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    file_type = Column(String(50))  # pdf, docx, pptx, etc.
    document_type = Column(Enum(DocumentType), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT)
    
    # Firebase Storage path
    storage_path = Column(String(500), nullable=False)
    download_url = Column(Text)
    
    # Access control
    course_section_id = Column(Integer, ForeignKey("course_sections.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    allowed_roles = Column(String(200))  # JSON array of roles
    
    # Metadata
    version = Column(String(10), default="1.0")
    tags = Column(Text)  # JSON array of tags
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_section = relationship("CourseSection", backref="documents")
    uploader = relationship("User", backref="uploaded_documents")

class DocumentAccess(Base):
    __tablename__ = "document_access"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_date = Column(DateTime(timezone=True), server_default=func.now())
    download_count = Column(Integer, default=0)
    last_download = Column(DateTime(timezone=True))

    # Relationships
    document = relationship("Document", backref="access_logs")
    user = relationship("User", backref="document_accesses")