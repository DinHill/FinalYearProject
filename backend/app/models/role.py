"""
Role model for RBAC system
"""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user_role import UserRole


class Role(BaseModel):
    """
    Role model for role-based access control
    
    Roles:
    - student: Standard student permissions (campus-scoped)
    - teacher: Standard teacher permissions (campus-scoped)
    - super_admin: Full system access (typically campus_id=NULL for cross-campus access)
    - academic_admin: Manage courses, schedules, enrollments, grades (can be campus-scoped)
    - finance_admin: Manage invoices, payments, fees (can be campus-scoped)
    - support_admin: Manage support tickets, document requests (can be campus-scoped)
    - content_admin: Manage announcements, notifications (can be campus-scoped)
    """
    __tablename__ = "roles"
    
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole",
        back_populates="role",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"
