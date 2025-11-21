import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.models.academic import Course
import uuid


@pytest.mark.asyncio
class TestSearchEndpoints:
    
    async def test_global_search(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        # Create test data
        uid = str(uuid.uuid4())
        user = User(
            firebase_uid=f"search-user-{uid}",
            email=f"search-{uid}@test.com",
            full_name="Search Test User",
            username=f"searchuser{uid[:8]}",
            role="student"
        )
        db_session.add(user)
        
        course_uid = str(uuid.uuid4())[:8]
        course = Course(
            course_code=f"SRCH{course_uid}",
            name="Search Test Course",
            credits=3
        )
        db_session.add(course)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/search/global?q=Search",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert data["query"] == "Search"
    
    async def test_search_suggestions(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        # Create test data
        uid = str(uuid.uuid4())
        user = User(
            firebase_uid=f"suggest-user-{uid}",
            email=f"suggest-{uid}@test.com",
            full_name="Suggest User",
            username=f"suggestuser{uid[:8]}",
            role="student"
        )
        db_session.add(user)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/search/suggestions?q=Sug",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
