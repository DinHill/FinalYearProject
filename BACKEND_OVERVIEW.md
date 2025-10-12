# Academic Portal Backend - Architecture Overview

## 🏗️ Technology Stack

**Framework**: FastAPI (Python)
**Database**: PostgreSQL (Unified for dev/prod)
**Authentication**: Hybrid JWT + Firebase
**Hosting**: Render (already deployed endpoint: https://academic-portal-api.onrender.com)
**ORM**: SQLAlchemy
**Validation**: Pydantic

## 📊 Database Schema (18 Tables)

### 1. Core User Management

```sql
-- Users table (students, teachers, staff)
users (
    id: SERIAL PRIMARY KEY,
    user_id: VARCHAR(50) UNIQUE,
    firebase_uid: VARCHAR(128) UNIQUE,
    email: VARCHAR(255) UNIQUE,
    full_name: VARCHAR(255),
    user_type: ENUM('student', 'teacher', 'staff'),
    campus: VARCHAR(100),
    is_active: BOOLEAN DEFAULT TRUE,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP
)

-- Admin roles for staff users
admin_roles (
    id: SERIAL PRIMARY KEY,
    user_id: INTEGER REFERENCES users(id),
    role: ENUM('super_admin', 'academic_admin', 'content_admin', 'finance_admin', 'support_admin'),
    permissions: JSONB,
    created_at: TIMESTAMP
)
```

### 2. Academic Structure

```sql
-- Academic periods
semesters (
    id: SERIAL PRIMARY KEY,
    name: VARCHAR(100),
    start_date: DATE,
    end_date: DATE,
    is_current: BOOLEAN DEFAULT FALSE,
    campus: VARCHAR(100)
)

-- Course catalog
courses (
    id: SERIAL PRIMARY KEY,
    course_code: VARCHAR(20) UNIQUE,
    course_name: VARCHAR(255),
    credits: INTEGER,
    description: TEXT,
    department: VARCHAR(100),
    campus: VARCHAR(100),
    is_active: BOOLEAN DEFAULT TRUE
)

-- Course sections (specific instances)
course_sections (
    id: SERIAL PRIMARY KEY,
    course_id: INTEGER REFERENCES courses(id),
    semester_id: INTEGER REFERENCES semesters(id),
    section_code: VARCHAR(10),
    teacher_id: INTEGER REFERENCES users(id),
    max_capacity: INTEGER,
    enrolled_count: INTEGER DEFAULT 0,
    room: VARCHAR(50),
    schedule_days: VARCHAR(20), -- e.g., "MON,WED,FRI"
    start_time: TIME,
    end_time: TIME
)
```

### 3. Scheduling System

```sql
-- Regular class schedules
schedules (
    id: SERIAL PRIMARY KEY,
    section_id: INTEGER REFERENCES course_sections(id),
    day_of_week: INTEGER, -- 1=Monday, 7=Sunday
    start_time: TIME,
    end_time: TIME,
    room: VARCHAR(50),
    is_active: BOOLEAN DEFAULT TRUE
)

-- Special events (exams, holidays, etc.)
special_events (
    id: SERIAL PRIMARY KEY,
    title: VARCHAR(255),
    description: TEXT,
    event_type: ENUM('exam', 'holiday', 'meeting', 'workshop'),
    start_datetime: TIMESTAMP,
    end_datetime: TIMESTAMP,
    location: VARCHAR(255),
    campus: VARCHAR(100),
    created_by: INTEGER REFERENCES users(id)
)
```

### 4. Student Management

```sql
-- Student enrollments
enrollments (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    section_id: INTEGER REFERENCES course_sections(id),
    enrollment_date: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status: ENUM('enrolled', 'dropped', 'completed'),
    grade: VARCHAR(5), -- A+, A, B+, etc.
    grade_points: DECIMAL(3,2)
)

-- Assignments
assignments (
    id: SERIAL PRIMARY KEY,
    section_id: INTEGER REFERENCES course_sections(id),
    title: VARCHAR(255),
    description: TEXT,
    assignment_type: ENUM('homework', 'quiz', 'exam', 'project'),
    due_date: TIMESTAMP,
    max_points: INTEGER,
    is_published: BOOLEAN DEFAULT FALSE,
    created_by: INTEGER REFERENCES users(id)
)

-- Student grades
grades (
    id: SERIAL PRIMARY KEY,
    assignment_id: INTEGER REFERENCES assignments(id),
    student_id: INTEGER REFERENCES users(id),
    points_earned: DECIMAL(5,2),
    submission_date: TIMESTAMP,
    feedback: TEXT,
    graded_by: INTEGER REFERENCES users(id),
    graded_at: TIMESTAMP
)
```

### 5. Communication System

```sql
-- Chat rooms
chat_rooms (
    id: SERIAL PRIMARY KEY,
    name: VARCHAR(255),
    room_type: ENUM('course', 'direct', 'group'),
    course_section_id: INTEGER REFERENCES course_sections(id),
    created_by: INTEGER REFERENCES users(id),
    created_at: TIMESTAMP,
    is_active: BOOLEAN DEFAULT TRUE
)

-- Chat participants
chat_participants (
    id: SERIAL PRIMARY KEY,
    room_id: INTEGER REFERENCES chat_rooms(id),
    user_id: INTEGER REFERENCES users(id),
    joined_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role: ENUM('admin', 'member') DEFAULT 'member'
)

-- Messages (stored in PostgreSQL, real-time via Firebase)
messages (
    id: SERIAL PRIMARY KEY,
    room_id: INTEGER REFERENCES chat_rooms(id),
    sender_id: INTEGER REFERENCES users(id),
    content: TEXT,
    message_type: ENUM('text', 'file', 'image') DEFAULT 'text',
    firebase_message_id: VARCHAR(255), -- Reference to Firebase document
    sent_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at: TIMESTAMP,
    is_deleted: BOOLEAN DEFAULT FALSE
)
```

### 6. Content Management

```sql
-- Announcements
announcements (
    id: SERIAL PRIMARY KEY,
    title: VARCHAR(255),
    content: TEXT,
    author_id: INTEGER REFERENCES users(id),
    target_audience: ENUM('all', 'students', 'teachers', 'campus_specific'),
    campus: VARCHAR(100),
    priority: ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_published: BOOLEAN DEFAULT FALSE,
    publish_date: TIMESTAMP,
    expire_date: TIMESTAMP,
    created_at: TIMESTAMP
)

-- Document management
documents (
    id: SERIAL PRIMARY KEY,
    title: VARCHAR(255),
    description: TEXT,
    file_path: VARCHAR(500),
    file_size: BIGINT,
    mime_type: VARCHAR(100),
    document_type: ENUM('syllabus', 'assignment', 'lecture', 'form', 'policy'),
    uploaded_by: INTEGER REFERENCES users(id),
    course_section_id: INTEGER REFERENCES course_sections(id),
    is_public: BOOLEAN DEFAULT FALSE,
    upload_date: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 7. Financial Management

```sql
-- Fee structures
fee_structures (
    id: SERIAL PRIMARY KEY,
    fee_type: VARCHAR(100), -- tuition, library, lab, etc.
    amount: DECIMAL(10,2),
    currency: VARCHAR(3) DEFAULT 'VND',
    semester_id: INTEGER REFERENCES semesters(id),
    campus: VARCHAR(100),
    is_active: BOOLEAN DEFAULT TRUE
)

-- Student fees
student_fees (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    fee_structure_id: INTEGER REFERENCES fee_structures(id),
    amount_due: DECIMAL(10,2),
    amount_paid: DECIMAL(10,2) DEFAULT 0,
    due_date: DATE,
    paid_date: TIMESTAMP,
    payment_method: VARCHAR(50),
    status: ENUM('pending', 'paid', 'overdue', 'waived') DEFAULT 'pending'
)
```

### 8. Support System

```sql
-- Support tickets
support_tickets (
    id: SERIAL PRIMARY KEY,
    ticket_number: VARCHAR(20) UNIQUE,
    user_id: INTEGER REFERENCES users(id),
    category: ENUM('technical', 'academic', 'financial', 'general'),
    priority: ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    subject: VARCHAR(255),
    description: TEXT,
    status: ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to: INTEGER REFERENCES users(id),
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at: TIMESTAMP,
    resolved_at: TIMESTAMP
)
```

## 🔐 Authentication System

### JWT + Firebase Hybrid

```python
# Authentication flow:
1. Frontend authenticates with Firebase
2. Backend validates Firebase token
3. Backend issues JWT for API access
4. Subsequent requests use JWT
5. Chat/real-time features use Firebase directly
```

### Role-Based Access Control (RBAC)

```python
PERMISSIONS = {
    'super_admin': ['*'],  # All permissions
    'academic_admin': ['users.read', 'courses.*', 'schedules.*'],
    'content_admin': ['announcements.*', 'documents.*'],
    'finance_admin': ['fees.*', 'payments.*'],
    'support_admin': ['tickets.*', 'users.read']
}
```

## 📡 API Endpoints Structure

### Authentication

- `POST /api/v1/auth/firebase-login` - Firebase token validation
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user info

### User Management

- `GET /api/v1/users` - List users (paginated)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Academic

- `GET /api/v1/academic/courses` - List courses
- `POST /api/v1/academic/courses` - Create course
- `GET /api/v1/academic/sections` - List course sections
- `GET /api/v1/academic/schedules` - Get schedules

### Communication

- `GET /api/v1/chat/rooms` - List chat rooms
- `POST /api/v1/chat/rooms` - Create chat room
- `GET /api/v1/chat/rooms/{id}/messages` - Get messages
- `POST /api/v1/chat/rooms/{id}/messages` - Send message

### Content

- `GET /api/v1/content/announcements` - List announcements
- `POST /api/v1/content/announcements` - Create announcement
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload` - Upload document

### Analytics

- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/users` - User analytics

## 🚀 Development Plan

### Phase 1: Core Setup (Day 1)

1. FastAPI project structure
2. PostgreSQL connection
3. SQLAlchemy models (18 tables)
4. Basic authentication

### Phase 2: User Management (Day 2)

1. User CRUD operations
2. Role-based permissions
3. Firebase integration

### Phase 3: Academic System (Day 3)

1. Course management
2. Schedule system
3. Enrollment logic

### Phase 4: Communication (Day 4)

1. Chat system
2. Real-time messaging
3. Notifications

### Phase 5: Content & Features (Day 5)

1. Announcements
2. Document management
3. Analytics dashboard

## 📂 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── academic.py
│   │   ├── chat.py
│   │   └── content.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── academic.py
│   │   └── chat.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── academic.py
│   │   │   └── chat.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── firebase_service.py
│   └── utils/
│       ├── __init__.py
│       ├── auth.py
│       └── permissions.py
├── requirements.txt
├── Dockerfile
├── .env
└── README.md
```

This backend will provide a robust, scalable foundation for your Academic Portal system with proper separation of concerns, comprehensive RBAC, and hybrid authentication. Ready to start building?
