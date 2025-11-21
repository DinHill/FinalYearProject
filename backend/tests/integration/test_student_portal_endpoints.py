"""
Test Student Portal Endpoints  
/api/v1/student-portal/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.models.academic import Enrollment, Grade, CourseSection


@pytest.mark.integration
@pytest.mark.student_portal
class TestStudentPortalEndpoints:
    """Test student portal endpoints."""
    
    async def test_get_dashboard_unauthorized(self, client: AsyncClient):
        """Test getting dashboard without authentication"""
        response = await client.get("/api/v1/student-portal/dashboard")
        assert response.status_code == 401
    
    async def test_get_dashboard_success(
        self, client: AsyncClient, student_token_headers: dict,
        db_session: AsyncSession, test_enrollment
    ):
        """Test getting student dashboard"""
        response = await client.get(
            "/api/v1/student-portal/dashboard",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_courses" in data
        assert "completed_courses" in data
        assert "current_gpa" in data
    
    async def test_get_my_courses_unauthorized(self, client: AsyncClient):
        """Test getting courses without authentication"""
        response = await client.get("/api/v1/student-portal/my-courses")
        assert response.status_code == 401
    
    async def test_get_my_courses_success(
        self, client: AsyncClient, student_token_headers: dict,
        test_enrollment
    ):
        """Test getting student's enrolled courses"""
        response = await client.get(
            "/api/v1/student-portal/my-courses",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_course_detail_unauthorized(
        self, client: AsyncClient, test_course
    ):
        """Test getting course detail without authentication"""
        response = await client.get(f"/api/v1/student-portal/course/{test_course.id}")
        assert response.status_code == 401
    
    async def test_get_course_detail_not_found(
        self, client: AsyncClient, student_token_headers: dict, test_student
    ):
        """Test getting non-existent course detail"""
        response = await client.get(
            "/api/v1/student-portal/course/999999",
            headers=student_token_headers
        )
        
        assert response.status_code == 404
    
    async def test_get_course_detail_success(
        self, client: AsyncClient, student_token_headers: dict,
        test_course, test_enrollment
    ):
        """Test getting course detail"""
        response = await client.get(
            f"/api/v1/student-portal/course/{test_course.id}",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["course_id"] == test_course.id
        assert "course_name" in data
        assert "course_code" in data
    
    async def test_get_grades_unauthorized(self, client: AsyncClient):
        """Test getting grades without authentication"""
        response = await client.get("/api/v1/student-portal/grades")
        assert response.status_code == 401
    
    async def test_get_grades_success(
        self, client: AsyncClient, student_token_headers: dict,
        db_session: AsyncSession, test_enrollment
    ):
        """Test getting student grades"""
        # Create a grade record
        grade = Grade(
            enrollment_id=test_enrollment.id,
            assignment_name="Midterm",
            grade_value=85.5,
            max_grade=100.0
        )
        db_session.add(grade)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/student-portal/grades",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_upcoming_classes_unauthorized(self, client: AsyncClient):
        """Test getting upcoming classes without authentication"""
        response = await client.get("/api/v1/student-portal/upcoming-classes")
        assert response.status_code == 401
    
    async def test_get_upcoming_classes_success(
        self, client: AsyncClient, student_token_headers: dict,
        test_enrollment
    ):
        """Test getting upcoming classes"""
        response = await client.get(
            "/api/v1/student-portal/upcoming-classes",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
