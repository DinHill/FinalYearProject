"""
System settings model for configurable application parameters
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class SystemSetting(Base):
    """
    System-wide configuration settings
    
    Stores key-value pairs for configurable application parameters:
    - System information (name, logo, contact)
    - Email configuration (SMTP settings)
    - Payment settings (methods, gateways)
    - Academic settings (grading scale, attendance rules)
    - Feature flags
    """
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Setting identification
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    
    # Metadata
    category = Column(String(50), nullable=False, index=True)  # e.g., "system", "email", "payment", "academic"
    description = Column(Text, nullable=True)
    data_type = Column(String(20), default="string")  # "string", "number", "boolean", "json"
    
    # Security
    is_public = Column(Boolean, default=False)  # Can be accessed without admin privileges
    is_encrypted = Column(Boolean, default=False)  # Value is encrypted
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)  # User ID who last updated
    
    def __repr__(self):
        return f"<SystemSetting {self.key}={self.value}>"
