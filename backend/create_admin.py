#!/usr/bin/env python3
"""
Simple script to create an admin user for testing
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SessionLocal, init_db
from app.models.user import User, UserRole, UserStatus
from app.services.user_service import UserService
from app.schemas.user import RegisterRequest

async def create_admin_user():
    """Create an admin user for testing"""
    try:
        # Initialize database
        await init_db()
        print("Database initialized")
        
        # Create database session
        db = SessionLocal()
        
        try:
            user_service = UserService(db)
            
            # Create admin user
            admin_data = RegisterRequest(
                user_id="admin001",
                password="admin123",
                full_name="Admin User",
                role=UserRole.ADMIN,
                email="admin@university.edu",
                department="IT Department",
                campus="Main Campus"
            )
            
            # Create the user directly without checking if exists (since we reset DB)
            try:
                admin_user = user_service.create_user_with_password(admin_data)
                print(f"Created admin user: {admin_user.user_id}")
                print(f"User ID: admin001")
                print(f"Password: admin123")
            except Exception as create_error:
                if "already exists" in str(create_error):
                    print("Admin user already exists!")
                else:
                    raise
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error creating admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_admin_user())