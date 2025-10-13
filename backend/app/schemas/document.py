"""
Document Schemas

Pydantic models for document-related operations.
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID
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
    file_path: str = Field(..., description="Path in GCS bucket")
    expires_at: str = Field(..., description="URL expiration time (ISO format)")
    method: str = Field(..., description="HTTP method to use (PUT)")
    headers: dict = Field(..., description="Required headers for upload")
    max_file_size: int = Field(..., description="Maximum file size in bytes")
    instructions: List[str] = Field(..., description="Upload instructions")


# Document CRUD

class DocumentCreate(BaseSchema):
    """Create document metadata after file upload"""
    file_path: str = Field(..., description="Path in GCS bucket")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File extension (e.g., pdf, docx)")
    category: str = Field(
        ...,
        description="Document category",
        pattern="^(document|transcript|certificate|assignment|avatar|other)$"
    )
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_public: Optional[bool] = Field(False, description="Is document public?")


class DocumentResponse(BaseSchema):
    """Document response"""
    id: int
    uploader_id: UUID
    file_path: str
    filename: str
    file_type: str
    file_size: int
    category: str
    title: str
    description: Optional[str]
    is_public: bool
    file_hash: Optional[str]
    uploaded_at: datetime
    
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
    student_id: UUID
    document_type: str
    purpose: str
    notes: Optional[str]
    status: str
    document_id: Optional[int]
    admin_notes: Optional[str]
    requested_at: datetime
    processed_at: Optional[datetime]
    completed_at: Optional[datetime]
    delivered_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Announcement

class AnnouncementCreate(BaseSchema):
    """Create announcement"""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    category: str = Field(
        ...,
        description="Announcement category",
        pattern="^(academic|administrative|event|maintenance|other)$"
    )
    target_audience: str = Field(
        ...,
        description="Target audience",
        pattern="^(all|student|teacher|admin)$"
    )
    priority: Optional[str] = Field(
        "normal",
        pattern="^(low|normal|high|urgent)$"
    )
    is_published: Optional[bool] = Field(False)
    publish_at: Optional[datetime] = Field(None, description="Scheduled publish time")
    expires_at: Optional[datetime] = Field(None, description="Expiration time")


class AnnouncementResponse(BaseSchema):
    """Announcement response"""
    id: int
    author_id: UUID
    title: str
    content: str
    category: str
    target_audience: str
    priority: str
    is_published: bool
    publish_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

