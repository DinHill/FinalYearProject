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
        pattern="^(technical|academic|financial|account|other)$"
    )
    priority: str = Field(
        "medium",  # Changed default from "normal" to "medium"
        description="Ticket priority",
        pattern="^(low|medium|high|urgent)$"  # Changed "normal" to "medium"
    )


class SupportTicketUpdate(BaseSchema):
    """Update support ticket (admin only)"""
    status: Optional[str] = Field(
        None,
        pattern="^(open|in_progress|waiting|resolved|closed)$"
    )
    priority: Optional[str] = Field(
        None,
        pattern="^(low|medium|high|urgent)$"  # Changed "normal" to "medium"
    )
    assigned_to_id: Optional[int] = Field(None, description="Assign to user ID")  # Changed UUID to int
    category: Optional[str] = Field(
        None,
        pattern="^(technical|academic|financial|account|other)$"
    )


class SupportTicketResponse(BaseSchema):
    """Support ticket response"""
    id: int
    user_id: int  # Changed from requester_id (UUID) to user_id (int)
    assigned_to: Optional[int]  # Changed from assigned_to_id to match model
    subject: str
    description: Optional[str]
    category: Optional[str]
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class SupportTicketDetailResponse(SupportTicketResponse):
    """Support ticket with events"""
    pass  # Removed events and sla_breached (TicketEvent table doesn't exist)


# Ticket Event Schemas

class TicketEventCreate(BaseSchema):
    """Create ticket event/comment"""
    event_type: str = Field(
        "comment",
        description="Event type",
        pattern="^(comment|status_changed|priority_changed|assigned|unassigned|category_changed|created)$"
    )
    description: str = Field(..., min_length=1, description="Event description or comment")


class TicketEventResponse(BaseSchema):
    """Ticket event response"""
    id: int
    ticket_id: int
    created_by: int  # Changed from user_id to match model
    event_type: str
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
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
        pattern="^(direct|group|support)$"
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

