import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from app.models import User
from app.models.academic import Course, Enrollment
from app.models.finance import Invoice, Payment
from app.models.document import Announcement
from app.models.communication import SupportTicket


@pytest.mark.asyncio
class TestDashboardEndpoints:
    
    async def test_get_dashboard_stats(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_admin: User
    ):
        response = await client.get(
            "/api/v1/dashboard/stats",
            headers=admin_token_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "academics" in data
        assert "finance" in data
    
    async def test_get_recent_activity(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.get(
            "/api/v1/dashboard/recent-activity?limit=5",
            headers=admin_token_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "total" in data
    
    async def test_get_user_activity_analytics(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.get(
            "/api/v1/dashboard/analytics/user-activity",
            headers=admin_token_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "active_users" in data
        assert "activity_by_role" in data
    
    async def test_get_enrollment_trends(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.get(
            "/api/v1/dashboard/analytics/enrollment-trends?days=30",
            headers=admin_token_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "period_days" in data
        assert "top_courses" in data
    
    async def test_get_revenue_analytics(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.get(
            "/api/v1/dashboard/analytics/revenue?days=30",
            headers=admin_token_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "outstanding" in data
