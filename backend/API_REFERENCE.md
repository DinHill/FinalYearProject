# 📖 Complete API Reference

## Quick Navigation

- [Authentication](#authentication-5-endpoints)
- [Users](#users-7-endpoints)
- [Academic](#academic-15-endpoints)
- [Finance](#finance-10-endpoints)
- [Documents](#documents-12-endpoints)
- [Support](#support-10-endpoints)

---

## Authentication (5 endpoints)

### POST `/api/v1/auth/student-login`

Student mobile login - returns custom Firebase token

**Request:**

```json
{
  "student_id": "HIEUNDGCD220033",
  "password": "password123"
}
```

**Response:**

```json
{
  "custom_token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "username": "HieuNDGCD220033",
    "role": "student",
    "campus": "Da Nang",
    "major": "Computing"
  }
}
```

### POST `/api/v1/auth/session`

Admin web session creation

**Request:**

```json
{
  "id_token": "firebase_id_token"
}
```

### GET `/api/v1/auth/me`

Get current user profile with permissions

**Headers:** `Authorization: Bearer {id_token}`

### POST `/api/v1/auth/logout`

Revoke refresh tokens

### PUT `/api/v1/auth/change-password`

Change user password

---

## Users (7 endpoints)

### POST `/api/v1/users`

Create user with auto-generated Greenwich username

**Request:**

```json
{
  "email": "hieu@greenwich.edu.vn",
  "password": "SecurePass123",
  "full_name": "Nguyen Dinh Hieu",
  "role": "student",
  "campus_id": 1,
  "major_id": 1,
  "year": 2022
}
```

**Response:**

```json
{
  "id": "uuid",
  "username": "HieuNDGCD220033",
  "email": "hieu@student.greenwich.edu.vn",
  "full_name": "Nguyen Dinh Hieu",
  "role": "student",
  "is_active": true
}
```

### GET `/api/v1/users`

List users with filters

**Query Params:**

- `role`: student, teacher, admin
- `campus_id`: Filter by campus
- `major_id`: Filter by major
- `status`: active, inactive
- `search`: Search in name/username
- `page`: Page number
- `page_size`: Items per page

### GET `/api/v1/users/{id}`

Get user details

### PUT `/api/v1/users/{id}`

Update user

### DELETE `/api/v1/users/{id}`

Soft delete (deactivate)

### GET `/api/v1/users/campuses`

List all campuses

### GET `/api/v1/users/majors`

List all majors

---

## Academic (15+ endpoints)

### Courses

#### POST `/api/v1/academic/courses`

Create course

**Request:**

```json
{
  "code": "CS101",
  "name": "Introduction to Programming",
  "credits": 3,
  "description": "Basic programming concepts"
}
```

#### GET `/api/v1/academic/courses`

List courses (with filters)

### Sections

#### POST `/api/v1/academic/sections`

Create course section

**Request:**

```json
{
  "course_id": 1,
  "semester_id": 1,
  "teacher_id": "uuid",
  "campus_id": 1,
  "section_number": "A1",
  "max_capacity": 30,
  "schedules": [
    {
      "day_of_week": "monday",
      "start_time": "08:00",
      "end_time": "10:00",
      "room": "A101"
    }
  ]
}
```

#### GET `/api/v1/academic/sections`

List sections (with enrollment counts)

### Enrollments

#### POST `/api/v1/academic/enrollments`

Enroll in course (validates capacity, conflicts, prerequisites)

**Request:**

```json
{
  "section_id": 42
}
```

**Response:**

```json
{
  "id": 1,
  "section_id": 42,
  "student_id": "uuid",
  "status": "enrolled",
  "enrolled_at": "2024-01-15T10:30:00Z"
}
```

#### GET `/api/v1/academic/enrollments/my`

Get my enrollments

**Query Params:**

- `semester_id`: Filter by semester
- `status`: enrolled, dropped, completed

#### DELETE `/api/v1/academic/enrollments/{id}`

Drop enrollment

### Grades

#### POST `/api/v1/academic/assignments/{id}/grades`

Submit grade for assignment

**Request:**

```json
{
  "student_id": "uuid",
  "score": 85.5,
  "feedback": "Excellent work!"
}
```

#### GET `/api/v1/academic/students/my/gpa`

Get GPA (semester or cumulative)

**Query Params:**

- `semester_id`: Optional, for semester GPA

**Response:**

```json
{
  "gpa": 3.75,
  "credits_attempted": 15,
  "credits_earned": 15,
  "course_grades": [
    {
      "course_code": "CS101",
      "course_name": "Intro to Programming",
      "credits": 3,
      "grade": "A",
      "grade_points": 4.0
    }
  ]
}
```

#### GET `/api/v1/academic/students/my/academic-standing`

Get academic standing and degree progress

**Response:**

```json
{
  "cumulative_gpa": 3.75,
  "academic_standing": "Dean's List",
  "degree_progress": 62.5,
  "credits_earned": 75,
  "credits_required": 120
}
```

### Attendance

#### POST `/api/v1/academic/attendance/bulk`

Record attendance for multiple students

**Request:**

```json
{
  "section_id": 42,
  "date": "2024-01-15",
  "attendance": [
    {
      "student_id": "uuid",
      "status": "present"
    },
    {
      "student_id": "uuid2",
      "status": "absent"
    }
  ]
}
```

#### GET `/api/v1/academic/sections/{id}/attendance/{student_id}`

Get attendance summary for student in section

---

## Finance (10+ endpoints)

### Invoices

#### POST `/api/v1/finance/invoices`

Create invoice with line items

**Request:**

```json
{
  "student_id": "uuid",
  "semester_id": 1,
  "invoice_number": "INV202401001",
  "issue_date": "2024-01-01",
  "due_date": "2024-01-31",
  "lines": [
    {
      "description": "Tuition Fee - Computing",
      "quantity": 1,
      "unit_price": 5000.0,
      "amount": 5000.0
    },
    {
      "description": "Lab Fee",
      "quantity": 1,
      "unit_price": 500.0,
      "amount": 500.0
    }
  ]
}
```

#### GET `/api/v1/finance/invoices`

List invoices

**Query Params:**

- `student_id`: Filter by student
- `semester_id`: Filter by semester
- `status`: pending, partial, paid, overdue, cancelled
- `page`, `page_size`

#### GET `/api/v1/finance/invoices/{id}`

Get invoice details (with lines and payments)

### Payments

#### POST `/api/v1/finance/payments`

Record payment (with idempotency)

**Headers:** `X-Idempotency-Key: unique_key`

**Request:**

```json
{
  "invoice_id": 1,
  "amount": 2000.0,
  "payment_method": "bank_transfer",
  "transaction_reference": "TXN123456",
  "notes": "Partial payment"
}
```

**Response:**

```json
{
  "id": 1,
  "invoice_id": 1,
  "amount": 2000.0,
  "payment_date": "2024-01-15",
  "payment_method": "bank_transfer",
  "transaction_reference": "TXN123456"
}
```

#### GET `/api/v1/finance/payments`

List payments

### Financial Summaries

#### GET `/api/v1/finance/students/{id}/summary`

Get student financial summary

**Response:**

```json
{
  "student_id": "uuid",
  "student_name": "Nguyen Dinh Hieu",
  "total_invoiced": 10000.0,
  "total_paid": 6000.0,
  "outstanding_balance": 4000.0,
  "invoice_count": 2,
  "status_breakdown": {
    "paid": 1,
    "partial": 1
  }
}
```

#### GET `/api/v1/finance/students/my/summary`

Get my financial summary (student access)

#### GET `/api/v1/finance/semesters/{id}/summary`

Get semester financial summary (admin access)

**Response:**

```json
{
  "semester_id": 1,
  "semester_name": "Spring 2024",
  "total_invoiced": 500000.0,
  "total_collected": 450000.0,
  "outstanding_balance": 50000.0,
  "collection_rate": 90.0,
  "student_count": 100,
  "invoice_count": 100
}
```

---

## Documents (12+ endpoints)

### File Upload/Download

#### POST `/api/v1/documents/upload-url`

Generate presigned upload URL

**Request:**

```json
{
  "filename": "assignment.pdf",
  "content_type": "application/pdf",
  "category": "assignment"
}
```

**Response:**

```json
{
  "upload_url": "https://storage.googleapis.com/...",
  "file_path": "assignments/2024/10/uuid/timestamp_assignment.pdf",
  "expires_at": "2024-10-08T11:00:00Z",
  "method": "PUT",
  "headers": {
    "Content-Type": "application/pdf"
  },
  "max_file_size": 104857600,
  "instructions": [
    "1. Upload file using PUT request to the upload_url",
    "2. Set Content-Type header to: application/pdf",
    "3. File size must not exceed 100MB",
    "4. After successful upload, call POST /documents with file_path"
  ]
}
```

#### POST `/api/v1/documents`

Create document metadata after upload

**Request:**

```json
{
  "file_path": "assignments/2024/10/uuid/timestamp_assignment.pdf",
  "filename": "assignment.pdf",
  "file_type": "pdf",
  "category": "assignment",
  "title": "Programming Assignment 1",
  "description": "First assignment submission",
  "is_public": false
}
```

#### GET `/api/v1/documents`

List documents

**Query Params:**

- `category`: document, transcript, certificate, assignment, avatar
- `uploader_id`: Filter by uploader
- `is_public`: Filter by visibility
- `search`: Search in title/description
- `page`, `page_size`

#### GET `/api/v1/documents/{id}/download-url`

Generate presigned download URL

**Query Params:**

- `disposition`: inline (view) or attachment (download)

**Response:**

```json
{
  "download_url": "https://storage.googleapis.com/...",
  "expires_at": "2024-10-08T11:00:00Z",
  "filename": "assignment.pdf",
  "file_size": 1024000,
  "content_type": "application/pdf"
}
```

#### DELETE `/api/v1/documents/{id}`

Delete document (metadata and file)

### Document Requests

#### POST `/api/v1/documents/requests`

Request official document

**Request:**

```json
{
  "document_type": "transcript",
  "purpose": "Job application",
  "notes": "Please expedite"
}
```

#### GET `/api/v1/documents/requests`

List document requests

**Query Params:**

- `student_id`: Filter by student
- `document_type`: transcript, certificate, etc.
- `status`: pending, processing, ready, delivered

#### PUT `/api/v1/documents/requests/{id}`

Update request status (admin only)

**Request:**

```json
{
  "status": "ready",
  "document_id": 42,
  "admin_notes": "Transcript generated"
}
```

### Announcements

#### POST `/api/v1/documents/announcements`

Create announcement (admin only)

**Request:**

```json
{
  "title": "Registration Opens",
  "content": "Spring 2024 registration opens on Jan 1",
  "category": "academic",
  "target_audience": "student",
  "priority": "high",
  "is_published": true,
  "expires_at": "2024-01-31T23:59:59Z"
}
```

#### GET `/api/v1/documents/announcements`

List announcements

**Query Params:**

- `category`: academic, administrative, event, maintenance
- `priority`: low, normal, high, urgent
- `is_published`: Filter by published status

---

## Support (10+ endpoints)

### Support Tickets

#### POST `/api/v1/support/tickets`

Create support ticket

**Request:**

```json
{
  "subject": "Cannot access course materials",
  "description": "I'm unable to download lecture slides for CS101",
  "category": "technical",
  "priority": "normal"
}
```

**Response:**

```json
{
  "id": 1,
  "ticket_number": "TICKET-20241008-0001",
  "requester_id": "uuid",
  "subject": "Cannot access course materials",
  "category": "technical",
  "priority": "normal",
  "status": "open",
  "sla_deadline": "2024-10-11T10:00:00Z",
  "created_at": "2024-10-08T10:00:00Z"
}
```

#### GET `/api/v1/support/tickets`

List support tickets

**Query Params:**

- `status`: open, in_progress, waiting, resolved, closed
- `priority`: low, normal, high, urgent
- `category`: technical, academic, financial, account, other
- `requester_id`: Filter by requester
- `assigned_to_id`: Filter by assignee
- `sla_breached`: true/false
- `search`: Search in subject/description
- `page`, `page_size`

#### GET `/api/v1/support/tickets/{id}`

Get ticket details (with all events)

**Response:**

```json
{
  "id": 1,
  "ticket_number": "TICKET-20241008-0001",
  "status": "in_progress",
  "sla_breached": false,
  "events": [
    {
      "id": 1,
      "event_type": "created",
      "description": "Ticket created",
      "created_at": "2024-10-08T10:00:00Z"
    },
    {
      "id": 2,
      "event_type": "assigned",
      "description": "Ticket assigned to John Doe",
      "created_at": "2024-10-08T10:30:00Z"
    }
  ]
}
```

#### PUT `/api/v1/support/tickets/{id}`

Update ticket (admin only)

**Request:**

```json
{
  "status": "resolved",
  "priority": "high",
  "assigned_to_id": "uuid",
  "category": "technical"
}
```

#### POST `/api/v1/support/tickets/{id}/events`

Add event/comment to ticket

**Request:**

```json
{
  "event_type": "comment",
  "description": "I've checked the issue and it's resolved now"
}
```

#### GET `/api/v1/support/tickets/{id}/events`

List all events for a ticket

#### GET `/api/v1/support/stats/summary`

Get support statistics (admin only)

**Response:**

```json
{
  "total_tickets": 150,
  "by_status": {
    "open": 20,
    "in_progress": 15,
    "resolved": 100,
    "closed": 15
  },
  "by_priority": {
    "urgent": 5,
    "high": 25,
    "normal": 100,
    "low": 20
  },
  "sla_breaches": 3,
  "average_resolution_hours": 18.5
}
```

---

## Common Response Formats

### Success Response

```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Error Response

```json
{
  "code": "VALIDATION_ERROR",
  "detail": "Request validation failed",
  "fields": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Paginated Response

```json
{
  "items": [],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5
}
```

---

## Authentication

All endpoints (except login) require authentication:

**Header:** `Authorization: Bearer {firebase_id_token}`

Get ID token from Firebase after login:

```javascript
const idToken = await user.getIdToken();
```

---

## SLA Configuration

Support ticket SLA deadlines by priority:

- **Urgent**: 4 hours
- **High**: 24 hours
- **Normal**: 72 hours (3 days)
- **Low**: 168 hours (7 days)

---

## File Categories

Document categories with size limits:

- **avatar**: 5MB
- **assignment**: 100MB
- **document**: 50MB
- **transcript**: 50MB
- **certificate**: 50MB
- **other**: 50MB

---

**Total Endpoints: 60+**
**API Version: v1**
**Last Updated: October 8, 2025**
