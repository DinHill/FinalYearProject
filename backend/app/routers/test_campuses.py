"""
Temporary standalone campuses and majors endpoint for testing
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import Campus, Major
from app.schemas.user import CampusResponse, MajorResponse
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["Test"])


@router.get("/campuses", response_model=List[CampusResponse])
async def test_list_campuses(db: AsyncSession = Depends(get_db)):
    """Test campuses endpoint (public, no auth required)"""
    logger.info("TEST: Fetching campuses...")
    result = await db.execute(select(Campus).order_by(Campus.id))
    campuses = result.scalars().all()
    logger.info(f"TEST: Found {len(campuses)} campuses")
    
    return [
        CampusResponse(
            id=campus.id,
            code=campus.code,
            name=campus.name,
            city=campus.city,
            is_active=campus.is_active,
            created_at=campus.created_at
        )
        for campus in campuses
    ]


@router.get("/majors", response_model=List[MajorResponse])
async def test_list_majors(db: AsyncSession = Depends(get_db)):
    """Test majors endpoint (public, no auth required)"""
    logger.info("TEST: Fetching majors...")
    result = await db.execute(select(Major).order_by(Major.id))
    majors = result.scalars().all()
    logger.info(f"TEST: Found {len(majors)} majors")
    
    return [
        MajorResponse(
            id=major.id,
            code=major.code,
            name=major.name,
            degree_type=None,  # Field doesn't exist in database yet
            credits_required=120,  # Default value
            is_active=major.is_active,
            created_at=major.created_at
        )
        for major in majors
    ]
