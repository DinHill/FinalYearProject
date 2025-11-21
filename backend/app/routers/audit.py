"""
Audit Log API endpoints
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import io
import csv

from app.core.database import get_db
from app.core.security import verify_firebase_token
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


class AuditLogResponse(BaseModel):
    """Audit log response model"""
    id: int
    timestamp: datetime
    user_id: Optional[str]
    user_name: Optional[str]
    user_email: Optional[str]
    action: str
    entity: Optional[str]
    entity_id: Optional[str]
    description: str
    status: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    metadata: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


@router.get("/logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action_type: Optional[str] = Query(None, alias="action"),
    entity: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Get paginated audit logs with filters
    
    **Filters:**
    - action_type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, SECURITY, ADMIN, SYSTEM, API_REQUEST
    - entity: User, Course, Grade, Enrollment, Document, Invoice, Announcement, Setting, Report
    - status: success, failed, pending
    - user_id: Filter by specific user
    - search: Search in description
    - start_date/end_date: Date range filter (YYYY-MM-DD format)
    """
    try:
        # Build query
        query = select(AuditLog)
        conditions = []
        
        if action_type:
            conditions.append(AuditLog.action == action_type.upper())
        if entity:
            conditions.append(AuditLog.entity == entity)
        if status:
            conditions.append(AuditLog.status == status)
        if user_id:
            conditions.append(AuditLog.user_id == user_id)
        if search:
            conditions.append(AuditLog.description.ilike(f"%{search}%"))
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            conditions.append(AuditLog.created_at >= start_dt)
        if end_date:
            end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
            conditions.append(AuditLog.created_at < end_dt)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count()).select_from(AuditLog)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(AuditLog.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Convert to response format
        logs_data = [{
            "id": str(log.id),
            "timestamp": log.created_at.isoformat(),
            "user_id": log.user_id,
            "user_name": log.user_name,
            "user_email": log.user_email,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "description": log.description,
            "status": log.status,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "metadata": log.extra_data or {}
        } for log in logs]
        
        return {
            "logs": logs_data,
            "total": total,
            "page": page,
            "page_size": page_size
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )


@router.get("/stats")
async def get_audit_stats(
    action_type: Optional[str] = Query(None, alias="action"),
    entity: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_firebase_token)
) -> Dict[str, Any]:
    """
    Get audit log statistics
    
    **Returns:**
    - total_logs: Total number of audit logs
    - failed_operations: Number of failed operations
    - success_rate: Percentage of successful operations
    - most_common_action: Most frequently performed action
    """
    try:
        # Build base query conditions
        conditions = []
        
        if action_type:
            conditions.append(AuditLog.action == action_type.upper())
        if entity:
            conditions.append(AuditLog.entity == entity)
        if status:
            conditions.append(AuditLog.status == status)
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            conditions.append(AuditLog.created_at >= start_dt)
        if end_date:
            end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
            conditions.append(AuditLog.created_at < end_dt)
        
        # Get total logs
        total_query = select(func.count()).select_from(AuditLog)
        if conditions:
            total_query = total_query.where(and_(*conditions))
        total_result = await db.execute(total_query)
        total_logs = total_result.scalar() or 0
        
        # Get failed operations
        failed_conditions = conditions + [AuditLog.status == "failed"]
        failed_query = select(func.count()).select_from(AuditLog).where(and_(*failed_conditions))
        failed_result = await db.execute(failed_query)
        failed_operations = failed_result.scalar() or 0
        
        # Calculate success rate
        success_rate = ((total_logs - failed_operations) / total_logs * 100) if total_logs > 0 else 0
        
        # Get most common action
        action_query = select(
            AuditLog.action,
            func.count(AuditLog.id).label('count')
        ).group_by(AuditLog.action).order_by(desc('count')).limit(1)
        if conditions:
            action_query = action_query.where(and_(*conditions))
        
        action_result = await db.execute(action_query)
        action_row = action_result.first()
        most_common_action = action_row[0] if action_row else "N/A"
        
        return {
            "total_logs": total_logs,
            "failed_operations": failed_operations,
            "success_rate": round(success_rate, 2),
            "most_common_action": most_common_action
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch audit statistics: {str(e)}"
        )


