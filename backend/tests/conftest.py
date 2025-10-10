"""Pytest configuration and fixtures."""
import asyncio
import os
from typing import AsyncGenerator, Generator
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.settings import settings
from app.models import (
    User, Campus, Major, Course, Semester, 
    Section, Enrollment, Grade, Invoice, Payment,
    Document, SupportTicket, TicketEvent
)

# Test database URL (SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create async engine for tests
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
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


@pytest.fixture(scope="function")
def client(db_session: AsyncSession) -> Generator:
    """Create a test client with database override."""
    
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
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
        degree_type="bachelor",
        duration_years=4,
        total_credits=120
    )
    db_session.add(major)
    await db_session.commit()
    await db_session.refresh(major)
    return major


@pytest_asyncio.fixture
async def test_student(db_session: AsyncSession, test_campus: Campus, test_major: Major) -> User:
    """Create a test student user."""
    from app.services.auth_service import hash_password
    
    student = User(
        username="HieuNDGCD220033",
        email="hieu@student.greenwich.edu.vn",
        password=hash_password("password123"),
        full_name="Nguyen Dinh Hieu",
        role="student",
        campus_id=test_campus.id,
        major_id=test_major.id,
        year=2022,
        is_active=True,
        firebase_uid="test_firebase_uid_student"
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)
    return student


@pytest_asyncio.fixture
async def test_teacher(db_session: AsyncSession, test_campus: Campus) -> User:
    """Create a test teacher user."""
    from app.services.auth_service import hash_password
    
    teacher = User(
        username="JohnDGCD200001",
        email="john@greenwich.edu.vn",
        password=hash_password("password123"),
        full_name="John Doe",
        role="teacher",
        campus_id=test_campus.id,
        is_active=True,
        firebase_uid="test_firebase_uid_teacher"
    )
    db_session.add(teacher)
    await db_session.commit()
    await db_session.refresh(teacher)
    return teacher


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession, test_campus: Campus) -> User:
    """Create a test admin user."""
    from app.services.auth_service import hash_password
    
    admin = User(
        username="AdminGCD200001",
        email="admin@greenwich.edu.vn",
        password=hash_password("password123"),
        full_name="Admin User",
        role="admin",
        campus_id=test_campus.id,
        is_active=True,
        firebase_uid="test_firebase_uid_admin"
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
        code="CS101",
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
) -> Section:
    """Create a test course section."""
    section = Section(
        course_id=test_course.id,
        semester_id=test_semester.id,
        teacher_id=test_teacher.id,
        campus_id=test_campus.id,
        section_number="A1",
        max_capacity=30,
        current_enrollment=0
    )
    db_session.add(section)
    await db_session.commit()
    await db_session.refresh(section)
    return section


@pytest_asyncio.fixture
async def test_enrollment(
    db_session: AsyncSession,
    test_student: User,
    test_section: Section
) -> Enrollment:
    """Create a test enrollment."""
    enrollment = Enrollment(
        student_id=test_student.id,
        section_id=test_section.id,
        status="enrolled",
        enrolled_at=datetime.utcnow()
    )
    db_session.add(enrollment)
    
    # Update section enrollment count
    test_section.current_enrollment += 1
    
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


@pytest.fixture
def mock_firebase_auth(monkeypatch):
    """Mock Firebase authentication."""
    def mock_verify_token(id_token: str):
        # Parse mock token format: "mock_token_{uid}_{role}"
        parts = id_token.split("_")
        if len(parts) >= 3:
            uid = parts[2]
            role = parts[3] if len(parts) > 3 else "student"
            return {"uid": uid, "role": role}
        raise ValueError("Invalid token")
    
    def mock_create_custom_token(uid: str, claims: dict = None):
        return f"custom_token_{uid}".encode()
    
    # Mock Firebase Admin SDK functions
    monkeypatch.setattr("firebase_admin.auth.verify_id_token", mock_verify_token)
    monkeypatch.setattr("firebase_admin.auth.create_custom_token", mock_create_custom_token)


@pytest.fixture
def student_token() -> str:
    """Generate a mock student authentication token."""
    return "mock_token_test_firebase_uid_student_student"


@pytest.fixture
def teacher_token() -> str:
    """Generate a mock teacher authentication token."""
    return "mock_token_test_firebase_uid_teacher_teacher"


@pytest.fixture
def admin_token() -> str:
    """Generate a mock admin authentication token."""
    return "mock_token_test_firebase_uid_admin_admin"
