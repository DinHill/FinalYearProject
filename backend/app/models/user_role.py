"""
User-Role junction table for many-to-many relationship
"""
from sqlalchemy import ForeignKey, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.role import Role
    from app.models.academic import Campus


class UserRole(BaseModel):
    """
    Junction table for User-Role many-to-many relationship with campus scoping
    
    A user can have multiple roles (e.g., teacher + academic_admin)
    
    Campus Scoping:
    - campus_id=NULL: Cross-campus access (typically for super_admin)
    - campus_id=123: Role is scoped to specific campus only
    
    Examples:
    - User with (role=super_admin, campus_id=NULL) can access all campuses
    - User with (role=academic_admin, campus_id=1) can only manage campus 1 academic data
    - User with (role=student, campus_id=2) is a student at campus 2
    """
    __tablename__ = "user_roles"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    campus_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("campuses.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_roles")
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")
    campus: Mapped[Optional["Campus"]] = relationship("Campus")
    
    # Ensure a user can only have a role once per campus
    # NULL campus_id is treated as distinct value
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "campus_id", name="uq_user_role_campus"),
    )
    
    def __repr__(self) -> str:
        campus_str = f", campus_id={self.campus_id}" if self.campus_id else ", campus_id=NULL"
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id}{campus_str})>"