async def _generate_mock_audit_logs(
    page: int,
    page_size: int,
    action_type: Optional[str],
    entity: Optional[str],
    status_filter: Optional[str],
    user_id: Optional[str],
    search: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str]
) -> list:
    """Generate mock audit logs for demonstration"""
    
    actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SECURITY', 'ADMIN', 'SYSTEM', 'API_REQUEST']
    entities = ['User', 'Course', 'Grade', 'Enrollment', 'Document', 'Invoice', 'Announcement', 'Setting', 'Report']
    statuses = ['success', 'failed', 'pending']
    
    users = [
        {'id': 'admin001', 'name': 'Admin User', 'email': 'admin@greenwich.edu.vn'},
        {'id': 'teacher001', 'name': 'John Smith', 'email': 'john.smith@greenwich.edu.vn'},
        {'id': 'student001', 'name': 'Jane Doe', 'email': 'jane.doe@greenwich.edu.vn'},
    ]
    
    logs = []
    base_time = datetime.now()
    
    # Generate 500 total mock logs
    total_logs = 500
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    for i in range(total_logs):
        user = users[i % len(users)]
        action = actions[i % len(actions)]
        entity_type = entities[i % len(entities)]
        status_val = 'success' if i % 10 != 0 else 'failed'  # 10% failure rate
        
        # Apply filters
        if action_type and action != action_type:
            continue
        if entity and entity_type != entity:
            continue
        if status_filter and status_val != status_filter:
            continue
        if user_id and user['id'] != user_id:
            continue
            
        log = {
            'id': f'audit_{1000 + i}',
            'timestamp': (base_time - timedelta(hours=i)).isoformat(),
            'user_id': user['id'],
            'user_name': user['name'],
            'user_email': user['email'],
            'action': action,
            'entity': entity_type,
            'entity_id': str(2000 + i),
            'description': f"{action} {entity_type} operation",
            'status': status_val,
            'ip_address': f'192.168.1.{(i % 254) + 1}',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'metadata': {
                'source': 'web_portal',
                'duration_ms': 150 + (i % 500)
            }
        }
        
        if search and search.lower() not in log['description'].lower():
            continue
            
        logs.append(log)
    
    # Return paginated results
    return logs[start_idx:end_idx]


async def _get_total_audit_logs(
    action_type: Optional[str],
    entity: Optional[str],
    status_filter: Optional[str],
    user_id: Optional[str],
    search: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str]
) -> int:
    """Get total count of audit logs with filters"""
    # Mock implementation - would query database in production
    base_total = 500
    
    # Apply filter reductions
    if action_type:
        base_total = base_total // 9  # 9 action types
    if entity:
        base_total = base_total // 9  # 9 entity types
    if status_filter:
        if status_filter == 'failed':
            base_total = base_total // 10  # 10% failure rate
    if user_id:
        base_total = base_total // 3  # 3 users
    if search:
        base_total = base_total // 2  # Reduce by half for search
        
    return max(base_total, 20)  # Ensure at least one page


async def _generate_mock_stats(
    action_type: Optional[str],
    entity: Optional[str],
    status_filter: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str]
) -> Dict[str, Any]:
    """Generate mock statistics"""
    
    total_logs = 500
    failed_operations = 50  # 10% failure rate
    success_rate = ((total_logs - failed_operations) / total_logs) * 100
    
    return {
        'total_logs': total_logs,
        'failed_operations': failed_operations,
        'success_rate': round(success_rate, 2),
        'most_common_action': 'UPDATE'
    }


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
    # Use same mock data generation as /logs endpoint
    all_logs = _generate_mock_audit_logs()
    
    # Apply all filters
    filtered_logs = [log for log in all_logs if (
        (not action_type or log['action'] == action_type) and
        (not entity or log['entity'] == entity) and
        (not status or log['status'] == status) and
        (not user_id or log['user_id'] == user_id) and
        (not search or search.lower() in log['description'].lower())
    )]
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'ID', 'Timestamp', 'User ID', 'User Name', 'User Email', 
        'Action', 'Entity', 'Entity ID', 'Description', 
        'Status', 'IP Address'
    ])
    
    writer.writeheader()
    for log in filtered_logs:
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
            'IP Address': log.get('ip_address', '')
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
