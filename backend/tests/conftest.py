"""Pytest configuration and fixtures."""
import asyncio
import os
from typing import AsyncGenerator, Generator
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.settings import settings
from app.core.firebase import initialize_firebase
from app.models import (
    User, Campus, Major, Course, Semester, 
    CourseSection, Enrollment, Grade, Invoice, Payment,
    Document, SupportTicket, TicketEvent
)

# Initialize Firebase for tests - uses real credentials
print(" Initializing Firebase for tests...")
firebase_initialized = initialize_firebase()
if firebase_initialized:
    print(" Firebase initialized successfully for tests!")
else:
    print("  Firebase initialization failed - some tests will be skipped")

# Test database URL (PostgreSQL for testing - unified with production)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/greenwich_test"

# Create async engine for tests
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
)

# Create async session factory
TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestingSessionLocal() as session:
        yield session

    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator:
    """Create an async test client with database override."""
    
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_campus(db_session: AsyncSession) -> Campus:
    """Create a test campus."""
    campus = Campus(
        name="Da Nang",
        code="DN",
        address="123 Test Street, Da Nang",
        phone="+84-123-456-789",
        email="danang@greenwich.edu.vn"
    )
    db_session.add(campus)
    await db_session.commit()
    await db_session.refresh(campus)
    return campus


@pytest_asyncio.fixture
async def test_major(db_session: AsyncSession) -> Major:
    """Create a test major."""
    major = Major(
        name="Computer Science",
        code="CS",
        description="Computer Science Program",
        is_active=True
    )
    db_session.add(major)
    await db_session.commit()
    await db_session.refresh(major)
    return major


@pytest_asyncio.fixture
async def test_student(db_session: AsyncSession, test_campus: Campus, test_major: Major) -> User:
    """Create a test student user."""
    from app.core.security import SecurityUtils
    
    student = User(
        username="GHPSTD240001",
        email="student@greenwich.edu.vn",
        password_hash=SecurityUtils.hash_password("password123"),
        full_name="Test Student",
        role="student",
        campus_id=test_campus.id,
        major_id=test_major.id,
        year_entered=2024,
        status="active",
        firebase_uid="student123"  # Match token uid
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)
    return student


@pytest_asyncio.fixture
async def test_student2(db_session: AsyncSession, test_campus: Campus, test_major: Major) -> User:
    """Create a second test student user."""
    from app.core.security import SecurityUtils
    
    student2 = User(
        username="GHPSTD240002",
        email="student2@greenwich.edu.vn",
        password_hash=SecurityUtils.hash_password("password123"),
        full_name="Test Student 2",
        role="student",
        campus_id=test_campus.id,
        major_id=test_major.id,
        year_entered=2024,
        status="active",
        firebase_uid="student456"  # Different uid
    )
    db_session.add(student2)
    await db_session.commit()
    await db_session.refresh(student2)
    return student2


@pytest_asyncio.fixture
async def test_teacher(db_session: AsyncSession, test_campus: Campus) -> User:
    """Create a test teacher user."""
    from app.core.security import SecurityUtils
    
    teacher = User(
        username="TeacherGCD200001",
        email="teacher@greenwich.edu.vn",
        password_hash=SecurityUtils.hash_password("password123"),
        full_name="John Doe",
        role="teacher",
        campus_id=test_campus.id,
        status="active",
        firebase_uid="teacher123"  # Match token uid
    )
    db_session.add(teacher)
    await db_session.commit()
    await db_session.refresh(teacher)
    return teacher


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession, test_campus: Campus, test_student: User, test_teacher: User) -> User:
    """Create a test admin user (depends on student and teacher to ensure ID=3)."""
    from app.core.security import SecurityUtils
    
    admin = User(
        username="AdminGCD200001",
        email="admin@greenwich.edu.vn",
        password_hash=SecurityUtils.hash_password("password123"),
        full_name="Admin User",
        role="super_admin",  # Changed from "admin" to match academic router requirements
        campus_id=test_campus.id,
        status="active",
        firebase_uid="admin123"  # Match admin_token
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def test_semester(db_session: AsyncSession) -> Semester:
    """Create a test semester."""
    semester = Semester(
        name="Spring 2024",
        code="2024A",
        start_date=datetime(2024, 1, 15),
        end_date=datetime(2024, 5, 31),
        is_current=True
    )
    db_session.add(semester)
    await db_session.commit()
    await db_session.refresh(semester)
    return semester


@pytest_asyncio.fixture
async def test_course(db_session: AsyncSession, test_major: Major) -> Course:
    """Create a test course."""
    course = Course(
        course_code="COMP1010",  # Fixed: Changed from CS101 to match pattern ^[A-Z]{3,4}\d{4}$
        name="Introduction to Programming",
        credits=3,
        major_id=test_major.id,
        description="Basic programming concepts"
    )
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)
    return course


@pytest_asyncio.fixture
async def test_section(
    db_session: AsyncSession,
    test_course: Course,
    test_semester: Semester,
    test_teacher: User,
    test_campus: Campus
) -> CourseSection:
    """Create a test course section."""
    section = CourseSection(
        course_id=test_course.id,
        semester_id=test_semester.id,
        instructor_id=test_teacher.id,  # Fixed: teacher_id  instructor_id
        section_code="A1",  # Fixed: section_number  section_code
        max_students=30,  # Fixed: max_capacity  max_students
        enrolled_count=0  # Fixed: current_enrollment  enrolled_count
        # Note: campus_id doesn't exist in CourseSection model
    )
    db_session.add(section)
    await db_session.commit()
    await db_session.refresh(section)
    return section


