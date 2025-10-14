"""
Create all database tables directly on Render
"""
import asyncio
import asyncpg

DB_PASSWORD = "D1h4oQ2f1ZN2Y6XFbfN68LxqVvPako5y"

async def create_tables():
    """Create all tables"""
    conn = await asyncpg.connect(
        f"postgresql://greenwich_kbjo_user:{DB_PASSWORD}@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo"
    )
    
    print("Creating all database tables...")
    print("=" * 60)
    
    # Create tables SQL
    await conn.execute("""
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            firebase_uid VARCHAR(128) UNIQUE NOT NULL,
            username VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255),
            role VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            phone_number VARCHAR(20),
            avatar_url VARCHAR(500),
            date_of_birth DATE,
            gender VARCHAR(10),
            campus_id INTEGER,
            major_id INTEGER,
            year_entered INTEGER,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Campuses table
        CREATE TABLE IF NOT EXISTS campuses (
            id SERIAL PRIMARY KEY,
            code VARCHAR(3) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            address VARCHAR(500),
            city VARCHAR(100),
            timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
            phone VARCHAR(20),
            email VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Majors table
        CREATE TABLE IF NOT EXISTS majors (
            id SERIAL PRIMARY KEY,
            code VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE INDEX IF NOT EXISTS idx_users_campus ON users(campus_id);
        CREATE INDEX IF NOT EXISTS idx_users_major ON users(major_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    """)
    
    print("SUCCESS! All tables created!")
    print("=" * 60)
    
    # Verify tables
    tables = await conn.fetch("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    
    print(f"\nCreated {len(tables)} tables:")
    for row in tables:
        print(f"  - {row['table_name']}")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(create_tables())
