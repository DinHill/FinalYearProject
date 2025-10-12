# Academic Portal Backend - Detailed Technical Specifications

## 📋 **Detailed Backend Requirements**

### **Functional Requirements**

#### **User Management**

- ✅ **Account Creation**: Auto-generate usernames following Greenwich patterns
- ✅ **Authentication**: Hybrid JWT + Firebase for mobile/web
- ✅ **Authorization**: Role-based access control (RBAC) with 7 user types
- ✅ **Profile Management**: Complete user profiles with academic records
- ✅ **Password Management**: Secure password policies and reset functionality
- ✅ **Multi-campus Support**: Campus-specific data filtering and permissions

#### **Academic Management**

- ✅ **Course Catalog**: Full course management with prerequisites
- ✅ **Enrollment System**: Student registration with capacity limits
- ✅ **Schedule Management**: Timetable creation and conflict detection
- ✅ **Grade Management**: Comprehensive grading system with GPA calculation
- ✅ **Attendance Tracking**: Real-time attendance marking and reporting
- ✅ **Academic Records**: Transcript generation and academic history
- ✅ **Assignment System**: Assignment creation, submission, and grading

#### **Communication Features**

- ✅ **Real-time Chat**: Multi-room chat system with Firebase integration
- ✅ **AI Support**: OpenAI-powered academic assistant
- ✅ **Announcements**: Campus and major-specific notifications
- ✅ **File Sharing**: Document and media sharing in chat rooms
- ✅ **Notification System**: Push notifications for important updates

#### **Document Management**

- ✅ **File Upload/Download**: Secure file handling with virus scanning
- ✅ **Document Requests**: Official transcript and certificate requests
- ✅ **Digital Signatures**: Secure document verification
- ✅ **Version Control**: Document versioning and approval workflows
- ✅ **Access Control**: Permission-based document access

#### **Financial Management**

- ✅ **Fee Structures**: Flexible fee configuration by major/campus
- ✅ **Payment Tracking**: Comprehensive billing and payment history
- ✅ **Financial Reports**: Revenue and outstanding balance reports
- ✅ **Payment Integration**: Support for multiple payment methods
- ✅ **Scholarship Management**: Scholarship application and tracking

#### **Analytics & Reporting**

- ✅ **Dashboard Analytics**: Real-time system metrics
- ✅ **Academic Analytics**: Performance trends and insights
- ✅ **User Behavior**: Engagement and usage patterns
- ✅ **Custom Reports**: Flexible report generation
- ✅ **Data Export**: CSV/PDF export functionality

### **Non-Functional Requirements**

#### **Performance**

- 🎯 **Response Time**: < 200ms for API calls, < 2s for complex queries
- 🎯 **Throughput**: Support 1000+ concurrent users
- 🎯 **Scalability**: Horizontal scaling with load balancers
- 🎯 **Caching**: Redis for session and query caching
- 🎯 **Database Optimization**: Proper indexing and query optimization

#### **Security**

- 🔒 **Authentication**: Multi-factor authentication support
- 🔒 **Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- 🔒 **Input Validation**: Comprehensive input sanitization
- 🔒 **Rate Limiting**: API rate limiting to prevent abuse
- 🔒 **Audit Logging**: Complete audit trail for sensitive operations

#### **Reliability**

- 🛡️ **Uptime**: 99.9% availability SLA
- 🛡️ **Backup**: Automated daily backups with point-in-time recovery
- 🛡️ **Monitoring**: Comprehensive health monitoring and alerting
- 🛡️ **Error Handling**: Graceful error handling and recovery
- 🛡️ **Circuit Breakers**: Fault tolerance for external services

## 🗄️ **Detailed Data Structure**

### **Core Entities Relationship Diagram**

```
Users (Central Hub)
├── Students → Enrollments → Course Sections → Courses
├── Teachers → Course Sections → Schedules
├── Staff → Admin Roles → Permissions
│
├── Academic Records
│   ├── Grades → Assignments
│   ├── Attendance → Schedules
│   └── Transcripts → Enrollments
│
├── Communication
│   ├── Chat Rooms → Messages
│   ├── Chat Participants
│   └── Announcements
│
├── Documents
│   ├── File Storage
│   ├── Document Requests
│   └── Access Permissions
│
└── Financial
    ├── Fee Structures
    ├── Student Fees
    └── Payments
```

