import asyncio
import asyncpg

async def check_tables():
    conn = await asyncpg.connect(
        "postgresql://greenwich_kbjo_user:D1h4oQ2f1ZN2Y6XFbfN68LxqVvPako5y@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo"
    )
    
    # Get all tables
    tables = await conn.fetch("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    
    print("\nDATABASE TABLES:")
    print("=" * 50)
    for row in tables:
        table_name = row['table_name']
        # Get row count
        count = await conn.fetchval(f'SELECT COUNT(*) FROM {table_name}')
        print(f"  {table_name:<30} ({count} rows)")
    
    await conn.close()

asyncio.run(check_tables())
