"""
Communication Schemas

Pydantic models for communication-related operations (support tickets, chat).
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import Field, validator

from app.schemas.base import BaseSchema


# Support Ticket Schemas

class SupportTicketCreate(BaseSchema):
    """Create support ticket"""
    subject: str = Field(..., min_length=1, max_length=255, description="Ticket subject")
    description: str = Field(..., min_length=1, description="Detailed description")
    category: str = Field(
        ...,
        description="Ticket category",
        regex="^(technical|academic|financial|account|other)$"
    )
    priority: str = Field(
        "normal",
        description="Ticket priority",
        regex="^(low|normal|high|urgent)$"
    )


class SupportTicketUpdate(BaseSchema):
    """Update support ticket (admin only)"""
    status: Optional[str] = Field(
        None,
        regex="^(open|in_progress|waiting|resolved|closed)$"
    )
    priority: Optional[str] = Field(
        None,
        regex="^(low|normal|high|urgent)$"
    )
    assigned_to_id: Optional[UUID] = Field(None, description="Assign to user ID")
    category: Optional[str] = Field(
        None,
        regex="^(technical|academic|financial|account|other)$"
    )


class SupportTicketResponse(BaseSchema):
    """Support ticket response"""
    id: int
    ticket_number: str
    requester_id: UUID
    assigned_to_id: Optional[UUID]
    subject: str
    description: str
    category: str
    priority: str
    status: str
    sla_deadline: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SupportTicketDetailResponse(SupportTicketResponse):
    """Support ticket with events"""
    events: List['TicketEventResponse']
    sla_breached: bool


# Ticket Event Schemas

class TicketEventCreate(BaseSchema):
    """Create ticket event/comment"""
    event_type: str = Field(
        "comment",
        description="Event type",
        regex="^(comment|status_changed|priority_changed|assigned|unassigned|category_changed|created)$"
    )
    description: str = Field(..., min_length=1, description="Event description or comment")


class TicketEventResponse(BaseSchema):
    """Ticket event response"""
    id: int
    ticket_id: int
    user_id: UUID
    event_type: str
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Chat Room Schemas (for future implementation with Firestore)

class ChatRoomCreate(BaseSchema):
    """Create chat room"""
    name: Optional[str] = Field(None, max_length=255, description="Room name (optional)")
    room_type: str = Field(
        ...,
        description="Room type",
        regex="^(direct|group|support)$"
    )
    participant_ids: List[UUID] = Field(..., min_items=2, description="Initial participants")


class ChatRoomResponse(BaseSchema):
    """Chat room response"""
    id: int
    firestore_room_id: str
    name: Optional[str]
    room_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatParticipantResponse(BaseSchema):
    """Chat participant response"""
    id: int
    room_id: int
    user_id: UUID
    joined_at: datetime
    last_read_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Forward references resolution
SupportTicketDetailResponse.model_rebuild()