### **Database Schema (Detailed)**

#### **1. User Management Tables**

```sql
-- Users table with Greenwich-specific fields
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,          -- Auto-generated: HieuNDGCD220033
    firebase_uid VARCHAR(128) UNIQUE,              -- Firebase authentication
    email VARCHAR(255) UNIQUE NOT NULL,            -- Auto-generated email
    full_name VARCHAR(255) NOT NULL,               -- Nguyen Dinh Hieu
    first_name VARCHAR(100) NOT NULL,              -- Hieu
    last_name VARCHAR(150) NOT NULL,               -- Nguyen Dinh
    user_type user_type_enum NOT NULL,             -- student, teacher, staff

    -- Academic Information
    major VARCHAR(50),                             -- Computing, Business, Design
    campus campus_enum NOT NULL,                   -- ha_noi, da_nang, can_tho, ho_chi_minh
    year_entered INTEGER,                          -- 2022, 2023, 2024
    sequence_number INTEGER,                       -- 0033
    graduation_year INTEGER,                       -- Expected/actual graduation
    academic_status academic_status_enum DEFAULT 'active', -- active, suspended, graduated, withdrawn

    -- Authentication
    password_hash VARCHAR(255),
    password_salt VARCHAR(255),
    password_expires_at TIMESTAMP,
    last_login_at TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,

    -- Profile Information
    date_of_birth DATE,
    gender gender_enum,                            -- male, female, other
    phone_number VARCHAR(20),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),

    -- System Fields
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),

    -- Indexes
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_campus_major (campus, major),
    INDEX idx_users_type_status (user_type, academic_status)
);

-- Enums
CREATE TYPE user_type_enum AS ENUM ('student', 'teacher', 'staff');
CREATE TYPE campus_enum AS ENUM ('ha_noi', 'da_nang', 'can_tho', 'ho_chi_minh');
CREATE TYPE academic_status_enum AS ENUM ('active', 'suspended', 'graduated', 'withdrawn');
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');

-- Admin roles with granular permissions
CREATE TABLE admin_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role role_type_enum NOT NULL,
    campus campus_enum,                            -- NULL for all campuses
    department VARCHAR(50),                        -- Specific department access
    permissions JSONB NOT NULL DEFAULT '{}',      -- Detailed permissions object
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                          -- Temporary role assignments
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(user_id, role, campus)
);

CREATE TYPE role_type_enum AS ENUM (
    'super_admin', 'academic_admin', 'content_admin',
    'finance_admin', 'support_admin'
);

-- Username generation tracking
CREATE TABLE username_sequences (
    id SERIAL PRIMARY KEY,
    base_username VARCHAR(20) NOT NULL,
    user_type user_type_enum NOT NULL,
    count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(base_username, user_type)
);

-- Student-specific sequence tracking
CREATE TABLE student_sequences (
    id SERIAL PRIMARY KEY,
    major VARCHAR(50) NOT NULL,
    campus campus_enum NOT NULL,
    year_entered INTEGER NOT NULL,
    last_sequence INTEGER DEFAULT 0,

    UNIQUE(major, campus, year_entered)
);
```

#### **2. Academic Management Tables**

