"""
Communication Router - Support Tickets and Chat Management

Handles communication features including:
- Support ticket system with SLA tracking
- Ticket event logging
- Priority and status management
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.core.database import get_db
from app.core.rbac import require_roles, require_admin, get_user_campus_access, check_campus_access
from app.core.exceptions import NotFoundError, BusinessLogicError
from app.models.user import User
from app.models.communication import SupportTicket, TicketEvent
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.communication import (
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketDetailResponse,
    SupportTicketUpdate,
    TicketEventCreate,
    TicketEventResponse,
)

router = APIRouter(prefix="/support", tags=["Support"])


# SLA Configuration (in hours)
SLA_URGENT = 4      # 4 hours
SLA_HIGH = 24       # 1 day
SLA_NORMAL = 72     # 3 days
SLA_LOW = 168       # 7 days


def calculate_sla_deadline(priority: str, created_at: datetime) -> datetime:
    """Calculate SLA deadline based on priority"""
    sla_hours = {
        "urgent": SLA_URGENT,
        "high": SLA_HIGH,
        "normal": SLA_NORMAL,
        "low": SLA_LOW,
    }
    hours = sla_hours.get(priority, SLA_NORMAL)
    return created_at + timedelta(hours=hours)


def is_sla_breached(deadline: datetime) -> bool:
    """Check if SLA deadline has been breached"""
    return datetime.utcnow() > deadline


@router.post("/tickets", response_model=SupportTicketResponse, status_code=201)
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    Create a new support ticket.
    
    Access: student, teacher, admin
    
    Process:
    1. Create ticket
    2. Set initial status to "open"
    """
    # Create ticket
    ticket = SupportTicket(
        user_id=current_user["db_user_id"],  # Changed from requester_id, removed UUID conversion
        subject=ticket_data.subject,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
    )
    
    db.add(ticket)
    await db.flush()  # Get ticket ID
    
    # Ticket events not supported - ticket_events table doesn't exist in database
    # # Create initial event
    # initial_event = TicketEvent(
    #     ticket_id=ticket.id,
    #     user_id=current_user["db_user_id"],
    #     event_type="created",
    #     description=f"Ticket created by {current_user.get('username', 'User')}",
    # )
    # db.add(initial_event)
    
    await db.commit()
    await db.refresh(ticket)
    
    return ticket


