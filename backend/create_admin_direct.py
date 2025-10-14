"""
Direct database connection to create admin user
Works with production Render PostgreSQL database
"""
import asyncio
import asyncpg
from passlib.context import CryptContext
import uuid

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Your Render PostgreSQL connection details
DB_CONFIG = {
    "host": "dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com",
    "port": 5432,
    "database": "greenwich_kbjo",
    "user": "greenwich_kbjo_user",
    "password": "",  # ⚠️ YOU NEED TO FILL THIS IN!
}

async def create_admin_user():
    """Create admin user in production database"""
    
    if not DB_CONFIG["password"]:
        print("❌ ERROR: Please set your database password in DB_CONFIG!")
        print("You can find it in your Render dashboard under Database > Connection")
        return
    
    try:
        # Connect to database
        print("🔌 Connecting to Render PostgreSQL...")
        conn = await asyncpg.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            ssl="require"  # Render requires SSL
        )
        
        print("✅ Connected successfully!")
        
        # Check if admin already exists
        existing = await conn.fetchrow(
            "SELECT * FROM users WHERE username = $1", "admin"
        )
        
        if existing:
            print("\n✅ Admin user already exists!")
            print(f"Username: {existing['username']}")
            print(f"Email: {existing['email']}")
            print(f"Role: {existing['role']}")
            await conn.close()
            return
        
        # Hash the password
        print("\n🔐 Hashing password...")
        hashed_password = pwd_context.hash("admin123")
        
        # Generate unique Firebase UID
        firebase_uid = f"admin_{uuid.uuid4().hex[:20]}"
        
        # Insert admin user
        print("👤 Creating admin user...")
        await conn.execute(
            """
            INSERT INTO users (
                firebase_uid, username, email, full_name, password_hash,
                role, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            """,
            firebase_uid,
            "admin",
            "admin@greenwich.edu.vn",
            "System Administrator",
            hashed_password,
            "admin",
            "active"
        )
        
        print("\n" + "="*60)
        print("✅ ADMIN USER CREATED SUCCESSFULLY!")
        print("="*60)
        print("\n📋 Login Credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Email: admin@greenwich.edu.vn")
        print("\n🌐 Admin Portal: http://localhost:3000/login")
        print("="*60)
        
        await conn.close()
        
    except asyncpg.exceptions.InvalidPasswordError:
        print("❌ Invalid database password! Check your credentials.")
    except asyncpg.exceptions.InvalidCatalogNameError:
        print("❌ Database not found! Check the database name.")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you filled in the password in DB_CONFIG")
        print("2. Get the password from: https://dashboard.render.com")
        print("3. Go to your database > Connect > External Connection")


if __name__ == "__main__":
    print("="*60)
    print("🌱 Admin User Creation Script")
    print("="*60)
    asyncio.run(create_admin_user())
