import os
from typing import List, Optional
from pydantic import BaseModel

class Settings(BaseModel):
    # Project Information
    PROJECT_NAME: str = "Academic Portal API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Backend API for University Academic Portal System"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./academic_portal.db"
    )
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "")
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID", "")
    FIREBASE_AUTH_URI: str = os.getenv("FIREBASE_AUTH_URI", "")
    FIREBASE_TOKEN_URI: str = os.getenv("FIREBASE_TOKEN_URI", "")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # CORS Settings
    ALLOWED_HOSTS: List[str] = [
        "http://localhost:3000",    # Next.js admin
        "http://localhost:3001",    # Next.js admin (alternative port)
        "http://localhost:19006",   # Expo development
        "http://localhost:19000",   # Expo web
    ]
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [
        "pdf", "doc", "docx", "xls", "xlsx", 
        "jpg", "jpeg", "png", "gif", "txt"
    ]
    UPLOAD_DIR: str = "uploads"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Cache Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_EXPIRE_SECONDS: int = 3600  # 1 hour
    
    # Email Settings (Optional)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    
    # Academic System Settings
    DEFAULT_ACADEMIC_YEAR: str = "2024-2025"
    GRADING_SCALE: dict = {
        "A+": 4.0, "A": 4.0, "A-": 3.7,
        "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7,
        "D+": 1.3, "D": 1.0, "F": 0.0
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Validate required settings in production
if settings.ENVIRONMENT == "production":
    required_settings = [
        "SECRET_KEY",
        "DATABASE_URL"
        # Firebase settings are optional for now - can be added later
        # "FIREBASE_PROJECT_ID",
        # "FIREBASE_PRIVATE_KEY", 
        # "FIREBASE_CLIENT_EMAIL"
    ]
    
    missing = [setting for setting in required_settings 
               if not getattr(settings, setting) or getattr(settings, setting) == "your-super-secret-key-change-this"]
    
    if missing:
        raise ValueError(f"Missing required settings: {', '.join(missing)}")