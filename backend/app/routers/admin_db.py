"""
Admin utilities router - Database inspection and management
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import require_admin
from app.models import User

router = APIRouter(prefix="/admin/db", tags=["Admin - Database"])


@router.get("/tables")
async def list_tables(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_admin())
):
    """
    List all tables in the database
    
    Access: admin only
    """
    query = text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    result = await db.execute(query)
    tables = [row[0] for row in result.fetchall()]
    
    return {
        "total": len(tables),
        "tables": tables
    }


@router.get("/tables/{table_name}/count")
async def count_table_rows(
    table_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_admin())
):
    """
    Count rows in a specific table
    
    Access: admin only
    """
    query = text(f"SELECT COUNT(*) FROM {table_name}")
    result = await db.execute(query)
    count = result.scalar()
    
    return {
        "table": table_name,
        "row_count": count
    }


@router.get("/stats")
async def database_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_admin())
):
    """
    Get database statistics - row counts for all major tables
    
    Access: admin only
    """
    tables = [
        "users", "students", "teachers", "campuses", "majors",
        "courses", "enrollments", "grades", "invoices", "payments",
        "documents", "support_tickets", "announcements"
    ]
    
    stats = {}
    for table in tables:
        try:
            query = text(f"SELECT COUNT(*) FROM {table}")
            result = await db.execute(query)
            count = result.scalar()
            stats[table] = count
        except Exception as e:
            stats[table] = f"Error: {str(e)}"
    
    return {
        "database": "greenwich_kbjo",
        "statistics": stats,
        "total_tables": len(tables)
    }


@router.get("/tables/{table_name}/sample")
async def get_table_sample(
    table_name: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_admin())
):
    """
    Get sample rows from a table
    
    Access: admin only
    
    Parameters:
    - table_name: Name of the table
    - limit: Number of rows to return (default: 10, max: 100)
    """
    if limit > 100:
        limit = 100
    
    query = text(f"SELECT * FROM {table_name} LIMIT :limit")
    result = await db.execute(query, {"limit": limit})
    
    columns = result.keys()
    rows = [dict(zip(columns, row)) for row in result.fetchall()]
    
    return {
        "table": table_name,
        "columns": list(columns),
        "row_count": len(rows),
        "data": rows
    }
