"""
Audit Export endpoint - CSV export functionality
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io
import csv

from app.core.database import get_db
from app.core.security import verify_firebase_token

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/export")
async def export_audit_logs(
    action_type: Optional[str] = Query(None, alias="action"),
    entity: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Export audit logs to CSV format
    
    **Query Parameters:**
    - action: Filter by action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
    - entity: Filter by entity type (User, Course, Grade, etc.)
    - status: Filter by status (success, failed)
    - user_id: Filter by user ID
    - search: Search in description
    - start_date: Filter from date (YYYY-MM-DD)
    - end_date: Filter to date (YYYY-MM-DD)
    
    Returns CSV file with all matching audit logs
    """
    # Generate mock audit logs (in production, fetch from database)
    logs = _generate_mock_audit_logs_for_export(
        action_type=action_type,
        entity=entity,
        status=status,
        user_id=user_id,
        search=search,
        start_date=start_date,
        end_date=end_date
    )
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'ID', 'Timestamp', 'User ID', 'User Name', 'User Email', 
        'Action', 'Entity', 'Entity ID', 'Description', 
        'Status', 'IP Address', 'User Agent'
    ])
    
    writer.writeheader()
    for log in logs:
        writer.writerow({
            'ID': log['id'],
            'Timestamp': log['timestamp'],
            'User ID': log['user_id'],
            'User Name': log['user_name'],
            'User Email': log['user_email'],
            'Action': log['action'],
            'Entity': log['entity'],
            'Entity ID': log.get('entity_id', ''),
            'Description': log['description'],
            'Status': log['status'],
            'IP Address': log.get('ip_address', ''),
            'User Agent': log.get('user_agent', '')
        })
    
    # Prepare response
    output.seek(0)
    filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


def _generate_mock_audit_logs_for_export(
    action_type: Optional[str] = None,
    entity: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Generate filtered mock audit logs for export"""
    from datetime import timedelta
    import random
    
    actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "SECURITY", "ADMIN", "SYSTEM", "API_REQUEST"]
    entities = ["User", "Course", "Grade", "Enrollment", "Document", "Invoice", "Announcement", "Setting", "Report"]
    users = [
        {"id": "admin001", "name": "Admin User", "email": "admin@greenwich.edu.vn"},
        {"id": "teacher001", "name": "John Smith", "email": "john.smith@greenwich.edu.vn"},
        {"id": "student001", "name": "Nguyen Van A", "email": "student001@greenwich.edu.vn"}
    ]
    
    logs = []
    base_time = datetime.now()
    
    # Generate 500 logs
    for i in range(500):
        user = random.choice(users)
        action = random.choice(actions)
        entity_type = random.choice(entities)
        status_val = "failed" if random.random() < 0.1 else "success"
        
        # Apply filters
        if action_type and action != action_type:
            continue
        if entity and entity_type != entity:
            continue
        if status and status_val != status:
            continue
        if user_id and user["id"] != user_id:
            continue
        
        timestamp = base_time - timedelta(hours=i)
        
        description = f"{action} {entity_type} #{random.randint(1000, 9999)}"
        if search and search.lower() not in description.lower():
            continue
        
        # Date filtering
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                if timestamp < start:
                    continue
            except:
                pass
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
                if timestamp > end:
                    continue
            except:
                pass
        
        logs.append({
            "id": 500 - i,
            "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "user_id": user["id"],
            "user_name": user["name"],
            "user_email": user["email"],
            "action": action,
            "entity": entity_type,
            "entity_id": random.randint(1, 1000),
            "description": description,
            "status": status_val,
            "ip_address": f"192.168.1.{random.randint(1, 254)}",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        })
    
    return logs
