"""
Simple seed script - Creates admin user only
"""
import asyncio
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db
from app.core.security import SecurityUtils
from sqlalchemy import text


async def seed_admin():
    """Create admin user"""
    print("=" * 60)
    print("Creating admin user...")
    print("=" * 60)
    
    async for db in get_db():
        try:
            # Check if admin exists
            result = await db.execute(
                text("SELECT * FROM users WHERE username = 'admin'")
            )
            existing = result.fetchone()
            
            if existing:
                print("\nAdmin user already exists!")
                print(f"Username: admin")
                print(f"Password: Test123!@#")
                return
            
            # Create admin
            firebase_uid = f"admin_{uuid4().hex[:8]}"
            hashed_password = SecurityUtils.hash_password("Test123!@#")
            
            await db.execute(
                text("""
                INSERT INTO users (
                    firebase_uid, username, email, full_name, 
                    password_hash, role, status, created_at, updated_at
                )
                VALUES (
                    :firebase_uid, :username, :email, :full_name,
                    :password_hash, :role, :status, NOW(), NOW()
                )
                """),
                {
                    "firebase_uid": firebase_uid,
                    "username": "admin",
                    "email": "admin@greenwich.edu.vn",
                    "full_name": "System Administrator",
                    "password_hash": hashed_password,
                    "role": "admin",
                    "status": "active"
                }
            )
            
            await db.commit()
            
            print("\n" + "=" * 60)
            print("SUCCESS! Admin user created!")
            print("=" * 60)
            print("\nLogin credentials:")
            print("  Username: admin")
            print("  Password: Test123!@#")
            print("\nLogin at: http://localhost:3000/login")
            print("=" * 60)
            
        except Exception as e:
            print(f"\nError: {e}")
            await db.rollback()
        finally:
            await db.close()
            break


if __name__ == "__main__":
    asyncio.run(seed_admin())
