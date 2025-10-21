"""
Idempotency middleware for preventing duplicate operations
"""
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.idempotency import IdempotencyKey
import json
import logging

logger = logging.getLogger(__name__)


async def require_idempotency_key(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> str:
    """
    Dependency to require and validate idempotency key
    
    Usage:
        @router.post("/payments", dependencies=[Depends(require_idempotency_key)])
        async def create_payment(...):
            ...
    
    Returns:
        The idempotency key string
        
    Raises:
        HTTPException if key is missing or operation already processed
    """
    # Get idempotency key from header
    idempotency_key = request.headers.get("Idempotency-Key")
    
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Idempotency-Key header"
        )
    
    # Check if key was already used
    result = await db.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == idempotency_key)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Return cached response
        logger.info(f"Idempotency key {idempotency_key} already processed")
        
        # Parse stored response
        try:
            response_data = json.loads(existing.response_data) if existing.response_data else {}
        except:
            response_data = {}
        
        # Return the stored response with same status code
        from fastapi.responses import JSONResponse
        return JSONResponse(
            content=response_data,
            status_code=existing.status_code
        )
    
    return idempotency_key


async def store_idempotency_result(
    idempotency_key: str,
    endpoint: str,
    request_data: dict,
    response_data: dict,
    status_code: int,
    db: AsyncSession
):
    """
    Store the result of an idempotent operation
    
    Args:
        idempotency_key: The idempotency key
        endpoint: The endpoint path
        request_data: Request payload
        response_data: Response payload
        status_code: HTTP status code
        db: Database session
    """
    try:
        idempotency_record = IdempotencyKey(
            key=idempotency_key,
            endpoint=endpoint,
            request_data=json.dumps(request_data),
            response_data=json.dumps(response_data),
            status_code=status_code
        )
        db.add(idempotency_record)
        await db.commit()
        logger.info(f"Stored idempotency key: {idempotency_key}")
    except Exception as e:
        logger.error(f"Failed to store idempotency key: {e}")
        # Don't fail the request if we can't store the key


class IdempotencyManager:
    """Manager for idempotency operations"""
    
    @staticmethod
    async def check_key(key: str, db: AsyncSession) -> IdempotencyKey | None:
        """Check if idempotency key exists"""
        result = await db.execute(
            select(IdempotencyKey).where(IdempotencyKey.key == key)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def store_key(
        key: str,
        endpoint: str,
        request_data: dict,
        response_data: dict,
        status_code: int,
        db: AsyncSession
    ):
        """Store idempotency key with request/response"""
        await store_idempotency_result(
            key, endpoint, request_data, response_data, status_code, db
        )
    
    @staticmethod
    async def get_cached_response(key: str, db: AsyncSession) -> tuple[dict, int] | None:
        """Get cached response for idempotency key"""
        existing = await IdempotencyManager.check_key(key, db)
        
        if not existing:
            return None
        
        try:
            response_data = json.loads(existing.response_data) if existing.response_data else {}
            return (response_data, existing.status_code)
        except:
            return ({}, existing.status_code)
