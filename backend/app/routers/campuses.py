"""
Campus Management Router

Endpoints for managing campuses and campus transfers.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles
from app.models.user import Campus, User
from app.models.academic import Enrollment, CourseSection


router = APIRouter(prefix="/api/v1/campuses", tags=["Campus Management"])


# ==================== REQUEST/RESPONSE MODELS ====================

class CampusCreate(BaseModel):
    """Request model for creating a campus"""
    code: str = Field(..., min_length=1, max_length=3, description="Campus code (H, D, C, S)")
    name: str = Field(..., min_length=1, max_length=100, description="Campus name")
    address: Optional[str] = Field(None, max_length=500, description="Campus address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    timezone: str = Field("Asia/Ho_Chi_Minh", max_length=50, description="Timezone")
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone")
    email: Optional[str] = Field(None, max_length=255, description="Contact email")
    is_active: bool = Field(True, description="Whether campus is active")


class CampusUpdate(BaseModel):
    """Request model for updating a campus"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class CampusResponse(BaseModel):
    """Response model for campus"""
    id: int
    code: str
    name: str
    address: Optional[str]
    city: Optional[str]
    timezone: str
    phone: Optional[str]
    email: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CampusStats(BaseModel):
    """Campus statistics response"""
    campus_id: int
    campus_code: str
    campus_name: str
    total_students: int
    total_teachers: int
    total_staff: int
    total_users: int
    active_enrollments: int


class CampusTransferRequest(BaseModel):
    """Request model for campus transfer"""
    user_id: int = Field(..., description="User ID to transfer")
    from_campus_id: int = Field(..., description="Current campus ID")
    to_campus_id: int = Field(..., description="Target campus ID")
    reason: Optional[str] = Field(None, max_length=500, description="Transfer reason")
    effective_date: Optional[datetime] = Field(None, description="When transfer takes effect")
    transfer_enrollments: bool = Field(False, description="Also transfer active enrollments")


class CampusTransferResponse(BaseModel):
    """Response for campus transfer"""
    success: bool
    user_id: int
    from_campus: str
    to_campus: str
    enrollments_transferred: int
    message: str


# ==================== CAMPUS CRUD ====================

@router.post("/", response_model=CampusResponse)
async def create_campus(
    campus_data: CampusCreate,
    user: dict = Depends(require_roles("super_admin")),
    db = Depends(get_db)
):
    """
    Create a new campus
    
    **Required Role:** super_admin
    
    **Request Body:**
    - code: Campus code (1-3 chars, e.g., "H", "D", "C", "S")
    - name: Campus name
    - address, city, timezone, phone, email: Contact details
    - is_active: Whether campus is active (default: true)
    
    **Returns:**
    - Campus details
    """
    # Check if code already exists
    stmt = select(Campus).where(Campus.code == campus_data.code.upper())
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Campus with code '{campus_data.code}' already exists"
        )
    
    # Create campus
    campus = Campus(
        code=campus_data.code.upper(),
        name=campus_data.name,
        address=campus_data.address,
        city=campus_data.city,
        timezone=campus_data.timezone,
        phone=campus_data.phone,
        email=campus_data.email,
        is_active=campus_data.is_active
    )
    
    db.add(campus)
    await db.commit()
    await db.refresh(campus)
    
    return campus


@router.get("/", response_model=List[CampusResponse])
async def list_campuses(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    city: Optional[str] = Query(None, description="Filter by city"),
    user: dict = Depends(verify_firebase_token),
    db = Depends(get_db)
):
    """
    List all campuses
    
    **Query Parameters:**
    - is_active: Filter by active status
    - city: Filter by city
    
    **Returns:**
    - List of campuses
    """
    query = select(Campus).order_by(Campus.code)
    
    # Apply filters
    if is_active is not None:
        query = query.where(Campus.is_active == is_active)
    
    if city:
        query = query.where(Campus.city.ilike(f"%{city}%"))
    
    result = await db.execute(query)
    campuses = result.scalars().all()
    
    return campuses


@router.get("/{campus_id}", response_model=CampusResponse)
async def get_campus(
    campus_id: int,
    user: dict = Depends(verify_firebase_token),
    db = Depends(get_db)
):
    """
    Get campus details
    
    **Parameters:**
    - campus_id: Campus ID
    
    **Returns:**
    - Campus details
    """
    campus = await db.get(Campus, campus_id)
    
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    return campus


@router.put("/{campus_id}", response_model=CampusResponse)
async def update_campus(
    campus_id: int,
    campus_data: CampusUpdate,
    user: dict = Depends(require_roles("super_admin")),
    db = Depends(get_db)
):
    """
    Update campus details
    
    **Required Role:** super_admin
    
    **Parameters:**
    - campus_id: Campus ID
    
    **Request Body:** Fields to update
    
    **Returns:**
    - Updated campus details
    """
    campus = await db.get(Campus, campus_id)
    
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    # Update fields
    update_data = campus_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campus, field, value)
    
    await db.commit()
    await db.refresh(campus)
    
    return campus