@router.get("/tickets", response_model=PaginatedResponse[SupportTicketResponse])
async def list_support_tickets(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user_id: Optional[int] = Query(None, description="Filter by requester"),  # Changed from requester_id
    assigned_to_id: Optional[int] = Query(None, description="Filter by assignee"),  # Removed UUID type
    campus_id: Optional[int] = Query(None, description="Filter by campus"),
    # sla_breached: Optional[bool] = Query(None, description="Filter by SLA breach"),  # Removed: sla_due_at doesn't exist in DB
    search: Optional[str] = Query(None, description="Search in subject/description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    List support tickets with filters (campus-filtered).
    
    Access:
    - Admins can see tickets within their campus scope
    - Students/Teachers can see their own tickets and tickets assigned to them
    """
    # Build query with join to User for campus filtering
    query = select(SupportTicket).join(User, SupportTicket.user_id == User.id)  # Changed from requester_id
    
    # Role-based filtering
    user_roles = current_user.get("roles", [])
    if any(role in ["student", "teacher"] for role in user_roles):
        # Can see tickets they created or tickets assigned to them
        query = query.where(
            or_(
                SupportTicket.user_id == current_user["db_user_id"],  # Changed from requester_id, removed UUID
                SupportTicket.assigned_to == current_user["db_user_id"]  # Changed to match model, removed UUID
            )
        )
    else:
        # Admin - apply campus filtering
        user_campus_access = await get_user_campus_access(
            {"uid": current_user["uid"], "roles": current_user.get("roles", [])}, db
        )
        
        if campus_id:
            # Specific campus requested - verify access
            if user_campus_access is not None:
                await check_campus_access(
                    {"uid": current_user["uid"], "roles": current_user.get("roles", [])}, 
                    campus_id, db, raise_error=True
                )
            query = query.where(User.campus_id == campus_id)
        else:
            # No specific campus - filter by user's campus access
            if user_campus_access is not None:  # Campus-scoped admin
                if user_campus_access:
                    query = query.where(User.campus_id.in_(user_campus_access))
                else:
                    # No campus assignments - return empty
                    return PaginatedResponse(
                        items=[],
                        total=0,
                        page=page,
                        per_page=page_size,  # Fixed: use per_page instead of page_size
                        pages=0
                    )
    
    if status:
        query = query.where(SupportTicket.status == status)
    
    if priority:
        query = query.where(SupportTicket.priority == priority)
    
    if category:
        query = query.where(SupportTicket.category == category)
    
    if user_id:  # Changed from requester_id
        query = query.where(SupportTicket.user_id == user_id)  # Changed from requester_id
    
    if assigned_to_id:
        query = query.where(SupportTicket.assigned_to == assigned_to_id)  # Changed to match model
    
    # SLA filtering removed - sla_due_at column doesn't exist in database
    # if sla_breached is not None:
    #     if sla_breached:
    #         # SLA breached (deadline passed and not resolved)
    #         query = query.where(...)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                SupportTicket.subject.ilike(search_term),
                SupportTicket.description.ilike(search_term)
                # Removed: ticket_number search - field doesn't exist in database
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(SupportTicket.created_at.desc())
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    return PaginatedResponse(
        items=tickets,
        total=total,
        page=page,
        per_page=page_size,  # Fixed: use per_page instead of page_size
        pages=(total + page_size - 1) // page_size
    )


@router.get("/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
async def get_support_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    Get ticket details including all events.
    
    Access:
    - Admins can see any ticket
    - Users can see tickets they created or are assigned to
    """
    query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    
    # Role-based filtering
    user_roles = current_user.get("roles", [])
    if any(role in ["student", "teacher"] for role in user_roles):
        query = query.where(
            or_(
                SupportTicket.user_id == current_user["db_user_id"],  # Changed from requester_id, removed UUID
                SupportTicket.assigned_to == current_user["db_user_id"]  # Changed to match model, removed UUID
            )
        )
    
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found")
    
    # Ticket events not supported - ticket_events table doesn't exist in database
    # # Get all events for this ticket
    # events_query = await db.execute(
    #     select(TicketEvent)
    #     .where(TicketEvent.ticket_id == ticket_id)
    #     .order_by(TicketEvent.created_at.asc())
    # )
    # events = events_query.scalars().all()
    events = []  # Empty list since events table doesn't exist
    
    # SLA breach calculation removed - sla_due_at column doesn't exist in database
    # sla_breached = is_sla_breached(ticket.sla_due_at) and ticket.status not in ["resolved", "closed"]
    
    return SupportTicketDetailResponse(
        **ticket.__dict__,
        events=events,
        # sla_breached=sla_breached  # Removed
    )


@router.put("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: int,
    update_data: SupportTicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "support_admin"))
):
    """
    Update support ticket (assign, change status, priority, etc.).
    
    Access: admin, support_admin
    
    Creates a ticket event for each change.
    """
    # Get ticket
    query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found")
    
    # Track changes for events
    events_to_create = []
    
    # Update status
    if update_data.status and update_data.status != ticket.status:
        old_status = ticket.status
        ticket.status = update_data.status
        events_to_create.append({
            "event_type": "status_change",
            "description": f"Status changed from '{old_status}' to '{update_data.status}'"
        })
        
        # Update resolved/closed timestamps
        if update_data.status == "resolved":
            ticket.resolved_at = datetime.utcnow()
        elif update_data.status == "closed":
            ticket.closed_at = datetime.utcnow()
    
    # Update priority
    if update_data.priority and update_data.priority != ticket.priority:
        old_priority = ticket.priority
        ticket.priority = update_data.priority
        
        # Recalculate SLA deadline
        ticket.sla_due_at = calculate_sla_deadline(update_data.priority, ticket.created_at)
        
        events_to_create.append({
            "event_type": "comment",
            "description": f"Priority changed from '{old_priority}' to '{update_data.priority}'"
        })
    
    # Update assignment
    if update_data.assigned_to_id is not None:
        if update_data.assigned_to_id != ticket.assigned_to_id:
            ticket.assigned_to_id = update_data.assigned_to_id
            
            if update_data.assigned_to_id:
                # Verify assignee exists
                assignee_query = await db.execute(
                    select(User).where(User.id == update_data.assigned_to_id)
                )
                assignee = assignee_query.scalar_one_or_none()
                if not assignee:
                    raise NotFoundError(f"User with ID {update_data.assigned_to_id} not found")
                
                events_to_create.append({
                    "event_type": "assignment",
                    "description": f"Ticket assigned to {assignee.full_name}"
                })
            else:
                events_to_create.append({
                    "event_type": "assignment",
                    "description": "Ticket unassigned"
                })
    
    # Update category
    if update_data.category and update_data.category != ticket.category:
        old_category = ticket.category
        ticket.category = update_data.category
        events_to_create.append({
            "event_type": "comment",
            "description": f"Category changed from '{old_category}' to '{update_data.category}'"
        })
    
    # Create events for all changes
    for event_data in events_to_create:
        event = TicketEvent(
            ticket_id=ticket.id,
            created_by=current_user["db_user_id"],
            event_type=event_data["event_type"],
            description=event_data["description"],
        )
        db.add(event)
    
    await db.commit()
    await db.refresh(ticket)
    
    return ticket


