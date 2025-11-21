"""
File Management Router
Handles file uploads, document library, and version control
Uses local filesystem storage (can be upgraded to S3/Azure Blob)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import logging
import os
import shutil
import uuid
from pathlib import Path

from app.core.database import get_db
from app.models import Document, DocumentRequest
from app.models.user import User
from app.core.security import verify_firebase_token, require_roles

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["File Management"])

# Configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif',
    'zip', 'rar', '7z'
}

# ============================================================================
# Request/Response Models
# ============================================================================
# ============================================================================
# Request/Response Models
# ============================================================================

class FileMetadata(BaseModel):
    id: int
    filename: Optional[str] = None
    original_filename: str
    file_size: int
    mime_type: str
    category: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: int
    uploaded_by_name: str
    uploaded_at: Optional[str] = None
    download_count: int
    is_public: bool
    version: int
    parent_file_id: Optional[int] = None
    tags: List[str] = []

class FileUploadResponse(BaseModel):
    success: bool
    file_id: int
    filename: str
    file_url: str
    file_size: int
    message: str

class FileListResponse(BaseModel):
    files: List[FileMetadata]
    total: int
    page: int
    page_size: int
    total_pages: int

class FileVersionInfo(BaseModel):
    id: int
    version: int
    filename: str
    file_size: int
    uploaded_by_name: str
    uploaded_at: str
    is_current: bool
    uploaded_by_name: str
    uploaded_at: str
    is_current: bool

# ============================================================================
# Helper Functions
# ============================================================================

def get_file_extension(filename: str) -> str:
    """Extract file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename to prevent collisions"""
    ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}" if ext else unique_id

def get_file_path(filename: str) -> Path:
    """Get full file path"""
    return UPLOAD_DIR / filename

def validate_file(filename: str, file_size: int) -> tuple[bool, Optional[str]]:
    """Validate file extension and size"""
    ext = get_file_extension(filename)
    
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type '.{ext}' is not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File size ({file_size / 1024 / 1024:.2f}MB) exceeds maximum allowed size ({MAX_FILE_SIZE / 1024 / 1024}MB)"
    
    return True, None

def get_mime_type(filename: str) -> str:
    """Get MIME type based on extension"""
    ext = get_file_extension(filename)
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed'
    }
    return mime_types.get(ext, 'application/octet-stream')

async def create_document_record(
    db: AsyncSession,
    filename: str,
    original_filename: str,
    file_size: int,
    mime_type: str,
    category: str,
    description: Optional[str],
    user_id: int,
    is_public: bool,
    parent_file_id: Optional[int] = None
) -> Document:
    """Create document database record"""
    
    # Determine version number
    version = 1
    if parent_file_id:
        # This is a new version of existing file
        stmt = select(func.max(Document.version)).where(
            or_(
                Document.id == parent_file_id,
                Document.parent_file_id == parent_file_id
            )
        )
        result = await db.execute(stmt)
        max_version = result.scalar()
        version = (max_version or 0) + 1
    
    document = Document(
        title=original_filename,
        filename=filename,
        file_size=file_size,
        mime_type=mime_type,
        category=category,
        description=description,
        uploaded_by=user_id,
        version=version,
        parent_file_id=parent_file_id,
        status='approved',  # Auto-approve uploaded files
        is_public=is_public
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document

# ============================================================================
# Endpoints
# ============================================================================

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Query(..., description="File category: academic, administrative, financial, etc."),
    description: Optional[str] = Query(None, description="File description"),
    is_public: bool = Query(False, description="Whether file is publicly accessible"),
    parent_file_id: Optional[int] = Query(None, description="Parent file ID for versioning"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Upload a file to the system.
    Supports versioning by providing parent_file_id.
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Validate
        is_valid, error_msg = validate_file(file.filename, file_size)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(file.filename)
        file_path = get_file_path(unique_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Get MIME type
        mime_type = get_mime_type(file.filename)
        
        # Create database record
        user_id = current_user['user_id']
        document = await create_document_record(
            db,
            unique_filename,
            file.filename,
            file_size,
            mime_type,
            category,
            description,
            user_id,
            is_public,
            parent_file_id
        )
        
        logger.info(f"File uploaded: {file.filename} -> {unique_filename} by user {user_id}")
        
        return FileUploadResponse(
            success=True,
            file_id=document.id,
            filename=unique_filename,
            file_url=f"/api/v1/files/{document.id}/download",
            file_size=file_size,
            message=f"File uploaded successfully{' (new version)' if parent_file_id else ''}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        # Clean up file if database operation failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/library", response_model=FileListResponse)
async def get_file_library(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    uploaded_by: Optional[int] = None,
    is_public: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get paginated list of files in the document library.
    Supports filtering by category, uploader, and search.
    """
    try:
        # Build query
        stmt = (
            select(Document, User)
            .join(User, Document.uploaded_by == User.id)
            .where(Document.parent_file_id.is_(None))  # Only show current versions
        )
        
        # Apply filters
        filters = []
        if category:
            filters.append(Document.category == category)
        if uploaded_by:
            filters.append(Document.uploaded_by == uploaded_by)
        if is_public is not None:
            filters.append(Document.is_public == is_public)
        if search:
            search_filter = or_(
                Document.title.ilike(f'%{search}%'),
                Document.description.ilike(f'%{search}%')
            )
            filters.append(search_filter)
        
        if filters:
            stmt = stmt.where(and_(*filters))
        
        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Apply pagination
        stmt = stmt.order_by(desc(Document.uploaded_at))
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Format response
        files = []
        for document, user in rows:
            files.append(FileMetadata(
                id=document.id,
                filename=document.filename,
                original_filename=document.title,
                file_size=document.file_size,
                mime_type=document.mime_type,
                category=document.category,
                description=document.description,
                uploaded_by=document.uploaded_by,
                uploaded_by_name=user.full_name,
                uploaded_at=document.uploaded_at.isoformat() if document.uploaded_at else None,
                download_count=document.download_count or 0,
                is_public=document.is_public,
                version=document.version,
                parent_file_id=document.parent_file_id,
                tags=[]  # TODO: Implement tagging system
            ))
        
        return FileListResponse(
            files=files,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )
        
    except Exception as e:
        logger.error(f"Error fetching file library: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Download a file by ID.
    Increments download counter.
    """
    try:
        # Get document
        stmt = select(Document).where(Document.id == file_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check permissions (for private files)
        if not document.is_public:
            user_role = current_user.get('role', 'student')
            if user_role not in ['super_admin', 'academic_admin', 'support_admin']:
                # Only allow owner to download private files
                if document.uploaded_by != current_user['user_id']:
                    raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if file exists
        file_path = get_file_path(document.filename)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Increment download count
        document.download_count = (document.download_count or 0) + 1
        await db.commit()
        
        # Return file
        return FileResponse(
            path=str(file_path),
            filename=document.title,
            media_type=document.mime_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}/versions", response_model=List[FileVersionInfo])
async def get_file_versions(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get all versions of a file.
    Returns version history with metadata.
    """
    try:
        # Get the file (could be parent or child)
        stmt = select(Document).where(Document.id == file_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Determine parent ID
        parent_id = document.parent_file_id if document.parent_file_id else file_id
        
        # Get all versions (parent + children)
        stmt = (
            select(Document, User)
            .join(User, Document.uploaded_by == User.id)
            .where(
                or_(
                    Document.id == parent_id,
                    Document.parent_file_id == parent_id
                )
            )
            .order_by(desc(Document.version))
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        # Find current version (highest version number)
        current_version = max(doc.version for doc, _ in rows) if rows else 1
        
        # Format response
        versions = []
        for doc, user in rows:
            versions.append(FileVersionInfo(
                id=doc.id,
                version=doc.version,
                filename=doc.title,
                file_size=doc.file_size,
                uploaded_by_name=user.full_name,
                uploaded_at=doc.uploaded_at.isoformat() if doc.uploaded_at else (doc.created_at.isoformat() if hasattr(doc, 'created_at') and doc.created_at else ''),
                is_current=(doc.version == current_version)
            ))
        
        return versions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching file versions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{file_id}/info", response_model=FileMetadata)
async def get_file_info(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """Get detailed information about a file"""
    try:
        stmt = (
            select(Document, User)
            .join(User, Document.uploaded_by == User.id)
            .where(Document.id == file_id)
        )
        result = await db.execute(stmt)
        row = result.first()
        
        if not row:
            raise HTTPException(status_code=404, detail="File not found")
        
        document, user = row
        
        return FileMetadata(
            id=document.id,
            filename=document.filename,
            original_filename=document.title,
            file_size=document.file_size,
            mime_type=document.mime_type,
            category=document.category,
            description=document.description,
            uploaded_by=document.uploaded_by,
            uploaded_by_name=user.full_name,
            uploaded_at=document.uploaded_at.isoformat() if document.uploaded_at else None,
            download_count=document.download_count or 0,
            is_public=document.is_public,
            version=document.version,
            parent_file_id=document.parent_file_id,
            tags=[]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching file info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    delete_versions: bool = Query(False, description="Also delete all versions"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(['super_admin', 'academic_admin', 'support_admin']))
):
    """
    Delete a file and optionally all its versions.
    Only admins can delete files.
    """
    try:
        # Get document
        stmt = select(Document).where(Document.id == file_id)
        result = await db.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="File not found")
        
        files_to_delete = [document]
        
        if delete_versions:
            # Get all versions
            parent_id = document.parent_file_id if document.parent_file_id else file_id
            version_stmt = select(Document).where(
                or_(
                    Document.id == parent_id,
                    Document.parent_file_id == parent_id
                )
            )
            version_result = await db.execute(version_stmt)
            files_to_delete = version_result.scalars().all()
        
        # Delete files from disk and database
        deleted_count = 0
        for doc in files_to_delete:
            file_path = get_file_path(doc.filename)
            if file_path.exists():
                file_path.unlink()
            await db.delete(doc)
            deleted_count += 1
        
        await db.commit()
        
        logger.info(f"Deleted {deleted_count} file(s) by user {current_user['user_id']}")
        
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} file(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_file_categories(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """Get list of all file categories with counts"""
    try:
        stmt = (
            select(
                Document.category,
                func.count(Document.id).label('count')
            )
            .where(Document.parent_file_id.is_(None))
            .group_by(Document.category)
            .order_by(desc('count'))
        )
        
        result = await db.execute(stmt)
        categories = result.all()
        
        return {
            "categories": [
                {"name": cat, "count": count}
                for cat, count in categories
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




