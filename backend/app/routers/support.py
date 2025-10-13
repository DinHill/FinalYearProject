"""
Communication Router - Support Tickets and Chat Management

Handles communication features including:
- Support ticket system with SLA tracking
- Ticket event logging
- Priority and status management
"""

from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.core.database import get_db
from app.core.security import require_roles
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
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    Create a new support ticket.
    
    Access: student, teacher, admin
    
    Process:
    1. Create ticket with auto-assigned ticket number
    2. Set initial status to "open"
    3. Calculate SLA deadline based on priority
    4. Create initial ticket event
    """
    # Generate ticket number
    # Format: TICKET-YYYYMMDD-XXXX
    today = datetime.utcnow()
    date_str = today.strftime("%Y%m%d")
    
    # Get count of tickets created today
    count_query = await db.execute(
        select(func.count(SupportTicket.id)).where(
            func.date(SupportTicket.created_at) == today.date()
        )
    )
    daily_count = count_query.scalar() or 0
    ticket_number = f"TICKET-{date_str}-{daily_count + 1:04d}"
    
    # Calculate SLA deadline
    sla_deadline = calculate_sla_deadline(ticket_data.priority, today)
    
    # Create ticket
    ticket = SupportTicket(
        ticket_number=ticket_number,
        requester_id=current_user.id,
        subject=ticket_data.subject,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        sla_deadline=sla_deadline,
    )
    
    db.add(ticket)
    await db.flush()  # Get ticket ID
    
    # Create initial event
    initial_event = TicketEvent(
        ticket_id=ticket.id,
        user_id=current_user.id,
        event_type="created",
        description=f"Ticket created by {current_user.full_name}",
    )
    db.add(initial_event)
    
    await db.commit()
    await db.refresh(ticket)
    
    return ticket


@router.get("/tickets", response_model=PaginatedResponse[SupportTicketResponse])
async def list_support_tickets(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by category"),
    requester_id: Optional[UUID] = Query(None, description="Filter by requester"),
    assigned_to_id: Optional[UUID] = Query(None, description="Filter by assignee"),
    sla_breached: Optional[bool] = Query(None, description="Filter by SLA breach"),
    search: Optional[str] = Query(None, description="Search in subject/description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    List support tickets with filters.
    
    Access:
    - Admins can see all tickets
    - Students/Teachers can see their own tickets and tickets assigned to them
    """
    query = select(SupportTicket)
    
    # Role-based filtering
    if current_user.role in ["student", "teacher"]:
        # Can see tickets they created or tickets assigned to them
        query = query.where(
            or_(
                SupportTicket.requester_id == current_user.id,
                SupportTicket.assigned_to_id == current_user.id
            )
        )
    
    if status:
        query = query.where(SupportTicket.status == status)
    
    if priority:
        query = query.where(SupportTicket.priority == priority)
    
    if category:
        query = query.where(SupportTicket.category == category)
    
    if requester_id:
        query = query.where(SupportTicket.requester_id == requester_id)
    
    if assigned_to_id:
        query = query.where(SupportTicket.assigned_to_id == assigned_to_id)
    
    if sla_breached is not None:
        if sla_breached:
            # SLA breached (deadline passed and not resolved)
            query = query.where(
                and_(
                    SupportTicket.sla_deadline < datetime.utcnow(),
                    SupportTicket.status.in_(["open", "in_progress", "waiting"])
                )
            )
        else:
            # SLA not breached
            query = query.where(
                or_(
                    SupportTicket.sla_deadline >= datetime.utcnow(),
                    SupportTicket.status.in_(["resolved", "closed"])
                )
            )
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                SupportTicket.subject.ilike(search_term),
                SupportTicket.description.ilike(search_term),
                SupportTicket.ticket_number.ilike(search_term)
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
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
async def get_support_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    Get ticket details including all events.
    
    Access:
    - Admins can see any ticket
    - Users can see tickets they created or are assigned to
    """
    query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    
    # Role-based filtering
    if current_user.role in ["student", "teacher"]:
        query = query.where(
            or_(
                SupportTicket.requester_id == current_user.id,
                SupportTicket.assigned_to_id == current_user.id
            )
        )
    
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found")
    
    # Get all events for this ticket
    events_query = await db.execute(
        select(TicketEvent)
        .where(TicketEvent.ticket_id == ticket_id)
        .order_by(TicketEvent.created_at.asc())
    )
    events = events_query.scalars().all()
    
    # Check if SLA breached
    sla_breached = is_sla_breached(ticket.sla_deadline) and ticket.status not in ["resolved", "closed"]
    
    return SupportTicketDetailResponse(
        **ticket.__dict__,
        events=events,
        sla_breached=sla_breached
    )


@router.put("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: int,
    update_data: SupportTicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "support_admin"]))
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
            "event_type": "status_changed",
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
        ticket.sla_deadline = calculate_sla_deadline(update_data.priority, ticket.created_at)
        
        events_to_create.append({
            "event_type": "priority_changed",
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
                    "event_type": "assigned",
                    "description": f"Ticket assigned to {assignee.full_name}"
                })
            else:
                events_to_create.append({
                    "event_type": "unassigned",
                    "description": "Ticket unassigned"
                })
    
    # Update category
    if update_data.category and update_data.category != ticket.category:
        old_category = ticket.category
        ticket.category = update_data.category
        events_to_create.append({
            "event_type": "category_changed",
            "description": f"Category changed from '{old_category}' to '{update_data.category}'"
        })
    
    # Create events for all changes
    for event_data in events_to_create:
        event = TicketEvent(
            ticket_id=ticket.id,
            user_id=current_user.id,
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
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
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
    if current_user.role in ["student", "teacher"]:
        query = query.where(
            or_(
                SupportTicket.requester_id == current_user.id,
                SupportTicket.assigned_to_id == current_user.id
            )
        )
    
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise NotFoundError(f"Support ticket with ID {ticket_id} not found or access denied")
    
    # Create event
    event = TicketEvent(
        ticket_id=ticket_id,
        user_id=current_user.id,
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
    current_user: User = Depends(require_roles(["student", "teacher", "admin"]))
):
    """
    List all events for a ticket.
    
    Access:
    - Admins can see events for any ticket
    - Users can see events for tickets they created or are assigned to
    """
    # Get ticket (with access check)
    ticket_query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    
    if current_user.role in ["student", "teacher"]:
        ticket_query = ticket_query.where(
            or_(
                SupportTicket.requester_id == current_user.id,
                SupportTicket.assigned_to_id == current_user.id
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
    current_user: User = Depends(require_roles(["admin", "support_admin"]))
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
    
    # SLA breaches
    sla_breach_query = await db.execute(
        select(func.count(SupportTicket.id))
        .where(
            and_(
                SupportTicket.sla_deadline < datetime.utcnow(),
                SupportTicket.status.in_(["open", "in_progress", "waiting"])
            )
        )
    )
    sla_breaches = sla_breach_query.scalar()
    
    # Average resolution time (in hours)
    avg_resolution_query = await db.execute(
        select(
            func.avg(
                func.extract('epoch', SupportTicket.resolved_at - SupportTicket.created_at) / 3600
            )
        )
        .where(SupportTicket.resolved_at.isnot(None))
    )
    avg_resolution_hours = avg_resolution_query.scalar() or 0
    
    return {
        "total_tickets": total_tickets,
        "by_status": by_status,
        "by_priority": by_priority,
        "sla_breaches": sla_breaches,
        "average_resolution_hours": round(avg_resolution_hours, 2),
    }
