"""
Setup script for test database
Run this before running tests: python tests/setup_test_db.py
"""
import asyncio
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.database import Base

# Database connection details
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_HOST = "localhost"
DB_PORT = 5432
TEST_DB_NAME = "greenwich_test"


async def create_test_database():
    """Create the test database if it doesn't exist"""
    # Connect to the default 'postgres' database to create the test database
    conn = await asyncpg.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database="postgres"
    )
    
    try:
        # Check if test database exists
        result = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            TEST_DB_NAME
        )
        
        if result:
            print(f"Test database '{TEST_DB_NAME}' already exists. Dropping it...")
            # Terminate all connections to the test database
            await conn.execute(f"""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '{TEST_DB_NAME}'
                AND pid <> pg_backend_pid()
            """)
            # Drop the database
            await conn.execute(f'DROP DATABASE {TEST_DB_NAME}')
            print(f"Dropped test database '{TEST_DB_NAME}'")
        
        # Create the test database
        await conn.execute(f'CREATE DATABASE {TEST_DB_NAME}')
        print(f"Created test database '{TEST_DB_NAME}'")
        
    finally:
        await conn.close()
    
    # Now create the tables in the test database
    test_db_url = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{TEST_DB_NAME}"
    engine = create_async_engine(test_db_url)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print(f"Created all tables in test database '{TEST_DB_NAME}'")
    
    await engine.dispose()
    print("\n✅ Test database setup complete!")
    print(f"   Database: {TEST_DB_NAME}")
    print(f"   URL: {test_db_url}")


if __name__ == "__main__":
    asyncio.run(create_test_database())
