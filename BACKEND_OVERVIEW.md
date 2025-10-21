# 🎓 Academic Portal Backend - Complete Overview

**Last Updated:** October 18, 2025  
**Status:** ✅ Production Deployed on Render  
**API Base URL:** https://academic-portal-api.onrender.com

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Database Schema (22 Tables)](#database-schema)
3. [API Endpoints (60+ Routes)](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Current Limitations](#current-limitations)
6. [Recommended Next Steps](#recommended-next-steps)

---

## 🛠️ Technology Stack

### Backend Framework

- **FastAPI** (Python 3.13) - Modern, fast web framework
- **SQLAlchemy 2.x** - ORM with async support
- **Alembic** - Database migration tool
- **PostgreSQL** - Production database on Render

### Authentication

- **Firebase Authentication** - For mobile app (students/teachers)
- **JWT Tokens** - For admin web login
- **Bcrypt** - Password hashing

### Cloud Services

- **Render** - API hosting with auto-deployment from GitHub
- **Cloudinary/GCS** (configured) - File storage for documents/images

### Development Tools

- **pytest** - Testing framework
- **python-dotenv** - Environment configuration
- **FastAPI docs** - Auto-generated API documentation at `/docs`

---

## 🗄️ Database Schema (22 Tables)

### 👥 User Management (6 tables)

| Table                  | Description                  | Key Fields                                               |
| ---------------------- | ---------------------------- | -------------------------------------------------------- |
| **users**              | Main user table              | firebase_uid, username, email, role, campus_id, major_id |
| **campuses**           | University campuses          | code (H/D/C/S), name, city                               |
| **majors**             | Academic programs            | code (C/B/D), name                                       |
| **username_sequences** | Username collision tracking  | base_username, count                                     |
| **student_sequences**  | Student ID generation        | major_code, campus_code, year_entered                    |
| **device_tokens**      | FCM push notification tokens | user_id, token, platform                                 |

**User Roles:** `student`, `teacher`, `admin`  
**Campus Codes:** H=Hanoi, D=Da Nang, C=Can Tho, S=Saigon  
**Major Codes:** C=Computing, B=Business, D=Design

---

### 📚 Academic Management (8 tables)

| Table               | Description                    | Key Fields                                                 |
| ------------------- | ------------------------------ | ---------------------------------------------------------- |
| **semesters**       | Academic terms                 | code, name, start_date, end_date, is_current               |
| **courses**         | Course catalog                 | code, name, credits, level, major_id                       |
| **course_sections** | Specific course offerings      | course_id, semester_id, instructor_id, campus_id, schedule |
| **schedules**       | Class meeting times            | section_id, day_of_week, start_time, end_time, room        |
| **enrollments**     | Student course registrations   | student_id, section_id, status, enrolled_at                |
| **assignments**     | Course assignments             | section_id, title, type, due_date, max_score               |
| **grades**          | Student assignment/exam scores | assignment_id, student_id, score, status                   |
| **attendance**      | Class attendance records       | section_id, student_id, attendance_date, status            |

**Features:**

- ✅ Automatic enrollment with conflict detection
- ✅ GPA calculation (semester and cumulative)
- ✅ Academic standing tracking (Good/Probation/Suspension)
- ✅ Bulk attendance marking
- ✅ Grade submission with validation

---

### 💰 Finance Management (4 tables)

| Table              | Description           | Key Fields                                               |
| ------------------ | --------------------- | -------------------------------------------------------- |
| **fee_structures** | Tuition fee templates | semester_id, major_id, campus_id, amount, description    |
| **invoices**       | Student bills         | student_id, semester_id, total_amount, status, due_date  |
| **invoice_lines**  | Invoice line items    | invoice_id, description, quantity, unit_price, amount    |
| **payments**       | Payment records       | invoice_id, student_id, amount, method, reference_number |

**Features:**

- ✅ Automated invoice generation from fee structures
- ✅ Multiple payment methods (cash, transfer, card, online)
- ✅ Payment tracking with reference numbers
- ✅ Student financial summary reports
- ✅ Semester financial analytics

---

### 📄 Document Management (3 tables)

| Table                 | Description               | Key Fields                                               |
| --------------------- | ------------------------- | -------------------------------------------------------- |
| **documents**         | Uploaded files            | uploader_id, category, file_url, visibility, campus_id   |
| **document_requests** | Student document requests | student_id, type, status, delivery_method, notes         |
| **announcements**     | System announcements      | author_id, title, content, category, priority, campus_id |

**Features:**

- ✅ Cloudinary/GCS integration for file storage
- ✅ Pre-signed URLs for secure uploads/downloads
- ✅ Document request workflow (pending → approved/rejected → delivered)
- ✅ Targeted announcements (campus/major specific)

---

### 💬 Communication (4 tables)

| Table                 | Description         | Key Fields                                                 |
| --------------------- | ------------------- | ---------------------------------------------------------- |
| **chat_rooms**        | Chat groups         | type (direct/group/course), name, description              |
| **chat_participants** | Room members        | room_id, user_id, role, joined_at                          |
| **support_tickets**   | Help desk tickets   | requester_id, assigned_to_id, category, priority, status   |
| **ticket_events**     | Ticket activity log | ticket_id, actor_id, type, comment, old_status, new_status |

**Features:**

- ✅ Direct messaging and group chats
- ✅ Course-based chat rooms
- ✅ Support ticket system with assignment
- ✅ Ticket event tracking (comments, status changes, assignments)

---

## 🔌 API Endpoints (60+ Routes)

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint            | Description                        | Auth     |
| ------ | ------------------- | ---------------------------------- | -------- |
| POST   | `/admin-login`      | Admin login with username/password | None     |
| POST   | `/student-register` | Student self-registration          | None     |
| POST   | `/verify-token`     | Validate Firebase/JWT token        | None     |
| GET    | `/me`               | Get current user profile           | Required |
| POST   | `/logout`           | User logout                        | Required |
| PUT    | `/update-profile`   | Update user profile                | Required |

---

### 👥 User Management (`/api/v1/users`)

| Method | Endpoint     | Description                  | Auth          |
| ------ | ------------ | ---------------------------- | ------------- |
| POST   | `/`          | Create new user (admin only) | Admin         |
| GET    | `/`          | List users with filters      | Admin/Teacher |
| GET    | `/{user_id}` | Get user by ID               | Admin/Teacher |
| PUT    | `/{user_id}` | Update user                  | Admin         |
| DELETE | `/{user_id}` | Delete user                  | Admin         |
| GET    | `/campuses`  | List all campuses            | Admin/Teacher |
| GET    | `/majors`    | List all majors              | Admin/Teacher |

**Features:**

- ✅ Auto-generated usernames (e.g., `GCD210101` for students)
- ✅ Auto-generated emails (e.g., `gcd210101@greenwich.edu.vn`)
- ✅ Firebase user creation integrated
- ✅ Pagination, search, filtering by role/campus/major/status

---

### 📚 Academic (`/api/v1/academic`)

| Method | Endpoint                                 | Description           | Auth            |
| ------ | ---------------------------------------- | --------------------- | --------------- |
| POST   | `/courses`                               | Create course         | Admin           |
| GET    | `/courses`                               | List courses          | All             |
| POST   | `/sections`                              | Create course section | Admin/Teacher   |
| GET    | `/sections`                              | List course sections  | All             |
| POST   | `/enrollments`                           | Enroll student        | Admin/Teacher   |
| GET    | `/enrollments/my`                        | My enrollments        | Student         |
| DELETE | `/enrollments/{id}`                      | Drop course           | Admin           |
| POST   | `/assignments/{id}/grades`               | Submit grade          | Teacher         |
| GET    | `/students/my/gpa`                       | Get my GPA            | Student         |
| GET    | `/students/my/academic-standing`         | Get academic status   | Student         |
| POST   | `/attendance/bulk`                       | Bulk mark attendance  | Teacher         |
| GET    | `/sections/{id}/attendance/{student_id}` | Attendance summary    | Teacher/Student |

**Business Logic:**

- ✅ Enrollment conflict detection (time/duplicate)
- ✅ GPA calculation (4.0 scale with credit weighting)
- ✅ Academic standing: Good (GPA ≥ 2.0), Probation (1.5-2.0), Suspension (< 1.5)
- ✅ Attendance rate calculation

---

### 💰 Finance (`/api/v1/finance`)

| Method | Endpoint                  | Description               | Auth          |
| ------ | ------------------------- | ------------------------- | ------------- |
| POST   | `/invoices`               | Create invoice            | Admin         |
| GET    | `/invoices`               | List invoices             | Admin/Student |
| GET    | `/invoices/{id}`          | Invoice details           | Admin/Student |
| POST   | `/payments`               | Record payment            | Admin/Finance |
| GET    | `/payments`               | List payments             | Admin/Finance |
| GET    | `/students/{id}/summary`  | Student financial summary | Admin/Student |
| GET    | `/students/my/summary`    | My financial summary      | Student       |
| GET    | `/semesters/{id}/summary` | Semester financial report | Admin         |

**Features:**

- ✅ Multi-currency support (VND, USD, etc.)
- ✅ Invoice line items with quantity/unit price
- ✅ Payment methods: cash, bank_transfer, credit_card, e_wallet
- ✅ Outstanding balance calculation
- ✅ Payment deadline tracking

---

### 📄 Documents (`/api/v1/documents`)

| Method | Endpoint             | Description               | Auth        |
| ------ | -------------------- | ------------------------- | ----------- |
| POST   | `/upload-url`        | Get pre-signed upload URL | All         |
| POST   | `/`                  | Create document record    | All         |
| GET    | `/`                  | List documents            | All         |
| GET    | `/{id}/download-url` | Get download URL          | All         |
| DELETE | `/{id}`              | Delete document           | Admin/Owner |
| POST   | `/requests`          | Request document          | Student     |
| GET    | `/requests`          | List document requests    | All         |
| PUT    | `/requests/{id}`     | Update request status     | Admin       |
| POST   | `/announcements`     | Create announcement       | Admin       |
| GET    | `/announcements`     | List announcements        | All         |

**Document Types:**

- Transcript, Certificate, ID Card, Recommendation Letter, Enrollment Letter, Other

**Announcement Categories:**

- Academic, Administrative, Event, Maintenance, Emergency, Other

---

### 🎫 Support (`/api/v1/support`)

| Method | Endpoint               | Description                            | Auth          |
| ------ | ---------------------- | -------------------------------------- | ------------- |
| POST   | `/tickets`             | Create support ticket                  | All           |
| GET    | `/tickets`             | List tickets                           | All           |
| GET    | `/tickets/{id}`        | Ticket details with events             | All           |
| PUT    | `/tickets/{id}`        | Update ticket (status/priority/assign) | Admin/Support |
| POST   | `/tickets/{id}/events` | Add comment/event                      | All           |
| GET    | `/tickets/{id}/events` | List ticket events                     | All           |
| GET    | `/stats/summary`       | Ticket statistics                      | Admin         |

**Ticket Categories:**

- Technical, Academic, Finance, Administrative, Other

**Ticket Priorities:**

- Low, Medium, High, Urgent

**Ticket Statuses:**

- Open, In Progress, Waiting for Student, Resolved, Closed

---

### 📊 Dashboard (`/api/v1/dashboard`)

| Method | Endpoint           | Description            | Auth  |
| ------ | ------------------ | ---------------------- | ----- |
| GET    | `/stats`           | Dashboard statistics   | Admin |
| GET    | `/recent-activity` | Recent system activity | Admin |

**Dashboard Metrics:**

- User counts (students, teachers, staff)
- Academic metrics (courses, enrollments, attendance rate)
- Financial metrics (total revenue, pending invoices)
- Pending items (documents, tickets)

---

### 🛠️ Admin DB (`/api/v1/admin/db`)

| Method | Endpoint                | Description              | Auth  |
| ------ | ----------------------- | ------------------------ | ----- |
| GET    | `/tables`               | List all database tables | Admin |
| GET    | `/tables/{name}/count`  | Row count for table      | Admin |
| GET    | `/stats`                | Database statistics      | Admin |
| GET    | `/tables/{name}/sample` | Sample data from table   | Admin |

**Utility endpoints for database inspection**

---

## 🔐 Authentication & Authorization

### Current Implementation

#### 1. **Authentication Methods**

```python
# Firebase Authentication (for mobile app)
- Used by students and teachers via mobile app
- Firebase ID tokens validated via Firebase Admin SDK
- Tokens contain: uid, email, role

# JWT Authentication (for admin web)
- Used by admin users via admin web portal
- JWT tokens signed with SECRET_KEY
- Tokens contain: uid, email, role, admin_type (future)
```

#### 2. **Authorization (Role-Based)**

```python
# Three main roles currently:
UserRole.STUDENT = "student"
UserRole.TEACHER = "teacher"
UserRole.ADMIN = "admin"

# Protection examples:
@router.post("/users")
async def create_user(
    current_user: Dict = Depends(require_roles(["admin"]))
)

@router.get("/users")
async def list_users(
    current_user: Dict = Depends(require_roles(["admin", "teacher"]))
)
```

#### 3. **Security Utilities**

- `verify_firebase_token()` - Main auth dependency (supports both Firebase & JWT)
- `require_roles([roles])` - Role-based access control
- `require_permissions([perms])` - Permission-based access (implemented but not used yet)
- `require_same_user_or_admin()` - Self-data or admin access
- Password hashing with bcrypt
- JWT token creation/decoding

#### 4. **Current State**

```
✅ Firebase authentication working
✅ Admin login with JWT working
✅ Role-based protection implemented
✅ Token validation working
⚠️  Auth temporarily disabled on:
    - /api/v1/dashboard/* (for testing)
    - /api/v1/users (list endpoint, for testing)
❌ No fine-grained permissions system yet
❌ No campus-scoped access control
❌ No admin role differentiation (all admins have same permissions)
```

---

## ⚠️ Current Limitations

### 1. **Authentication & Authorization**

❌ **All admins have same permissions** - No differentiation between super_admin, academic_admin, finance_admin, etc.  
❌ **No campus-based access control** - Admins can edit data from any campus  
❌ **No permission system** - Only role-based, not fine-grained (e.g., `users.create`, `invoices.approve`)  
❌ **Auth disabled on some endpoints** - For development testing (dashboard, users list)

### 2. **Data Validation**

⚠️ **Limited business rule validation** - Some edge cases not handled  
⚠️ **No data integrity checks** - Can create orphaned records in some cases  
⚠️ **No audit logging** - No tracking of who changed what and when

### 3. **API Features**

❌ **No bulk operations** - Can't bulk delete/update users, enrollments, etc.  
❌ **No data export** - No CSV/Excel export for reports  
❌ **No file validation** - Document uploads don't validate file types/sizes thoroughly  
❌ **No rate limiting** - API can be abused with too many requests

### 4. **Performance**

⚠️ **No caching** - All queries hit database every time  
⚠️ **No query optimization** - Some endpoints do N+1 queries  
⚠️ **No pagination limits** - Can request millions of records (will timeout)

### 5. **Testing**

⚠️ **Limited test coverage** - Not all endpoints have unit tests  
⚠️ **No integration tests** - Full workflow testing missing  
⚠️ **No load testing** - Unknown performance under high load

### 6. **Documentation**

✅ Auto-generated API docs available at `/docs`  
⚠️ **No API versioning** - All endpoints at `/api/v1/*` but no migration plan  
⚠️ **Limited error documentation** - Error responses not well documented

---

## 🚀 Recommended Next Steps

### Priority 1: RBAC System (Most Important)

**Problem:** All admins have same permissions, no campus scoping  
**Solution:** Implement full RBAC with 4 new tables

```sql
-- Add these 4 tables:
roles (id, name, description, is_system_role)
permissions (id, resource, action, name, description)
role_permissions (role_id, permission_id)
user_roles (user_id, role_id, campus_id)

-- Roles to create:
- super_admin (full access)
- academic_admin (courses, schedules, enrollments, grades)
- finance_admin (invoices, payments, fees)
- support_admin (tickets, document requests)
- content_admin (announcements, documents)
- teacher (existing)
- student (existing)

-- Permissions format: "resource.action"
users.create, users.read, users.update, users.delete
courses.create, courses.read, courses.update, courses.delete
invoices.create, invoices.read, invoices.approve, invoices.cancel
... etc
```

**Benefits:**
✅ Admins can have multiple roles  
✅ Campus-scoped permissions (e.g., finance_admin for Hanoi only)  
✅ Fine-grained control (read vs edit)  
✅ Easy to add new roles/permissions  
✅ No code changes needed to adjust permissions

**Implementation Steps:**

1. Create 4 new database tables via Alembic migration
2. Seed default roles and permissions
3. Update security.py to check permissions instead of just roles
4. Update all endpoints to use permission checks
5. Add middleware to inject user permissions into request
6. Update frontend to show/hide UI elements based on permissions
7. Re-enable auth on temporarily disabled endpoints

**Estimated Time:** 3-4 hours

---

### Priority 2: Complete Users Management (Current Feature)

**Goal:** Finish the admin web users page you're working on

**Tasks:**

- [x] Backend API ready (already done)
- [ ] Fix CORS for users endpoint
- [ ] Frontend data table with real data
- [ ] Search and filter UI
- [ ] Create user modal
- [ ] Edit user modal
- [ ] Delete confirmation
- [ ] Role assignment UI (will be replaced with RBAC later)
- [ ] Bulk actions (delete, export)
- [ ] Pagination

**Estimated Time:** 2-3 hours

---

### Priority 3: Re-enable Authentication

**Problem:** Auth is disabled on dashboard and users endpoints for testing  
**Solution:** Complete admin login flow in frontend

**Tasks:**

- [ ] Create login page UI (already exists but not connected)
- [ ] Store JWT token in localStorage/cookies
- [ ] Add Authorization header to all API requests
- [ ] Implement token refresh mechanism
- [ ] Handle 401 errors (redirect to login)
- [ ] Re-enable auth on backend endpoints
- [ ] Test full authentication flow

**Estimated Time:** 1-2 hours

---

### Priority 4: Admin Web Features (Remaining 8 Features)

Continue building the admin web according to your todo list:

1. **Academic Management** - Courses, semesters, schedules, enrollments
2. **Announcements System** - CRUD with rich text editor
3. **Documents Management** - Upload handling, requests workflow
4. **Fee & Finance** - Invoice generation, payment tracking
5. **Support Tickets** - Ticket management, assignment, comments
6. **Analytics Dashboard** - Charts and trends
7. **Settings** - Campus/major config, system settings
8. **Profile** - Admin profile management

**Each feature estimated:** 3-5 hours

---

### Priority 5: Quality & Performance Improvements

**After core features are complete:**

- [ ] Add comprehensive unit tests (pytest)
- [ ] Add integration tests
- [ ] Implement Redis caching for frequent queries
- [ ] Add rate limiting (slow down brute force attacks)
- [ ] Query optimization (eliminate N+1 queries)
- [ ] Add audit logging (track all admin actions)
- [ ] Data validation improvements
- [ ] Bulk operation endpoints
- [ ] CSV/Excel export functionality
- [ ] API documentation improvements

---

## 📝 Summary

### What You Have ✅

- ✅ **Solid foundation:** 22 database tables, 60+ API endpoints
- ✅ **Full CRUD** on users, courses, enrollments, invoices, tickets, documents
- ✅ **Complex business logic:** GPA calculation, enrollment conflicts, attendance tracking
- ✅ **Production deployed** on Render with PostgreSQL
- ✅ **Authentication working** (Firebase + JWT)
- ✅ **Auto-generated API docs** at `/docs`

### What You Need 🔨

- 🔨 **RBAC system** (most critical) - Different admin types with scoped permissions
- 🔨 **Admin web frontend** - Complete all 10 features in your todo list
- 🔨 **Re-enable authentication** - Currently disabled for testing
- 🔨 **Testing & validation** - More robust error handling
- 🔨 **Performance optimization** - Caching, query optimization

### Architecture Quality: 8/10 ⭐

**Strengths:** Clean code structure, good separation of concerns, comprehensive features  
**Weaknesses:** Missing RBAC, no caching, limited testing

---

## 🎯 Immediate Action Items

**To continue building the admin web:**

1. **Fix CORS issue** on `/api/v1/users` endpoint (same as dashboard)
2. **Decide on RBAC implementation** - Full tables approach (recommended) vs simple admin_type field
3. **Complete users management page** - Frontend data table, modals, actions
4. **Move to next feature** - Continue through your 10-item todo list

**Which one do you want to tackle first?** 🚀
