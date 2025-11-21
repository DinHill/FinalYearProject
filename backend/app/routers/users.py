"""
User management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.core.rbac import require_roles, require_admin, get_user_campus_access, check_campus_access, require_teacher_or_admin
from app.core.firebase import FirebaseService
from app.core.exceptions import NotFoundError, ValidationError
from app.models import User, Campus, Major
from app.models.academic import CourseSection, Course, Semester
from app.models.audit import AuditLog
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
        logger.info(f"Creating user with data: {user_data.model_dump()}")
        
        # Get campus and major info by business key codes
        campus = None
        major = None
        
        if user_data.campus_code:
            campus_result = await db.execute(select(Campus).where(Campus.code == user_data.campus_code.upper()))
            campus = campus_result.scalar_one_or_none()
            if not campus:
                raise NotFoundError("Campus", user_data.campus_code)
        
        if user_data.major_code:
            major_result = await db.execute(select(Major).where(Major.code == user_data.major_code.upper()))
            major = major_result.scalar_one_or_none()
            if not major:
                raise NotFoundError("Major", user_data.major_code)
        
        # Generate username
        if user_data.role == "student":
            if not campus or not major:
                raise ValidationError("Students must have campus and major")
            
            try:
                username = await UsernameGenerator.generate_student_username(
                    db=db,
                    full_name=user_data.full_name,
                    major_code=major.code,
                    campus_code=campus.code,
                    year_entered=user_data.year_entered
                )
            except ValueError as e:
                raise ValidationError(str(e))
        elif user_data.role == "teacher":
            if not campus:
                raise ValidationError("Teachers must have campus")
            
            try:
                username = await UsernameGenerator.generate_teacher_username(
                    db=db,
                    full_name=user_data.full_name,
                    campus_code=campus.code
                )
            except ValueError as e:
                raise ValidationError(str(e))
        else:
            if not campus:
                raise ValidationError("Admin/staff must have campus")
            
            try:
                username = await UsernameGenerator.generate_staff_username(
                    db=db,
                    full_name=user_data.full_name,
                    campus_code=campus.code,
                    role=user_data.role
                )
            except ValueError as e:
                raise ValidationError(str(e))
        
        # Generate Greenwich email for Firebase authentication
        firebase_email = UsernameGenerator.generate_email(username, user_data.role)
        
        # Determine initial status and Firebase sync
        firebase_uid = None
        if user_data.auto_approve:
            # Auto-approved: Create in Firebase immediately
            try:
                firebase_user = FirebaseService.create_user(
                    email=firebase_email,  # Use Greenwich email for Firebase
                    password=user_data.password if user_data.password else username,  # Default password = username
                    display_name=user_data.full_name
                )
                firebase_uid = firebase_user.uid
                initial_status = 'active'
            except Exception as e:
                logger.error(f"Failed to create Firebase user: {e}")
                raise ValidationError(f"Failed to create Firebase user: {str(e)}")
        else:
            # Not auto-approved: Create as pending (no Firebase sync yet)
            initial_status = 'pending'
            logger.info(f"Creating user {username} in pending status (awaiting approval)")
        
        # Create PostgreSQL user
        db_user = User(
            firebase_uid=firebase_uid,  # Will be None if pending
            username=username,
            email=user_data.email,  # Store personal email (can be None)
            full_name=user_data.full_name,
            role=user_data.role,
            status=initial_status,  # 'active' if auto-approved, 'pending' if not
            campus_id=campus.id if campus else None,  # Use ID from looked-up campus
            major_id=major.id if major else None,    # Use ID from looked-up major
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
        
        # Set Firebase custom claims (only if user was created in Firebase)
        if firebase_uid:
            custom_claims = {
                "role": user_data.role,
                "campus": campus.code if campus else None,
                "major": major.code if major else None,
                "db_user_id": db_user.id,
                "username": username
            }
            
            if user_data.role == "admin" and hasattr(user_data, 'admin_type') and user_data.admin_type:
                custom_claims["admin_type"] = user_data.admin_type
            
            FirebaseService.set_custom_user_claims(firebase_uid, custom_claims)
        
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
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )
        
    except (NotFoundError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"User creation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"  # Show actual error for debugging
        )


@router.post(
    "/{user_id}/approve",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve pending user",
    description="Approve a pending user, creating their Firebase account and setting status to active"
)
async def approve_user(
    user_id: int,
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """
    Approve a pending user by:
    1. Creating their Firebase account
    2. Updating their status from 'pending' to 'active'
    3. Setting Firebase custom claims
    
    **Admin-only endpoint**
    """
    try:
        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id))
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        
        # Check if user is pending
        if db_user.status != 'pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is not pending (current status: {db_user.status})"
            )
        
        # Create Firebase user
        try:
            firebase_user = FirebaseService.create_user(
                email=db_user.email,
                password=db_user.username,  # Use username as default password
                display_name=db_user.full_name
            )
            firebase_uid = firebase_user.uid
        except Exception as e:
            logger.error(f"Failed to create Firebase user during approval: {e}")
            raise ValidationError(f"Failed to create Firebase user: {str(e)}")
        
        # Update user status and firebase_uid
        db_user.firebase_uid = firebase_uid
        db_user.status = 'active'
        
        await db.commit()
        await db.refresh(db_user)
        
        # Set Firebase custom claims
        campus = await db.get(Campus, db_user.campus_id) if db_user.campus_id else None
        major = await db.get(Major, db_user.major_id) if db_user.major_id else None
        
        custom_claims = {
            "role": db_user.role,
            "campus": campus.code if campus else None,
            "major": major.code if major else None,
            "db_user_id": db_user.id,
            "username": db_user.username
        }
        
        FirebaseService.set_custom_user_claims(firebase_uid, custom_claims)
        
        logger.info(f"Approved user: {db_user.username} (ID: {user_id})")
        
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
            profile_picture_url=db_user.avatar_url,  # Fixed: User model has avatar_url
            # bio=db_user.bio,  # User model doesn't have bio field
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User approval error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve user: {str(e)}"
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
        # Build query with relationships loaded
        query = select(User).options(
            selectinload(User.campus),
            selectinload(User.major)
        )
        
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
                        items=[],
                        total=0,
                        page=pagination.page,
                        per_page=pagination.page_size,
                        pages=0
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
                gender=user.gender,
                campus=user.campus,  # Include nested campus object
                major=user.major,    # Include nested major object
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ]
        
        return PaginatedResponse(
            items=user_responses,
            total=total,
            page=pagination.page,
            per_page=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
        
    except Exception as e:
        logger.error(f"List users error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )


# ============================================================================
# User Statistics (must come BEFORE /{user_id} to avoid route conflicts)
# ============================================================================

@router.get(
    "/status-counts",
    summary="Get user status statistics",
    description="Get count of users by status (admin only)"
)
async def get_status_counts(
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, int]:
    """
    Get user counts grouped by status
    
    **Admin only**
    
    Returns counts for:
    - active: Active users
    - pending: Pending approval
    - inactive: Inactive users
    - suspended: Suspended users
    - total: Total users
    """
    try:
        # Query to count users by status
        result = await db.execute(
            select(
                User.status,
                func.count(User.id).label('count')
            ).group_by(User.status)
        )
        
        status_counts = {row.status: row.count for row in result}
        
        # Get total count
        total_result = await db.execute(select(func.count(User.id)))
        total = total_result.scalar() or 0
        
        # Return all status types with 0 for missing ones
        return {
            "active": status_counts.get("active", 0),
            "pending": status_counts.get("pending", 0),
            "inactive": status_counts.get("inactive", 0),
            "suspended": status_counts.get("suspended", 0),
            "total": total
        }
    except Exception as e:
        logger.error(f"Error getting status counts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve status counts"
        )


@router.get(
    "/role-counts",
    summary="Get user role statistics",
    description="Get count of users by role (admin only)"
)
async def get_role_counts(
    current_user: Dict[str, Any] = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, int]:
    """
    Get user counts grouped by role
    
    **Admin only**
    
    Returns counts for:
    - student: Student users
    - teacher: Teacher users
    - admin: Admin users (all types)
    - total: Total users
    """
    try:
        # Query to count users by role
        result = await db.execute(
            select(
                User.role,
                func.count(User.id).label('count')
            ).group_by(User.role)
        )
        
        role_counts = {row.role: row.count for row in result}
        
        # Get total count
        total_result = await db.execute(select(func.count(User.id)))
        total = total_result.scalar() or 0
        
        # Combine all admin types into one count
        admin_count = (
            role_counts.get("super_admin", 0) +
            role_counts.get("academic_admin", 0) +
            role_counts.get("finance_admin", 0) +
            role_counts.get("support_admin", 0)
        )
        
        # Return role counts
        return {
            "student": role_counts.get("student", 0),
            "teacher": role_counts.get("teacher", 0),
            "admin": admin_count,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error getting role counts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role counts"
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
    # Load user with relationships
    query = select(User).where(User.id == user_id).options(
        selectinload(User.campus),
        selectinload(User.major)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
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
        gender=user.gender,
        campus=user.campus,  # Include nested campus object
        major=user.major,    # Include nested major object
        created_at=user.created_at,
        updated_at=user.updated_at
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
        gender=user.gender,
        created_at=user.created_at,
        updated_at=user.updated_at
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
    
    # Store old status for audit log
    old_status = user.status
    username = user.username
    user_email = user.email
    
    user.status = "inactive"
    
    # Create audit log entry
    audit_log = AuditLog(
        user_id=current_user.get("uid"),
        user_name=current_user.get("name"),
        user_email=current_user.get("email"),
        action="UPDATE",
        entity="User",
        entity_id=str(user_id),
        description=f"Deactivated user '{username}' (changed status from '{old_status}' to 'inactive')",
        status="success",
        ip_address=None,  # Can be extracted from request if needed
        user_agent=None,
        extra_data={
            "user_id": user_id,
            "username": username,
            "user_email": user_email,
            "old_status": old_status,
            "new_status": "inactive"
        }
    )
    db.add(audit_log)
    
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
    try:
        logger.info("Fetching campuses from database...")
        result = await db.execute(select(Campus).order_by(Campus.id))
        campuses = result.scalars().all()
        logger.info(f"Found {len(campuses)} campuses")
        
        campus_responses = []
        for campus in campuses:
            try:
                campus_response = CampusResponse(
                    id=campus.id,
                    code=campus.code,
                    name=campus.name,
                    city=campus.city,
                    is_active=campus.is_active,
                    created_at=campus.created_at
                )
                campus_responses.append(campus_response)
                logger.debug(f"✓ Campus {campus.id}: {campus.name}")
            except Exception as e:
                logger.error(f"✗ Failed to serialize campus {campus.id}: {e}")
                raise
        
        logger.info(f"Successfully returning {len(campus_responses)} campuses")
        return campus_responses
    except Exception as e:
        logger.error(f"Error in list_campuses: {type(e).__name__}: {e}")
        raise


@router.get(
    "/majors",
    response_model=List[MajorResponse],
    tags=["Majors"],
    dependencies=[]  # Explicitly no auth required - public endpoint
)
async def list_majors(
    db: AsyncSession = Depends(get_db)
) -> List[MajorResponse]:
    """Get all majors (public endpoint - no authentication required)"""
    result = await db.execute(select(Major).order_by(Major.id))
    majors = result.scalars().all()
    
    return [
        MajorResponse(
            id=major.id,
            code=major.code,
            name=major.name,
            degree_type=None,  # Field doesn't exist in database yet
            credits_required=120,  # Default value
            is_active=major.is_active,
            created_at=major.created_at
        )
        for major in majors
    ]


@router.get(
    "/{user_id}/teaching-sections",
    status_code=status.HTTP_200_OK,
    summary="Get teacher's course sections",
    description="Get all course sections taught by a teacher"
)
async def get_teacher_sections(
    user_id: int,
    current_user: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Get all course sections taught by a teacher"""
    
    # Verify user is a teacher
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.role != 'teacher':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is not a teacher"
        )
    
    # Get all sections taught by this teacher
    query = (
        select(CourseSection)
        .where(CourseSection.teacher_id == user_id)
        .options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.semester)
        )
        .order_by(CourseSection.semester_id.desc(), CourseSection.section_code)
    )
    
    result = await db.execute(query)
    sections = result.scalars().all()
    
    # Format response
    return {
        "success": True,
        "data": [
            {
                "id": section.id,
                "section_code": section.section_code,
                "course": {
                    "id": section.course.id,
                    "code": section.course.course_code,
                    "name": section.course.name,
                    "credits": section.course.credits
                } if section.course else None,
                "semester": {
                    "id": section.semester.id,
                    "code": section.semester.code,
                    "name": section.semester.name,
                    "academic_year": section.semester.academic_year
                } if section.semester else None,
                "max_students": section.max_students,
                "enrolled_count": section.enrolled_count,
                "schedule": section.schedule,
                "room": section.room,
                "status": section.status
            }
            for section in sections
        ],
        "total": len(sections)
    }