```sql
-- Academic calendars and semesters
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                   -- "Fall 2022", "Spring 2023"
    semester_type semester_type_enum NOT NULL,    -- fall, spring, summer
    academic_year VARCHAR(10) NOT NULL,           -- "2022-2023"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start DATE NOT NULL,
    registration_end DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    campus campus_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE semester_type_enum AS ENUM ('fall', 'spring', 'summer');

-- Course catalog
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,      -- "CS101", "BUS201", "DES301"
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL CHECK (credits > 0),
    major VARCHAR(50) NOT NULL,                   -- Computing, Business, Design
    course_level course_level_enum NOT NULL,     -- undergraduate, graduate
    prerequisites JSONB DEFAULT '[]',            -- Array of required course IDs
    corequisites JSONB DEFAULT '[]',             -- Array of concurrent course IDs
    max_students INTEGER DEFAULT 30,
    min_students INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_courses_major (major),
    INDEX idx_courses_level (course_level),
    INDEX idx_courses_code (course_code)
);

CREATE TYPE course_level_enum AS ENUM ('undergraduate', 'graduate');

-- Course sections (class instances)
CREATE TABLE course_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    section_code VARCHAR(10) NOT NULL,           -- "A", "B", "C"
    instructor_id INTEGER REFERENCES users(id),  -- Primary instructor
    co_instructors JSONB DEFAULT '[]',           -- Array of co-instructor IDs

    -- Capacity and enrollment
    max_capacity INTEGER NOT NULL DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    waitlist_capacity INTEGER DEFAULT 10,

    -- Location and timing
    room VARCHAR(50),
    building VARCHAR(100),
    campus campus_enum NOT NULL,

    -- Status
    status section_status_enum DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    syllabus_url VARCHAR(500),
    course_materials JSONB DEFAULT '[]',
    grading_policy TEXT,
    attendance_policy TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(course_id, semester_id, section_code),
    INDEX idx_sections_instructor (instructor_id),
    INDEX idx_sections_semester (semester_id),
    INDEX idx_sections_campus (campus)
);

CREATE TYPE section_status_enum AS ENUM ('draft', 'open', 'closed', 'cancelled', 'completed');

-- Class schedules
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    building VARCHAR(100),
    effective_from DATE NOT NULL,
    effective_until DATE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Schedule type for different meeting patterns
    schedule_type schedule_type_enum DEFAULT 'regular',
    recurrence_pattern JSONB,                    -- For complex scheduling

    CHECK (end_time > start_time),
    INDEX idx_schedules_section (section_id),
    INDEX idx_schedules_day_time (day_of_week, start_time)
);

CREATE TYPE schedule_type_enum AS ENUM ('regular', 'lab', 'exam', 'makeup', 'special');
```

#### **3. Student Academic Records**

```sql
-- Student enrollments
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,

    -- Enrollment details
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_type enrollment_type_enum DEFAULT 'regular',
    status enrollment_status_enum DEFAULT 'enrolled',

    -- Academic outcomes
    final_grade grade_enum,
    grade_points DECIMAL(3,2),                   -- 4.00, 3.67, 3.33, etc.
    credits_earned INTEGER DEFAULT 0,

    -- Withdrawal information
    withdraw_date TIMESTAMP,
    withdraw_reason VARCHAR(255),

    -- Payment status
    payment_status payment_status_enum DEFAULT 'pending',
    payment_deadline DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, section_id),
    INDEX idx_enrollments_student (student_id),
    INDEX idx_enrollments_section (section_id),
    INDEX idx_enrollments_status (status)
);

CREATE TYPE enrollment_type_enum AS ENUM ('regular', 'audit', 'credit_no_credit');
CREATE TYPE enrollment_status_enum AS ENUM ('enrolled', 'withdrawn', 'completed', 'failed');
CREATE TYPE grade_enum AS ENUM ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'partial', 'paid', 'waived', 'overdue');

-- Assignments and assessments
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Assignment configuration
    assignment_type assignment_type_enum NOT NULL,
    max_points INTEGER NOT NULL CHECK (max_points > 0),
    weight_percentage DECIMAL(5,2) NOT NULL CHECK (weight_percentage > 0),

    -- Timing
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    late_penalty_percent DECIMAL(5,2) DEFAULT 0,
    allow_late_submission BOOLEAN DEFAULT TRUE,

    -- Submission settings
    submission_type submission_type_enum DEFAULT 'online',
    file_types_allowed JSONB DEFAULT '[]',       -- ["pdf", "doc", "txt"]
    max_file_size_mb INTEGER DEFAULT 10,
    max_submissions INTEGER DEFAULT 1,

    -- Grading
    rubric JSONB,                                -- Detailed grading rubric
    auto_grade BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    grades_released BOOLEAN DEFAULT FALSE,

    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_assignments_section (section_id),
    INDEX idx_assignments_due_date (due_date),
    INDEX idx_assignments_type (assignment_type)
);

CREATE TYPE assignment_type_enum AS ENUM ('homework', 'quiz', 'midterm', 'final', 'project', 'presentation', 'lab');
CREATE TYPE submission_type_enum AS ENUM ('online', 'paper', 'both');

-- Student grades
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Scoring
    points_earned DECIMAL(6,2),
    max_points INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN max_points > 0 THEN (points_earned / max_points) * 100 ELSE 0 END
    ) STORED,

    -- Submission details
    submission_date TIMESTAMP,
    late_submission BOOLEAN DEFAULT FALSE,
    submission_files JSONB DEFAULT '[]',         -- Array of file references
    submission_text TEXT,

    -- Grading details
    feedback TEXT,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP,
    grade_status grade_status_enum DEFAULT 'not_submitted',

    -- Extra credit and adjustments
    extra_credit DECIMAL(6,2) DEFAULT 0,
    penalty_points DECIMAL(6,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(assignment_id, student_id),
    INDEX idx_grades_student (student_id),
    INDEX idx_grades_assignment (assignment_id),
    INDEX idx_grades_status (grade_status)
);

CREATE TYPE grade_status_enum AS ENUM ('not_submitted', 'submitted', 'graded', 'returned', 'resubmission_required');

-- Attendance tracking
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(id),

    attendance_date DATE NOT NULL,
    status attendance_status_enum NOT NULL,

    -- Timing details
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    duration_minutes INTEGER,

    -- Additional information
    notes TEXT,
    excuse_provided BOOLEAN DEFAULT FALSE,
    excuse_documentation VARCHAR(500),

    -- Tracking
    marked_by INTEGER REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method attendance_method_enum DEFAULT 'manual',

    UNIQUE(student_id, section_id, attendance_date),
    INDEX idx_attendance_student_date (student_id, attendance_date),
    INDEX idx_attendance_section_date (section_id, attendance_date)
);

CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused', 'partial');
CREATE TYPE attendance_method_enum AS ENUM ('manual', 'qr_code', 'nfc', 'biometric', 'gps');
```

