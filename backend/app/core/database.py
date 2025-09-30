from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import logging

from app.core.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    connect_args={
        "check_same_thread": False,  # Only needed for SQLite
    } if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,  # Log SQL queries in development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Database dependency for FastAPI
def get_db():
    """
    Dependency that provides database session to FastAPI routes.
    Automatically handles session lifecycle and cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logging.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Import all models at module level to ensure they're registered
from app.models import Base as ModelsBase

# Database utility functions
async def init_db():
    """Initialize database tables"""
    try:
        # Use the models Base instead of the local Base
        ModelsBase.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Error creating database tables: {e}")
        raise

async def close_db():
    """Close database connections"""
    try:
        engine.dispose()
        logging.info("Database connections closed")
    except Exception as e:
        logging.error(f"Error closing database: {e}")

# Health check function
def check_db_health() -> bool:
    """Check if database is accessible"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        logging.error(f"Database health check failed: {e}")
        return False