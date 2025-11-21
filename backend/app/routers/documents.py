"""
Documents Router - File and Document Management

Handles document operations including:
- File upload with presigned URLs
- File download with presigned URLs
- Document request workflow (transcripts, certificates)
- Announcement management
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.core.database import get_db
from app.core.rbac import require_roles, require_admin, require_student, get_user_campus_access, check_campus_access
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
from app.services.local_storage_service import get_local_storage_service
from app.services.cloudinary_service import cloudinary_service
from app.core.settings import settings

def get_storage_service():
    """Get available storage service (Cloudinary preferred, then local storage)"""
    if settings.CLOUDINARY_CLOUD_NAME:
        return cloudinary_service
    # Fall back to local storage for development/testing
    return get_local_storage_service()

router = APIRouter(prefix="/documents", tags=["Documents"])




@router.post("/upload-url", response_model=DocumentUploadUrlResponse)
async def generate_upload_url(
    request: DocumentUploadUrlRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    Generate a presigned URL for uploading a file to cloud storage.
    
    Access: student, teacher, admin
    
    Process:
    1. Generate unique file path
    2. Create presigned URL for PUT request
    3. Return upload URL with instructions
    
    Client should:
    1. Use the returned upload_url to upload the file
    2. Upload file directly to storage (Cloudinary or local) using POST/PUT request
    3. Call POST /documents to save metadata
    """
    # Get storage service
    storage_service = get_storage_service()
    
    # Validate file size
    max_size = 50 * 1024 * 1024  # 50MB default
    if request.category == "avatar":
        max_size = 5 * 1024 * 1024  # 5MB for avatars
    elif request.category == "assignment":
        max_size = 100 * 1024 * 1024  # 100MB for assignments
    
    # Generate unique file path
    file_path = storage_service.generate_file_path(
        category=request.category,
        user_id=current_user["db_user_id"],
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
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    Create document metadata after successful file upload.
    
    Access: student, teacher, admin
    
    This should be called after uploading the file to cloud storage using presigned URL.
    """
    storage_service = get_storage_service()
    
    # Verify file exists in storage
    if not storage_service.file_exists(document_data.file_path):
        raise BusinessLogicError("File not found in storage. Please upload the file first.")
    
    # Get file metadata from storage
    try:
        file_metadata = storage_service.get_file_metadata(document_data.file_path)
    except FileNotFoundError:
        raise BusinessLogicError("File not found in storage")
    
    # Create document record
    document = Document(
        uploaded_by=current_user["db_user_id"],
        user_id=current_user["db_user_id"],
        file_url=document_data.file_path,
        title=document_data.title,
        document_type=document_data.category,
        file_size=document_data.file_size,
        mime_type=document_data.mime_type,
        status="active",
        course_id=document_data.course_id,
        description=document_data.description,
        file_name=document_data.filename,
        file_type=document_data.file_type,
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document


@router.get("/", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    uploader_id: Optional[UUID] = Query(None, description="Filter by uploader ID"),
    campus_id: Optional[int] = Query(None, description="Filter by campus"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    List documents with filters (campus-filtered).
    
    Access:
    - Admins can see documents within their campus scope
    - Teachers can see public documents and their own (within campus)
    - Students can see public documents and their own (within campus)
    """
    query = select(Document)
    
    # Get user's campus access
    user_campus_access = await get_user_campus_access(
        {"uid": current_user["uid"], "roles": current_user.get("roles", [])}, db
    )
    
    # Role-based filtering
    user_roles = current_user.get("roles", [])
    if any(role in ["student", "teacher"] for role in user_roles):
        # Can see own documents only (is_public field doesn't exist in model)
        query = query.where(
            Document.uploaded_by == current_user["db_user_id"]
        )
    
    # Campus filtering
    if campus_id:
        # Specific campus requested - verify access
        if user_campus_access is not None:
            await check_campus_access(
                {"uid": current_user["uid"], "roles": current_user.get("roles", [])}, 
                campus_id, db, raise_error=True
            )
        query = query.where(Document.campus_id == campus_id)
    else:
        # No specific campus - filter by user's campus access
        if user_campus_access is not None:  # Campus-scoped user
            if user_campus_access:
                query = query.where(Document.campus_id.in_(user_campus_access))
            else:
                # No campus assignments - return empty
                return PaginatedResponse(
                    items=[],
                    total=0,
                    page=page,
                    per_page=page_size,
                    pages=0
                )
    
    if category:
        query = query.where(Document.document_type == category)
    
    if uploader_id:
        query = query.where(Document.uploaded_by == uploader_id)
    
    if is_public is not None:
        # Map is_public to status: True -> "active", False -> "archived"
        status_value = "active" if is_public else "archived"
        query = query.where(Document.status == status_value)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(Document.title.ilike(search_term))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Document.created_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    # Convert to Pydantic schemas to avoid DetachedInstanceError
    document_responses = [DocumentResponse.model_validate(doc) for doc in documents]
    
    return PaginatedResponse(
        items=document_responses,
        total=total,
        page=page,
        per_page=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{document_id}/download-url", response_model=dict)
async def generate_download_url(
    document_id: int,
    disposition: str = Query("inline", regex="^(inline|attachment)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
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
    user_roles = current_user.get("roles", [])
    if not any(role in ["super_admin", "support_admin"] for role in user_roles):
        # Non-admins can only download their own documents
        if document.uploaded_by != current_user["db_user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to download this document"
            )
    
    storage_service = get_storage_service()
    
    # Generate download URL
    # Use file_url since that's what exists in database
    try:
        download_data = storage_service.generate_download_url(
            file_path=document.file_url,
            expiration=3600,  # 1 hour
            disposition=disposition,
            filename=document.title or "document",  # Use title as filename
        )
    except FileNotFoundError:
        raise NotFoundError("File not found in storage")
    
    return {
        "download_url": download_data["download_url"],
        "expires_at": download_data["expires_at"],
        "filename": document.title or "document",
        "file_size": download_data["size"],
        "content_type": download_data["content_type"],
    }


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
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
    user_roles = current_user.get("roles", [])
    if not any(role in ["super_admin", "support_admin"] for role in user_roles) and document.uploader_id != current_user["db_user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own documents"
        )
    
    storage_service = get_storage_service()
    
    # Delete file from storage - use file_url
    storage_service.delete_file(document.file_url)
    
    # Delete metadata from database
    await db.delete(document)
    await db.commit()
    
    return SuccessResponse(message="Document deleted successfully")


# Document Requests (for official documents like transcripts)

@router.post("/requests", response_model=DocumentRequestResponse, status_code=201)
async def create_document_request(
    request_data: DocumentRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_student())
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
        student_id=current_user["db_user_id"],
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
    current_user: Dict[str, Any] = Depends(require_roles("student", "super_admin", "support_admin"))
):
    """
    List document requests.
    
    Access:
    - Admins can see all requests
    - Students can only see their own requests
    """
    query = select(DocumentRequest)
    
    # Students can only see their own requests
    user_roles = current_user.get("roles", [])
    if "student" in user_roles:
        query = query.where(DocumentRequest.student_id == current_user["db_user_id"])
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
        per_page=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.put("/requests/{request_id}", response_model=DocumentRequestResponse)
async def update_document_request(
    request_id: int,
    update_data: DocumentRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "support_admin"))
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
    current_user: Dict[str, Any] = Depends(require_admin())
):
    """
    Create a new announcement.
    
    Access: admin
    """
    announcement = Announcement(
        author_id=current_user["db_user_id"],
        title=announcement_data.title,
        content=announcement_data.content,
        target_audience=announcement_data.target_audience,
        is_published=announcement_data.is_published or False,
        publish_date=announcement_data.publish_date,
        expire_date=announcement_data.expire_date,
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
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    List announcements.
    
    Access: all authenticated users
    
    Returns published announcements visible to current user's role.
    """
    query = select(Announcement)
    
    # Non-admins can only see published announcements
    user_roles = current_user.get("roles", [])
    if not any(role in ["super_admin", "support_admin"] for role in user_roles):
        query = query.where(Announcement.is_published == True)
        
        # Filter by target audience - build conditions for each user role
        conditions = [Announcement.target_audience == "all"]
        for role in user_roles:
            conditions.append(Announcement.target_audience == role)
        query = query.where(or_(*conditions))
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
        per_page=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/reports/usage")
async def get_document_usage_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    campus: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Generate document usage report and export as CSV
    
    **Query Parameters:**
    - start_date: Start date for report (YYYY-MM-DD)
    - end_date: End date for report (YYYY-MM-DD)
    - campus: Filter by campus ID
    
    Returns CSV file with document usage statistics
    """
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    # Mock data for document usage report
    usage_data = [
        {
            'Document Type': 'Official Transcript',
            'Total Requests': 145,
            'Completed': 142,
            'Pending': 3,
            'Average Processing Days': 2.5,
            'Downloads': 567
        },
        {
            'Document Type': 'Enrollment Certificate',
            'Total Requests': 89,
            'Completed': 87,
            'Pending': 2,
            'Average Processing Days': 1.8,
            'Downloads': 234
        },
        {
            'Document Type': 'Grade Report',
            'Total Requests': 234,
            'Completed': 230,
            'Pending': 4,
            'Average Processing Days': 3.2,
            'Downloads': 789
        },
        {
            'Document Type': 'Degree Certificate',
            'Total Requests': 67,
            'Completed': 65,
            'Pending': 2,
            'Average Processing Days': 4.5,
            'Downloads': 134
        },
        {
            'Document Type': 'Course Materials',
            'Total Requests': 0,
            'Completed': 0,
            'Pending': 0,
            'Average Processing Days': 0,
            'Downloads': 2456
        }
    ]
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'Document Type', 'Total Requests', 'Completed', 'Pending', 
        'Average Processing Days', 'Downloads'
    ])
    
    writer.writeheader()
    for row in usage_data:
        writer.writerow(row)
    
    # Prepare response
    output.seek(0)
    filename = f"document_usage_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
