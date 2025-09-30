from fastapi import APIRouter
from app.api.v1 import auth, users, courses, schedule, mock_auth, firebase

api_router = APIRouter(prefix="/api/v1")

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(courses.router)
api_router.include_router(schedule.router)
api_router.include_router(mock_auth.router)
api_router.include_router(firebase.router)