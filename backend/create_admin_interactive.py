"""
Interactive admin user creation script
"""
import asyncio
import asyncpg
from passlib.context import CryptContext
import uuid
import getpass

# Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user(db_password):
    """Create admin user in production database"""
    
    DB_CONFIG = {
        "host": "dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com",
        "port": 5432,
        "database": "greenwich_kbjo",
        "user": "greenwich_kbjo_user",
        "password": db_password,
    }
    
    try:
        # Connect to database
        print("\n🔌 Connecting to Render PostgreSQL...")
        conn = await asyncpg.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            ssl="require"  # Render requires SSL
        )
        
        print("✅ Connected successfully!\n")
        
        # Check if admin already exists
        existing = await conn.fetchrow(
            "SELECT * FROM users WHERE username = $1", "admin"
        )
        
        if existing:
            print("="*60)
            print("✅ Admin user already exists!")
            print("="*60)
            print(f"Username: {existing['username']}")
            print(f"Email: {existing['email']}")
            print(f"Role: {existing['role']}")
            print(f"Status: {existing['status']}")
            print("\n💡 You can login with:")
            print("   Username: admin")
            print("   Password: admin123")
            print("="*60)
            await conn.close()
            return
        
        # Hash the password
        print("🔐 Hashing password...")
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
        print("🎉 ADMIN USER CREATED SUCCESSFULLY!")
        print("="*60)
        print("\n📋 Login Credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Email: admin@greenwich.edu.vn")
        print("\n🌐 Login at: http://localhost:3000/login")
        print("="*60 + "\n")
        
        await conn.close()
        
    except asyncpg.exceptions.InvalidPasswordError:
        print("\n❌ Invalid database password!")
        print("Please check your password and try again.")
    except asyncpg.exceptions.InvalidCatalogNameError:
        print("\n❌ Database not found!")
        print("Please check the database name.")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌱 Admin User Creation Script for Render Database")
    print("="*60)
    print("\n📋 Instructions:")
    print("1. Go to: https://dashboard.render.com")
    print("2. Click your database: greenwich_kbjo")
    print("3. Go to 'Connect' → 'External Connection'")
    print("4. Copy the PASSWORD value")
    print("\n" + "="*60 + "\n")
    
    db_password = getpass.getpass("🔑 Paste your database password here: ")
    
    if not db_password:
        print("\n❌ No password provided. Exiting...")
    else:
        asyncio.run(create_admin_user(db_password))
