# 🎓 Greenwich University Academic Portal - Backend API

FastAPI-based REST API for Greenwich University Vietnam Academic Management System.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-114%20passing-success.svg)](./tests/)
[![Coverage](https://img.shields.io/badge/coverage-80%25+-success.svg)](./tests/)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)]()

## 📊 Project Status

```
✅ Backend Development: 95% Complete
✅ API Endpoints: 60+ Operational
✅ Test Coverage: 114 Tests (80%+)
✅ Documentation: Complete
✅ Production Ready: Yes
```

---

## 📋 Table of Contents

- [Technology Stack](#-technology-stack)
- [Database Schema](#-database-schema-28-tables)
- [Authentication](#-authentication-flow)
- [API Endpoints](#-api-endpoints-60-total)
- [Key Features](#-key-features)
- [Backend Services](#-backend-services)
- [Quick Start](#-quick-start-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)

---

## 🏗️ Technology Stack

```
• Framework: FastAPI 0.115 (async Python)
• Database: PostgreSQL 15+ with SQLAlchemy 2.0 (async ORM)
• Authentication: Firebase Admin SDK (custom tokens + ID tokens)
• File Storage: Google Cloud Storage (presigned URLs)
• Caching: Redis 7+
• PDF Generation: ReportLab
• Background Tasks: Dramatiq
• AI Integration: OpenAI API (GPT-3.5-turbo)
• Email: SendGrid
• Testing: Pytest (114 tests, 80%+ coverage)
```

**Performance Optimizations:**

- ✅ Async database queries (non-blocking I/O)
- ✅ Connection pooling (20 connections, 10 overflow)
- ✅ Presigned URLs (direct client→GCS, no server load)
- ✅ Redis caching (frequently accessed data)
- ✅ Pagination on all list endpoints
- ✅ Database indexing (foreign keys, status fields)
- ✅ Background tasks (Dramatiq)
- ✅ Query timeout (5 seconds)

---

## 📊 Database Schema (28 Tables)

### Identity & RBAC

- **`users`** - Main user table (firebase_uid, username, email, role, status, campus_id, major_id)
- **`roles`** - Role definitions
- **`user_roles`** - Many-to-many user-role mapping
- **`campuses`** - 4 campuses (H=Hanoi, D=DaNang, C=CanTho, S=HCM)
- **`majors`** - Programs (C=Computing, B=Business, D=Design)
- **`username_sequences`** - Collision tracking for username generation
- **`student_sequences`** - Student ID generation tracking
- **`device_tokens`** - FCM push notification tokens

### Academic

- **`semesters`** - Academic terms (Fall, Spring, Summer)
- **`courses`** - Course catalog (course_code, name, credits, prerequisites as JSONB)
- **`course_sections`** - Course offerings (section_code, instructor, max_students, schedule as JSONB)
- **`enrollments`** - Student registrations (student_id, course_section_id, status, grade)
- **`assignments`** - Coursework (title, type, max_points, weight, due_date)
- **`grades`** - Student grades (enrollment_id, assignment_name, grade_value, approval_status)
- **`attendance`** - Attendance records (enrollment_id, date, status, notes)
- **`section_schedules`** - Class schedules (section_id, day_of_week, start_time, end_time, room)

### Financial

- **`fee_structures`** - Fee templates (campus_id, major_id, semester_id, fee_type, amount)
- **`invoices`** - Student bills (invoice_number, student_id, total_amount, paid_amount, status)
- **`invoice_lines`** - Invoice items (invoice_id, description, qty, unit_price, amount)
- **`payments`** - Payment records (invoice_id, amount, payment_method, transaction_id, status)

### Documents

- **`documents`** - File metadata (title, document_type, file_url, file_size, user_id)
- **`document_requests`** - Official document requests (document_type, purpose, status, delivery_method)
- **`announcements`** - Campus announcements (title, content, author_id, target_audience, publish_date)

### Communication

- **`chat_rooms`** - Chat metadata (firebase_room_id, type, section_id)
- **`chat_participants`** - Room membership (room_id, user_id, role)
- **`support_tickets`** - Help desk (subject, description, category, priority, status, user_id, assigned_to)
- **`ticket_events`** - Ticket history (ticket_id, event_type, description, created_by)
- **`notifications`** - User notifications (user_id, title, message, type, is_read, action_url)

### System

- **`system_settings`** - App configuration
- **`idempotency_keys`** - Payment deduplication
- **`audit_logs`** - System audit trail

---

## 🔐 Authentication Flow

### Mobile App (Students) - Custom Token Flow

```
1. Student enters: student_id (username) + password
2. POST /api/v1/auth/student-login
3. Backend verifies credentials in PostgreSQL
4. Backend creates Firebase custom token with claims:
   {
     "role": "student",
     "campus_id": 1,
     "campus": "D",
     "major": "C",
     "db_user_id": 123,
     "username": "HieuNDGCD220033"
   }
5. Mobile app: signInWithCustomToken(customToken)
6. Get Firebase ID token
7. All API calls: Authorization: Bearer <ID_TOKEN>
```

### Admin/Teacher Web Portal

```
1. User enters username
2. POST /api/v1/auth/username-to-email
3. Backend returns email
4. Frontend: Firebase signInWithEmailAndPassword(email, password)
5. Get ID token
6. Optional: POST /api/v1/auth/session for session cookie
7. All API calls: Authorization: Bearer <ID_TOKEN>
```

### Token Verification

Every protected endpoint uses:

```python
@router.get("/protected")
async def protected(current_user = Depends(verify_firebase_token)):
    # current_user contains decoded Firebase token:
    # {
    #   "uid": "firebase_uid",
    #   "email": "user@example.com",
    #   "role": "student",
    #   "campus_id": 1,
    #   ...
    # }
```

---

## 📡 API Endpoints (60+ Total)

### Authentication (6 endpoints)

```
POST   /api/v1/auth/username-to-email     # Convert username → email
POST   /api/v1/auth/student-login          # Student login (custom token)
POST   /api/v1/auth/session                # Create session cookie
GET    /api/v1/auth/me                     # Get current user profile
POST   /api/v1/auth/logout                 # Logout
PUT    /api/v1/auth/change-password        # Change password
```

### Mobile App - "Me" Endpoints (9 endpoints)

```
GET    /api/v1/me/profile                  # My profile
PATCH  /api/v1/me/profile                  # Update profile
GET    /api/v1/me/schedule                 # My class schedule
GET    /api/v1/me/enrollments              # My enrollments
GET    /api/v1/me/grades                   # My grades
GET    /api/v1/me/attendance               # My attendance
GET    /api/v1/me/invoices                 # My invoices
GET    /api/v1/me/documents                # My document requests
GET    /api/v1/me/gpa                      # My GPA calculation
```

### Mobile App - Student Portal (5 endpoints)

```
GET    /api/v1/student-portal/dashboard           # Dashboard stats
GET    /api/v1/student-portal/my-courses          # Enrolled courses
GET    /api/v1/student-portal/course/{id}         # Course details
GET    /api/v1/student-portal/grades              # All grades
GET    /api/v1/student-portal/upcoming-classes    # Upcoming classes
```

### User Management (10+ endpoints)

```
POST   /api/v1/users                       # Create user (auto-gen username)
POST   /api/v1/users/bulk                  # Bulk create users
GET    /api/v1/users                       # List users (paginated)
GET    /api/v1/users/search                # Search users
GET    /api/v1/users/role/{role}           # Get users by role
GET    /api/v1/users/{user_id}             # Get user details
PUT    /api/v1/users/{user_id}             # Update user
DELETE /api/v1/users/{user_id}             # Delete user
```

### Academic (40+ endpoints)

```
# Programs/Majors
POST   /api/v1/academic/programs
GET    /api/v1/academic/programs
PUT/PATCH/DELETE /api/v1/academic/programs/{id}

# Courses
POST   /api/v1/academic/courses
GET    /api/v1/academic/courses            # Paginated, filterable
PUT/PATCH /api/v1/academic/courses/{id}

# Sections
POST   /api/v1/academic/sections
GET    /api/v1/academic/sections

# Enrollments
POST   /api/v1/academic/enrollments        # Enroll student
GET    /api/v1/academic/enrollments
GET    /api/v1/academic/enrollments/my
DELETE /api/v1/academic/enrollments/{id}

# Grades (with approval workflow)
POST   /api/v1/academic/assignments/{id}/grades
GET    /api/v1/academic/grades
GET/PUT/DELETE /api/v1/academic/grades/{id}
POST   /api/v1/academic/grades/submit/{section_id}
POST   /api/v1/academic/grades/approve/{section_id}
POST   /api/v1/academic/grades/reject/{section_id}
POST   /api/v1/academic/grades/publish/{section_id}

# Attendance
POST   /api/v1/academic/attendance/bulk
GET    /api/v1/academic/attendance
PUT/DELETE /api/v1/academic/attendance/{id}
GET    /api/v1/academic/attendance/compliance/section/{id}
GET    /api/v1/academic/attendance/at-risk

# GPA & Academic Standing
GET    /api/v1/academic/students/my/gpa
GET    /api/v1/academic/students/my/academic-standing

# Semesters
POST/GET/PUT /api/v1/academic/semesters
GET    /api/v1/academic/semesters/current
```

### Finance (10+ endpoints)

```
POST   /api/v1/finance/invoices
GET    /api/v1/finance/invoices
GET/PUT/DELETE /api/v1/finance/invoices/{id}

POST   /api/v1/finance/payments            # Idempotent
GET    /api/v1/finance/payments

GET    /api/v1/finance/students/my/summary
GET    /api/v1/finance/students/{id}/summary
GET    /api/v1/finance/semesters/{id}/summary
```

### Documents (12+ endpoints)

```
POST   /api/v1/documents/upload-url        # Presigned upload URL
POST   /api/v1/documents
GET    /api/v1/documents
GET    /api/v1/documents/{id}/download-url
DELETE /api/v1/documents/{id}

POST   /api/v1/documents/requests
GET    /api/v1/documents/requests
PUT    /api/v1/documents/requests/{id}

POST/GET /api/v1/documents/announcements
```

### Support (8 endpoints)

```
POST   /api/v1/support/tickets
GET    /api/v1/support/tickets
GET/PUT /api/v1/support/tickets/{id}
POST   /api/v1/support/tickets/{id}/events
GET    /api/v1/support/tickets/{id}/events
GET    /api/v1/support/stats/summary
```

**Additional Modules:**

- **Announcements** (7 endpoints): CRUD, publish/unpublish
- **Notifications** (8 endpoints): CRUD, mark-read, SSE stream
- **Dashboard** (6 endpoints): Stats, analytics, activity
- **Search** (2 endpoints): Global search, suggestions
- **Bulk Operations** (8 endpoints): Bulk update/delete
- **Import/Export** (14 endpoints): CSV import/export, templates
- **Campuses** (9 endpoints): Management, stats, transfers
- **Audit Logs** (3 endpoints): View logs, stats, export

**See [API_REFERENCE.md](./API_REFERENCE.md) for complete documentation.**

---

## 🎯 Key Features

### 1. Auto-Generated Vietnamese Usernames

```python
# Input: Nguyen Dinh Hieu, Computing, DaNang, entered 2022
# Output: HieuNDGCD220033
# Pattern: {FirstName}{Initials}{Major}{Campus}{YY}{Sequence}
```

### 2. Weighted GPA Calculation

```python
def calculate_gpa(enrollments):
    total_grade_points = 0
    total_credits = 0

    for enrollment in enrollments:
        grade_point = GRADE_SCALE[enrollment.letter_grade]  # A=4.0, B=3.0, etc.
        credits = enrollment.section.course.credits
        total_grade_points += grade_point * credits
        total_credits += credits

    return total_grade_points / total_credits
```

### 3. Grade Approval Workflow

```
draft → submitted → under_review → approved → published
                    ↓
                rejected (with reason)
```

### 4. Idempotent Payments

```python
# Prevents duplicate payments
headers = {"Idempotency-Key": "payment-12345"}
POST /api/v1/finance/payments
# If called again with same key → returns cached response
```

### 5. Presigned URLs for Scalable File Storage

```python
# Upload flow:
1. POST /api/v1/documents/upload-url
   → Returns: { "upload_url": "https://gcs.../signed-url", "file_id": 123 }
2. Client uploads directly to GCS using presigned URL
3. POST /api/v1/documents { "file_id": 123, "title": "..." }

# Download flow:
GET /api/v1/documents/{id}/download-url
   → Returns: { "download_url": "https://gcs.../signed-url" }
```

### 6. Attendance Compliance Tracking

```python
# Thresholds:
≥ 75%: Compliant
50-74%: At Risk
25-49%: Exam Ineligible
< 25%: Auto Fail

# Endpoints:
GET /api/v1/academic/attendance/at-risk
GET /api/v1/academic/attendance/compliance/section/{id}
```

---

## 🔧 Backend Services

**Key Service Files:**

```
app/services/
├── auth_service.py          # Authentication logic
├── gpa_service.py           # GPA calculation
├── enrollment_service.py    # Enrollment validation
├── username_generator.py    # Vietnamese username generation
├── cloudinary_service.py    # File upload handling
└── notification_service.py  # Push notifications
```

**Username Generator Example:**

```python
# Full name: "Nguyễn Đình Hiếu"
# Output: "HieuNDG"
# Logic:
1. Remove Vietnamese accents: "Nguyen Dinh Hieu"
2. Extract first name: "Hieu"
3. Get initials from middle+last: "NDH" → "NDG" (G=Greenwich)
4. Combine: "HieuNDG"
5. Add campus/major/year: "HieuNDGCD220033"
```

---

## 🚀 Quick Start (Development)

### 1. Clone and Setup

```powershell
# Navigate to backend directory
cd "d:\Dinh Hieu\Final Year Project\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```powershell
# Copy environment template
copy .env.example .env

# Edit .env with your credentials
notepad .env
```

**Minimum required configurations:**

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/greenwich_dev

# Security
SECRET_KEY=your-secret-key-min-32-chars

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=./credentials/serviceAccountKey.json

# Google Cloud Storage (optional)
GCS_BUCKET_NAME=greenwich-documents-dev
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcs-credentials.json

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### 3. Setup Database

```powershell
# Run migrations
alembic upgrade head

# Seed initial data (optional)
python seed_essential_data.py
```

### 4. Run Development Server

```powershell
# Start server with auto-reload
uvicorn app.main:app --reload

# Server will start at http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### 5. Run Tests

```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific tests
pytest tests/unit/test_gpa_service.py
pytest -m integration
```

---

## 🧪 Testing

### Test Statistics

```
Total Tests:      114 test cases
Unit Tests:       80 tests (70%)
Integration:      34 tests (30%)
Coverage:         80%+
Status:           All passing ✅
```

### Running Tests

```powershell
# Run all tests
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser

# Run specific test types
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest -m finance        # Finance module tests

# Run specific test file
pytest tests/unit/test_gpa_service.py -v
```

**Key Test Files:**

```
tests/unit/test_gpa_service.py
tests/unit/test_username_generator.py
tests/integration/test_enrollment_workflow.py
tests/integration/test_finance_idempotency.py
```

---

## 🚢 Deployment

### Quick Deployment Options

#### Option 1: Ubuntu/Linux VPS (Recommended)

```bash
# See docs/QUICK_DEPLOY.md for step-by-step instructions
# Uses: Nginx + Gunicorn + Supervisor + PostgreSQL
# Time: ~30 minutes
# Cost: ~$20-50/month
```

#### Option 2: Docker (Most Portable)

```bash
docker-compose up -d
# Time: ~5 minutes (if Docker installed)
# Cost: Varies by hosting
```

### Deployment Scripts

```powershell
# Development
./run_dev.ps1                 # Start dev server with auto-reload

# Production
./deploy-production.ps1       # Deploy to production server
./start_servers.ps1           # Start all services
./stop_servers.ps1            # Stop all services

# Database
alembic upgrade head          # Run migrations
python seed_essential_data.py # Seed initial data
```

### Production Features

- ✅ Connection pooling (20 connections, 10 overflow)
- ✅ Query timeout (5 seconds)
- ✅ Request/Response logging with request IDs
- ✅ Error tracking (Sentry integration ready)
- ✅ CORS configuration (explicit allowlist)
- ✅ Rate limiting (60/min, 1000/hour)
- ✅ Audit middleware (logs all API actions)
- ✅ Idempotency for payments
- ✅ Pagination on all list endpoints

**See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for complete instructions.**

---

## 📚 Documentation

### Getting Started

- **[Quick Start](./docs/QUICKSTART.md)** - Get up and running quickly ⚡
- **[Quick Deploy](./docs/QUICK_DEPLOY.md)** - Fast deployment checklist 🚀
- **[Full Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Complete deployment 📦
- **[Environment Setup](./.env.example)** - Environment variable template

### API Documentation

- **[API Reference](./API_REFERENCE.md)** - All 60+ endpoints documented 📖
- **[Interactive Docs](http://localhost:8000/docs)** - Swagger UI (when server running)
- **[ReDoc](http://localhost:8000/redoc)** - Alternative API documentation

### Architecture & Design

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Complete system architecture 🏗️
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - How to write and run tests 🧪
- **[Firebase Setup](./docs/FIREBASE_MIGRATION_GUIDE.md)** - Firebase configuration 🔥
- **[GCS Setup](./docs/GCS_SETUP_GUIDE.md)** - Google Cloud Storage setup ☁️

---

## 🔐 Security Features

- ✅ Firebase token verification with clock skew tolerance (60s)
- ✅ Role-based access control (student/teacher/admin)
- ✅ Password hashing (bcrypt, cost=12)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (Pydantic validation)
- ✅ CORS configuration (explicit allowlist)
- ✅ Presigned URLs with expiration (1 hour)
- ✅ File type and size validation
- ✅ Payment idempotency (prevent duplicates)
- ✅ Audit logging (all API actions)

---

## 📦 Project Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI application
│   ├── core/                  # Configuration, database, security
│   │   ├── settings.py        # Environment settings
│   │   ├── database.py        # Async database connection
│   │   ├── firebase.py        # Firebase initialization
│   │   ├── security.py        # Authentication & RBAC
│   │   ├── rbac.py            # Role-based access control
│   │   ├── exceptions.py      # Custom exceptions
│   │   └── idempotency.py     # Payment deduplication
│   ├── models/                # SQLAlchemy models (28 tables)
│   │   ├── user.py
│   │   ├── academic.py
│   │   ├── finance.py
│   │   ├── document.py
│   │   ├── communication.py
│   │   └── ...
│   ├── schemas/               # Pydantic schemas for validation
│   ├── routers/               # API endpoints (23 routers)
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── academic.py
│   │   ├── finance.py
│   │   ├── documents.py
│   │   ├── support.py
│   │   ├── me.py              # Mobile app endpoints
│   │   ├── student_portal.py  # Student-facing APIs
│   │   └── ...
│   ├── services/              # Business logic (8 services)
│   │   ├── auth_service.py
│   │   ├── gpa_service.py
│   │   ├── enrollment_service.py
│   │   ├── username_generator.py
│   │   └── ...
│   ├── middleware/            # Custom middleware
│   │   └── audit.py           # Audit logging
│   └── utils/                 # Helper functions
├── tests/
│   ├── unit/                  # Unit tests (80 tests)
│   └── integration/           # Integration tests (34 tests)
├── migrations/                # Alembic database migrations
├── scripts/                   # Utility scripts
│   ├── seed_essential_data.py
│   ├── seed_academic_data.py
│   └── ...
├── credentials/               # Firebase & GCS credentials (gitignored)
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── QUICK_DEPLOY.md
│   ├── QUICKSTART.md
│   ├── TESTING_GUIDE.md
│   ├── FIREBASE_MIGRATION_GUIDE.md
│   └── GCS_SETUP_GUIDE.md
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
├── pytest.ini                # Pytest configuration
├── alembic.ini               # Alembic configuration
├── API_REFERENCE.md          # Complete API documentation
├── PRODUCTION_DEPLOYMENT_GUIDE.md
└── README.md                 # This file
```

---

## 🛠️ Development Commands

```powershell
# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1

# Run development server
uvicorn app.main:app --reload --port 8000

# Run production server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Run tests
pytest                                    # All tests
pytest -v --cov=app                      # With coverage
pytest -m unit                           # Unit tests only

# Code quality
black app/                               # Format code
ruff app/                               # Lint code
mypy app/                               # Type checking
```

---

## 🎯 Backend Status Summary

| Component           | Status           | Details                           |
| ------------------- | ---------------- | --------------------------------- |
| **Core**            | ✅ Complete      | FastAPI + PostgreSQL + Firebase   |
| **Authentication**  | ✅ Complete      | Custom tokens + ID tokens         |
| **User Management** | ✅ Complete      | Auto-gen usernames, RBAC          |
| **Academic**        | ✅ Complete      | Courses, enrollments, grades, GPA |
| **Finance**         | ✅ Complete      | Invoices, payments, idempotency   |
| **Documents**       | ✅ Complete      | GCS storage, presigned URLs       |
| **Support**         | ✅ Complete      | Ticketing system, SLA tracking    |
| **Mobile APIs**     | ✅ Complete      | /me endpoints, student portal     |
| **Admin APIs**      | ✅ Complete      | Dashboard, bulk ops, analytics    |
| **Testing**         | ✅ 80%+ Coverage | 114 tests passing                 |
| **Documentation**   | ✅ Complete      | API Reference, guides             |
| **Deployment**      | ✅ Ready         | Scripts, guides, configs          |

---

## 🎉 Status: Production Ready!

```
╔════════════════════════════════════════════╗
║   ✅ Backend: 95% Complete                ║
║   ✅ API Endpoints: 60+ Operational       ║
║   ✅ Tests: 114 Passing (80%+ Coverage)   ║
║   ✅ Documentation: Complete              ║
║   ✅ Ready to Deploy: Yes                 ║
╚════════════════════════════════════════════╝
```

**Your Greenwich University Backend is ready to deploy! 🚀**

---

## 📞 Support & Resources

**Documentation:**

- API Reference: [API_REFERENCE.md](./API_REFERENCE.md)
- Deployment: [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | [docs/QUICK_DEPLOY.md](./docs/QUICK_DEPLOY.md)
- Testing: [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**Useful Links:**

- FastAPI Docs: https://fastapi.tiangolo.com
- SQLAlchemy: https://docs.sqlalchemy.org
- Firebase Admin: https://firebase.google.com/docs/admin/setup
- PostgreSQL: https://www.postgresql.org/docs

---

## 👥 Team

- **Developer**: Nguyen Dinh Hieu
- **Institution**: Greenwich University Vietnam
- **Program**: Final Year Project
- **Year**: 2024-2025

---

## 📄 License

This project is part of a final year project at Greenwich University Vietnam.

---

**Built with ❤️ for Greenwich University Vietnam**