#### **4. Communication System Tables**

```sql
-- Chat rooms
CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_type room_type_enum NOT NULL,

    -- Room configuration
    is_private BOOLEAN DEFAULT FALSE,
    max_participants INTEGER,
    allow_file_sharing BOOLEAN DEFAULT TRUE,
    allow_voice_messages BOOLEAN DEFAULT TRUE,
    message_retention_days INTEGER DEFAULT 365,

    -- Associated entities
    course_section_id INTEGER REFERENCES course_sections(id),
    campus campus_enum,

    -- Room settings
    moderation_enabled BOOLEAN DEFAULT FALSE,
    auto_moderation_rules JSONB DEFAULT '{}',
    welcome_message TEXT,
    room_rules TEXT,

    -- Metadata
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    INDEX idx_chat_rooms_type (room_type),
    INDEX idx_chat_rooms_course (course_section_id),
    INDEX idx_chat_rooms_campus (campus)
);

CREATE TYPE room_type_enum AS ENUM ('course', 'direct', 'group', 'ai_support', 'campus_general', 'major_specific');

-- Chat participants
CREATE TABLE chat_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Participant role and permissions
    role participant_role_enum DEFAULT 'member',
    permissions JSONB DEFAULT '{}',

    -- Activity tracking
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP,
    last_message_read_id INTEGER,
    notification_settings JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP,

    UNIQUE(room_id, user_id),
    INDEX idx_chat_participants_user (user_id),
    INDEX idx_chat_participants_room (room_id)
);

CREATE TYPE participant_role_enum AS ENUM ('owner', 'admin', 'moderator', 'member', 'observer');

-- Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),

    -- Message content
    content TEXT NOT NULL,
    message_type message_type_enum DEFAULT 'text',

    -- Rich content
    attachments JSONB DEFAULT '[]',              -- File attachments
    mentions JSONB DEFAULT '[]',                 -- User mentions
    reactions JSONB DEFAULT '{}',                -- Message reactions

    -- Threading
    reply_to_id INTEGER REFERENCES messages(id),
    thread_root_id INTEGER REFERENCES messages(id),

    -- Firebase integration
    firebase_message_id VARCHAR(255),
    firebase_room_id VARCHAR(255),

    -- Message metadata
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES users(id),

    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_by INTEGER REFERENCES users(id),
    flag_reason VARCHAR(255),
    moderation_status moderation_status_enum DEFAULT 'approved',

    INDEX idx_messages_room_time (room_id, sent_at),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_thread (thread_root_id)
);

CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'voice', 'ai_response', 'system', 'announcement');
CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected', 'auto_approved');
```

## 🔄 **Data Flow Architecture**

### **Request Flow Diagram**

