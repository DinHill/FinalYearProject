"""
Test Settings Endpoints
/api/v1/settings/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import SystemSetting


@pytest.mark.integration
@pytest.mark.settings
class TestSettingsEndpoints:
    """Test settings endpoints."""
    
    async def test_create_setting_unauthorized(self, client: AsyncClient):
        """Test creating setting without authentication"""
        request_data = {
            "key": "test_setting",
            "value": "test_value",
            "category": "general"
        }
        response = await client.post("/api/v1/settings/", json=request_data)
        assert response.status_code == 401
    
    async def test_create_setting_success(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test creating setting successfully"""
        request_data = {
            "key": "new_setting",
            "value": "new_value",
            "category": "test",
            "description": "Test setting"
        }
        response = await client.post(
            "/api/v1/settings/",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["key"] == "new_setting"
        assert data["value"] == "new_value"
    
    async def test_get_settings_unauthorized(self, client: AsyncClient):
        """Test getting settings without authentication"""
        response = await client.get("/api/v1/settings/")
        assert response.status_code == 401
    
    async def test_get_settings_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting settings list"""
        # Create a test setting
        setting = SystemSetting(
            key="test_key",
            value="test_value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/settings/",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
    
    async def test_get_setting_by_id_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test getting setting by ID without authentication"""
        setting = SystemSetting(
            key="auth_test",
            value="value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        response = await client.get(f"/api/v1/settings/{setting.id}")
        assert response.status_code == 401
    
    async def test_get_setting_by_id_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test getting non-existent setting"""
        response = await client.get(
            "/api/v1/settings/999999",
            headers=admin_token_headers
        )
        assert response.status_code == 404
    
    async def test_get_setting_by_id_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting setting by ID"""
        setting = SystemSetting(
            key="id_test",
            value="test_value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        response = await client.get(
            f"/api/v1/settings/{setting.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == setting.id
        assert data["key"] == "id_test"
    
    async def test_get_setting_by_key_unauthorized(self, client: AsyncClient):
        """Test getting setting by key without authentication"""
        response = await client.get("/api/v1/settings/key/test_key")
        assert response.status_code == 401
    
    async def test_get_setting_by_key_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting setting by key"""
        setting = SystemSetting(
            key="key_test",
            value="key_value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/settings/key/key_test",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "key_test"
        assert data["value"] == "key_value"
    
    async def test_update_setting_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test updating setting without authentication"""
        setting = SystemSetting(
            key="update_test",
            value="old_value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        request_data = {"value": "new_value"}
        response = await client.put(
            f"/api/v1/settings/{setting.id}",
            json=request_data
        )
        assert response.status_code == 401
    
    async def test_update_setting_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test updating setting successfully"""
        setting = SystemSetting(
            key="update_test_2",
            value="old_value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        request_data = {"value": "updated_value"}
        response = await client.put(
            f"/api/v1/settings/{setting.id}",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["value"] == "updated_value"
    
    async def test_delete_setting_unauthorized(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test deleting setting without authentication"""
        setting = SystemSetting(
            key="delete_test",
            value="value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        response = await client.delete(f"/api/v1/settings/{setting.id}")
        assert response.status_code == 401
    
    async def test_delete_setting_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test deleting setting successfully"""
        setting = SystemSetting(
            key="delete_test_2",
            value="value",
            category="general"
        )
        db_session.add(setting)
        await db_session.commit()
        await db_session.refresh(setting)
        
        response = await client.delete(
            f"/api/v1/settings/{setting.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
    
    async def test_get_settings_by_category_unauthorized(self, client: AsyncClient):
        """Test getting settings by category without authentication"""
        response = await client.get("/api/v1/settings/category/general")
        assert response.status_code == 401
    
    async def test_get_settings_by_category_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting settings by category"""
        setting = SystemSetting(
            key="category_test",
            value="value",
            category="test_category"
        )
        db_session.add(setting)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/settings/category/test_category",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
