"""
Test Notifications Endpoints
/api/v1/notifications/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.communication import Notification, NotificationType, NotificationPriority


@pytest.mark.integration
@pytest.mark.notifications
class TestNotificationsEndpoints:
    """Test notifications endpoints."""

    async def test_create_notification_admin(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test creating a notification (admin only)"""
        notification_data = {
            "user_id": test_admin.id,
            "title": "Important System Update",
            "message": "The system will undergo maintenance on Monday.",
            "type": "system",
            "priority": "high",
            "action_url": "/system/maintenance",
            "action_text": "View Details",
            "related_entity_type": "system",
            "related_entity_id": 1
        }
        
        response = await client.post(
            "/api/v1/notifications",
            json=notification_data,
            headers=admin_token_headers
        )
        
        if response.status_code != 201:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == notification_data["title"]
        assert data["message"] == notification_data["message"]
        assert data["type"] == notification_data["type"]
        assert data["priority"] == notification_data["priority"]
        assert data["user_id"] == test_admin.id
        assert data["is_read"] is False

    async def test_list_notifications(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test listing notifications with pagination"""
        # Create test notifications
        for i in range(3):
            notification = Notification(
                user_id=test_admin.id,
                title=f"Test Notification {i+1}",
                message=f"This is test notification {i+1}",
                type=NotificationType.SYSTEM,
                priority=NotificationPriority.NORMAL
            )
            db_session.add(notification)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/notifications?page=1&page_size=10",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "pages" in data
        assert len(data["items"]) >= 3

    async def test_list_notifications_filter_unread(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test filtering notifications by unread status"""
        # Create read and unread notifications
        read_notif = Notification(
            user_id=test_admin.id,
            title="Read Notification",
            message="This was read",
            type=NotificationType.SYSTEM,
            is_read=True
        )
        unread_notif = Notification(
            user_id=test_admin.id,
            title="Unread Notification",
            message="This is unread",
            type=NotificationType.SYSTEM,
            is_read=False
        )
        db_session.add_all([read_notif, unread_notif])
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/notifications?is_read=false",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["is_read"] is False for item in data["items"])

    async def test_get_unread_count(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test getting unread notification count"""
        # Create unread notifications
        for i in range(5):
            notification = Notification(
                user_id=test_admin.id,
                title=f"Unread {i+1}",
                message=f"Message {i+1}",
                type=NotificationType.SYSTEM,
                is_read=False
            )
            db_session.add(notification)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/notifications/unread-count",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        assert data["unread_count"] >= 5

    async def test_get_notification_detail(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test getting notification by ID"""
        notification = Notification(
            user_id=test_admin.id,
            title="Detail Test",
            message="Test message for detail view",
            type=NotificationType.SYSTEM,
            priority=NotificationPriority.HIGH
        )
        db_session.add(notification)
        await db_session.commit()
        await db_session.refresh(notification)
        
        response = await client.get(
            f"/api/v1/notifications/{notification.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == notification.id
        assert data["title"] == "Detail Test"
        assert data["message"] == "Test message for detail view"

    async def test_mark_notification_read(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test marking a notification as read"""
        notification = Notification(
            user_id=test_admin.id,
            title="Mark Read Test",
            message="This will be marked as read",
            type=NotificationType.SYSTEM,
            is_read=False
        )
        db_session.add(notification)
        await db_session.commit()
        await db_session.refresh(notification)
        
        response = await client.put(
            f"/api/v1/notifications/{notification.id}/mark-read",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_read"] is True
        assert data["read_at"] is not None

    async def test_mark_all_notifications_read(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test marking all notifications as read"""
        # Create multiple unread notifications
        for i in range(3):
            notification = Notification(
                user_id=test_admin.id,
                title=f"Unread {i+1}",
                message=f"Message {i+1}",
                type=NotificationType.SYSTEM,
                is_read=False
            )
            db_session.add(notification)
        await db_session.commit()
        
        response = await client.post(
            "/api/v1/notifications/mark-all-read",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "marked" in data["message"].lower()

    async def test_delete_notification(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test deleting a notification"""
        notification = Notification(
            user_id=test_admin.id,
            title="Delete Test",
            message="This will be deleted",
            type=NotificationType.SYSTEM
        )
        db_session.add(notification)
        await db_session.commit()
        await db_session.refresh(notification)
        
        notification_id = notification.id
        
        response = await client.delete(
            f"/api/v1/notifications/{notification_id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/notifications/{notification_id}",
            headers=admin_token_headers
        )
        assert get_response.status_code == 404

    async def test_clear_all_notifications(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test clearing all READ notifications for user"""
        # Create multiple READ notifications
        for i in range(5):
            notification = Notification(
                user_id=test_admin.id,
                title=f"Clear Test {i+1}",
                message=f"Message {i+1}",
                type=NotificationType.SYSTEM,
                is_read=True  # Mark as read so they can be cleared
            )
            db_session.add(notification)
        await db_session.commit()
        
        response = await client.delete(
            "/api/v1/notifications/clear-all",
            headers=admin_token_headers
        )
        
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "cleared" in data["message"].lower() or "read" in data["message"].lower()