```
Client Request
      ↓
[Rate Limiter] → [Load Balancer]
      ↓
[API Gateway] → [Authentication Middleware]
      ↓
[Route Handler] → [Validation Layer]
      ↓
[Business Logic] → [Service Layer]
      ↓
[Data Access] → [Database/Cache]
      ↓
[Response Format] → [Client Response]
```

### **Authentication Flow**

```
Mobile App:
Firebase Auth → Firebase Token → Backend Validation → JWT Issue → API Access

Admin Portal:
Username/Password → Backend Auth → JWT Issue → API Access

Real-time Features:
Firebase Token → Firebase Realtime DB → Sync with PostgreSQL
```

### **Data Processing Pipelines**

#### **Student Enrollment Flow**

```python
1. Student selects course section
2. Check prerequisites and capacity
3. Validate payment status
4. Create enrollment record
5. Update section enrollment count
6. Generate schedule conflicts check
7. Send confirmation notifications
8. Update student academic plan
```

#### **Grade Processing Flow**

```python
1. Instructor submits grades
2. Validate grade format and ranges
3. Calculate weighted scores
4. Update assignment grades table
5. Recalculate course grade
6. Update enrollment final grade
7. Recalculate student GPA
8. Trigger academic standing review
9. Send grade notifications
```

#### **Document Request Flow**

```python
1. Student submits document request
2. Validate request eligibility
3. Calculate processing fees
4. Create request record
5. Route to appropriate department
6. Process payment (if required)
7. Generate document
8. Digital signature and verification
9. Notify student for pickup/delivery
10. Update request status
```

## 🚀 **Backend Features (Detailed)**

### **Core Features**

#### **1. Smart Username Generation**

```python
class UsernameGenerator:
    def generate_student_username(self, full_name, major, campus, year):
        # Vietnamese name parsing
        # Greenwich pattern implementation
        # Collision detection
        # Sequence management
        pass

    def generate_staff_username(self, full_name, role):
        # Role-based generation
        # Duplicate handling
        # Format standardization
        pass
```

#### **2. Academic Calendar Management**

```python
class AcademicCalendar:
    def create_semester(self, semester_data):
        # Semester creation
        # Holiday integration
        # Conflict detection
        pass

    def generate_schedule_conflicts(self, schedule_data):
        # Room booking conflicts
        # Instructor availability
        # Student schedule conflicts
        pass
```

#### **3. Intelligent GPA Calculator**

```python
class GPACalculator:
    def calculate_semester_gpa(self, student_id, semester_id):
        # Credit-weighted GPA calculation
        # Grade point conversion
        # Academic standing determination
        pass

    def calculate_cumulative_gpa(self, student_id):
        # Multi-semester aggregation
        # Transfer credit handling
        # Academic progression tracking
        pass
```

#### **4. Real-time Communication Engine**

```python
class CommunicationEngine:
    def setup_course_chat_room(self, section_id):
        # Auto-room creation
        # Participant management
        # Permission setup
        pass

    def ai_chat_handler(self, message, context):
        # OpenAI integration
        # Context-aware responses
        # Academic knowledge base
        pass
```

#### **5. Document Processing System**

```python
class DocumentProcessor:
    def generate_transcript(self, student_id, official=False):
        # Academic record compilation
        # GPA calculation
        # Digital signature
        # PDF generation
        pass

    def process_certificate_request(self, request_id):
        # Eligibility verification
        # Template processing
        # Security features
        # Delivery management
        pass
```

### **Advanced Features**

#### **6. Analytics and Reporting Engine**

```python
class AnalyticsEngine:
    def generate_enrollment_analytics(self, filters):
        # Trend analysis
        # Predictive modeling
        # Capacity planning
        pass

    def academic_performance_insights(self, scope):
        # Grade distribution
        # Success rate analysis
        # Early warning systems
        pass
```

#### **7. Notification System**

```python
class NotificationSystem:
    def send_grade_notification(self, student_id, grade_data):
        # Multi-channel delivery
        # Preference management
        # Delivery confirmation
        pass

    def academic_deadline_reminders(self):
        # Automated scheduling
        # Personalized reminders
        # Escalation rules
        pass
```

#### **8. File Management System**

```python
class FileManager:
    def upload_with_virus_scan(self, file_data):
        # Virus scanning
        # File type validation
        # Size limitations
        # Metadata extraction
        pass

    def generate_secure_download_link(self, file_id, user_id):
        # Permission verification
        # Temporary URL generation
        # Access logging
        pass
```

