"""
Idempotency key tracking for preventing duplicate operations
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, text
from app.models.base import BaseModel


class IdempotencyKey(BaseModel):
    """
    Track idempotency keys to prevent duplicate operations
    
    Used for critical operations like payments and file uploads
    """
    __tablename__ = "idempotency_keys"
    
    key = Column(String(255), nullable=False, unique=True, index=True)
    endpoint = Column(String(255), nullable=False)
    request_data = Column(Text)  # JSON serialized request data
    response_data = Column(Text)  # JSON serialized response data
    status_code = Column(Integer, nullable=False)
    
    def __repr__(self):
        return f"<IdempotencyKey {self.key}>"