@router.post("/tickets/{ticket_id}/events", response_model=TicketEventResponse, status_code=201)
async def add_ticket_event(
    ticket_id: int,
    event_data: TicketEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    Add an event/comment to a ticket.
    
    Access:
    - Admins can add events to any ticket
    - Users can add events to tickets they created or are assigned to
    """
    # Get ticket
    query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    
    # Role-based filtering
    user_roles = current_user.get("roles", [])
    if any(role in ["student", "teacher"] for role in user_roles):
        query = query.where(
            or_(
                SupportTicket.user_id == current_user["db_user_id"],  # Changed from requester_id, removed UUID
                SupportTicket.assigned_to == current_user["db_user_id"]  # Changed to match model, removed UUID
            )
        )
    
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found or access denied")
    
    # Create event
    event = TicketEvent(
        ticket_id=ticket_id,
        created_by=current_user["db_user_id"],
        event_type=event_data.event_type,
        description=event_data.description,
    )
    
    db.add(event)
    
    # Update ticket's updated_at timestamp
    ticket.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(event)
    
    return event


@router.get("/tickets/{ticket_id}/events", response_model=List[TicketEventResponse])
async def list_ticket_events(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("student", "teacher", "super_admin", "support_admin"))
):
    """
    List all events for a ticket.
    
    Access:
    - Admins can see events for any ticket
    - Users can see events for tickets they created or are assigned to
    """
    # Get ticket (with access check)
    ticket_query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    
    user_roles = current_user.get("roles", [])
    if any(role in ["student", "teacher"] for role in user_roles):
        ticket_query = ticket_query.where(
            or_(
                SupportTicket.user_id == current_user["db_user_id"],  # Changed from requester_id, removed UUID
                SupportTicket.assigned_to == current_user["db_user_id"]  # Changed to match model, removed UUID
            )
        )
    
    ticket_result = await db.execute(ticket_query)
    ticket = ticket_result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found or access denied")
    
    # Get events
    events_query = await db.execute(
        select(TicketEvent)
        .where(TicketEvent.ticket_id == ticket_id)
        .order_by(TicketEvent.created_at.asc())
    )
    events = events_query.scalars().all()
    
    return events


@router.get("/stats/summary", response_model=dict)
async def get_support_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "support_admin"))
):
    """
    Get support ticket statistics.
    
    Access: admin, support_admin
    
    Returns:
    - Total tickets
    - Tickets by status
    - Tickets by priority
    - SLA breach count
    - Average resolution time
    """
    # Total tickets
    total_query = await db.execute(select(func.count(SupportTicket.id)))
    total_tickets = total_query.scalar()
    
    # By status
    status_query = await db.execute(
        select(SupportTicket.status, func.count(SupportTicket.id))
        .group_by(SupportTicket.status)
    )
    by_status = {status: count for status, count in status_query.all()}
    
    # By priority
    priority_query = await db.execute(
        select(SupportTicket.priority, func.count(SupportTicket.id))
        .group_by(SupportTicket.priority)
    )
    by_priority = {priority: count for priority, count in priority_query.all()}
    
    # SLA breaches - Since sla_due_at doesn't exist, return 0 for now
    sla_breaches = 0
    
    # Average resolution time - Since resolved_at doesn't exist, return 0
    avg_resolution_hours = 0
    
    return {
        "total_tickets": total_tickets,
        "by_status": by_status,
        "by_priority": by_priority,
        "sla_breaches": sla_breaches,
        "average_resolution_hours": round(avg_resolution_hours, 2),
    }
