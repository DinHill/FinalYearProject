"""
Communication models - chat, support tickets
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class RoomType(str, enum.Enum):
    """Chat room type enum"""
    COURSE = "course"
    DIRECT = "direct"
    GROUP = "group"
    AI_SUPPORT = "ai_support"


class ParticipantRole(str, enum.Enum):
    """Chat participant role enum"""
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


class TicketCategory(str, enum.Enum):
    """Support ticket category enum"""
    ACADEMIC = "academic"
    TECHNICAL = "technical"
    DOCUMENT = "document"
    FINANCIAL = "financial"
    OTHER = "other"


class TicketPriority(str, enum.Enum):
    """Ticket priority enum"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(str, enum.Enum):
    """Ticket status enum"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class EventType(str, enum.Enum):
    """Ticket event type enum"""
    CREATED = "created"
    STATUS_CHANGE = "status_change"
    ASSIGNMENT = "assignment"
    COMMENT = "comment"
    RESOLUTION = "resolution"


class NotificationType(str, enum.Enum):
    """Notification type enum"""
    ANNOUNCEMENT = "announcement"
    GRADE_POSTED = "grade_posted"
    ENROLLMENT = "enrollment"
    ATTENDANCE = "attendance"
    FEE_DUE = "fee_due"
    DOCUMENT_READY = "document_ready"
    MESSAGE = "message"
    SYSTEM = "system"


class NotificationPriority(str, enum.Enum):
    """Notification priority enum"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ChatRoom(BaseModel):
    """Chat room model"""
    
    __tablename__ = "chat_rooms"
    
    firebase_room_id = Column(String(100), unique=True, index=True)  # Firestore document ID
    
    # Room Info
    name = Column(String(200))
    description = Column(Text)
    type = Column(SQLEnum(RoomType), nullable=False, index=True)
    
    # Context
    section_id = Column(Integer, ForeignKey("course_sections.id"), index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    last_message_at = Column(DateTime(timezone=True))
    
    # Relationships
    section = relationship("CourseSection")
    campus = relationship("Campus")
    creator = relationship("User")
    participants = relationship("ChatParticipant", back_populates="room")
    
    def __repr__(self):
        return f"<ChatRoom {self.name} ({self.type})>"


class ChatParticipant(BaseModel):
    """Chat participant model"""
    
    __tablename__ = "chat_participants"
    __table_args__ = (
        UniqueConstraint('room_id', 'user_id', name='uq_room_user'),
    )
    
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Role in Room
    role = Column(SQLEnum(ParticipantRole), default=ParticipantRole.MEMBER)
    
    # Activity
    joined_at = Column(DateTime(timezone=True))
    left_at = Column(DateTime(timezone=True))
    last_read_at = Column(DateTime(timezone=True))
    
    # Notifications
    is_muted = Column(Boolean, default=False)
    
    # Relationships
    room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User", back_populates="chat_participations")
    
    def __repr__(self):
        return f"<ChatParticipant Room{self.room_id} User{self.user_id}>"


class SupportTicket(BaseModel):
    """Support ticket model"""
    
    __tablename__ = "support_tickets"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Changed from requester_id
    
    # Ticket Info
    subject = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(50))  # Matches database varchar
    
    # Priority & Status
    priority = Column(String(20), default="medium", index=True)  # Changed default from "normal" to "medium"
    status = Column(String(20), default="open", index=True)
    
    # Assignment
    assigned_to = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Relationships
    user = relationship("User", back_populates="support_tickets", foreign_keys=[user_id])  # Changed from requester to user
    assignee = relationship("User", foreign_keys=[assigned_to])
    events = relationship("TicketEvent", back_populates="ticket")
    
    def __repr__(self):
        return f"<SupportTicket {self.id} - {self.subject}>"


class TicketEvent(BaseModel):
    """Ticket event model"""
    
    __tablename__ = "ticket_events"
    
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False, index=True)
    
    # Event Info
    event_type = Column(SQLEnum(EventType), nullable=False, index=True)
    description = Column(Text)
    
    # Changes
    old_value = Column(String(200))
    new_value = Column(String(200))
    
    # Actor
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationship
    ticket = relationship("SupportTicket", back_populates="events")
    actor = relationship("User")
    
    def __repr__(self):
        return f"<TicketEvent {self.event_type} for Ticket{self.ticket_id}>"


class Notification(BaseModel):
    """User notification model"""
    
    __tablename__ = "notifications"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification Content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.NORMAL)
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True))
    
    # Action Link
    action_url = Column(String(500))
    action_text = Column(String(100))
    
    # Related Entity
    related_entity_type = Column(String(50))  # e.g., "grade", "announcement", "enrollment"
    related_entity_id = Column(Integer)
    
    # Extra Data
    extra_data = Column(Text)  # JSON string for additional data
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.title}>"