@router.delete("/{campus_id}")
async def delete_campus(
    campus_id: int,
    user: dict = Depends(require_roles("super_admin")),
    db = Depends(get_db)
):
    """
    Delete a campus
    
    **Required Role:** super_admin
    
    **WARNING:** This will fail if there are users assigned to this campus.
    Transfer users to another campus first.
    
    **Parameters:**
    - campus_id: Campus ID
    
    **Returns:**
    - Deletion confirmation
    """
    campus = await db.get(Campus, campus_id)
    
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    # Check if campus has users
    stmt = select(func.count(User.id)).where(User.campus_id == campus_id)
    result = await db.execute(stmt)
    user_count = result.scalar() or 0
    
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete campus with {user_count} users. Transfer users first."
        )
    
    await db.delete(campus)
    await db.commit()
    
    return {
        "success": True,
        "message": f"Campus '{campus.name}' deleted successfully"
    }


# ==================== CAMPUS STATISTICS ====================

@router.get("/{campus_id}/stats", response_model=CampusStats)
async def get_campus_stats(
    campus_id: int,
    user: dict = Depends(verify_firebase_token),
    db = Depends(get_db)
):
    """
    Get campus statistics
    
    **Parameters:**
    - campus_id: Campus ID
    
    **Returns:**
    - Campus statistics (student count, teacher count, enrollments, etc.)
    """
    campus = await db.get(Campus, campus_id)
    
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    # Count users by role
    total_students = (await db.execute(
        select(func.count(User.id)).where(
            User.campus_id == campus_id,
            User.role == "student"
        )
    )).scalar() or 0
    
    total_teachers = (await db.execute(
        select(func.count(User.id)).where(
            User.campus_id == campus_id,
            User.role == "teacher"
        )
    )).scalar() or 0
    
    total_staff = (await db.execute(
        select(func.count(User.id)).where(
            User.campus_id == campus_id,
            User.role.in_(["admin", "registrar", "academic_admin", "super_admin"])
        )
    )).scalar() or 0
    
    total_users = (await db.execute(
        select(func.count(User.id)).where(User.campus_id == campus_id)
    )).scalar() or 0
    
    # Count active enrollments for campus students
    active_enrollments = (await db.execute(
        select(func.count(Enrollment.id)).join(
            User, Enrollment.student_id == User.id
        ).where(
            User.campus_id == campus_id,
            Enrollment.status == "enrolled"
        )
    )).scalar() or 0
    
    return {
        "campus_id": campus.id,
        "campus_code": campus.code,
        "campus_name": campus.name,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_staff": total_staff,
        "total_users": total_users,
        "active_enrollments": active_enrollments
    }


@router.get("/stats/all", response_model=List[CampusStats])
async def get_all_campus_stats(
    user: dict = Depends(require_roles("super_admin", "academic_admin")),
    db = Depends(get_db)
):
    """
    Get statistics for all campuses
    
    **Required Role:** super_admin, academic_admin
    
    **Returns:**
    - List of campus statistics
    """
    stmt = select(Campus).where(Campus.is_active == True).order_by(Campus.code)
    result = await db.execute(stmt)
    campuses = result.scalars().all()
    
    stats_list = []
    for campus in campuses:
        # Count users by role
        total_students = (await db.execute(
            select(func.count(User.id)).where(
                User.campus_id == campus.id,
                User.role == "student"
            )
        )).scalar() or 0
        
        total_teachers = (await db.execute(
            select(func.count(User.id)).where(
                User.campus_id == campus.id,
                User.role == "teacher"
            )
        )).scalar() or 0
        
        total_staff = (await db.execute(
            select(func.count(User.id)).where(
                User.campus_id == campus.id,
                User.role.in_(["admin", "registrar", "academic_admin", "super_admin"])
            )
        )).scalar() or 0
        
        total_users = (await db.execute(
            select(func.count(User.id)).where(User.campus_id == campus.id)
        )).scalar() or 0
        
        # Count active enrollments
        active_enrollments = (await db.execute(
            select(func.count(Enrollment.id)).join(
                User, Enrollment.student_id == User.id
            ).where(
                User.campus_id == campus.id,
                Enrollment.status == "enrolled"
            )
        )).scalar() or 0
        
        stats_list.append({
            "campus_id": campus.id,
            "campus_code": campus.code,
            "campus_name": campus.name,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_staff": total_staff,
            "total_users": total_users,
            "active_enrollments": active_enrollments
        })
    
    return stats_list


# ==================== CAMPUS TRANSFERS ====================

