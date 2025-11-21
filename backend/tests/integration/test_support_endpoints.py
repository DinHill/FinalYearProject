"""
Test Support Tickets Endpoints
/api/v1/support/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.communication import SupportTicket, TicketEvent


@pytest.mark.integration
@pytest.mark.support
class TestSupportTicketsEndpoints:
    """Test support tickets endpoints."""

    async def test_create_support_ticket(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test creating a support ticket"""
        ticket_data = {
            "subject": "Cannot access course materials",
            "description": "I am unable to view the uploaded PDF files in Course CS101",
            "category": "technical",
            "priority": "high"
        }
        
        response = await client.post(
            "/api/v1/support/tickets",
            json=ticket_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["subject"] == ticket_data["subject"]
        assert data["description"] == ticket_data["description"]
        assert data["category"] == ticket_data["category"]
        assert data["priority"] == ticket_data["priority"]
        assert data["status"] == "open"
        assert data["user_id"] == test_admin.id

    async def test_list_support_tickets(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test listing support tickets with pagination"""
        # Create test tickets
        for i in range(3):
            ticket = SupportTicket(
                user_id=test_admin.id,
                subject=f"Test Ticket {i+1}",
                description=f"Description for ticket {i+1}",
                category="technical",
                priority="medium",
                status="open"
            )
            db_session.add(ticket)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/support/tickets?page=1&page_size=10",
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

    async def test_list_tickets_filter_by_status(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test filtering tickets by status"""
        # Create tickets with different statuses
        open_ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Open Ticket",
            description="This is open",
            category="technical",
            status="open"
        )
        closed_ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Closed Ticket",
            description="This is closed",
            category="technical",
            status="closed"
        )
        db_session.add_all([open_ticket, closed_ticket])
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/support/tickets?status=open",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Verify all returned tickets have status "open"
        for item in data["items"]:
            assert item["status"] == "open"

    async def test_get_ticket_detail(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test getting ticket by ID"""
        ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Detail Test Ticket",
            description="Testing detail view",
            category="academic",
            priority="high",
            status="open"
        )
        db_session.add(ticket)
        await db_session.commit()
        await db_session.refresh(ticket)
        
        response = await client.get(
            f"/api/v1/support/tickets/{ticket.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == ticket.id
        assert data["subject"] == "Detail Test Ticket"
        assert data["description"] == "Testing detail view"
        assert data["category"] == "academic"
        assert data["priority"] == "high"

    async def test_update_support_ticket(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test updating a support ticket (admin)"""
        ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Update Test",
            description="Will be updated",
            category="technical",
            priority="low",
            status="open"
        )
        db_session.add(ticket)
        await db_session.commit()
        await db_session.refresh(ticket)
        
        update_data = {
            "status": "in_progress",
            "priority": "high"
        }
        
        response = await client.put(
            f"/api/v1/support/tickets/{ticket.id}",
            json=update_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["priority"] == "high"

    async def test_create_ticket_event(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test adding a comment/event to ticket"""
        ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Event Test",
            description="Testing events",
            category="technical",
            status="open"
        )
        db_session.add(ticket)
        await db_session.commit()
        await db_session.refresh(ticket)
        
        event_data = {
            "event_type": "comment",
            "description": "This is a test comment on the ticket"
        }
        
        response = await client.post(
            f"/api/v1/support/tickets/{ticket.id}/events",
            json=event_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "comment"
        assert data["description"] == event_data["description"]
        assert data["ticket_id"] == ticket.id

    async def test_list_ticket_events(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test listing events for a ticket"""
        ticket = SupportTicket(
            user_id=test_admin.id,
            subject="Events List Test",
            description="Testing event listing",
            category="technical",
            status="open"
        )
        db_session.add(ticket)
        await db_session.commit()
        await db_session.refresh(ticket)
        
        # Create events
        for i in range(3):
            event = TicketEvent(
                ticket_id=ticket.id,
                event_type="comment",
                description=f"Comment {i+1}",
                created_by=test_admin.id
            )
            db_session.add(event)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/support/tickets/{ticket.id}/events",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

    async def test_get_support_stats(
        self,
        client: AsyncClient,
        admin_token_headers: dict,
        test_admin: User,
        db_session: AsyncSession
    ):
        """Test getting support statistics summary"""
        # Create tickets with various statuses
        for status in ["open", "in_progress", "closed"]:
            ticket = SupportTicket(
                user_id=test_admin.id,
                subject=f"Stats Test {status}",
                description="For stats testing",
                category="technical",
                status=status
            )
            db_session.add(ticket)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/support/stats/summary",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Check that stats contain expected keys
        assert "by_status" in data or "by_priority" in data
