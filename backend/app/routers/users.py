"""
User management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles, require_admin, get_user_campus_access, check_campus_access, require_teacher_or_admin
from app.core.firebase import FirebaseService
from app.core.exceptions import NotFoundError, ValidationError
from app.models import User, Campus, Major
from app.services.username_generator import UsernameGenerator
from app.schemas.user import UserCreate, UserUpdate, UserResponse, CampusResponse, MajorResponse
from app.schemas.base import PaginatedResponse, SuccessResponse, PaginationParams
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


# ============================================================================
# User CRUD Operations (Admin Only)
# ============================================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user",
    description="Create a new user (student, teacher, or admin). Requires admin role."
)
async def create_user(
    user_data: UserCreate,
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """
    Create new user with auto-generated username
    
    **Admin only**
    
    Steps:
    1. Generate username based on role
    2. Create Firebase user
    3. Create PostgreSQL user record
    4. Set custom claims in Firebase
    """
    try:
        # Get campus and major info
        campus = await db.get(Campus, user_data.campus_id) if user_data.campus_id else None
        major = await db.get(Major, user_data.major_id) if user_data.major_id else None
        
        if user_data.campus_id and not campus:
            raise NotFoundError("Campus", user_data.campus_id)
        
        if user_data.major_id and not major:
            raise NotFoundError("Major", user_data.major_id)
        
        # Generate username
        if user_data.role == "student":
            if not campus or not major:
                raise ValidationError("Students must have campus and major")
            
            username = await UsernameGenerator.generate_student_username(
                db=db,
                full_name=user_data.full_name,
                major_code=major.code,
                campus_code=campus.code,
                year_entered=user_data.year_entered
            )
        elif user_data.role == "teacher":
            if not campus:
                raise ValidationError("Teachers must have campus")
            
            username = await UsernameGenerator.generate_teacher_username(
                db=db,
                full_name=user_data.full_name,
                campus_code=campus.code
            )
        else:
            if not campus:
                raise ValidationError("Admin/staff must have campus")
            
            username = await UsernameGenerator.generate_staff_username(
                db=db,
                full_name=user_data.full_name,
                campus_code=campus.code,
                role=user_data.role
            )
        
        # Generate email
        email = UsernameGenerator.generate_email(username, user_data.role)
        
        # Create Firebase user
        try:
            firebase_user = FirebaseService.create_user(
                email=email,
                password=user_data.password if user_data.password else username,  # Default password = username
                display_name=user_data.full_name
            )
            firebase_uid = firebase_user.uid
        except Exception as e:
            logger.error(f"Failed to create Firebase user: {e}")
            raise ValidationError(f"Failed to create Firebase user: {str(e)}")
        
        # Create PostgreSQL user
        db_user = User(
            firebase_uid=firebase_uid,
            username=username,
            email=email,
            full_name=user_data.full_name,
            role=user_data.role,
            status=user_data.status,
            campus_id=user_data.campus_id,
            major_id=user_data.major_id,
            year_entered=user_data.year_entered,
            phone_number=user_data.phone_number,
            date_of_birth=user_data.date_of_birth,
            gender=user_data.gender
        )
        
        # Set password hash if provided
        if user_data.password:
            from app.core.security import SecurityUtils
            db_user.password_hash = SecurityUtils.hash_password(user_data.password)
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        # Set Firebase custom claims
        custom_claims = {
            "role": user_data.role,
            "campus": campus.code if campus else None,
            "major": major.code if major else None,
            "db_user_id": db_user.id,
            "username": username
        }
        
        if user_data.role == "admin" and user_data.admin_type:
            custom_claims["admin_type"] = user_data.admin_type
        
        FirebaseService.set_custom_claims(firebase_uid, custom_claims)
        
        logger.info(f"Created user: {username} (role: {user_data.role})")
        
        return UserResponse(
            id=db_user.id,
            firebase_uid=db_user.firebase_uid,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            role=db_user.role,
            status=db_user.status,
            campus_id=db_user.campus_id,
            major_id=db_user.major_id,
            year_entered=db_user.year_entered,
            phone_number=db_user.phone_number,
            date_of_birth=db_user.date_of_birth,
            gender=db_user.gender,
            created_at=db_user.created_at
        )
        
    except (NotFoundError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"User creation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get(
    "",
    response_model=PaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List users",
    description="Get paginated list of users with optional filters (campus-filtered)"
)
async def list_users(
    pagination: PaginationParams = Depends(),
    role: Optional[str] = Query(None, description="Filter by role"),
    campus_id: Optional[int] = Query(None, description="Filter by campus"),
    major_id: Optional[int] = Query(None, description="Filter by major"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name, username, or email"),
    current_user: Dict[str, Any] = Depends(require_teacher_or_admin()),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse:
    """
    List users with filters and pagination (campus-filtered)
    
    **Admin and Teacher access - see only users within their campus scope**
    """
    try:
        # Build query
        query = select(User)
        
        # Apply campus filtering
        user_campus_access = await get_user_campus_access(current_user, db)
        
        # Apply filters
        conditions = []
        if role:
            conditions.append(User.role == role)
        if major_id:
            conditions.append(User.major_id == major_id)
        if status_filter:
            conditions.append(User.status == status_filter)
        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    User.full_name.ilike(search_term),
                    User.username.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        # Handle campus filtering
        if campus_id:
            # Specific campus requested - verify access
            if user_campus_access is not None:
                await check_campus_access(current_user, campus_id, db, raise_error=True)
            conditions.append(User.campus_id == campus_id)
        else:
            # No specific campus - filter by user's campus access
            if user_campus_access is not None:  # Campus-scoped user
                if user_campus_access:
                    conditions.append(User.campus_id.in_(user_campus_access))
                else:
                    # No campus assignments - return empty
                    return PaginatedResponse(
                        data=[],
                        pagination={
                            "page": pagination.page,
                            "page_size": pagination.page_size,
                            "total": 0,
                            "total_pages": 0
                        }
                    )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count()).select_from(User)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
        query = query.order_by(User.created_at.desc())
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Convert to response
        user_responses = [
            UserResponse(
                id=user.id,
                firebase_uid=user.firebase_uid,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                status=user.status,
                campus_id=user.campus_id,
                major_id=user.major_id,
                year_entered=user.year_entered,
                phone_number=user.phone_number,
                date_of_birth=user.date_of_birth,
                gender=getattr(user, 'gender', None),
                created_at=user.created_at
            )
            for user in users
        ]
        
        return PaginatedResponse(
            data=user_responses,
            pagination={
                "page": pagination.page,
                "page_size": pagination.page_size,
                "total": total,
                "total_pages": (total + pagination.page_size - 1) // pagination.page_size
            }
        )
        
    except Exception as e:
        logger.error(f"List users error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
    description="Get user details by ID"
)
async def get_user(
    user_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Get user by ID"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse(
        id=user.id,
        firebase_uid=user.firebase_uid,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        campus_id=user.campus_id,
        major_id=user.major_id,
        year_entered=user.year_entered,
        phone_number=user.phone_number,
        date_of_birth=user.date_of_birth,
        gender=getattr(user, 'gender', None),
        created_at=user.created_at
    )


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user",
    description="Update user information (admin only)"
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Update user"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"Updated user: {user.username}")
    
    return UserResponse(
        id=user.id,
        firebase_uid=user.firebase_uid,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        campus_id=user.campus_id,
        major_id=user.major_id,
        year_entered=user.year_entered,
        phone_number=user.phone_number,
        date_of_birth=user.date_of_birth,
        gender=getattr(user, 'gender', None),
        created_at=user.created_at
    )


@router.delete(
    "/{user_id}",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete user",
    description="Soft delete user (set status to inactive)"
)
async def delete_user(
    user_id: int,
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse:
    """Soft delete user"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.status = "inactive"
    await db.commit()
    
    logger.info(f"Deleted user: {user.username}")
    
    return SuccessResponse(
        success=True,
        message=f"User {user.username} has been deactivated"
    )


# ============================================================================
# Campus and Major Management
# ============================================================================

@router.get(
    "/campuses",
    response_model=List[CampusResponse],
    tags=["Campuses"]
)
async def list_campuses(
    db: AsyncSession = Depends(get_db)
) -> List[CampusResponse]:
    """Get all campuses (public endpoint)"""
    result = await db.execute(select(Campus).order_by(Campus.id))
    campuses = result.scalars().all()
    
    return [
        CampusResponse(
            id=campus.id,
            code=campus.code,
            name=campus.name,
            address=campus.address,
            created_at=campus.created_at
        )
        for campus in campuses
    ]


@router.get(
    "/majors",
    response_model=List[MajorResponse],
    tags=["Majors"]
)
async def list_majors(
    db: AsyncSession = Depends(get_db)
) -> List[MajorResponse]:
    """Get all majors (public endpoint)"""
    result = await db.execute(select(Major).order_by(Major.id))
    majors = result.scalars().all()
    
    return [
        MajorResponse(
            id=major.id,
            code=major.code,
            name=major.name,
            description=major.description,
            created_at=major.created_at
        )
        for major in majors
    ]
