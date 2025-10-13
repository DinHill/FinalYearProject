"""
Documents Router - File and Document Management

Handles document operations including:
- File upload with presigned URLs
- File download with presigned URLs
- Document request workflow (transcripts, certificates)
- Announcement management
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.core.database import get_db
from app.core.security import require_roles, get_current_user
from app.core.exceptions import NotFoundError, BusinessLogicError
from app.models.user import User
from app.models.document import Document, DocumentRequest, Announcement
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.document import (
    DocumentUploadUrlRequest,
    DocumentUploadUrlResponse,
    DocumentCreate,
    DocumentResponse,
    DocumentRequestCreate,
    DocumentRequestResponse,
    DocumentRequestUpdate,
    AnnouncementCreate,
    AnnouncementResponse,
)
from app.services.gcs_service import gcs_service
from app.services.cloudinary_service import cloudinary_service
from app.core.settings import settings

def get_storage_service():
    if settings.CLOUDINARY_CLOUD_NAME:
        return cloudinary_service
    gcs = get_gcs_service()
    if gcs:
        return gcs
    raise RuntimeError("No file storage service configured. Please set up Cloudinary or GCS.")

router = APIRouter(prefix="/documents", tags=["Documents"])




@router.post("/upload-url", response_model=DocumentUploadUrlResponse)
async def generate_upload_url(
    request: DocumentUploadUrlRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    Generate a presigned URL for uploading a file to GCS.
    
    Access: student, teacher, admin
from app.services.gcs_service import get_gcs_service
    Process:
    1. Generate unique file path
    2. Create presigned URL for PUT request
    3. Return upload URL with instructions
    
    Client should:
def get_storage_service():
    if settings.CLOUDINARY_CLOUD_NAME:
        return cloudinary_service
    gcs = get_gcs_service()
    if gcs:
        return gcs
    raise RuntimeError("No file storage service configured. Please set up Cloudinary or GCS.")
    2. Upload file directly to storage (Cloudinary or GCS) using POST/PUT request
    3. Call POST /documents to save metadata
    """
    # Generate unique file path
    file_path = storage_service.generate_file_path(
        category=request.category,
            user_id=current_user.id,
        filename=request.filename,
        add_timestamp=True,
    )
    
    # Validate file size
    max_size = 50 * 1024 * 1024  # 50MB default
    if request.category == "avatar":
        max_size = 5 * 1024 * 1024  # 5MB for avatars
    elif request.category == "assignment":
        max_size = 100 * 1024 * 1024  # 100MB for assignments
    
    storage_service = get_storage_service()
    file_path = storage_service.generate_file_path(
        category=request.category,
        user_id=current_user.id,
        filename=request.filename,
        add_timestamp=True,
    )
    upload_data = storage_service.generate_upload_url(
        file_path=file_path,
        content_type=request.content_type,
        expiration=3600,  # 1 hour
        max_file_size=max_size,
    )
    
    return DocumentUploadUrlResponse(
        upload_url=upload_data.get("upload_url") or upload_data.get("url"),
        file_path=upload_data["file_path"],
        expires_at=upload_data["expires_at"],
        method=upload_data["method"],
        headers=upload_data["headers"],
        max_file_size=max_size,
        instructions=[
            f"1. Upload file using PUT request to the upload_url",
            f"2. Set Content-Type header to: {request.content_type}",
            f"3. File size must not exceed {max_size / 1024 / 1024:.0f}MB",
            f"4. After successful upload, call POST /documents with file_path",
        ],
    )


