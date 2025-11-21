"""
Test Bulk Operations Endpoints
/api/v1/bulk/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.models.academic import Enrollment, Grade, CourseSection


@pytest.mark.integration
@pytest.mark.bulk
class TestBulkEndpoints:
    """Test bulk operations endpoints."""
    
    async def test_bulk_update_users_unauthorized(self, client: AsyncClient):
        """Test bulk updating users without authentication"""
        request_data = {
            "user_ids": [1, 2],
            "updates": {"status": "active"}
        }
        response = await client.post("/api/v1/bulk/users/update", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_update_users_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_student
    ):
        """Test bulk updating users successfully"""
        request_data = {
            "user_ids": [test_student.id],
            "updates": {"status": "active"}
        }
        response = await client.post(
            "/api/v1/bulk/users/update",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
        assert "total" in data
    
    async def test_bulk_delete_users_unauthorized(self, client: AsyncClient):
        """Test bulk deleting users without authentication"""
        request_data = {"user_ids": [1, 2]}
        response = await client.post("/api/v1/bulk/users/delete", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_delete_users_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test bulk deleting users successfully"""
        # Create test users
        user1 = User(
            username="bulkuser1",
            email="bulk1@test.com",
            full_name="Bulk User1",
            role="student"
        )
        user2 = User(
            username="bulkuser2",
            email="bulk2@test.com",
            full_name="Bulk User2",
            role="student"
        )
        db_session.add_all([user1, user2])
        await db_session.commit()
        await db_session.refresh(user1)
        await db_session.refresh(user2)
        
        request_data = {"user_ids": [user1.id, user2.id]}
        response = await client.post(
            "/api/v1/bulk/users/delete",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
    
    async def test_bulk_update_enrollments_unauthorized(self, client: AsyncClient):
        """Test bulk updating enrollments without authentication"""
        request_data = {
            "enrollment_ids": [1, 2],
            "updates": {"status": "active"}
        }
        response = await client.post("/api/v1/bulk/enrollments/update", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_update_enrollments_success(
        self, client: AsyncClient, admin_token_headers: dict,
        test_enrollment
    ):
        """Test bulk updating enrollments successfully"""
        request_data = {
            "enrollment_ids": [test_enrollment.id],
            "updates": {"status": "active"}
        }
        response = await client.post(
            "/api/v1/bulk/enrollments/update",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
        assert "total" in data
    
    async def test_bulk_delete_enrollments_unauthorized(self, client: AsyncClient):
        """Test bulk deleting enrollments without authentication"""
        request_data = {"enrollment_ids": [1, 2]}
        response = await client.post("/api/v1/bulk/enrollments/delete", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_delete_enrollments_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_student, test_section
    ):
        """Test bulk deleting enrollments successfully"""
        # Create test enrollments
        enrollment1 = Enrollment(
            student_id=test_student.id,
            course_section_id=test_section.id,
            status="enrolled"
        )
        # create a second section so we don't violate unique constraint
        section2 = CourseSection(
            course_id=test_section.course_id,
            semester_id=test_section.semester_id,
            section_code="BULK2"
        )
        db_session.add(section2)
        await db_session.commit()
        await db_session.refresh(section2)

        enrollment2 = Enrollment(
            student_id=test_student.id,
            course_section_id=section2.id,
            status="enrolled"
        )
        db_session.add_all([enrollment1, enrollment2])
        await db_session.commit()
        await db_session.refresh(enrollment1)
        await db_session.refresh(enrollment2)
        
        request_data = {"enrollment_ids": [enrollment1.id, enrollment2.id]}
        response = await client.post(
            "/api/v1/bulk/enrollments/delete",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
    
    async def test_bulk_update_grades_unauthorized(self, client: AsyncClient):
        """Test bulk updating grades without authentication"""
        request_data = {
            "grade_ids": [1, 2],
            "updates": {"score": 85.0}
        }
        response = await client.post("/api/v1/bulk/grades/update", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_update_grades_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_enrollment
    ):
        """Test bulk updating grades successfully"""
        # Create test grades
        grade1 = Grade(
            enrollment_id=test_enrollment.id,
            assignment_name="Midterm",
            grade_value=80.0,
            max_grade=100.0
        )
        grade2 = Grade(
            enrollment_id=test_enrollment.id,
            assignment_name="Final",
            grade_value=85.0,
            max_grade=100.0
        )
        db_session.add_all([grade1, grade2])
        await db_session.commit()
        await db_session.refresh(grade1)
        await db_session.refresh(grade2)
        
        request_data = {
            "grade_ids": [grade1.id, grade2.id],
            "updates": {"score": 90.0}
        }
        response = await client.post(
            "/api/v1/bulk/grades/update",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
    
    async def test_bulk_delete_grades_unauthorized(self, client: AsyncClient):
        """Test bulk deleting grades without authentication"""
        request_data = {"grade_ids": [1, 2]}
        response = await client.post("/api/v1/bulk/grades/delete", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_delete_grades_success(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_enrollment
    ):
        """Test bulk deleting grades successfully"""
        # Create test grades
        grade1 = Grade(
            enrollment_id=test_enrollment.id,
            assignment_name="Quiz1",
            grade_value=90.0,
            max_grade=100.0
        )
        grade2 = Grade(
            enrollment_id=test_enrollment.id,
            assignment_name="Quiz2",
            grade_value=95.0,
            max_grade=100.0
        )
        db_session.add_all([grade1, grade2])
        await db_session.commit()
        await db_session.refresh(grade1)
        await db_session.refresh(grade2)
        
        request_data = {"grade_ids": [grade1.id, grade2.id]}
        response = await client.post(
            "/api/v1/bulk/grades/delete",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
    
    async def test_bulk_delete_notifications_unauthorized(self, client: AsyncClient):
        """Test bulk deleting notifications without authentication"""
        request_data = {"notification_ids": [1, 2]}
        response = await client.post("/api/v1/bulk/notifications/delete", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_delete_notifications_success(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test bulk deleting notifications successfully"""
        request_data = {"notification_ids": [999, 1000]}
        response = await client.post(
            "/api/v1/bulk/notifications/delete",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
    
    async def test_bulk_mark_notifications_read_unauthorized(self, client: AsyncClient):
        """Test bulk marking notifications as read without authentication"""
        request_data = {"notification_ids": [1, 2]}
        response = await client.post("/api/v1/bulk/notifications/mark-read", json=request_data)
        assert response.status_code == 401
    
    async def test_bulk_mark_notifications_read_success(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        """Test bulk marking notifications as read successfully"""
        request_data = {"notification_ids": [999, 1000]}
        response = await client.post(
            "/api/v1/bulk/notifications/mark-read",
            json=request_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success_count" in data