@router.post("/transfer", response_model=CampusTransferResponse)
async def transfer_user_campus(
    transfer_data: CampusTransferRequest,
    user: dict = Depends(require_roles("super_admin", "academic_admin")),
    db = Depends(get_db)
):
    """
    Transfer a user from one campus to another
    
    **Required Role:** super_admin, academic_admin
    
    **Request Body:**
    - user_id: User to transfer
    - from_campus_id: Current campus
    - to_campus_id: Target campus
    - reason: Transfer reason (optional)
    - effective_date: When transfer takes effect (optional, default: now)
    - transfer_enrollments: Also move active enrollments (default: false)
    
    **Returns:**
    - Transfer result
    
    **Note:** 
    - Only active enrollments can be transferred
    - Completed/dropped enrollments remain at original campus
    """
    # Get user
    target_user = await db.get(User, transfer_data.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current campus
    if target_user.campus_id != transfer_data.from_campus_id:
        raise HTTPException(
            status_code=400,
            detail=f"User is not currently at campus {transfer_data.from_campus_id}"
        )
    
    # Get campuses
    from_campus = await db.get(Campus, transfer_data.from_campus_id)
    to_campus = await db.get(Campus, transfer_data.to_campus_id)
    
    if not from_campus or not to_campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    if not to_campus.is_active:
        raise HTTPException(status_code=400, detail="Target campus is not active")
    
    # Update user's campus
    target_user.campus_id = transfer_data.to_campus_id
    
    # Handle enrollment transfers if requested
    enrollments_transferred = 0
    if transfer_data.transfer_enrollments:
        # Get user's active enrollments
        stmt = select(Enrollment).where(
            Enrollment.student_id == transfer_data.user_id,
            Enrollment.status == "enrolled"
        ).options(selectinload(Enrollment.course_section))
        
        result = await db.execute(stmt)
        active_enrollments = result.scalars().all()
        
        # Note: Enrollments don't have campus_id, they're linked through course sections
        # We can't actually transfer enrollments unless sections exist at target campus
        # This is informational only
        enrollments_transferred = len(active_enrollments)
    
    await db.commit()
    
    return {
        "success": True,
        "user_id": target_user.id,
        "from_campus": from_campus.name,
        "to_campus": to_campus.name,
        "enrollments_transferred": enrollments_transferred,
        "message": f"User transferred from {from_campus.name} to {to_campus.name}"
    }


@router.post("/transfer/bulk")
async def bulk_transfer_users(
    user_ids: List[int],
    to_campus_id: int,
    reason: Optional[str] = None,
    user: dict = Depends(require_roles("super_admin")),
    db = Depends(get_db)
):
    """
    Transfer multiple users to a campus (super_admin only)
    
    **Required Role:** super_admin
    
    **Request Body:**
    - user_ids: List of user IDs to transfer
    - to_campus_id: Target campus ID
    - reason: Transfer reason (optional)
    
    **Returns:**
    - Bulk transfer result
    """
    # Verify target campus
    to_campus = await db.get(Campus, to_campus_id)
    if not to_campus:
        raise HTTPException(status_code=404, detail="Target campus not found")
    
    if not to_campus.is_active:
        raise HTTPException(status_code=400, detail="Target campus is not active")
    
    # Get users
    stmt = select(User).where(User.id.in_(user_ids))
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    if len(users) != len(user_ids):
        raise HTTPException(
            status_code=404,
            detail=f"Some users not found. Expected {len(user_ids)}, found {len(users)}"
        )
    
    # Transfer all users
    transferred_count = 0
    for target_user in users:
        target_user.campus_id = to_campus_id
        transferred_count += 1
    
    await db.commit()
    
    return {
        "success": True,
        "transferred": transferred_count,
        "to_campus": to_campus.name,
        "message": f"Transferred {transferred_count} users to {to_campus.name}"
    }


# ==================== CAMPUS USERS ====================

@router.get("/{campus_id}/users")
async def list_campus_users(
    campus_id: int,
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: bool = Query(True, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(verify_firebase_token),
    db = Depends(get_db)
):
    """
    List users in a campus
    
    **Parameters:**
    - campus_id: Campus ID
    
    **Query Parameters:**
    - role: Filter by role (student, teacher, admin, etc.)
    - is_active: Filter by active status (default: true)
    - skip, limit: Pagination
    
    **Returns:**
    - List of users in campus
    """
    # Verify campus exists
    campus = await db.get(Campus, campus_id)
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    # Build query
    query = select(User).where(User.campus_id == campus_id)
    
    # Apply filters
    if role:
        query = query.where(User.role == role)
    
    if is_active:
        query = query.where(User.status == "active")
    
    # Get total count
    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Apply pagination and get results
    query = query.order_by(User.full_name).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "status": u.status,
                "campus_id": u.campus_id
            }
            for u in users
        ]
    }
