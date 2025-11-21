"""
System settings schemas
"""
from pydantic import Field
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class SystemSettingBase(BaseSchema):
    """Base system setting schema"""
    key: str = Field(..., min_length=1, max_length=100, description="Setting key")
    value: Optional[str] = Field(None, description="Setting value")
    category: str = Field(..., min_length=1, max_length=50, description="Setting category")
    description: Optional[str] = Field(None, description="Setting description")
    data_type: str = Field("string", pattern="^(string|number|boolean|json)$")
    is_public: bool = Field(False, description="Public setting")
    is_encrypted: bool = Field(False, description="Encrypted value")


class SystemSettingCreate(SystemSettingBase):
    """Create system setting"""
    pass


class SystemSettingUpdate(BaseSchema):
    """Update system setting"""
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SystemSettingResponse(SystemSettingBase):
    """System setting response"""
    id: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int]
    
    class Config:
        from_attributes = True
