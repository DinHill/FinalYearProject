"""Integration tests for enrollment endpoints."""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


@pytest.mark.integration
@pytest.mark.academic
class TestEnrollmentEndpoints:
    """Test enrollment API endpoints."""
    
    def test_create_enrollment_success(
        self, 
        client: TestClient, 
        test_student, 
        test_section, 
        student_token, 
        mock_firebase_auth
    ):
        """Test successful course enrollment."""
        response = client.post(
            "/api/v1/academic/enrollments",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"section_id": test_section.id}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["section_id"] == test_section.id
        assert data["student_id"] == str(test_student.id)
        assert data["status"] == "enrolled"
    
    @pytest.mark.asyncio
    async def test_create_enrollment_section_full(
        self,
        client: TestClient,
        test_student,
        test_section,
        student_token,
        mock_firebase_auth,
        db_session
    ):
        """Test enrollment when section is full."""
        # Fill up the section
        test_section.current_enrollment = test_section.max_capacity
        db_session.add(test_section)
        await db_session.commit()
        
        response = client.post(
            "/api/v1/academic/enrollments",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"section_id": test_section.id}
        )
        
        assert response.status_code == 400
        assert "full" in response.json()["detail"].lower()
    
    def test_create_enrollment_already_enrolled(
        self,
        client: TestClient,
        test_student,
        test_enrollment,
        student_token,
        mock_firebase_auth
    ):
        """Test enrolling in same section twice."""
        response = client.post(
            "/api/v1/academic/enrollments",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"section_id": test_enrollment.section_id}
        )
        
        assert response.status_code == 400
        assert "already enrolled" in response.json()["detail"].lower()
    
    def test_get_my_enrollments(
        self,
        client: TestClient,
        test_student,
        test_enrollment,
        student_token,
        mock_firebase_auth
    ):
        """Test getting student's enrollments."""
        response = client.get(
            "/api/v1/academic/enrollments/my",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["section_id"] == test_enrollment.section_id
    
    def test_drop_enrollment_success(
        self,
        client: TestClient,
        test_student,
        test_enrollment,
        student_token,
        mock_firebase_auth
    ):
        """Test dropping an enrollment."""
        response = client.delete(
            f"/api/v1/academic/enrollments/{test_enrollment.id}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        assert "dropped" in response.json()["message"].lower()
    
    def test_drop_enrollment_not_own(
        self,
        client: TestClient,
        test_enrollment,
        teacher_token,
        mock_firebase_auth
    ):
        """Test dropping another student's enrollment (should fail)."""
        response = client.delete(
            f"/api/v1/academic/enrollments/{test_enrollment.id}",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.academic
class TestGradeEndpoints:
    """Test grade-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_my_gpa(
        self,
        client: TestClient,
        test_student,
        test_enrollment,
        student_token,
        mock_firebase_auth,
        db_session
    ):
        """Test getting student GPA."""
        # Add a grade to the enrollment
        from app.models import Grade
        grade = Grade(
            enrollment_id=test_enrollment.id,
            final_grade="A",
            created_at=datetime.utcnow()
        )
        db_session.add(grade)
        await db_session.commit()
        
        response = client.get(
            "/api/v1/academic/students/my/gpa",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "gpa" in data
        assert data["gpa"] == 4.0  # Grade A = 4.0
    
    def test_get_academic_standing(
        self,
        client: TestClient,
        test_student,
        student_token,
        mock_firebase_auth
    ):
        """Test getting academic standing."""
        response = client.get(
            "/api/v1/academic/students/my/academic-standing",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "cumulative_gpa" in data
        assert "academic_standing" in data
        assert "degree_progress" in data
