# Backend Quick Start Guide

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Firebase project with Admin SDK credentials
- Google Cloud Storage bucket

## Step 1: Environment Setup

### 1.1 Create Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 1.2 Install Dependencies

```powershell
pip install -r requirements.txt
```

### 1.3 Configure Environment Variables

Create `.env` file based on `.env.example`:

```env
# Application
APP_NAME="Greenwich Academic Portal API"
APP_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/greenwich_db

# Firebase (from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Google Cloud Storage
GCS_BUCKET_NAME=greenwich-documents

# OpenAI (for AI assistant)
OPENAI_API_KEY=sk-...

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:19006

# Security
SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-hex-32
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database

```powershell
# Using psql
psql -U postgres
CREATE DATABASE greenwich_db;
\q
```

### 2.2 Run Migrations

```powershell
# Create initial migration (if not exists)
alembic revision --autogenerate -m "Initial schema with 28 tables"

# Run migrations
alembic upgrade head
```

### 2.3 Seed Data

```powershell
python scripts/seed_data.py
```

This creates:

- 4 Campuses (Hanoi, Da Nang, Can Tho, HCMC)
- 3 Majors (Computing, Business, Design)

## Step 3: Firebase Setup

### 3.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project: "Greenwich Academic Portal"
3. Enable Authentication → Email/Password
4. Generate Admin SDK credentials

### 3.2 Download Service Account Key

1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Extract values for `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Step 4: Run Backend Server

### 4.1 Development Server

```powershell
# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python app/main.py
```

### 4.2 Verify Server

Open browser: http://localhost:8000

You should see:

```json
{
  "message": "Welcome to Greenwich Academic Portal API",
  "version": "1.0.0",
  "docs": "/api/docs",
  "health": "/health"
}
```

### 4.3 Check Health

```powershell
curl http://localhost:8000/health
```

## Step 5: Test API

### 5.1 View API Documentation

Open: http://localhost:8000/api/docs

Interactive Swagger UI with all endpoints

### 5.2 Create First Admin User

```powershell
# First, create Firebase user manually or use API
# Then seed admin in database
```

Example using Python:

```python
import asyncio
from app.core.database import get_db, engine
from app.models import User, Campus
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import SecurityUtils

async def create_admin():
    async with AsyncSession(engine) as db:
        # Get Hanoi campus
        campus = await db.execute(select(Campus).where(Campus.code == "H"))
        campus = campus.scalar_one()

        # Create admin
        admin = User(
            firebase_uid="admin-firebase-uid",  # From Firebase console
            username="AdminHGHA",
            email="admin@admin.greenwich.edu.vn",
            full_name="Admin Nguyen",
            role="admin",
            status="active",
            campus_id=campus.id,
            password_hash=SecurityUtils.hash_password("AdminPass123")
        )

        db.add(admin)
        await db.commit()
        print("Admin created successfully!")

    await engine.dispose()

asyncio.run(create_admin())
```

### 5.3 Test Student Login

```powershell
curl -X POST http://localhost:8000/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "HieuNDGCD220033",
    "password": "StudentPass123"
  }'
```

Response:

```json
{
  "custom_token": "eyJhbGciOiJSUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "HieuNDGCD220033",
    "email": "hieundgcd220033@student.greenwich.edu.vn",
    "role": "student",
    "campus_code": "D",
    "major_code": "C"
  }
}
```

## Step 6: Common Operations

### 6.1 Create Student User

POST `/api/v1/users` (Admin only)

```json
{
  "full_name": "Nguyen Dinh Hieu",
  "role": "student",
  "status": "active",
  "campus_id": 2,
  "major_id": 1,
  "year_entered": 2022,
  "phone_number": "0901234567",
  "date_of_birth": "2000-01-15",
  "gender": "male"
}
```

Response: Auto-generates username `HieuNDGCD220033`, email, Firebase account

### 6.2 List Users

GET `/api/v1/users?page=1&page_size=20&role=student`

### 6.3 Enroll in Course

POST `/api/v1/academic/enrollments`

```json
{
  "section_id": 1
}
```

Validates: capacity, schedule conflicts, prerequisites

### 6.4 Get My Enrollments

GET `/api/v1/academic/enrollments/my?semester_id=1`

### 6.5 Calculate GPA

GET `/api/v1/academic/students/my/gpa?semester_id=1`

GET `/api/v1/academic/students/my/academic-standing`

## Step 7: Database Migrations

### 7.1 Create New Migration

```powershell
# After modifying models
alembic revision --autogenerate -m "Add new field to User table"
```

### 7.2 Apply Migrations

```powershell
alembic upgrade head
```

### 7.3 Rollback Migration

```powershell
alembic downgrade -1
```

### 7.4 Check Current Version

```powershell
alembic current
```

## Troubleshooting

### Database Connection Error

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:** Check PostgreSQL is running and DATABASE_URL is correct

### Firebase Initialization Error

```
ValueError: Invalid or missing Firebase credentials
```

**Solution:** Verify FIREBASE\_\* values in `.env`, ensure private key includes `\n`

### Port Already in Use

```
OSError: [Errno 48] Address already in use
```

**Solution:** Kill existing process or use different port

```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Change port
uvicorn app.main:app --port 8001
```

### Alembic Can't Find Models

```
No changes detected
```

**Solution:** Ensure models are imported in `migrations/env.py`:

```python
from app.models import *
```

## Development Tips

### Enable Debug Logging

```env
LOG_LEVEL=DEBUG
```

### Hot Reload

```powershell
uvicorn app.main:app --reload
```

### Run Tests

```powershell
pytest
```

### Check Code Quality

```powershell
# Format code
black app/

# Lint
flake8 app/

# Type check
mypy app/
```

## Next Steps

1. ✅ Backend is running
2. ✅ Database is seeded
3. ✅ Authentication works
4. 🔄 Connect frontend apps
5. 🔄 Deploy to production

## API Endpoints Summary

### Authentication (5 endpoints)

- POST `/auth/student-login` - Student mobile login
- POST `/auth/session` - Admin web session
- GET `/auth/me` - Current user profile
- POST `/auth/logout` - Logout
- PUT `/auth/change-password` - Change password

### Users (7 endpoints)

- POST `/users` - Create user (auto-generates username)
- GET `/users` - List users (with filters)
- GET `/users/{id}` - Get user
- PUT `/users/{id}` - Update user
- DELETE `/users/{id}` - Deactivate user
- GET `/users/campuses` - List campuses
- GET `/users/majors` - List majors

### Academic (15+ endpoints)

- Course management (CRUD)
- Section management (CRUD)
- Enrollment (enroll, drop, list)
- Grades (submit, list)
- Attendance (bulk record, summary)
- GPA calculation (semester, cumulative, standing)

**Total: 30+ endpoints implemented**

## Need Help?

Check logs:

```powershell
# View logs
tail -f logs/app.log

# Or check console output
```

API documentation: http://localhost:8000/api/docs
