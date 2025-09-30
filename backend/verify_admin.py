#!/usr/bin/env python3
"""
Script to verify user creation and password verification
"""
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SessionLocal
from app.services.user_service import UserService

def verify_admin_user():
    """Verify admin user exists and can be authenticated"""
    try:
        # Create database session
        db = SessionLocal()
        
        try:
            user_service = UserService(db)
            
            # Check if admin user exists
            admin_user = user_service.get_user_by_user_id("admin001")
            if not admin_user:
                print("Admin user not found!")
                return
            
            print(f"Found user: {admin_user.user_id}")
            print(f"Full name: {admin_user.full_name}")
            print(f"Role: {admin_user.role}")
            print(f"Status: {admin_user.status}")
            print(f"Employee ID: {admin_user.employee_id}")
            
            # Test password verification
            password_correct = admin_user.verify_password("admin123")
            print(f"Password verification result: {password_correct}")
            
            if password_correct:
                print("✅ User authentication works correctly!")
            else:
                print("❌ Password verification failed!")
                
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error verifying admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_admin_user()