"""
Test Campuses Endpoints
/api/v1/campuses/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import Campus


@pytest.mark.integration
@pytest.mark.campuses
class TestCampusesEndpoints:
    """Test campuses endpoints."""
    
    async def test_create_campus_unauthorized(self, client: AsyncClient):
        """Test creating campus without authentication"""
        request_data = {
            "name": "Test Campus",
            "code": "TC",
            "address": "123 Test St"
        }
        response = await client.post("/api/v1/campuses/", json=request_data)
        assert response.status_code == 401
    
    async def test_create_campus_success(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test creating campus successfully"""
        request_data = {
            "name": "New Campus",
            "code": "NC",
            "address": "456 New St"
        }
        response = await client.post(
            "/api/v1/campuses/",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Campus"
        assert data["code"] == "NC"
    
    async def test_get_campuses_unauthorized(self, client: AsyncClient):
        """Test getting campuses list without authentication"""
        response = await client.get("/api/v1/campuses/")
        assert response.status_code == 401
    
    async def test_get_campuses_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_campus
    ):
        """Test getting campuses list"""
        response = await client.get(
            "/api/v1/campuses/",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    async def test_get_campus_by_id_unauthorized(
        self, client: AsyncClient, test_campus
    ):
        """Test getting campus by ID without authentication"""
        response = await client.get(f"/api/v1/campuses/{test_campus.id}")
        assert response.status_code == 401
    
    async def test_get_campus_by_id_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test getting non-existent campus"""
        response = await client.get(
            "/api/v1/campuses/999999",
            headers=admin_token_headers
        )
        assert response.status_code == 404
    
    async def test_get_campus_by_id_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_campus
    ):
        """Test getting campus by ID"""
        response = await client.get(
            f"/api/v1/campuses/{test_campus.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_campus.id
        assert data["name"] == test_campus.name
    
    async def test_update_campus_unauthorized(
        self, client: AsyncClient, test_campus
    ):
        """Test updating campus without authentication"""
        request_data = {"name": "Updated Campus"}
        response = await client.put(
            f"/api/v1/campuses/{test_campus.id}",
            json=request_data
        )
        assert response.status_code == 401
    
    async def test_update_campus_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test updating non-existent campus"""
        request_data = {"name": "Updated Campus"}
        response = await client.put(
            "/api/v1/campuses/999999",
            json=request_data,
            headers=admin_token_headers
        )
        assert response.status_code == 404
    
    async def test_update_campus_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_campus
    ):
        """Test updating campus successfully"""
        request_data = {"name": "Updated Campus Name"}
        response = await client.put(
            f"/api/v1/campuses/{test_campus.id}",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Campus Name"
    
    async def test_delete_campus_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test deleting campus without authentication"""
        # Create a campus to delete
        campus = Campus(name="Delete Test", code="DT", address="Delete St")
        db_session.add(campus)
        await db_session.commit()
        await db_session.refresh(campus)
        
        response = await client.delete(f"/api/v1/campuses/{campus.id}")
        assert response.status_code == 401
    
    async def test_delete_campus_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test deleting campus successfully"""
        # Create a campus to delete
        campus = Campus(name="Delete Test 2", code="DT2", address="Delete St 2")
        db_session.add(campus)
        await db_session.commit()
        await db_session.refresh(campus)
        
        response = await client.delete(
            f"/api/v1/campuses/{campus.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
    
    async def test_get_campus_stats_unauthorized(
        self, client: AsyncClient, test_campus
    ):
        """Test getting campus stats without authentication"""
        response = await client.get(f"/api/v1/campuses/{test_campus.id}/stats")
        assert response.status_code == 401
    
    async def test_get_campus_stats_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_campus
    ):
        """Test getting campus stats"""
        response = await client.get(
            f"/api/v1/campuses/{test_campus.id}/stats",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "campus_id" in data
        assert "total_students" in data
        assert "total_teachers" in data
    
    async def test_get_all_campus_stats_unauthorized(self, client: AsyncClient):
        """Test getting all campus stats without authentication"""
        response = await client.get("/api/v1/campuses/stats/all")
        assert response.status_code == 401
    
    async def test_get_all_campus_stats_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_campus
    ):
        """Test getting all campus stats"""
        response = await client.get(
            "/api/v1/campuses/stats/all",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


