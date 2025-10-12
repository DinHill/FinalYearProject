# Academic Portal Backend - Complete System Overview

## 🏗️ Technology Stack

**Framework**: FastAPI (Python)
**Database**: PostgreSQL (Unified for dev/prod)
**Authentication**: Hybrid JWT + Firebase
**Hosting**: Render (deployed endpoint: https://academic-portal-api.onrender.com)
**ORM**: SQLAlchemy
**Validation**: Pydantic
**Real-time**: Firebase + WebSockets
**File Storage**: Firebase Storage / Local Storage

## 🆔 Username & ID Generation System

### **🎓 Student Username Format**

```
Format: [FirstName][LastNameInitials][University][Major][Campus][YearEntered][SequenceNumber]
Example: HieuNDGCD220033
```

**Real Pattern Analysis:**

- Full name: "Nguyen Dinh Hieu" → First: "Hieu", Last initials: "ND"
- University: "G" (Greenwich)
- Major: "C" (Computing)
- Campus: "D" (Da Nang)
- Year: "22" (2022)
- Sequence: "0033" (33rd student)

**Campus Codes:**

- **H** = Ha Noi
- **D** = Da Nang
- **C** = Can Tho
- **S** = Ho Chi Minh (Saigon)

**Major Codes:**

- **C** = Computing (BSc Computing) - Includes AI, IT specializations
- **B** = Business (BA Business) - Includes Marketing, Events, Communications, International Business
- **D** = Design (BA Graphic and Digital Design)

**Examples:**

```
HieuNDGCD220033  # Hieu Nguyen Dinh, Computing, Da Nang, 2022, #33
AnLVGBS230045    # An Le Van, Business, Ho Chi Minh, 2023, #45
MaiTTGDH240012   # Mai Tran Thi, Design, Ha Noi, 2024, #12
```

### **👨‍🏫 Teacher Username Format**

```
Format: [firstname][familyinitials][duplicatenumber]
Examples: Vinhhn3, Anpb2
```

**Pattern:**

- "Hoang Nhu Vinh" → "Vinh" + "hn" + "3" (3rd person with same name)
- Lowercase format for teachers

### **👨‍💼 Staff Username Format**

```
Format: [FirstName][FamilyInitials][DuplicateNumber]
Examples: AnPB3, LinhNT1
```

**Pattern:**

- "Pham Binh An" → "An" + "PB" + "3" (3rd person with same name)
- Mixed case format for staff

## 📊 Database Schema (18 Tables)

### 1. Core User Management

```sql
-- Users table with Greenwich ID system
users (
    id: SERIAL PRIMARY KEY,
    username: VARCHAR(20) UNIQUE NOT NULL,        -- Generated username
    firebase_uid: VARCHAR(128) UNIQUE,            -- Firebase UID
    email: VARCHAR(255) UNIQUE NOT NULL,          -- Generated email
    full_name: VARCHAR(255) NOT NULL,
    user_type: ENUM('student', 'teacher', 'staff'),

    -- Student specific
    student_id: VARCHAR(20),                      -- Same as username for students
    major: VARCHAR(50),                           -- Computing, Business, Design
    campus: VARCHAR(50),                          -- Ha Noi, Da Nang, Can Tho, Ho Chi Minh
    year_entered: INTEGER,
    sequence_number: INTEGER,

    -- Common fields
    is_active: BOOLEAN DEFAULT TRUE,
    password_hash: VARCHAR(255),
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Admin roles for staff users
admin_roles (
    id: SERIAL PRIMARY KEY,
    user_id: INTEGER REFERENCES users(id),
    role: ENUM('super_admin', 'academic_admin', 'content_admin', 'finance_admin', 'support_admin'),
    campus: VARCHAR(50),                          -- Campus-specific permissions
    permissions: JSONB,
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Username generation tracking
username_sequences (
    id: SERIAL PRIMARY KEY,
    base_username: VARCHAR(20) NOT NULL,
    user_type: VARCHAR(20) NOT NULL,
    count: INTEGER DEFAULT 0
)

-- Student sequence tracking
student_sequences (
    id: SERIAL PRIMARY KEY,
    major: VARCHAR(10) NOT NULL,
    campus: VARCHAR(10) NOT NULL,
    year_entered: INTEGER NOT NULL,
    last_sequence: INTEGER DEFAULT 0,
    UNIQUE(major, campus, year_entered)
)
```

### 2. Academic Structure

```sql
-- Academic periods
semesters (
    id: SERIAL PRIMARY KEY,
    name: VARCHAR(100),                           -- "Fall 2022", "Spring 2023"
    start_date: DATE,
    end_date: DATE,
    is_current: BOOLEAN DEFAULT FALSE,
    campus: VARCHAR(50),
    academic_year: VARCHAR(10)                    -- "2022-2023"
)

-- Course catalog
courses (
    id: SERIAL PRIMARY KEY,
    course_code: VARCHAR(20) UNIQUE,              -- "CS101", "BUS201"
    course_name: VARCHAR(255),
    credits: INTEGER,
    description: TEXT,
    major: VARCHAR(50),                           -- Computing, Business, Design
    campus: VARCHAR(50),
    prerequisites: JSONB,                         -- Array of required course IDs
    is_active: BOOLEAN DEFAULT TRUE
)

-- Course sections (specific instances)
course_sections (
    id: SERIAL PRIMARY KEY,
    course_id: INTEGER REFERENCES courses(id),
    semester_id: INTEGER REFERENCES semesters(id),
    section_code: VARCHAR(10),                    -- "A", "B", "C"
    teacher_id: INTEGER REFERENCES users(id),
    max_capacity: INTEGER,
    enrolled_count: INTEGER DEFAULT 0,
    room: VARCHAR(50),
    campus: VARCHAR(50),
    is_active: BOOLEAN DEFAULT TRUE
)
```

### 3. Scheduling System

```sql
-- Class schedules
schedules (
    id: SERIAL PRIMARY KEY,
    section_id: INTEGER REFERENCES course_sections(id),
    day_of_week: INTEGER,                         -- 1=Monday, 7=Sunday
    start_time: TIME,
    end_time: TIME,
    room: VARCHAR(50),
    campus: VARCHAR(50),
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
    campus: VARCHAR(50),
    created_by: INTEGER REFERENCES users(id)
)
```

### 4. Student Academic Records

```sql
-- Student enrollments
enrollments (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    section_id: INTEGER REFERENCES course_sections(id),
    enrollment_date: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status: ENUM('enrolled', 'dropped', 'completed'),
    final_grade: VARCHAR(5),                      -- A+, A, B+, B, C+, C, D, F
    grade_points: DECIMAL(3,2),                   -- 4.0, 3.7, 3.3, etc.
    gpa_contribution: DECIMAL(5,2)                -- Credits × Grade Points
)

-- Assignments and assessments
assignments (
    id: SERIAL PRIMARY KEY,
    section_id: INTEGER REFERENCES course_sections(id),
    title: VARCHAR(255),
    description: TEXT,
    assignment_type: ENUM('homework', 'quiz', 'midterm', 'final', 'project'),
    due_date: TIMESTAMP,
    max_points: INTEGER,
    weight_percentage: DECIMAL(5,2),              -- Contribution to final grade
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

-- Attendance tracking
attendance (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    section_id: INTEGER REFERENCES course_sections(id),
    date: DATE,
    status: ENUM('present', 'absent', 'late', 'excused'),
    marked_by: INTEGER REFERENCES users(id),
    marked_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 5. Communication System

```sql
-- Chat rooms
chat_rooms (
    id: SERIAL PRIMARY KEY,
    name: VARCHAR(255),
    room_type: ENUM('course', 'direct', 'group', 'ai_support'),
    course_section_id: INTEGER REFERENCES course_sections(id),
    campus: VARCHAR(50),
    created_by: INTEGER REFERENCES users(id),
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    message_type: ENUM('text', 'file', 'image', 'ai_response') DEFAULT 'text',
    firebase_message_id: VARCHAR(255),
    reply_to_id: INTEGER REFERENCES messages(id),
    sent_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    target_audience: ENUM('all', 'students', 'teachers', 'campus_specific', 'major_specific'),
    campus: VARCHAR(50),
    major: VARCHAR(50),
    priority: ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_published: BOOLEAN DEFAULT FALSE,
    publish_date: TIMESTAMP,
    expire_date: TIMESTAMP,
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Document management
documents (
    id: SERIAL PRIMARY KEY,
    title: VARCHAR(255),
    description: TEXT,
    file_path: VARCHAR(500),
    file_size: BIGINT,
    mime_type: VARCHAR(100),
    document_type: ENUM('syllabus', 'assignment', 'lecture', 'form', 'policy', 'transcript'),
    uploaded_by: INTEGER REFERENCES users(id),
    course_section_id: INTEGER REFERENCES course_sections(id),
    is_public: BOOLEAN DEFAULT FALSE,
    upload_date: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Document requests (transcripts, certificates, etc.)
document_requests (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    document_type: ENUM('transcript', 'enrollment_certificate', 'degree_certificate', 'recommendation_letter'),
    quantity: INTEGER DEFAULT 1,
    purpose: TEXT,
    delivery_method: ENUM('pickup', 'mail', 'email'),
    delivery_address: TEXT,
    status: ENUM('pending', 'processing', 'ready', 'completed', 'cancelled'),
    processing_fee: DECIMAL(10,2),
    processed_by: INTEGER REFERENCES users(id),
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at: TIMESTAMP
)
```

### 7. Financial Management

```sql
-- Fee structures
fee_structures (
    id: SERIAL PRIMARY KEY,
    fee_type: VARCHAR(100),                       -- tuition, library, lab, graduation
    amount: DECIMAL(12,2),
    currency: VARCHAR(3) DEFAULT 'VND',
    semester_id: INTEGER REFERENCES semesters(id),
    major: VARCHAR(50),
    campus: VARCHAR(50),
    is_active: BOOLEAN DEFAULT TRUE,
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Student fees
student_fees (
    id: SERIAL PRIMARY KEY,
    student_id: INTEGER REFERENCES users(id),
    fee_structure_id: INTEGER REFERENCES fee_structures(id),
    amount_due: DECIMAL(12,2),
    amount_paid: DECIMAL(12,2) DEFAULT 0,
    due_date: DATE,
    paid_date: TIMESTAMP,
    payment_method: VARCHAR(50),
    payment_reference: VARCHAR(100),
    status: ENUM('pending', 'partial', 'paid', 'overdue', 'waived') DEFAULT 'pending'
)
```

### 8. Support System

```sql
-- Support tickets
support_tickets (
    id: SERIAL PRIMARY KEY,
    ticket_number: VARCHAR(20) UNIQUE,
    user_id: INTEGER REFERENCES users(id),
    category: ENUM('technical', 'academic', 'financial', 'general', 'ai_support'),
    priority: ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    subject: VARCHAR(255),
    description: TEXT,
    status: ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to: INTEGER REFERENCES users(id),
    campus: VARCHAR(50),
    created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at: TIMESTAMP
)
```

## 🔐 Authentication System

### JWT + Firebase Hybrid Architecture

```python
# Authentication flow:
1. Mobile: Firebase Auth → Backend validates Firebase token → Issues JWT
2. Admin: Direct login → Backend validates credentials → Issues JWT
3. API calls: JWT token validation
4. Real-time features: Firebase token for chat/notifications
```

### Username Generation Functions

```python
def generate_student_username(full_name, major, campus, year_entered):
    """Generate Greenwich student username"""
    name_parts = full_name.strip().split()
    first_name = name_parts[-1]  # Vietnamese: last part is first name

    # Get family name initials
    family_parts = name_parts[:-1]
    last_initials = ''.join([part[0].upper() for part in family_parts])

    university = "G"  # Greenwich
    major_code = {"Computing": "C", "Business": "B", "Design": "D"}[major]
    campus_code = {"Ha Noi": "H", "Da Nang": "D", "Can Tho": "C", "Ho Chi Minh": "S"}[campus]
    year_code = str(year_entered)[-2:]

    sequence = get_next_student_sequence(year_entered, major, campus)

    return f"{first_name}{last_initials}{university}{major_code}{campus_code}{year_code}{sequence:04d}"

def generate_teacher_username(full_name):
    """Generate teacher username"""
    name_parts = full_name.strip().split()
    first_name = name_parts[-1].lower()
    family_parts = name_parts[:-1]
    last_initials = ''.join([part[0].lower() for part in family_parts])

    base_username = f"{first_name}{last_initials}"
    duplicate_count = get_duplicate_count(base_username, 'teacher')

    return f"{base_username}{duplicate_count + 1}" if duplicate_count > 0 else base_username

def generate_staff_username(full_name):
    """Generate staff username"""
    name_parts = full_name.strip().split()
    first_name = name_parts[-1]
    family_parts = name_parts[:-1]
    last_initials = ''.join([part[0].upper() for part in family_parts])

    base_username = f"{first_name}{last_initials}"
    duplicate_count = get_duplicate_count(base_username, 'staff')

    return f"{base_username}{duplicate_count + 1}" if duplicate_count > 0 else base_username
```

## 📡 API Endpoints Structure

### Authentication & User Management

- `POST /api/v1/auth/firebase-login` - Mobile Firebase authentication
- `POST /api/v1/auth/admin-login` - Admin portal login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/auth/me` - Current user profile
- `POST /api/v1/auth/logout` - Logout

### User Management (Admin)

- `GET /api/v1/users` - List users (paginated, filtered)
- `POST /api/v1/users` - Create user with auto-generated username
- `GET /api/v1/users/{id}` - User details
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Deactivate user

### Academic Management

- `GET /api/v1/academic/courses` - Course catalog
- `POST /api/v1/academic/courses` - Create course
- `GET /api/v1/academic/sections` - Course sections
- `POST /api/v1/academic/enrollments` - Enroll student
- `GET /api/v1/academic/schedules` - Student/Teacher schedules
- `GET /api/v1/academic/grades` - Student grades
- `PUT /api/v1/academic/grades/{id}` - Update grade
- `GET /api/v1/academic/attendance` - Attendance records
- `POST /api/v1/academic/attendance` - Mark attendance
- `GET /api/v1/academic/transcript/{student_id}` - Official transcript
- `GET /api/v1/academic/gpa/{student_id}` - GPA calculation

### Document Management

- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/{id}/download` - Download document
- `POST /api/v1/documents/request` - Request official document
- `GET /api/v1/documents/requests` - Track document requests
- `PUT /api/v1/documents/requests/{id}` - Update request status

### Communication

- `GET /api/v1/chat/rooms` - User's chat rooms
- `POST /api/v1/chat/rooms` - Create chat room
- `GET /api/v1/chat/rooms/{id}/messages` - Chat history
- `POST /api/v1/chat/rooms/{id}/messages` - Send message
- `POST /api/v1/chat/ai` - AI chat support
- `GET /api/v1/announcements` - Campus announcements

### Financial

- `GET /api/v1/fees/student/{id}` - Student fee summary
- `GET /api/v1/fees/structures` - Fee structures by major/campus
- `POST /api/v1/fees/payments` - Record payment
- `GET /api/v1/fees/statements/{student_id}` - Payment history

### Analytics & Reporting

- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/academic` - Academic performance metrics
- `GET /api/v1/analytics/users` - User engagement analytics
- `GET /api/v1/reports/enrollment` - Enrollment reports
- `GET /api/v1/reports/grades` - Grade distribution reports

## 🚀 Implementation Phases

### Phase 1: Core Foundation (Day 1-2)

1. FastAPI project setup
2. PostgreSQL connection with Greenwich schema
3. Username generation system
4. Basic authentication (JWT + Firebase)
5. User CRUD with auto-generated usernames

### Phase 2: Academic Core (Day 3-4)

1. Course and section management
2. Student enrollment system
3. Schedule management
4. Grade book functionality
5. Attendance tracking

### Phase 3: Communication & Content (Day 5-6)

1. Chat system with Firebase real-time
2. AI support integration
3. Announcement system
4. Document upload/download
5. Document request workflow

### Phase 4: Financial & Analytics (Day 7)

1. Fee management system
2. Payment tracking
3. Analytics dashboard
4. Reporting system
5. GPA calculation engine

### Phase 5: Polish & Deploy (Day 8)

1. Performance optimization
2. Security hardening
3. Testing and validation
4. Documentation
5. Production deployment

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
│   │   └── auth.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── academic.py
│   │       ├── chat.py
│   │       └── analytics.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── username_generator.py
│   │   ├── firebase_service.py
│   │   └── gpa_calculator.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── permissions.py
│   │   └── validators.py
│   └── core/
│       ├── __init__.py
│       ├── config.py
│       └── security.py
├── requirements.txt
├── Dockerfile
├── .env
└── README.md
```

This backend architecture provides a comprehensive foundation for the Greenwich University Academic Portal, with authentic Vietnamese naming patterns, proper academic workflows, and scalable multi-campus support.
