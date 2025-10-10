"""
Routers package initialization
"""
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.academic import router as academic_router
from app.routers.finance import router as finance_router
from app.routers.documents import router as documents_router
from app.routers.support import router as support_router

__all__ = [
    "auth_router",
    "users_router",
    "academic_router",
    "finance_router",
    "documents_router",
    "support_router",
]
