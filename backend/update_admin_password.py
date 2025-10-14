"""
Update admin user password with properly hashed password
"""
import asyncio
import asyncpg
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    # Database connection
    conn = await asyncpg.connect(
        host="dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com",
        database="greenwich_kbjo",
        user="greenwich_kbjo_user",
        password="D1h4oQ2f1ZN2Y6XFbfN68LxqVvPako5y",
        port=5432
    )
    
    try:
        # Generate proper password hash
        password_hash = pwd_context.hash("admin123")
        print(f"Generated hash: {password_hash}")
        
        # Update admin user
        result = await conn.execute(
            """
            UPDATE users 
            SET password_hash = $1 
            WHERE username = 'admin'
            """,
            password_hash
        )
        
        print(f"✅ Admin password updated successfully!")
        print(f"Result: {result}")
        
        # Verify the update
        user = await conn.fetchrow(
            "SELECT username, password_hash FROM users WHERE username = 'admin'"
        )
        print(f"\nVerified admin user:")
        print(f"Username: {user['username']}")
        print(f"Password hash: {user['password_hash']}")
        
        # Test password verification
        is_valid = pwd_context.verify("admin123", user['password_hash'])
        print(f"\nPassword verification test: {'✅ PASS' if is_valid else '❌ FAIL'}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
