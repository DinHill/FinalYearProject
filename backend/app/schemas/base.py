"""
Base Pydantic schemas
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, Generic, TypeVar
from datetime import datetime


T = TypeVar('T')


class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True
    )


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = 1
    page_size: int = 20
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "page": 1,
                "page_size": 20
            }
        }
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    items: list[T]
    total: int
    page: int
    per_page: int
    pages: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "per_page": 20,
                "pages": 5
            }
        }
    )


class SuccessResponse(BaseModel):
    """Success response"""
    success: bool = True
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Error response"""
    code: str
    detail: str
    fields: Optional[dict] = None
