"""
Simple script to create an admin user
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db
from app.models import User, UserRole, UserStatus
from app.core.security import SecurityUtils
from sqlalchemy import select


async def create_admin():
    """Create admin user"""
    async for db in get_db():
        try:
            # Check if admin already exists
            result = await db.execute(
                select(User).where(User.username == "admin")
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print("✅ Admin user already exists!")
                print(f"Username: {existing.username}")
                print(f"Email: {existing.email}")
                return
            
            # Create admin user
            hashed_password = SecurityUtils.hash_password("admin123")
            
            admin = User(
                firebase_uid=f"admin_{SecurityUtils.generate_random_string(20)}",
                username="admin",
                email="admin@greenwich.edu.vn",
                full_name="System Administrator",
                password_hash=hashed_password,
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            )
            
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            
            print("✅ Admin user created successfully!")
            print(f"Username: admin")
            print(f"Password: admin123")
            print(f"Email: {admin.email}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()
            break


if __name__ == "__main__":
    asyncio.run(create_admin())