## 📁 **Detailed Folder Structure**

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI application entry point
│   ├── config.py                        # Configuration management
│   ├── database.py                      # Database connection and session management
│   │
│   ├── core/                           # Core application components
│   │   ├── __init__.py
│   │   ├── security.py                 # Security utilities and JWT handling
│   │   ├── dependencies.py             # FastAPI dependencies
│   │   ├── exceptions.py               # Custom exception classes
│   │   ├── middleware.py               # Custom middleware
│   │   └── settings.py                 # Application settings
│   │
│   ├── models/                         # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py                     # Base model class
│   │   ├── user.py                     # User-related models
│   │   ├── academic.py                 # Academic models (courses, enrollments, etc.)
│   │   ├── communication.py            # Chat and messaging models
│   │   ├── document.py                 # Document management models
│   │   ├── financial.py                # Financial and fee models
│   │   ├── analytics.py                # Analytics and reporting models
│   │   └── system.py                   # System and audit models
│   │
│   ├── schemas/                        # Pydantic models for API validation
│   │   ├── __init__.py
│   │   ├── base.py                     # Base schema classes
│   │   ├── user.py                     # User schemas (request/response)
│   │   ├── auth.py                     # Authentication schemas
│   │   ├── academic.py                 # Academic schemas
│   │   ├── communication.py            # Chat and messaging schemas
│   │   ├── document.py                 # Document schemas
│   │   ├── financial.py                # Financial schemas
│   │   └── analytics.py                # Analytics schemas
│   │
│   ├── api/                            # API route handlers
│   │   ├── __init__.py
│   │   ├── dependencies.py             # API-specific dependencies
│   │   └── v1/                         # API version 1
│   │       ├── __init__.py
│   │       ├── router.py               # Main API router
│   │       ├── auth.py                 # Authentication endpoints
│   │       ├── users.py                # User management endpoints
│   │       ├── academic.py             # Academic management endpoints
│   │       ├── communication.py        # Chat and messaging endpoints
│   │       ├── documents.py            # Document management endpoints
│   │       ├── financial.py            # Financial management endpoints
│   │       ├── analytics.py            # Analytics and reporting endpoints
│   │       └── admin.py                # Admin-specific endpoints
│   │
│   ├── services/                       # Business logic layer
│   │   ├── __init__.py
│   │   ├── base.py                     # Base service class
│   │   ├── auth_service.py             # Authentication business logic
│   │   ├── user_service.py             # User management logic
│   │   ├── username_generator.py       # Greenwich username generation
│   │   ├── academic_service.py         # Academic management logic
│   │   ├── enrollment_service.py       # Student enrollment logic
│   │   ├── grade_service.py            # Grading and GPA calculation
│   │   ├── schedule_service.py         # Schedule management logic
│   │   ├── communication_service.py    # Chat and messaging logic
│   │   ├── document_service.py         # Document processing logic
│   │   ├── financial_service.py        # Financial management logic
│   │   ├── notification_service.py     # Notification handling
│   │   ├── analytics_service.py        # Analytics and reporting logic
│   │   ├── firebase_service.py         # Firebase integration
│   │   └── ai_service.py               # AI chat integration
│   │
│   ├── utils/                          # Utility functions and helpers
│   │   ├── __init__.py
│   │   ├── auth.py                     # Authentication utilities
│   │   ├── permissions.py              # Permission checking utilities
│   │   ├── validators.py               # Custom validators
│   │   ├── formatters.py               # Data formatting utilities
│   │   ├── email.py                    # Email utilities
│   │   ├── file_utils.py               # File handling utilities
│   │   ├── date_utils.py               # Date and time utilities
│   │   ├── crypto.py                   # Cryptographic utilities
│   │   └── constants.py                # Application constants
│   │
│   ├── tasks/                          # Background tasks and jobs
│   │   ├── __init__.py
│   │   ├── celery_app.py               # Celery configuration
│   │   ├── email_tasks.py              # Email sending tasks
│   │   ├── notification_tasks.py       # Notification tasks
│   │   ├── analytics_tasks.py          # Analytics processing tasks
│   │   ├── backup_tasks.py             # Backup and maintenance tasks
│   │   └── cleanup_tasks.py            # Data cleanup tasks
│   │
│   ├── integrations/                   # External service integrations
│   │   ├── __init__.py
│   │   ├── firebase/                   # Firebase integration
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                 # Firebase authentication
│   │   │   ├── firestore.py            # Firestore operations
│   │   │   ├── storage.py              # Firebase storage
│   │   │   └── messaging.py            # Firebase cloud messaging
│   │   ├── openai/                     # OpenAI integration
│   │   │   ├── __init__.py
│   │   │   ├── chat.py                 # Chat completion
│   │   │   └── embeddings.py           # Text embeddings
│   │   ├── payment/                    # Payment gateways
│   │   │   ├── __init__.py
│   │   │   ├── vnpay.py                # VNPay integration
│   │   │   └── momo.py                 # MoMo integration
│   │   └── storage/                    # File storage providers
│   │       ├── __init__.py
│   │       ├── local.py                # Local file storage
│   │       └── cloud.py                # Cloud storage (AWS S3, etc.)
│   │
│   ├── tests/                          # Test suites
│   │   ├── __init__.py
│   │   ├── conftest.py                 # Test configuration
│   │   ├── test_auth.py                # Authentication tests
│   │   ├── test_users.py               # User management tests
│   │   ├── test_academic.py            # Academic functionality tests
│   │   ├── test_communication.py       # Communication tests
│   │   ├── test_documents.py           # Document management tests
│   │   ├── test_financial.py           # Financial tests
│   │   └── test_integrations.py        # Integration tests
│   │
│   └── migrations/                     # Database migrations
│       ├── __init__.py
│       ├── env.py                      # Alembic environment
│       ├── script.py.mako              # Migration template
│       └── versions/                   # Migration files
│           ├── 001_initial_schema.py
│           ├── 002_add_username_system.py
│           ├── 003_enhance_academic_records.py
│           └── ...
│
├── scripts/                            # Utility scripts
│   ├── init_db.py                      # Database initialization
│   ├── seed_data.py                    # Test data seeding
│   ├── migrate.py                      # Migration runner
│   ├── backup.py                       # Database backup
│   └── deploy.py                       # Deployment script
│
├── docs/                               # Documentation
│   ├── api/                            # API documentation
│   ├── database/                       # Database schema docs
│   ├── deployment/                     # Deployment guides
│   └── development/                    # Development setup
│
├── requirements/                       # Python dependencies
│   ├── base.txt                        # Base requirements
│   ├── development.txt                 # Development requirements
│   ├── production.txt                  # Production requirements
│   └── testing.txt                     # Testing requirements
│
├── docker/                             # Docker configuration
│   ├── Dockerfile                      # Main application Dockerfile
│   ├── Dockerfile.worker              # Background worker Dockerfile
│   ├── docker-compose.yml             # Local development setup
│   └── docker-compose.prod.yml        # Production setup
│
├── config/                             # Configuration files
│   ├── logging.conf                    # Logging configuration
│   ├── celery.conf                     # Celery configuration
│   └── nginx.conf                      # Nginx configuration
│
├── .env.example                        # Environment variables template
├── .env.development                    # Development environment
├── .env.production                     # Production environment
├── .gitignore                          # Git ignore rules
├── requirements.txt                    # Main requirements file
├── pyproject.toml                      # Python project configuration
├── README.md                           # Project documentation
├── Makefile                            # Development commands
└── alembic.ini                         # Database migration configuration
```

### **Key Architecture Decisions**

#### **Separation of Concerns**

- **Models**: Pure data representation with SQLAlchemy
- **Schemas**: API contract validation with Pydantic
- **Services**: Business logic implementation
- **API**: HTTP interface and routing
- **Utils**: Reusable utility functions

#### **Scalability Patterns**

- **Service Layer**: Encapsulates business logic for reusability
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: Loose coupling between components
- **Event-Driven**: Background task processing with Celery
- **Microservice Ready**: Modular design for future decomposition

#### **Security Implementation**

- **Authentication**: Multi-provider support (JWT + Firebase)
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive Pydantic schemas
- **SQL Injection**: SQLAlchemy ORM protection
- **Rate Limiting**: API abuse prevention

This comprehensive architecture provides a solid foundation for building the Greenwich University Academic Portal with proper Vietnamese academic patterns, scalable design, and production-ready features.
