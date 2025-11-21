"""
Test Admin Database Endpoints
/api/v1/admin-db/*
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
@pytest.mark.admin_db
class TestAdminDatabaseEndpoints:
    """Test admin database endpoints."""
    pass