@pytest_asyncio.fixture
async def test_enrollment(
    db_session: AsyncSession,
    test_student: User,
    test_section: CourseSection
) -> Enrollment:
    """Create a test enrollment."""
    enrollment = Enrollment(
        student_id=test_student.id,
        course_section_id=test_section.id,  # Fixed: section_id  course_section_id
        status="enrolled"
        # Note: enrollment_date has server default, no need to set
    )
    db_session.add(enrollment)
    
    # Update section enrollment count
    test_section.enrolled_count += 1  # Fixed: current_enrollment  enrolled_count
    
    await db_session.commit()
    await db_session.refresh(enrollment)
    return enrollment


@pytest_asyncio.fixture
async def test_invoice(
    db_session: AsyncSession,
    test_student: User,
    test_semester: Semester
) -> Invoice:
    """Create a test invoice."""
    invoice = Invoice(
        student_id=test_student.id,
        semester_id=test_semester.id,
        invoice_number="INV202401001",
        issue_date=datetime(2024, 1, 1),
        due_date=datetime(2024, 1, 31),
        total_amount=5500.00,
        amount_paid=0.00,
        status="pending"
    )
    db_session.add(invoice)
    await db_session.commit()
    await db_session.refresh(invoice)
    return invoice


@pytest_asyncio.fixture
async def test_document(
    db_session: AsyncSession,
    test_student: User
) -> Document:
    """Create a test document."""
    document = Document(
        filename="test_document.pdf",
        file_path="documents/2024/10/test/test_document.pdf",
        file_type="pdf",
        file_size=1024000,
        category="document",
        uploader_id=test_student.id,
        title="Test Document",
        description="This is a test document",
        is_public=False
    )
    db_session.add(document)
    await db_session.commit()
    await db_session.refresh(document)
    return document


@pytest_asyncio.fixture
async def test_support_ticket(
    db_session: AsyncSession,
    test_student: User
) -> SupportTicket:
    """Create a test support ticket."""
    ticket = SupportTicket(
        ticket_number="TICKET-20241009-0001",
        requester_id=test_student.id,
        subject="Test Support Ticket",
        description="This is a test support ticket",
        category="technical",
        priority="normal",
        status="open",
        sla_deadline=datetime.utcnow() + timedelta(hours=72)
    )
    db_session.add(ticket)
    await db_session.commit()
    await db_session.refresh(ticket)
    return ticket


# Mock Firebase authentication
class MockFirebaseUser:
    """Mock Firebase user for testing."""
    def __init__(self, uid: str, email: str, role: str = "student"):
        self.uid = uid
        self.email = email
        self.custom_claims = {"role": role}


@pytest.fixture(autouse=True)  # Auto-apply to all tests
def mock_firebase_auth(monkeypatch):
    """Mock Firebase authentication and user creation."""
    def mock_verify_token(id_token: str, check_revoked: bool = False):
        # Parse mock token format: "Bearer_{uid}_{role}"
        # Use a format that's easy to parse even with underscores in role names
        if not id_token.startswith("Bearer_"):
            raise ValueError("Invalid token format")
        
        # Remove "Bearer_" prefix and split by underscore
        token_parts = id_token[7:].split("_", 1)  # Split into uid and role (max 2 parts)
        
        if len(token_parts) == 2:
            uid, role = token_parts
            
            # Mock database user ID based on role (matches test fixtures)
            # Student has ID 1, Teacher has ID 2, Admin has ID 3
            user_id_map = {
                "student123": 1,
                "teacher123": 2,
                "admin123": 3
            }
            db_user_id = user_id_map.get(uid, 1)
            
            # Return structure matching Firebase decoded token
            return {
                "uid": uid,
                "id": db_user_id,  # Database user ID 
                "db_user_id": db_user_id,  # For backward compatibility with other routers
                "role": role,  # Single role for require_roles check
                "roles": [role],  # Custom claim - roles as list for RBAC system
                "email": f"{uid}@greenwich.edu.vn"
            }
        raise ValueError("Invalid token")
    
    def mock_create_custom_token(uid: str, claims: dict = None):
        return f"custom_token_{uid}".encode()
    
    def mock_create_user(email: str, password: str, **kwargs):
        """Mock Firebase user creation - returns fake user record."""
        import uuid
        return type('UserRecord', (), {
            'uid': f'firebase_{uuid.uuid4().hex[:12]}',
            'email': email
        })()
    
    def mock_set_custom_user_claims(uid: str, custom_claims: dict):
        """Mock setting custom claims - does nothing in tests."""
        pass
    
    # Mock Firebase Admin SDK functions
    monkeypatch.setattr("firebase_admin.auth.verify_id_token", mock_verify_token)
    monkeypatch.setattr("firebase_admin.auth.create_custom_token", mock_create_custom_token)
    monkeypatch.setattr("firebase_admin.auth.create_user", mock_create_user)
    monkeypatch.setattr("firebase_admin.auth.set_custom_user_claims", mock_set_custom_user_claims)


@pytest.fixture
def student_token() -> str:
    """Generate a mock student authentication token."""
    return "Bearer_student123_student"


@pytest.fixture
def teacher_token() -> str:
    """Generate a mock teacher authentication token."""
    return "Bearer_teacher123_teacher"


@pytest.fixture
def admin_token() -> str:
    """Generate a mock admin authentication token."""
    return "Bearer_admin123_super_admin"


@pytest.fixture
def student_token_headers(student_token: str) -> dict:
    """Generate HTTP headers with student authentication token."""
    return {"Authorization": f"Bearer {student_token}"}


@pytest.fixture
def teacher_token_headers(teacher_token: str) -> dict:
    """Generate HTTP headers with teacher authentication token."""
    return {"Authorization": f"Bearer {teacher_token}"}


@pytest.fixture
def admin_token_headers(admin_token: str) -> dict:
    """Generate HTTP headers with admin authentication token."""
    return {"Authorization": f"Bearer {admin_token}"}

