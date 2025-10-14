"""
Direct SQL script to create admin user
"""
import asyncio
import sys
from pathlib import Path
import uuid

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine
from app.core.security import SecurityUtils
from sqlalchemy import text


async def create_admin_sql():
    """Create admin user using direct SQL"""
    async with engine.begin() as conn:
        try:
            # Check if admin exists
            result = await conn.execute(
                text("SELECT * FROM users WHERE username = 'admin'")
            )
            existing = result.fetchone()
            
            if existing:
                print("✅ Admin user already exists!")
                print("Username: admin")
                print("Email: admin@greenwich.edu.vn")
                return
            
            # Create admin user with SQL
            firebase_uid = f"admin_{uuid.uuid4().hex[:20]}"
            hashed_password = SecurityUtils.hash_password("admin123")
            
            await conn.execute(
                text("""
                INSERT INTO users (
                    firebase_uid, username, email, full_name, password_hash,
                    role, status, created_at, updated_at
                )
                VALUES (
                    :firebase_uid, :username, :email, :full_name, :password_hash,
                    :role, :status, NOW(), NOW()
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
            
            print("✅ Admin user created successfully!")
            print("=" * 50)
            print("Username: admin")
            print("Password: admin123")
            print("Email: admin@greenwich.edu.vn")
            print("=" * 50)
            print("\n🌐 You can now login at: http://localhost:3000/login")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_admin_sql())
