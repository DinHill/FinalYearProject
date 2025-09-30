from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base
import enum

class MessageType(enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"

class MessageStatus(enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    DELETED = "deleted"

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    description = Column(Text)
    room_type = Column(String(50), nullable=False)  # direct, group, course, ai_support
    course_section_id = Column(Integer, ForeignKey("course_sections.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    last_message_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_section = relationship("CourseSection", backref="chat_rooms")
    creator = relationship("User", backref="created_chat_rooms")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True))
    is_admin = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    last_read_at = Column(DateTime(timezone=True))

    # Relationships
    chat_room = relationship("ChatRoom", backref="participants")
    user = relationship("User", backref="chat_participations")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"))  # Nullable for system messages
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    
    # File attachments (stored in Firebase Storage)
    file_url = Column(Text)
    file_name = Column(String(255))
    file_size = Column(Integer)
    
    # Message metadata
    reply_to_id = Column(Integer, ForeignKey("messages.id"))
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    chat_room = relationship("ChatRoom", backref="messages")
    sender = relationship("User", backref="sent_messages")
    reply_to = relationship("Message", remote_side=[id], backref="replies")