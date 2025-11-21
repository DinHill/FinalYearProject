"""
Test Schedule Endpoints
/api/v1/schedule/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.models.academic import SectionSchedule, CourseSection, Course, Semester
from datetime import date


@pytest.mark.integration
@pytest.mark.schedule
class TestScheduleEndpoints:
    """Test schedule endpoints."""
    
    async def test_get_calendar_unauthorized(self, client: AsyncClient):
        """Test getting calendar without authentication"""
        response = await client.get("/api/v1/schedule/calendar")
        assert response.status_code == 401
    
    async def test_get_calendar_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test getting calendar with authentication"""
        # Create a schedule for the test section
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Monday",  # Monday
            start_time="09:00",
            end_time="10:30",
            room="A101"
        )
        db_session.add(schedule)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/schedule/calendar?start_date=2024-01-01&end_date=2024-12-31",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_calendar_with_date_filter(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test getting calendar with date range filter"""
        response = await client.get(
            "/api/v1/schedule/calendar?start_date=2024-01-01&end_date=2024-12-31",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_section_schedule_unauthorized(
        self, client: AsyncClient, test_section
    ):
        """Test getting section schedule without authentication"""
        response = await client.get(f"/api/v1/schedule/section/{test_section.id}")
        assert response.status_code == 401
    
    async def test_get_section_schedule_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test getting section schedule"""
        # Create a schedule for the test section
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Tuesday",  # Tuesday
            start_time="14:00",
            end_time="15:30",
            room="B201"
        )
        db_session.add(schedule)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/schedule/section/{test_section.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_section_schedule_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test getting schedule for non-existent section"""
        response = await client.get(
            "/api/v1/schedule/section/999999",
            headers=admin_token_headers
        )
        
        assert response.status_code == 404
    
    async def test_check_conflicts_no_conflicts(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test conflict check when no conflicts exist"""
        request_data = {
            "section_id": test_section.id,
            "schedules": [
                {
                    "day_of_week": "Monday",
                    "start_time": "09:00",
                    "end_time": "10:30"
                }
            ]
        }
        
        response = await client.post(
            "/api/v1/schedule/check-conflicts",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "has_conflicts" in data
        assert "conflicts" in data
    
    async def test_create_schedule_unauthorized(
        self, client: AsyncClient, test_section
    ):
        """Test creating schedule without authentication"""
        request_data = {
            "section_id": test_section.id,
            "day_of_week": "Monday",
            "start_time": "09:00",
            "end_time": "10:30",
            "room": "A101"
        }
        
        response = await client.post(
            "/api/v1/schedule",
            json=request_data
        )
        
        assert response.status_code == 401
    
    async def test_create_schedule_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test creating schedule successfully"""
        request_data = {
            "section_id": test_section.id,
            "day_of_week": "Wednesday",  # Wednesday
            "start_time": "11:00",
            "end_time": "12:30",
            "room": "C301",
            "building": "Main Building"
        }
        
        response = await client.post(
            "/api/v1/schedule",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["section_id"] == test_section.id
        assert data["day_of_week"] == 2  # Wednesday is index 2 (Monday=0)
        assert data["room"] == "C301"
    
    async def test_update_schedule_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession, test_section
    ):
        """Test updating schedule without authentication"""
        # Create a schedule first
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Monday",
            start_time="09:00",
            end_time="10:30"
        )
        db_session.add(schedule)
        await db_session.commit()
        await db_session.refresh(schedule)
        
        request_data = {"room": "Updated Room"}
        
        response = await client.put(
            f"/api/v1/schedule/{schedule.id}",
            json=request_data
        )
        
        assert response.status_code == 401
    
    async def test_update_schedule_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test updating schedule successfully"""
        # Create a schedule first
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Monday",
            start_time="09:00",
            end_time="10:30",
            room="Original Room"
        )
        db_session.add(schedule)
        await db_session.commit()
        await db_session.refresh(schedule)
        
        request_data = {
            "room": "Updated Room",
            "building": "New Building"
        }
        
        response = await client.put(
            f"/api/v1/schedule/{schedule.id}",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["room"] == "Updated Room"
        assert data["building"] == "New Building"
    
    async def test_delete_schedule_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession, test_section
    ):
        """Test deleting schedule without authentication"""
        # Create a schedule first
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Monday",
            start_time="09:00",
            end_time="10:30"
        )
        db_session.add(schedule)
        await db_session.commit()
        await db_session.refresh(schedule)
        
        response = await client.delete(f"/api/v1/schedule/{schedule.id}")
        
        assert response.status_code == 401
    
    async def test_delete_schedule_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_section
    ):
        """Test deleting schedule successfully"""
        # Create a schedule first
        schedule = SectionSchedule(
            section_id=test_section.id,
            day_of_week="Monday",
            start_time="09:00",
            end_time="10:30"
        )
        db_session.add(schedule)
        await db_session.commit()
        await db_session.refresh(schedule)
        
        response = await client.delete(
            f"/api/v1/schedule/{schedule.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

