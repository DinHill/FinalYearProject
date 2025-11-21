"""
Announcement endpoints - CRUD operations for announcements
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles, require_admin
from app.models.document import Announcement
from app.schemas.base import PaginatedResponse, SuccessResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ============================================================================
# Schemas
# ============================================================================

class AnnouncementCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str  # Rich HTML content
    target_audience: str = Field(default="all")
    is_published: bool = Field(default=False)
    publish_date: Optional[datetime] = None
    expire_date: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    target_audience: Optional[str] = None
    is_published: Optional[bool] = None
    publish_date: Optional[datetime] = None
    expire_date: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: Optional[int] = None
    target_audience: str
    is_published: bool
    publish_date: Optional[datetime]
    expire_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# CRUD Endpoints
# ============================================================================

@router.get("", response_model=PaginatedResponse[AnnouncementResponse])
async def list_announcements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_published: Optional[bool] = Query(None),
    target_audience: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse[AnnouncementResponse]:
    """
    List announcements with filters
    - Students see only published announcements
    - Admins see all announcements
    """
    query = select(Announcement)
    
    # Students can only see published announcements
    if current_user.get('role') not in ['super_admin', 'academic_admin']:
        query = query.where(Announcement.is_published == True)
        # Also check expiry date
        query = query.where(
            or_(
                Announcement.expire_date == None,
                Announcement.expire_date > datetime.utcnow()
            )
        )
    else:
        # Admin filters
        if is_published is not None:
            query = query.where(Announcement.is_published == is_published)
    
    if target_audience:
        query = query.where(Announcement.target_audience == target_audience)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Announcement.title.ilike(search_pattern),
                Announcement.content.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Apply pagination and ordering
    query = query.order_by(Announcement.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    announcements = result.scalars().all()
    
    total_count = total or 0
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    
    return PaginatedResponse(
        items=[AnnouncementResponse.model_validate(a) for a in announcements],
        total=total_count,
        page=page,
        per_page=page_size,
        pages=total_pages
    )


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement_by_id(
    announcement_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """Get single announcement by ID"""
    announcement = await db.get(Announcement, announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Students can only view published announcements
    if current_user.get('role') not in ['super_admin', 'academic_admin']:
        if not announcement.is_published:
            raise HTTPException(status_code=403, detail="Access denied")
        if announcement.expire_date and announcement.expire_date < datetime.utcnow():
            raise HTTPException(status_code=404, detail="Announcement expired")
    
    return AnnouncementResponse.model_validate(announcement)


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """Create new announcement (admin only)"""
    announcement = Announcement(
        **announcement_data.model_dump(),
        author_id=current_user['db_user_id']
    )
    
    db.add(announcement)
    await db.commit()
    await db.refresh(announcement)
    
    logger.info(f"Created announcement {announcement.id}: {announcement.title}")
    return AnnouncementResponse.model_validate(announcement)


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """Update announcement (admin only)"""
    announcement = await db.get(Announcement, announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Update fields
    update_data = announcement_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(announcement, key, value)
    
    await db.commit()
    await db.refresh(announcement)
    
    logger.info(f"Updated announcement {announcement_id} by user {current_user['db_user_id']}")
    return AnnouncementResponse.model_validate(announcement)


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Delete announcement (admin only)"""
    announcement = await db.get(Announcement, announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    await db.delete(announcement)
    await db.commit()
    
    logger.info(f"Deleted announcement {announcement_id} by user {current_user['db_user_id']}")
    return None


@router.post("/{announcement_id}/publish", response_model=AnnouncementResponse)
async def publish_announcement(
    announcement_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """Publish announcement (admin only)"""
    announcement = await db.get(Announcement, announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_published = True
    if not announcement.publish_date:
        announcement.publish_date = datetime.utcnow()
    
    await db.commit()
    await db.refresh(announcement)
    
    logger.info(f"Published announcement {announcement_id}")
    return AnnouncementResponse.model_validate(announcement)


@router.post("/{announcement_id}/unpublish", response_model=AnnouncementResponse)
async def unpublish_announcement(
    announcement_id: int,
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin")),
    db: AsyncSession = Depends(get_db)
) -> AnnouncementResponse:
    """Unpublish announcement (admin only)"""
    announcement = await db.get(Announcement, announcement_id)
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_published = False
    
    await db.commit()
    await db.refresh(announcement)
    
    logger.info(f"Unpublished announcement {announcement_id}")
    return AnnouncementResponse.model_validate(announcement)
