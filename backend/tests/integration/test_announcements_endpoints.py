"""
Integration tests for Announcements endpoints
"""
import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.document import Announcement


@pytest.mark.asyncio
class TestAnnouncementsEndpoints:
    """Test announcements CRUD operations"""
    
    async def test_create_announcement_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict
    ):
        """Test creating an announcement as admin"""
        announcement_data = {
            "title": "Important System Maintenance",
            "content": "The system will be under maintenance on Saturday from 2 AM to 6 AM.",
            "target_audience": "all",
            "is_published": False,
            "publish_date": (datetime.now() + timedelta(hours=1)).isoformat(),
            "expire_date": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        response = await client.post(
            "/api/v1/announcements",
            json=announcement_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == announcement_data["title"]
        assert data["content"] == announcement_data["content"]
        assert data["target_audience"] == "all"
        assert data["is_published"] is False
        assert data["author_id"] == test_admin.id
    
    async def test_list_announcements(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test listing announcements with pagination"""
        # Create test announcements
        for i in range(3):
            announcement = Announcement(
                title=f"Announcement {i+1}",
                content=f"This is announcement number {i+1}",
                author_id=test_admin.id,
                target_audience="all",
                is_published=True
            )
            db_session.add(announcement)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/announcements?page=1&page_size=10",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 3
        assert data["total"] >= 3
    
    async def test_list_announcements_filter_published(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test filtering announcements by published status"""
        # Create published announcement
        published = Announcement(
            title="Published Announcement",
            content="This is published",
            author_id=test_admin.id,
            is_published=True
        )
        db_session.add(published)
        
        # Create unpublished announcement
        unpublished = Announcement(
            title="Draft Announcement",
            content="This is a draft",
            author_id=test_admin.id,
            is_published=False
        )
        db_session.add(unpublished)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/announcements?is_published=true",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["is_published"] is True
    
    async def test_get_announcement_detail(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting announcement detail by ID"""
        announcement = Announcement(
            title="Detailed Announcement",
            content="Full content here",
            author_id=test_admin.id,
            target_audience="students",
            is_published=True
        )
        db_session.add(announcement)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/announcements/{announcement.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == announcement.id
        assert data["title"] == "Detailed Announcement"
        assert data["content"] == "Full content here"
        assert data["target_audience"] == "students"
    
    async def test_update_announcement(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test updating an announcement"""
        announcement = Announcement(
            title="Original Title",
            content="Original content",
            author_id=test_admin.id
        )
        db_session.add(announcement)
        await db_session.commit()
        
        update_data = {
            "title": "Updated Title",
            "content": "Updated content with more details",
            "target_audience": "teachers"
        }
        
        response = await client.put(
            f"/api/v1/announcements/{announcement.id}",
            json=update_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content with more details"
        assert data["target_audience"] == "teachers"
    
    async def test_delete_announcement(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test deleting an announcement"""
        announcement = Announcement(
            title="To Be Deleted",
            content="This will be deleted",
            author_id=test_admin.id
        )
        db_session.add(announcement)
        await db_session.commit()
        announcement_id = announcement.id
        
        response = await client.delete(
            f"/api/v1/announcements/{announcement_id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/announcements/{announcement_id}",
            headers=admin_token_headers
        )
        assert get_response.status_code == 404
    
    async def test_publish_announcement(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test publishing an announcement"""
        announcement = Announcement(
            title="Draft to Publish",
            content="This will be published",
            author_id=test_admin.id,
            is_published=False
        )
        db_session.add(announcement)
        await db_session.commit()
        
        response = await client.post(
            f"/api/v1/announcements/{announcement.id}/publish",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_published"] is True
        assert data["publish_date"] is not None
    
    async def test_unpublish_announcement(
        self,
        client: AsyncClient,
        test_admin: User,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test unpublishing an announcement"""
        announcement = Announcement(
            title="Published to Unpublish",
            content="This will be unpublished",
            author_id=test_admin.id,
            is_published=True,
            publish_date=datetime.now()
        )
        db_session.add(announcement)
        await db_session.commit()
        
        response = await client.post(
            f"/api/v1/announcements/{announcement.id}/unpublish",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_published"] is False
