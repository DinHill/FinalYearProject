from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn
import asyncio
import signal
import sys

# Import core modules
from app.core.config import settings
from app.core.database import init_db, close_db, check_db_health

# Import API routers
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Security
security = HTTPBearer()

# Add CORS middleware - More permissive for local development and school networks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/testing
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    try:
        logger.info("Starting Academic Portal API...")
        # Initialize database
        await init_db()
        logger.info("Database initialized successfully")
        logger.info(f"API running in {settings.ENVIRONMENT} mode")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        # Don't raise for now to allow testing without database
        # raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        logger.info("Shutting down Academic Portal API...")
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle uncaught exceptions"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "message": "Academic Portal API",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "status": "healthy"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check"""
    try:
        # Check database connectivity
        db_healthy = check_db_health()
        
        health_status = {
            "status": "healthy" if db_healthy else "unhealthy",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "database": "connected" if db_healthy else "disconnected",
            "timestamp": "2024-12-30T00:00:00Z"  # We'll use datetime.now() when we import it
        }
        
        if not db_healthy:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=health_status
            )
            
        return health_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "error": "Health check failed",
                "timestamp": "2024-12-30T00:00:00Z"
            }
        )

# Include API routers
app.include_router(api_router)

# Development server with network-friendly settings
if __name__ == "__main__":
    import os
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nShutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Get port from environment (for deployment) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0" if os.environ.get("ENVIRONMENT") == "production" else "127.0.0.1"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
        access_log=True,
        use_colors=True,
        # Network timeout configurations
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30,
        # Limit concurrent connections for stability
        limit_concurrency=100,
        limit_max_requests=1000,
    )