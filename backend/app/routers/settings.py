"""
System settings management endpoints
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import json

from app.core.database import get_db
from app.core.rbac import require_roles
from app.core.security import verify_firebase_token
from app.models.settings import SystemSetting
from app.schemas.settings import SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse
from app.schemas.base import PaginatedResponse
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.post("/", response_model=SystemSettingResponse, status_code=201)
async def create_setting(
    setting_data: SystemSettingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin"))
):
    """
    Create a new system setting
    
    Access: super_admin only
    """
    # Check if key already exists
    existing_query = select(SystemSetting).where(SystemSetting.key == setting_data.key)
    existing = (await db.execute(existing_query)).scalar_one_or_none()
    
    if existing:
        raise ValidationError(f"Setting with key '{setting_data.key}' already exists")
    
    # Create setting
    setting = SystemSetting(
        **setting_data.model_dump(),
        updated_by=current_user.get("db_user_id")
    )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    return setting


@router.get("/", response_model=PaginatedResponse[SystemSettingResponse])
async def list_settings(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_public: Optional[bool] = Query(None, description="Filter by public flag"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    List system settings
    
    Access:
    - Public settings: all authenticated users
    - Private settings: super_admin only
    """
    query = select(SystemSetting)
    
    # Non-admins can only see public settings
    user_roles = current_user.get("roles", [])
    if "super_admin" not in user_roles:
        query = query.where(SystemSetting.is_public == True)
    
    # Apply filters
    if category:
        query = query.where(SystemSetting.category == category)
    
    if is_public is not None:
        query = query.where(SystemSetting.is_public == is_public)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(SystemSetting.category, SystemSetting.key)
    
    result = await db.execute(query)
    settings = result.scalars().all()
    
    pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=settings,
        total=total,
        page=page,
        per_page=page_size,
        pages=pages
    )


@router.get("/{setting_id}", response_model=SystemSettingResponse)
async def get_setting(
    setting_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get a specific setting by ID
    
    Access:
    - Public settings: all authenticated users
    - Private settings: super_admin only
    """
    query = select(SystemSetting).where(SystemSetting.id == setting_id)
    setting = (await db.execute(query)).scalar_one_or_none()
    
    if not setting:
        raise NotFoundError("Setting", setting_id)
    
    # Check access
    user_roles = current_user.get("roles", [])
    if not setting.is_public and "super_admin" not in user_roles:
        raise NotFoundError("Setting", setting_id)
    
    return setting


@router.get("/key/{key}", response_model=SystemSettingResponse)
async def get_setting_by_key(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get a specific setting by key
    
    Access:
    - Public settings: all authenticated users
    - Private settings: super_admin only
    """
    query = select(SystemSetting).where(SystemSetting.key == key)
    setting = (await db.execute(query)).scalar_one_or_none()
    
    if not setting:
        raise NotFoundError("Setting", key)
    
    # Check access
    user_roles = current_user.get("roles", [])
    if not setting.is_public and "super_admin" not in user_roles:
        raise NotFoundError("Setting", key)
    
    return setting


@router.put("/{setting_id}", response_model=SystemSettingResponse)
async def update_setting(
    setting_id: int,
    update_data: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin"))
):
    """
    Update a system setting
    
    Access: super_admin only
    """
    query = select(SystemSetting).where(SystemSetting.id == setting_id)
    setting = (await db.execute(query)).scalar_one_or_none()
    
    if not setting:
        raise NotFoundError(f"Setting with ID {setting_id} not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(setting, field, value)
    
    setting.updated_by = current_user.get("db_user_id")
    
    await db.commit()
    await db.refresh(setting)
    
    return setting


@router.delete("/{setting_id}")
async def delete_setting(
    setting_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin"))
):
    """
    Delete a system setting
    
    Access: super_admin only
    """
    query = select(SystemSetting).where(SystemSetting.id == setting_id)
    setting = (await db.execute(query)).scalar_one_or_none()
    
    if not setting:
        raise NotFoundError("Setting", setting_id)
    
    await db.delete(setting)
    await db.commit()
    
    return {"message": f"Setting '{setting.key}' deleted successfully"}


@router.get("/category/{category}", response_model=PaginatedResponse[SystemSettingResponse])
async def get_settings_by_category(
    category: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get all settings in a category
    
    Access:
    - Public settings: all authenticated users
    - Private settings: super_admin only
    """
    query = select(SystemSetting).where(SystemSetting.category == category)
    
    # Non-admins can only see public settings
    user_roles = current_user.get("roles", [])
    if "super_admin" not in user_roles:
        query = query.where(SystemSetting.is_public == True)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(SystemSetting.key)
    
    result = await db.execute(query)
    settings = result.scalars().all()
    
    pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=settings,
        total=total,
        page=page,
        per_page=page_size,
        pages=pages
    )


@router.post("/bulk-update")
async def bulk_update_settings(
    settings: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin"))
):
    """
    Bulk update multiple settings by key
    
    Access: super_admin only
    
    Body: { "key1": "value1", "key2": "value2", ... }
    """
    updated_count = 0
    errors = []
    
    for key, value in settings.items():
        try:
            query = select(SystemSetting).where(SystemSetting.key == key)
            setting = (await db.execute(query)).scalar_one_or_none()
            
            if setting:
                setting.value = value
                setting.updated_by = current_user.get("db_user_id")
                updated_count += 1
            else:
                errors.append(f"Setting '{key}' not found")
        except Exception as e:
            errors.append(f"Error updating '{key}': {str(e)}")
    
    await db.commit()
    
    return {
        "updated": updated_count,
        "errors": errors if errors else None
    }
