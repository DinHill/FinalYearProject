"""
Integration tests for Current User Profile endpoints
Tests: /api/v1/me/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, CourseSection, Enrollment, Grade, Attendance, Invoice, DocumentRequest, Assignment
from datetime import date, datetime


@pytest.mark.asyncio
class TestMeEndpoints:
    """Test suite for current user profile endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self, mock_firebase_auth):
        """Auto-use mock Firebase auth for all tests"""
        pass
    
    # ============================================================================
    # GET /api/v1/me/profile - Get current user profile
    # ============================================================================
    
    async def test_get_my_profile_success(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict
    ):
        """Test getting current user's profile"""
        response = await client.get(
            "/api/v1/me/profile",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_student.id
        assert data["email"] == test_student.email
        assert data["full_name"] == test_student.full_name
        assert data["role"] == test_student.role
        # Profile returns flat fields, not nested objects
        assert "campus_id" in data
        assert "major_id" in data
    
    async def test_get_my_profile_unauthorized(self, client: AsyncClient):
        """Test that profile requires authentication"""
        response = await client.get("/api/v1/me/profile")
        
        assert response.status_code == 401
    
    # ============================================================================
    # PATCH /api/v1/me/profile - Update current user profile
    # ============================================================================
    
    async def test_update_my_profile_success(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict
    ):
        """Test updating current user's profile"""
        update_data = {
            "full_name": "Updated Student Name",
            "phone": "+84987654321"
        }
        
        response = await client.patch(
            "/api/v1/me/profile",
            json=update_data,
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Student Name"
        # Phone field may or may not be in response depending on schema
    
    async def test_update_my_profile_unauthorized(self, client: AsyncClient):
        """Test that profile update requires authentication"""
        update_data = {"full_name": "New Name"}
        
        response = await client.patch(
            "/api/v1/me/profile",
            json=update_data
        )
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/schedule - Get my class schedule
    # ============================================================================
    
    async def test_get_my_schedule_as_student(
        self,
        client: AsyncClient,
        test_student: User,
        test_section: CourseSection,
        test_enrollment: Enrollment,
        student_token_headers: dict
    ):
        """Test getting schedule as a student"""
        response = await client.get(
            "/api/v1/me/schedule",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the enrolled section
        assert len(data) >= 1
    
    async def test_get_my_schedule_as_teacher(
        self,
        client: AsyncClient,
        test_teacher: User,
        test_section: CourseSection,
        teacher_token_headers: dict
    ):
        """Test getting schedule as a teacher"""
        response = await client.get(
            "/api/v1/me/schedule",
            headers=teacher_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Teacher should see sections they teach
    
    async def test_get_my_schedule_with_semester_filter(
        self,
        client: AsyncClient,
        test_student: User,
        test_section: CourseSection,
        test_enrollment: Enrollment,
        student_token_headers: dict
    ):
        """Test filtering schedule by semester"""
        response = await client.get(
            f"/api/v1/me/schedule?semester_id={test_section.semester_id}",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_my_schedule_unauthorized(self, client: AsyncClient):
        """Test that schedule requires authentication"""
        response = await client.get("/api/v1/me/schedule")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/enrollments - Get my enrollments
    # ============================================================================
    
    async def test_get_my_enrollments_success(
        self,
        client: AsyncClient,
        test_student: User,
        test_enrollment: Enrollment,
        student_token_headers: dict
    ):
        """Test getting current user's enrollments"""
        response = await client.get(
            "/api/v1/me/enrollments",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Check enrollment structure
        if len(data) > 0:
            enrollment = data[0]
            assert "id" in enrollment
            assert "status" in enrollment
    
    async def test_get_my_enrollments_unauthorized(self, client: AsyncClient):
        """Test that enrollments require authentication"""
        response = await client.get("/api/v1/me/enrollments")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/grades - Get my grades
    # ============================================================================
    
    async def test_get_my_grades_success(
        self,
        client: AsyncClient,
        test_student: User,
        test_enrollment: Enrollment,  # Added missing fixture
        student_token_headers: dict,
        db_session: AsyncSession,
        test_section: CourseSection
    ):
        """Test getting current user's grades"""
        # Create an assignment and grade
        assignment = Assignment(
            course_section_id=test_section.id,
            title="Test Assignment",
            assignment_type="homework",
            max_points=100,
            due_date=date.today()
        )
        db_session.add(assignment)
        await db_session.commit()
        await db_session.refresh(assignment)
        
        grade = Grade(
            enrollment_id=test_enrollment.id,  # Fixed: student_id → enrollment_id
            grade_value=85.0,  # Fixed: points_earned → grade_value
            max_grade=100.0,  # Added max_grade
            weight=30.0  # Added weight
        )
        db_session.add(grade)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/me/grades",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least one grade
        assert len(data) >= 1
    
    async def test_get_my_grades_with_semester_filter(
        self,
        client: AsyncClient,
        test_student: User,
        test_section: CourseSection,
        student_token_headers: dict
    ):
        """Test filtering grades by semester"""
        response = await client.get(
            f"/api/v1/me/grades?semester_id={test_section.semester_id}",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_my_grades_unauthorized(self, client: AsyncClient):
        """Test that grades require authentication"""
        response = await client.get("/api/v1/me/grades")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/attendance - Get my attendance records
    # ============================================================================
    
    async def test_get_my_attendance_success(
        self,
        client: AsyncClient,
        test_student: User,
        test_enrollment: Enrollment,
        student_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting current user's attendance records"""
        # Create an attendance record
        attendance = Attendance(
            enrollment_id=test_enrollment.id,
            date=date.today(),  # Fixed: attendance_date → date
            status="present"
        )
        db_session.add(attendance)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/me/attendance",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    async def test_get_my_attendance_with_date_filter(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict
    ):
        """Test filtering attendance by date range"""
        start_date = "2024-01-01"
        end_date = "2024-12-31"
        
        response = await client.get(
            f"/api/v1/me/attendance?start_date={start_date}&end_date={end_date}",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_my_attendance_unauthorized(self, client: AsyncClient):
        """Test that attendance requires authentication"""
        response = await client.get("/api/v1/me/attendance")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/invoices - Get my invoices
    # ============================================================================
    
    async def test_get_my_invoices_success(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting current user's invoices"""
        # Create an invoice
        invoice = Invoice(
            student_id=test_student.id,
            invoice_number="INV-2024-001",
            issued_date=date.today(),  # Fixed: issue_date → issued_date
            due_date=date(2024, 12, 31),
            total_amount=1000.0,
            status="pending"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/me/invoices",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    async def test_get_my_invoices_with_status_filter(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict
    ):
        """Test filtering invoices by status"""
        response = await client.get(
            "/api/v1/me/invoices?status=pending",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_my_invoices_unauthorized(self, client: AsyncClient):
        """Test that invoices require authentication"""
        response = await client.get("/api/v1/me/invoices")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/documents - Get my document requests
    # ============================================================================
    
    async def test_get_my_documents_success(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test getting current user's document requests"""
        # Create a document request
        doc_request = DocumentRequest(
            student_id=test_student.id,
            document_type="transcript",
            status="pending",
            requested_at=datetime.now()  # Fixed: request_date → requested_at (datetime)
        )
        db_session.add(doc_request)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/me/documents",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    async def test_get_my_documents_with_status_filter(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict
    ):
        """Test filtering documents by status"""
        response = await client.get(
            "/api/v1/me/documents?status=pending",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_my_documents_unauthorized(self, client: AsyncClient):
        """Test that documents require authentication"""
        response = await client.get("/api/v1/me/documents")
        
        assert response.status_code == 401
    
    # ============================================================================
    # GET /api/v1/me/gpa - Calculate my GPA
    # ============================================================================
    
    async def test_get_my_gpa_success(
        self,
        client: AsyncClient,
        test_student: User,
        student_token_headers: dict,
        db_session: AsyncSession,
        test_section: CourseSection,
        test_enrollment: Enrollment
    ):
        """Test getting current user's GPA"""
        # Update enrollment with completed status and grade
        test_enrollment.status = "completed"
        test_enrollment.grade = 3.7  # Fixed: "A" → 3.7 (Numeric GPA value)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/me/gpa",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "gpa" in data
        assert "total_credits" in data
        assert "courses_completed" in data
        assert isinstance(data["gpa"], (int, float))
        assert data["gpa"] >= 0.0
        assert data["gpa"] <= 4.0
    
    async def test_get_my_gpa_with_semester_filter(
        self,
        client: AsyncClient,
        test_student: User,
        test_section: CourseSection,
        student_token_headers: dict
    ):
        """Test calculating GPA for specific semester"""
        response = await client.get(
            f"/api/v1/me/gpa?semester_id={test_section.semester_id}",
            headers=student_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "gpa" in data
        assert "total_credits" in data
        assert "courses_completed" in data
    
    async def test_get_my_gpa_unauthorized(self, client: AsyncClient):
        """Test that GPA calculation requires authentication"""
        response = await client.get("/api/v1/me/gpa")
        
        assert response.status_code == 401
