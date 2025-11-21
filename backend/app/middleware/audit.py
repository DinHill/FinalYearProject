"""
Audit logging middleware - captures all significant API actions
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.audit import AuditLog, ActionType
import logging
import json
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


# Methods that should be logged
AUDITABLE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths that should be excluded from audit logging
EXCLUDED_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
    "/api/v1/auth/username-to-email",  # Lookup only
    "/api/v1/audit/logs",  # Don't log audit log queries
    "/api/v1/audit/stats",  # Don't log audit stats queries
    "/api/v1/dashboard/stats",  # Read-only stats
}


def should_audit(method: str, path: str) -> bool:
    """Determine if request should be audited"""
    # Skip excluded paths
    if any(path.startswith(excluded) for excluded in EXCLUDED_PATHS):
        return False
    
    # Audit all write operations
    if method in AUDITABLE_METHODS:
        return True
    
    # Special cases for GET requests we want to audit
    if method == "GET":
        # Audit sensitive data exports
        if "/export" in path:
            return True
        if "/download" in path:
            return True
    
    return False


def extract_entity_info(path: str, method: str, body: Optional[Dict[str, Any]] = None) -> tuple[str, Optional[str], str]:
    """Extract entity type, ID, and action from request"""
    parts = path.split("/")
    
    # Determine action type
    action_map = {
        "POST": ActionType.CREATE,
        "PUT": ActionType.UPDATE,
        "PATCH": ActionType.UPDATE,
        "DELETE": ActionType.DELETE,
    }
    action = action_map.get(method, ActionType.API_REQUEST)
    
    # Extract entity from path
    entity = None
    entity_id = None
    
    if "/users" in path:
        entity = "User"
    elif "/courses" in path:
        entity = "Course"
    elif "/sections" in path:
        entity = "Section"
    elif "/enrollments" in path:
        entity = "Enrollment"
    elif "/grades" in path:
        entity = "Grade"
    elif "/attendance" in path:
        entity = "Attendance"
    elif "/invoices" in path:
        entity = "Invoice"
    elif "/payments" in path:
        entity = "Payment"
    elif "/announcements" in path:
        entity = "Announcement"
    elif "/documents" in path:
        entity = "Document"
    elif "/semesters" in path:
        entity = "Semester"
    elif "/majors" in path:
        entity = "Major"
    elif "/campuses" in path:
        entity = "Campus"
    elif "/settings" in path:
        entity = "Setting"
    
    # Try to extract entity ID from path (usually last numeric part)
    for part in reversed(parts):
        if part.isdigit():
            entity_id = part
            break
    
    # Build description
    if entity:
        if action == ActionType.CREATE:
            description = f"Created {entity}"
            if body:
                # Add key details from body
                name_fields = ["name", "title", "username", "email", "code"]
                for field in name_fields:
                    if field in body:
                        description += f" '{body[field]}'"
                        break
        elif action == ActionType.UPDATE:
            description = f"Updated {entity}"
            if entity_id:
                description += f" #{entity_id}"
        elif action == ActionType.DELETE:
            description = f"Deleted {entity}"
            if entity_id:
                description += f" #{entity_id}"
        else:
            description = f"{method} {path}"
    else:
        description = f"{method} {path}"
    
    return entity, entity_id, description


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware to log all significant API actions to audit log"""
    
    async def dispatch(self, request: Request, call_next):
        """Process request and create audit log if needed"""
        
        # Get request details
        method = request.method
        path = request.url.path
        
        # Check if request should be audited
        if not should_audit(method, path):
            return await call_next(request)
        
        # Get user info from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        user_email = getattr(request.state, "user_email", None)
        user_name = user_email.split("@")[0] if user_email else None  # Extract name from email as fallback
        
        # Get request body for context
        body = None
        if method in {"POST", "PUT", "PATCH"}:
            try:
                body = await request.body()
                if body:
                    body = json.loads(body)
                    # Restore body for downstream
                    async def receive():
                        return {"type": "http.request", "body": json.dumps(body).encode()}
                    request._receive = receive
            except:
                pass
        
        # Extract entity info
        entity, entity_id, description = extract_entity_info(path, method, body)
        
        # Determine action type for audit log
        action_map = {
            "POST": ActionType.CREATE,
            "PUT": ActionType.UPDATE,
            "PATCH": ActionType.UPDATE,
            "DELETE": ActionType.DELETE,
        }
        action_type = action_map.get(method, ActionType.API_REQUEST)
        
        # Get client IP
        ip_address = request.client.host if request.client else None
        
        # Get user agent
        user_agent = request.headers.get("user-agent")
        
        # Process request
        response = await call_next(request)
        
        # Determine status based on response code
        log_status = "success" if response.status_code < 400 else "failed"
        
        # Create audit log entry asynchronously
        try:
            async with AsyncSessionLocal() as db:
                audit_log = AuditLog(
                    user_id=user_id,
                    user_name=user_name,
                    user_email=user_email,
                    action=action_type.value if hasattr(action_type, 'value') else str(action_type),
                    entity=entity,
                    entity_id=entity_id,
                    description=description,
                    status=log_status,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    extra_data={
                        "method": method,
                        "path": path,
                        "status_code": response.status_code,
                        "request_id": getattr(request.state, "request_id", None)
                    }
                )
                db.add(audit_log)
                await db.commit()
                
                logger.debug(f"📝 Audit log created: {description}")
        except Exception as e:
            # Don't fail request if audit logging fails
            logger.error(f"Failed to create audit log: {e}")
        
        return response
