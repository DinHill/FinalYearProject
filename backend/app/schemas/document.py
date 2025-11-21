"""
Document Schemas

Pydantic models for document-related operations.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import Field, validator

from app.schemas.base import BaseSchema


# Document Upload URL Request/Response

class DocumentUploadUrlRequest(BaseSchema):
    """Request to generate presigned upload URL"""
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type (e.g., application/pdf)")
    category: str = Field(
        ...,
        description="Document category",
        pattern="^(document|transcript|certificate|assignment|avatar|other)$"
    )


class DocumentUploadUrlResponse(BaseSchema):
    """Response with presigned upload URL"""
    upload_url: str = Field(..., description="Presigned URL for uploading")
    file_path: str = Field(..., description="Path in storage bucket")
    expires_at: str = Field(..., description="URL expiration time (ISO format)")
    method: str = Field(..., description="HTTP method to use (PUT)")
    headers: dict = Field(..., description="Required headers for upload")
    max_file_size: int = Field(..., description="Maximum file size in bytes")
    instructions: List[str] = Field(..., description="Upload instructions")


# Document CRUD

class DocumentCreate(BaseSchema):
    """Create document metadata after file upload"""
    file_path: str = Field(..., description="Path in storage bucket")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File extension (e.g., pdf, docx)")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type (e.g., application/pdf)")
    category: str = Field(
        ...,
        description="Document category",
        pattern="^(document|transcript|certificate|assignment|avatar|other|course_materials)$"
    )
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_public: Optional[bool] = Field(False, description="Is document public?")
    course_id: Optional[int] = Field(None, description="Course ID for course materials")


class DocumentResponse(BaseSchema):
    """Document response"""
    id: int
    user_id: int  # Integer, not UUID
    title: str
    document_type: str  # Changed from file_type to match model
    file_url: str
    file_size: Optional[int] = None  # Can be None
    mime_type: Optional[str] = None
    status: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime  # From BaseModel
    updated_at: Optional[datetime] = None  # From BaseModel
    
    # Course materials fields
    course_id: Optional[int] = None
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    
    class Config:
        from_attributes = True


# Document Request (for official documents)

class DocumentRequestCreate(BaseSchema):
    """Create a document request"""
    document_type: str = Field(
        ...,
        description="Type of document",
        pattern="^(transcript|certificate|recommendation_letter|enrollment_verification|other)$"
    )
    purpose: str = Field(..., min_length=1, max_length=500, description="Purpose of request")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")


class DocumentRequestUpdate(BaseSchema):
    """Update document request (admin only)"""
    status: Optional[str] = Field(
        None,
        pattern="^(pending|processing|ready|delivered|cancelled)$"
    )
    document_id: Optional[int] = Field(None, description="ID of generated document")
    admin_notes: Optional[str] = Field(None, max_length=1000)


class DocumentRequestResponse(BaseSchema):
    """Document request response"""
    id: int
    student_id: int  # Integer, not UUID
    document_type: str
    purpose: str
    notes: Optional[str]
    status: str
    document_id: Optional[int] = None
    admin_notes: Optional[str] = None
    requested_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Announcement

class AnnouncementCreate(BaseSchema):
    """Create announcement"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    target_audience: Optional[str] = Field(
        "all",
        description="Target audience",
        max_length=50
    )
    is_published: Optional[bool] = Field(False)
    publish_date: Optional[datetime] = Field(None, description="Scheduled publish time")
    expire_date: Optional[datetime] = Field(None, description="Expiration time")


class AnnouncementResponse(BaseSchema):
    """Announcement response"""
    id: int
    author_id: Optional[int] = None  # Integer, not UUID, optional since some announcements may not have an author
    title: str
    content: str
    target_audience: str
    is_published: bool
    publish_date: Optional[datetime]
    expire_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

