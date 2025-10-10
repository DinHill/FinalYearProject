"""Integration tests for authentication endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
@pytest.mark.auth
class TestAuthEndpoints:
    """Test authentication API endpoints."""
    
    def test_student_login_success(self, client: TestClient, test_student, mock_firebase_auth):
        """Test successful student login."""
        response = client.post(
            "/api/v1/auth/student-login",
            json={
                "student_id": "HieuNDGCD220033",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "custom_token" in data
        assert "user" in data
        assert data["user"]["username"] == "HieuNDGCD220033"
        assert data["user"]["role"] == "student"
    
    def test_student_login_wrong_password(self, client: TestClient, test_student):
        """Test student login with wrong password."""
        response = client.post(
            "/api/v1/auth/student-login",
            json={
                "student_id": "HieuNDGCD220033",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_student_login_nonexistent_user(self, client: TestClient):
        """Test student login with non-existent user."""
        response = client.post(
            "/api/v1/auth/student-login",
            json={
                "student_id": "NonexistentUser",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401
    
    def test_student_login_inactive_user(self, client: TestClient, test_student, db_session):
        """Test student login with inactive user."""
        # Deactivate user
        test_student.is_active = False
        db_session.add(test_student)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/student-login",
            json={
                "student_id": "HieuNDGCD220033",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()
    
    def test_get_current_user(self, client: TestClient, test_student, student_token, mock_firebase_auth):
        """Test getting current user profile."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "HieuNDGCD220033"
        assert data["role"] == "student"
    
    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
    
    def test_change_password_success(self, client: TestClient, test_student, student_token, mock_firebase_auth):
        """Test successful password change."""
        response = client.put(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "current_password": "password123",
                "new_password": "newpassword456"
            }
        )
        
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()
    
    def test_change_password_wrong_current(self, client: TestClient, test_student, student_token, mock_firebase_auth):
        """Test password change with wrong current password."""
        response = client.put(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456"
            }
        )
        
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_change_password_weak_new_password(self, client: TestClient, test_student, student_token, mock_firebase_auth):
        """Test password change with weak new password."""
        response = client.put(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "current_password": "password123",
                "new_password": "123"  # Too short
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_logout(self, client: TestClient, test_student, student_token, mock_firebase_auth):
        """Test user logout."""
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()
