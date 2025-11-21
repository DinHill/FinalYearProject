"""
Audit Log model for tracking system activities
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.models.base import BaseModel


class ActionType(str, enum.Enum):
    """Audit action types"""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    SECURITY = "SECURITY"
    ADMIN = "ADMIN"
    SYSTEM = "SYSTEM"
    API_REQUEST = "API_REQUEST"


class LogStatus(str, enum.Enum):
    """Log status types"""
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"


class AuditLog(BaseModel):
    """Audit log model for tracking all system activities"""
    
    __tablename__ = "audit_logs"
    
    user_id = Column(String(255), nullable=True, index=True)  # Firebase UID or system user
    user_name = Column(String(255), nullable=True)
    user_email = Column(String(255), nullable=True, index=True)
    
    action = Column(String(50), nullable=False, index=True)  # Using String instead of Enum for flexibility
    entity = Column(String(100), nullable=True, index=True)  # e.g., "User", "Course", "Grade"
    entity_id = Column(String(100), nullable=True, index=True)
    
    description = Column(Text, nullable=False)
    status = Column(String(20), default="success", index=True)
    
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(Text, nullable=True)
    
    extra_data = Column(JSON, nullable=True)  # Additional context data (renamed from metadata to avoid conflict)
    
    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity} by {self.user_email or 'System'}>"
