"""
Bulk operations endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from app.core.database import get_db
from app.core.rbac import require_roles
from app.models import User, Course, Enrollment
from app.models.academic import SectionSchedule, Grade, Attendance
from app.models import Document, Announcement, Notification
from typing import Dict, Any, List
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bulk", tags=["Bulk Operations"])


# ============================================================================
# Request/Response Models
# ============================================================================

from pydantic import root_validator


class BulkUpdateRequest(BaseModel):
    ids: List[int] = []
    user_ids: List[int] = []
    enrollment_ids: List[int] = []
    grade_ids: List[int] = []
    notification_ids: List[int] = []
    updates: Dict[str, Any] = {}

    @root_validator(pre=True)
    def collect_ids(cls, values):
        # Normalize various possible id fields used across clients/tests into `ids`
        ids = values.get("ids") or []
        for key in ("user_ids", "enrollment_ids", "grade_ids", "notification_ids"):
            if key in values and values.get(key):
                ids.extend(values.get(key))
        values["ids"] = ids
        return values


class BulkDeleteRequest(BaseModel):
    ids: List[int] = []
    user_ids: List[int] = []
    enrollment_ids: List[int] = []
    grade_ids: List[int] = []
    notification_ids: List[int] = []

    @root_validator(pre=True)
    def collect_ids(cls, values):
        ids = values.get("ids") or []
        for key in ("user_ids", "enrollment_ids", "grade_ids", "notification_ids"):
            if key in values and values.get(key):
                ids.extend(values.get(key))
        values["ids"] = ids
        return values

class BulkOperationResponse(BaseModel):
    success: bool
    affected_count: int
    success_count: int = 0
    total: int = 0
    message: str
    failed_ids: List[int] = []


# ============================================================================
# User Bulk Operations
# ============================================================================

@router.post("/users/update", response_model=BulkOperationResponse)
async def bulk_update_users(
    request: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin"))
):
    """
    Bulk update users
    
    Access: super_admin, academic_admin
    
    Example updates:
    - {"status": "active"}
    - {"role": "teacher"}
    - {"campus_id": 1}
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    # Validate updates (only allow safe fields)
    allowed_fields = {"status", "role", "campus_id", "major_id", "is_active"}
    invalid_fields = set(request.updates.keys()) - allowed_fields
    if invalid_fields:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            message=f"Invalid fields: {', '.join(invalid_fields)}",
            failed_ids=[]
        )
    
    try:
        # Perform bulk update
        stmt = update(User).where(User.id.in_(request.ids)).values(**request.updates)
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)
        
        logger.info(f"Bulk updated {affected_count} users by user {current_user.get('email')}")
        
        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully updated {affected_count} user(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk update users failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/delete", response_model=BulkOperationResponse)
async def bulk_delete_users(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin"))
):
    """
    Bulk delete users (soft delete by setting status to 'deleted')
    
    Access: super_admin only
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    try:
        # Soft delete by updating status
        stmt = update(User).where(User.id.in_(request.ids)).values(status="deleted")
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk deleted {affected_count} users by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully deleted {affected_count} user(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk delete users failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Enrollment Bulk Operations
# ============================================================================

@router.post("/enrollments/update", response_model=BulkOperationResponse)
async def bulk_update_enrollments(
    request: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin"))
):
    """
    Bulk update enrollments
    
    Access: super_admin, academic_admin
    
    Example updates:
    - {"status": "approved"}
    - {"approval_status": "approved"}
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    allowed_fields = {"status", "approval_status", "grade"}
    invalid_fields = set(request.updates.keys()) - allowed_fields
    if invalid_fields:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            message=f"Invalid fields: {', '.join(invalid_fields)}",
            failed_ids=[]
        )
    
    try:
        stmt = update(Enrollment).where(Enrollment.id.in_(request.ids)).values(**request.updates)
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk updated {affected_count} enrollments by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully updated {affected_count} enrollment(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk update enrollments failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enrollments/delete", response_model=BulkOperationResponse)
async def bulk_delete_enrollments(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin"))
):
    """
    Bulk delete enrollments
    
    Access: super_admin, academic_admin
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    try:
        stmt = delete(Enrollment).where(Enrollment.id.in_(request.ids))
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk deleted {affected_count} enrollments by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully deleted {affected_count} enrollment(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk delete enrollments failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Grade Bulk Operations
# ============================================================================

@router.post("/grades/update", response_model=BulkOperationResponse)
async def bulk_update_grades(
    request: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin", "teacher"))
):
    """
    Bulk update grades
    
    Access: super_admin, academic_admin, teacher
    
    Example updates:
    - {"approval_status": "published"}
    - {"status": "published"}
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    allowed_fields = {"approval_status", "status", "score", "max_score", "feedback"}
    invalid_fields = set(request.updates.keys()) - allowed_fields
    if invalid_fields:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            message=f"Invalid fields: {', '.join(invalid_fields)}",
            failed_ids=[]
        )
    
    try:
        # Normalize allowed update keys to actual Grade column names
        key_map = {
            "score": "grade_value",
            "max_score": "max_grade",
            "component": "assignment_name",
            # keep direct mappings for approval_status/status/feedback
        }
        normalized_updates = {}
        for k, v in request.updates.items():
            normalized_updates[key_map.get(k, k)] = v

        stmt = update(Grade).where(Grade.id.in_(request.ids)).values(**normalized_updates)
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk updated {affected_count} grades by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully updated {affected_count} grade(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk update grades failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grades/delete", response_model=BulkOperationResponse)
async def bulk_delete_grades(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin"))
):
    """
    Bulk delete grades
    
    Access: super_admin, academic_admin
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    try:
        stmt = delete(Grade).where(Grade.id.in_(request.ids))
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk deleted {affected_count} grades by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully deleted {affected_count} grade(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk delete grades failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Notification Bulk Operations
# ============================================================================

@router.post("/notifications/delete", response_model=BulkOperationResponse)
async def bulk_delete_notifications(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin", "support_admin"))
):
    """
    Bulk delete notifications
    
    Access: super_admin, academic_admin, support_admin
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    try:
        stmt = delete(Notification).where(Notification.id.in_(request.ids))
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk deleted {affected_count} notifications by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully deleted {affected_count} notification(s)",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk delete notifications failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/mark-read", response_model=BulkOperationResponse)
async def bulk_mark_notifications_read(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "academic_admin", "support_admin"))
):
    """
    Bulk mark notifications as read
    
    Access: super_admin, academic_admin, support_admin
    """
    if not request.ids:
        return BulkOperationResponse(
            success=False,
            affected_count=0,
            success_count=0,
            total=0,
            message="No IDs provided",
            failed_ids=[]
        )
    
    try:
        stmt = update(Notification).where(Notification.id.in_(request.ids)).values(is_read=True)
        result = await db.execute(stmt)
        await db.commit()
        
        affected_count = result.rowcount
        total = len(request.ids)

        logger.info(f"Bulk marked {affected_count} notifications as read by user {current_user.get('email')}")

        return BulkOperationResponse(
            success=True,
            affected_count=affected_count,
            success_count=affected_count,
            total=total,
            message=f"Successfully marked {affected_count} notification(s) as read",
            failed_ids=[]
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk mark notifications read failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
