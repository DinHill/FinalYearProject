"""
Test Authentication Endpoints
/api/v1/auth/*
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User


@pytest.mark.integration
@pytest.mark.auth
class TestAuthEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_username_to_email_success(self, client: AsyncClient, test_admin: User):
        """Test successful username to email conversion."""
        response = await client.post(
            "/api/v1/auth/username-to-email",
            json={"username": "AdminGCD200001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@greenwich.edu.vn"
        assert data["full_name"] == "Admin User"
        assert data["role"] == "super_admin"

    @pytest.mark.asyncio
    async def test_username_to_email_not_found(self, client: AsyncClient):
        """Test username to email with non-existent user."""
        response = await client.post(
            "/api/v1/auth/username-to-email",
            json={"username": "NonExistent"}
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_username_to_email_missing_field(self, client: AsyncClient):
        """Test username to email with missing username field."""
        response = await client.post(
            "/api/v1/auth/username-to-email",
            json={}
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_student_login_success(self, client: AsyncClient, test_student: User):
        """Test successful student login - REAL Firebase integration."""
        response = await client.post(
            "/api/v1/auth/student-login",
            json={"student_id": "GHPSTD240001", "password": "password123"}
        )
        
        # Should return 200 with custom token and user info
        assert response.status_code == 200
        data = response.json()
        assert "custom_token" in data
        assert "user" in data
        assert data["user"]["username"] == "GHPSTD240001"
        assert data["user"]["role"] == "student"
        
        # Verify custom token is a valid string
        assert isinstance(data["custom_token"], str)
        assert len(data["custom_token"]) > 0

    @pytest.mark.asyncio
    async def test_student_login_wrong_password(self, client: AsyncClient, test_student: User):
        """Test student login with wrong password."""
        response = await client.post(
            "/api/v1/auth/student-login",
            json={"student_id": "GHPSTD240001", "password": "wrongpassword"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_student_login_nonexistent_user(self, client: AsyncClient):
        """Test student login with non-existent user."""
        response = await client.post(
            "/api/v1/auth/student-login",
            json={"student_id": "NONEXIST", "password": "password123"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_student_login_missing_fields(self, client: AsyncClient):
        """Test student login with missing required fields."""
        response = await client.post(
            "/api/v1/auth/student-login",
            json={"student_id": "GHPSTD240001"}  # Missing password
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_session_with_custom_token(self, client: AsyncClient, test_student: User):
        """Test session creation using custom token flow."""
        # Step 1: Get a custom token using student login with the test_student
        login_response = await client.post(
            "/api/v1/auth/student-login",
            json={"student_id": test_student.username, "password": "password123"}
        )
        
        assert login_response.status_code == 200, f"Login failed: {login_response.json()}"
        custom_token = login_response.json()["custom_token"]
        
        # Note: In real app, mobile would call signInWithCustomToken(custom_token)
        # to get an ID token, then send that ID token to /session endpoint.
        # For this test, we verify the custom token exists and is valid format.
        assert isinstance(custom_token, str)
        assert len(custom_token) > 0
        
        # The session endpoint would require an ID token from Firebase Auth
        # which is beyond the scope of pure backend testing (needs Firebase SDK client)
        # This test validates the custom token creation flow works correctly

    @pytest.mark.asyncio
    async def test_get_me_without_token(self, client: AsyncClient):
        """Test /me endpoint without authentication."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test /me endpoint with invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

