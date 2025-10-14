"""
Simple admin creation with pre-hashed password
"""
import asyncio
import asyncpg
import uuid

async def create_admin():
    conn = await asyncpg.connect(
        "postgresql://greenwich_kbjo_user:D1h4oQ2f1ZN2Y6XFbfN68LxqVvPako5y@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo"
    )
    
    # Check if admin exists
    existing = await conn.fetchrow("SELECT * FROM users WHERE username = 'admin'")
    if existing:
        print("Admin already exists!")
        print("Username: admin")
        print("Password: admin123")
        await conn.close()
        return
    
    # Create admin with pre-hashed password (admin123)
    firebase_uid = f"admin_{uuid.uuid4().hex[:8]}"
    password_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkQCjW8fQ6pO"
    
    await conn.execute(
        """
        INSERT INTO users (firebase_uid, username, email, full_name, password_hash, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        """,
        firebase_uid, 'admin', 'admin@greenwich.edu.vn', 'System Administrator', 
        password_hash, 'admin', 'active'
    )
    
    print("=" * 60)
    print("SUCCESS! Admin user created!")
    print("=" * 60)
    print("\nLogin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\nLogin at: http://localhost:3000/login")
    print("=" * 60)
    
    await conn.close()

asyncio.run(create_admin())
