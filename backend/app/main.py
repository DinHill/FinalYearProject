"""
Main FastAPI application
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import time

from app.core import settings, initialize_firebase, init_db, close_db
from app.core.exceptions import APIException
from app.middleware import AuditMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting Academic Portal API...")
    
    # Initialize Firebase
    try:
        initialize_firebase()
        logger.info("✅ Firebase initialized")
    except Exception as e:
        logger.error(f"❌ Firebase initialization failed: {e}")
        logger.warning("⚠️  Continuing without Firebase (admin-login will still work)")
        # Don't raise - allow app to start without Firebase for local development
    
    # Initialize Database (optional - use Alembic migrations instead)
    # await init_db()
    # logger.info("✅ Database initialized")
    
    logger.info(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} started successfully")
    logger.info(f"📝 Environment: {settings.APP_ENV}")
    logger.info(f"🌐 CORS origins: {settings.CORS_ORIGINS}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Academic Portal API...")
    await close_db()
    logger.info("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Greenwich University Academic Portal - Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# CORS Middleware - Explicit allowlist (no wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Explicit list from settings
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# Audit Middleware - Log all significant API actions
app.add_middleware(AuditMiddleware)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all requests for tracing"""
    import uuid
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Add to logging context
    logger.info(f"Request {request_id}: {request.method} {request.url.path}")
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Timing Middleware
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    """Add processing time header"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:  # > 1 second
        logger.warning(
            f"Slow request: {request.method} {request.url.path} "
            f"took {process_time:.2f}s"
        )
    
    return response


# Exception Handlers
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "detail": exc.detail,
            "fields": exc.fields
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    errors = {}
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors[field] = error["msg"]
    
    logger.error(f"❌ Validation error on {request.url}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "detail": "Request validation failed",
            "fields": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "detail": "An unexpected error occurred" if not settings.DEBUG else str(exc)
        }
    )


# Health Check Endpoints
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }


@app.get("/api/v1/health", tags=["System"])
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "api_version": "v1"
    }


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/api/docs" if settings.DEBUG else "Documentation disabled in production",
        "health": "/health"
    }


# Import and include routers
from app.routers import (
    auth_router,
    users_router,
    academic_router,
    finance_router,
    documents_router,
    support_router
)
from app.routers.admin_db import router as admin_db_router
from app.routers.dashboard import router as dashboard_router
from app.routers.dashboard_analytics import router as dashboard_analytics_router
from app.routers.me import router as me_router
from app.routers.settings import router as settings_router
from app.routers.announcements import router as announcements_router
from app.routers.search import router as search_router
from app.routers.bulk import router as bulk_router
from app.routers.schedule import router as schedule_router
from app.routers.files import router as files_router
from app.routers.student_portal import router as student_portal_router
from app.routers.import_export import router as import_export_router
from app.routers.campuses import router as campuses_router
from app.api.v1.seed import router as seed_router
from app.routers.test_campuses import router as test_campuses_router
from app.routers.audit import router as audit_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(test_campuses_router, prefix="/api/v1")  # Test endpoint
app.include_router(academic_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")
app.include_router(admin_db_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(dashboard_analytics_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(announcements_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(bulk_router, prefix="/api/v1")
app.include_router(schedule_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(student_portal_router, prefix="/api/v1")
app.include_router(import_export_router, prefix="/api/v1")
app.include_router(campuses_router)  # Already has /api/v1/campuses prefix
app.include_router(me_router, prefix="/api/v1")  # /me endpoints for mobile app
app.include_router(audit_router, prefix="/api/v1")  # Audit logs
app.include_router(seed_router)  # Seeding endpoint (should be protected in production)

# More routers to be added:
# from app.routers import analytics
# app.include_router(analytics.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )

