"""
Analytics endpoints for dashboard charts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Query

from app.core.database import get_db
from app.models import User
from app.models.user import Major
from app.models.finance import Payment

router = APIRouter(prefix="/dashboard/analytics", tags=["Analytics"])


@router.get("/user-activity")
async def get_user_activity_chart_data(
    campus: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get user activity data for charts - last 6 months"""
    now = datetime.utcnow()
    months_data = []
    
    for i in range(5, -1, -1):  # Last 6 months
        # Simple month calculation
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i*30)
        month_end = month_start + timedelta(days=30)
        
        # Count active users by role
        students = (await db.execute(select(func.count(User.id)).where(
            and_(User.role == "student", User.last_login >= month_start, User.last_login <= month_end)
        ))).scalar() or 0
        
        teachers = (await db.execute(select(func.count(User.id)).where(
            and_(User.role == "teacher", User.last_login >= month_start, User.last_login <= month_end)
        ))).scalar() or 0
        
        admins = (await db.execute(select(func.count(User.id)).where(
            and_(User.role.in_(["super_admin", "academic_admin", "finance_admin"]), User.last_login >= month_start, User.last_login <= month_end)
        ))).scalar() or 0
        
        months_data.append({
            "month": month_start.strftime("%b %Y"),
            "students": students,
            "teachers": teachers,
            "admins": admins
        })
    
    return months_data


@router.get("/enrollment-trends")
async def get_enrollment_trends_chart_data(
    campus: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get enrollment trends by major for charts"""
    majors = (await db.execute(select(Major).limit(8))).scalars().all()
    programs_data = []
    
    for major in majors:
        enrolled = (await db.execute(select(func.count(User.id)).where(
            and_(User.role == "student", User.major_id == major.id)
        ))).scalar() or 0
        
        capacity = int(enrolled * 1.3) if enrolled > 0 else 100  # Mock capacity
        
        programs_data.append({
            "program": major.name[:20],
            "enrolled": enrolled,
            "capacity": capacity
        })
    
    return programs_data


@router.get("/revenue")
async def get_revenue_chart_data(
    campus: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue data for charts - last 6 months"""
    now = datetime.utcnow()
    revenue_data = []
    
    for i in range(5, -1, -1):
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i*30)
        month_end = month_start + timedelta(days=30)
        
        total = (await db.execute(select(func.sum(Payment.amount)).where(
            and_(Payment.created_at >= month_start, Payment.created_at <= month_end)
        ))).scalar() or 0
        
        # Mock breakdown (70% tuition, 20% fees, 10% documents)
        revenue_data.append({
            "month": month_start.strftime("%b %Y"),
            "tuition": int(total * 0.70 / 1000),
            "fees": int(total * 0.20 / 1000),
            "documents": int(total * 0.10 / 1000)
        })
    
    return revenue_data


@router.get("/export")
async def export_analytics_csv(
    campus: Optional[str] = Query(None),
    term: Optional[str] = Query(None),
    range: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Export analytics to CSV"""
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    # Generate mock export data
    export_data = [
        {'Month': 'Jan 2024', 'Users': 2577, 'Students': 2420, 'Teachers': 145, 'Revenue': 142500},
        {'Month': 'Feb 2024', 'Users': 2740, 'Students': 2580, 'Teachers': 148, 'Revenue': 151000},
        {'Month': 'Mar 2024', 'Users': 2815, 'Students': 2650, 'Teachers': 152, 'Revenue': 146900},
        {'Month': 'Apr 2024', 'Users': 2948, 'Students': 2780, 'Teachers': 155, 'Revenue': 170200},
        {'Month': 'May 2024', 'Users': 2992, 'Students': 2820, 'Teachers': 158, 'Revenue': 163200},
        {'Month': 'Jun 2024', 'Users': 3024, 'Students': 2847, 'Teachers': 162, 'Revenue': 169900}
    ]
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['Month', 'Users', 'Students', 'Teachers', 'Revenue'])
    writer.writeheader()
    for row in export_data:
        writer.writerow(row)
    
    output.seek(0)
    filename = f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