@router.post("/", response_model=DocumentResponse, status_code=201)
async def create_document(
    document_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    Create document metadata after successful file upload.
    
    Access: student, teacher, admin
    
    This should be called after uploading the file to GCS using presigned URL.
    """
    # Verify file exists in GCS
    if not gcs_service.file_exists(document_data.file_path):
        raise BusinessLogicError("File not found in storage. Please upload the file first.")
    
    # Get file metadata from GCS
    try:
        file_metadata = gcs_service.get_file_metadata(document_data.file_path)
    except FileNotFoundError:
        raise BusinessLogicError("File not found in storage")
    
    # Create document record
    document = Document(
        uploader_id=current_user.id,
        file_path=document_data.file_path,
        filename=document_data.filename,
        file_type=document_data.file_type,
        file_size=file_metadata["size"],
        category=document_data.category,
        title=document_data.title,
        description=document_data.description,
        is_public=document_data.is_public or False,
        file_hash=file_metadata.get("md5_hash"),
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document


@router.get("/", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    uploader_id: Optional[UUID] = Query(None, description="Filter by uploader ID"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    List documents with filters.
    
    Access:
    - Admins can see all documents
    - Teachers can see public documents and their own
    - Students can see public documents and their own
    """
    query = select(Document)
    
    # Role-based filtering
    if current_user.role in ["student", "teacher"]:
        # Can see public documents or own documents
        query = query.where(
            or_(
                Document.is_public == True,
                Document.uploader_id == current_user.id
            )
        )
    
    if category:
        query = query.where(Document.category == category)
    
    if uploader_id:
        query = query.where(Document.uploader_id == uploader_id)
    
    if is_public is not None:
        query = query.where(Document.is_public == is_public)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Document.title.ilike(search_term),
                Document.description.ilike(search_term),
                Document.filename.ilike(search_term)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Document.uploaded_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return PaginatedResponse(
        items=documents,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{document_id}/download-url", response_model=dict)
async def generate_download_url(
    document_id: int,
    disposition: str = Query("inline", regex="^(inline|attachment)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    Generate a presigned URL for downloading a document.
    
    Access:
    - Admins can download any document
    - Users can download public documents or their own documents
    
    Args:
        disposition: "inline" (view in browser) or "attachment" (download)
    """
    # Get document
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise NotFoundError(f"Document with ID {document_id} not found")
    
    # Check access permissions
    if current_user.role not in ["admin", "document_admin"]:
        if not document.is_public and document.uploader_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to download this document"
            )
    
    # Generate download URL
    try:
        download_data = gcs_service.generate_download_url(
            file_path=document.file_path,
            expiration=3600,  # 1 hour
            disposition=disposition,
            filename=document.filename,
        )
    except FileNotFoundError:
        raise NotFoundError("File not found in storage")
    
    return {
        "download_url": download_data["download_url"],
        "expires_at": download_data["expires_at"],
        "filename": document.filename,
        "file_size": download_data["size"],
        "content_type": download_data["content_type"],
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "student", "teacher"]))
):
    """
    Delete a document (metadata and file).
    
    Access:
    - Admins can delete any document
    - Users can delete their own documents
    """
    # Get document
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise NotFoundError(f"Document with ID {document_id} not found")
    
    # Check permissions
    if current_user.role != "admin" and document.uploader_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own documents"
        )
    
    # Delete file from GCS
    gcs_service.delete_file(document.file_path)
    
    # Delete metadata from database
    await db.delete(document)
    await db.commit()
    
    return SuccessResponse(message="Document deleted successfully")


# Document Requests (for official documents like transcripts)

@router.post("/requests", response_model=DocumentRequestResponse, status_code=201)
async def create_document_request(
    request_data: DocumentRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student"]))
):
    """
    Request an official document (transcript, certificate, etc.).
    
    Access: student
    
    Process:
    1. Student creates request
    2. Admin processes request
    3. Document is generated and uploaded
    4. Student is notified when ready
    """
    # Create document request
    doc_request = DocumentRequest(
        student_id=current_user.id,
        document_type=request_data.document_type,
        purpose=request_data.purpose,
        notes=request_data.notes,
        status="pending",
    )
    
    db.add(doc_request)
    await db.commit()
    await db.refresh(doc_request)
    
    return doc_request


@router.get("/requests", response_model=PaginatedResponse[DocumentRequestResponse])
async def list_document_requests(
    student_id: Optional[UUID] = Query(None, description="Filter by student ID"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "admin", "document_admin"]))
):
    """
    List document requests.
    
    Access:
    - Admins can see all requests
    - Students can only see their own requests
    """
    query = select(DocumentRequest)
    
    # Students can only see their own requests
    if current_user.role == "student":
        query = query.where(DocumentRequest.student_id == current_user.id)
    elif student_id:
        query = query.where(DocumentRequest.student_id == student_id)
    
    if document_type:
        query = query.where(DocumentRequest.document_type == document_type)
    
    if status:
        query = query.where(DocumentRequest.status == status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(DocumentRequest.requested_at.desc())
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    return PaginatedResponse(
        items=requests,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.put("/requests/{request_id}", response_model=DocumentRequestResponse)
async def update_document_request(
    request_id: int,
    update_data: DocumentRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "document_admin"]))
):
    """
    Update document request status.
    
    Access: admin, document_admin
    
    Status flow: pending → processing → ready → delivered
    """
    # Get request
    query = select(DocumentRequest).where(DocumentRequest.id == request_id)
    result = await db.execute(query)
    doc_request = result.scalar_one_or_none()
    
    if not doc_request:
        raise NotFoundError(f"Document request with ID {request_id} not found")
    
    # Update fields
    if update_data.status:
        doc_request.status = update_data.status
        
        if update_data.status == "processing":
            doc_request.processed_at = datetime.utcnow()
        elif update_data.status == "ready":
            doc_request.completed_at = datetime.utcnow()
        elif update_data.status == "delivered":
            doc_request.delivered_at = datetime.utcnow()
    
    if update_data.document_id is not None:
        doc_request.document_id = update_data.document_id
    
    if update_data.admin_notes:
        doc_request.admin_notes = update_data.admin_notes
    
    await db.commit()
    await db.refresh(doc_request)
    
    return doc_request


# Announcements

@router.post("/announcements", response_model=AnnouncementResponse, status_code=201)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Create a new announcement.
    
    Access: admin
    """
    announcement = Announcement(
        author_id=current_user.id,
        title=announcement_data.title,
        content=announcement_data.content,
        category=announcement_data.category,
        target_audience=announcement_data.target_audience,
        priority=announcement_data.priority or "normal",
        is_published=announcement_data.is_published or False,
        publish_at=announcement_data.publish_at,
        expires_at=announcement_data.expires_at,
    )
    
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    
    return announcement


@router.get("/announcements", response_model=PaginatedResponse[AnnouncementResponse])
async def list_announcements(
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    is_published: Optional[bool] = Query(True, description="Filter by published status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List announcements.
    
    Access: all authenticated users
    
    Returns published announcements visible to current user's role.
    """
    query = select(Announcement)
    
    # Non-admins can only see published announcements
    if current_user.role != "admin":
        query = query.where(Announcement.is_published == True)
        
        # Filter by target audience
        query = query.where(
            or_(
                Announcement.target_audience == "all",
                Announcement.target_audience == current_user.role
            )
        )
    elif is_published is not None:
        query = query.where(Announcement.is_published == is_published)
    
    if category:
        query = query.where(Announcement.category == category)
    
    if priority:
        query = query.where(Announcement.priority == priority)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Announcement.created_at.desc())
    
    result = await db.execute(query)
    announcements = result.scalars().all()
    
    return PaginatedResponse(
        items=announcements,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )
