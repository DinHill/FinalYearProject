# 📚 Academic Portal API Endpoints

**Base URL:** `http://localhost:8000`  
**API Version:** `v1`  
**Prefix:** `/api/v1`

---

## 🔐 **Authentication** (`/api/v1/auth`)

| Method | Endpoint                | Description                  | Auth Required |
| ------ | ----------------------- | ---------------------------- | ------------- |
| POST   | `/auth/register`        | Register new user            | No            |
| POST   | `/auth/login`           | Login (Firebase or password) | No            |
| POST   | `/auth/admin-login`     | Admin password login         | No            |
| GET    | `/auth/verify`          | Verify JWT token             | Yes           |
| POST   | `/auth/reset-password`  | Request password reset       | No            |
| PUT    | `/auth/update-password` | Update password              | Yes           |

---

## 👤 **Users Management** (`/api/v1/users`)

| Method | Endpoint               | Description               | Auth Required |
| ------ | ---------------------- | ------------------------- | ------------- |
| POST   | `/users`               | Create new user           | Admin         |
| POST   | `/users/create-user`   | Create user (alternate)   | Admin         |
| GET    | `/users`               | Get all users (paginated) | Admin         |
| GET    | `/users/{user_id}`     | Get user by ID            | Admin         |
| PUT    | `/users/{user_id}`     | Update user               | Admin         |
| DELETE | `/users/{user_id}`     | Delete user               | Admin         |
| GET    | `/users/status-counts` | Get user counts by status | Admin         |
| GET    | `/users/count-by-role` | Get user counts by role   | Admin         |

---

## 👨‍🎓 **Current User (Me)** (`/api/v1/me`)

| Method | Endpoint          | Description        | Auth Required |
| ------ | ----------------- | ------------------ | ------------- |
| GET    | `/me/profile`     | Get my profile     | Yes           |
| PATCH  | `/me/profile`     | Update my profile  | Yes           |
| GET    | `/me/schedule`    | Get my schedule    | Yes           |
| GET    | `/me/enrollments` | Get my enrollments | Yes           |
| GET    | `/me/grades`      | Get my grades      | Yes           |
| GET    | `/me/attendance`  | Get my attendance  | Yes           |
| GET    | `/me/invoices`    | Get my invoices    | Yes           |
| GET    | `/me/documents`   | Get my documents   | Yes           |
| GET    | `/me/gpa`         | Get my GPA         | Yes           |

---

## 🎓 **Academic Management** (`/api/v1/academic`)

### **Programs (Majors)**

| Method | Endpoint                                      | Description        | Auth Required |
| ------ | --------------------------------------------- | ------------------ | ------------- |
| POST   | `/academic/programs`                          | Create program     | Admin         |
| GET    | `/academic/programs`                          | Get all programs   | All           |
| GET    | `/academic/programs/{program_id}`             | Get program by ID  | All           |
| PUT    | `/academic/programs/{program_id}`             | Update program     | Admin         |
| DELETE | `/academic/programs/{program_id}`             | Delete program     | Admin         |
| PUT    | `/academic/programs/{program_id}/coordinator` | Assign coordinator | Admin         |

### **Courses**

| Method | Endpoint            | Description     | Auth Required |
| ------ | ------------------- | --------------- | ------------- |
| POST   | `/academic/courses` | Create course   | Admin         |
| GET    | `/academic/courses` | Get all courses | All           |

### **Course Sections**

| Method | Endpoint             | Description      | Auth Required |
| ------ | -------------------- | ---------------- | ------------- |
| POST   | `/academic/sections` | Create section   | Admin         |
| GET    | `/academic/sections` | Get all sections | All           |

### **Semesters**

| Method | Endpoint                            | Description          | Auth Required |
| ------ | ----------------------------------- | -------------------- | ------------- |
| POST   | `/academic/semesters`               | Create semester      | Admin         |
| GET    | `/academic/semesters`               | Get all semesters    | All           |
| GET    | `/academic/semesters/current`       | Get current semester | All           |
| PUT    | `/academic/semesters/{semester_id}` | Update semester      | Admin         |

### **Enrollments**

| Method | Endpoint                                | Description         | Auth Required |
| ------ | --------------------------------------- | ------------------- | ------------- |
| POST   | `/academic/enrollments`                 | Create enrollment   | Admin         |
| GET    | `/academic/enrollments`                 | Get all enrollments | Admin         |
| GET    | `/academic/enrollments/my`              | Get my enrollments  | Student       |
| DELETE | `/academic/enrollments/{enrollment_id}` | Delete enrollment   | Admin         |

### **Grades**

| Method | Endpoint                                       | Description               | Auth Required |
| ------ | ---------------------------------------------- | ------------------------- | ------------- |
| POST   | `/academic/assignments/{assignment_id}/grades` | Create grade              | Teacher       |
| GET    | `/academic/grades`                             | Get all grades            | Admin/Teacher |
| GET    | `/academic/grades/{grade_id}`                  | Get grade by ID           | Admin/Teacher |
| PUT    | `/academic/grades/{grade_id}`                  | Update grade              | Teacher       |
| DELETE | `/academic/grades/{grade_id}`                  | Delete grade              | Admin         |
| GET    | `/academic/enrollments/{enrollment_id}/grades` | Get grades for enrollment | All           |
| GET    | `/academic/sections/{section_id}/grades`       | Get grades for section    | Teacher       |
| GET    | `/academic/students/my/gpa`                    | Get my GPA                | Student       |
| GET    | `/academic/students/my/academic-standing`      | Get academic standing     | Student       |

### **Grade Workflow**

| Method | Endpoint                                | Description                | Auth Required |
| ------ | --------------------------------------- | -------------------------- | ------------- |
| POST   | `/academic/grades/submit/{section_id}`  | Submit grades for review   | Teacher       |
| POST   | `/academic/grades/review/{section_id}`  | Mark grades under review   | Admin         |
| POST   | `/academic/grades/approve/{section_id}` | Approve grades             | Admin         |
| POST   | `/academic/grades/reject/{section_id}`  | Reject grades              | Admin         |
| POST   | `/academic/grades/publish/{section_id}` | Publish grades to students | Admin         |
| GET    | `/academic/grades/summary/{section_id}` | Get grade summary          | Admin/Teacher |

### **Attendance**

| Method | Endpoint                                                  | Description                    | Auth Required |
| ------ | --------------------------------------------------------- | ------------------------------ | ------------- |
| POST   | `/academic/attendance/bulk`                               | Bulk create attendance         | Teacher       |
| GET    | `/academic/attendance`                                    | Get all attendance records     | Admin/Teacher |
| GET    | `/academic/attendance/{attendance_id}`                    | Get attendance by ID           | Admin/Teacher |
| PUT    | `/academic/attendance/{attendance_id}`                    | Update attendance              | Teacher       |
| DELETE | `/academic/attendance/{attendance_id}`                    | Delete attendance              | Admin         |
| GET    | `/academic/sections/{section_id}/attendance/records`      | Get section attendance         | Teacher       |
| GET    | `/academic/sections/{section_id}/attendance/{student_id}` | Get student attendance summary | Teacher       |

### **Attendance Compliance**

| Method | Endpoint                                                 | Description          | Auth Required |
| ------ | -------------------------------------------------------- | -------------------- | ------------- |
| GET    | `/academic/attendance/compliance/section/{section_id}`   | Section compliance   | Admin/Teacher |
| GET    | `/academic/attendance/compliance/semester/{semester_id}` | Semester compliance  | Admin         |
| GET    | `/academic/attendance/at-risk`                           | Get at-risk students | Admin/Teacher |
| POST   | `/academic/attendance/lock/{section_id}`                 | Lock attendance      | Admin         |
| GET    | `/academic/attendance/export/{section_id}`               | Export attendance    | Teacher       |

### **Timetable**

| Method | Endpoint                                               | Description         | Auth Required |
| ------ | ------------------------------------------------------ | ------------------- | ------------- |
| POST   | `/academic/timetable/validate`                         | Validate timetable  | Admin         |
| GET    | `/academic/timetable/conflicts/section/{section_id}`   | Section conflicts   | Admin         |
| GET    | `/academic/timetable/conflicts/semester/{semester_id}` | Semester conflicts  | Admin         |
| GET    | `/academic/timetable/available-rooms`                  | Get available rooms | Admin         |

### **Academic Dashboard**

| Method | Endpoint                    | Description        | Auth Required |
| ------ | --------------------------- | ------------------ | ------------- |
| GET    | `/academic/dashboard/stats` | Get academic stats | Admin         |

---

## 📊 **Dashboard** (`/api/v1/dashboard`)

| Method | Endpoint                                 | Description              | Auth Required |
| ------ | ---------------------------------------- | ------------------------ | ------------- |
| GET    | `/dashboard/stats`                       | Get dashboard statistics | Admin         |
| GET    | `/dashboard/recent-activity`             | Get recent activity      | Admin         |
| GET    | `/dashboard/analytics/user-activity`     | User activity analytics  | Admin         |
| GET    | `/dashboard/analytics/enrollment-trends` | Enrollment trends        | Admin         |
| GET    | `/dashboard/analytics/revenue`           | Revenue analytics        | Admin         |

---

## 💰 **Finance** (`/api/v1/finance`)

### **Invoices**

| Method | Endpoint                         | Description         | Auth Required |
| ------ | -------------------------------- | ------------------- | ------------- |
| POST   | `/finance/invoices`              | Create invoice      | Admin         |
| GET    | `/finance/invoices`              | Get all invoices    | Admin         |
| GET    | `/finance/invoices/{invoice_id}` | Get invoice details | Admin         |
| PUT    | `/finance/invoices/{invoice_id}` | Update invoice      | Admin         |
| DELETE | `/finance/invoices/{invoice_id}` | Delete invoice      | Admin         |

### **Payments**

| Method | Endpoint            | Description      | Auth Required |
| ------ | ------------------- | ---------------- | ------------- |
| POST   | `/finance/payments` | Create payment   | Admin         |
| GET    | `/finance/payments` | Get all payments | Admin         |

### **Financial Summary**

| Method | Endpoint                                   | Description                | Auth Required |
| ------ | ------------------------------------------ | -------------------------- | ------------- |
| GET    | `/finance/students/{student_id}/summary`   | Student financial summary  | Admin         |
| GET    | `/finance/students/my/summary`             | My financial summary       | Student       |
| GET    | `/finance/semesters/{semester_id}/summary` | Semester financial summary | Admin         |

---

## 📄 **Documents** (`/api/v1/documents`)

### **Course Materials**

| Method | Endpoint                                | Description              | Auth Required |
| ------ | --------------------------------------- | ------------------------ | ------------- |
| POST   | `/documents/upload-url`                 | Get upload URL           | Teacher       |
| POST   | `/documents`                            | Create document metadata | Teacher       |
| GET    | `/documents`                            | Get all documents        | All           |
| GET    | `/documents/{document_id}/download-url` | Get download URL         | All           |
| DELETE | `/documents/{document_id}`              | Delete document          | Teacher/Admin |

### **Document Requests**

| Method | Endpoint                           | Description           | Auth Required |
| ------ | ---------------------------------- | --------------------- | ------------- |
| POST   | `/documents/requests`              | Request document      | Student       |
| GET    | `/documents/requests`              | Get all requests      | Admin         |
| PUT    | `/documents/requests/{request_id}` | Update request status | Admin         |

### **Announcements**

| Method | Endpoint                   | Description         | Auth Required |
| ------ | -------------------------- | ------------------- | ------------- |
| POST   | `/documents/announcements` | Create announcement | Admin         |
| GET    | `/documents/announcements` | Get announcements   | All           |

---

## 📢 **Announcements** (`/api/v1/announcements`)

| Method | Endpoint                                     | Description            | Auth Required |
| ------ | -------------------------------------------- | ---------------------- | ------------- |
| GET    | `/announcements`                             | Get all announcements  | All           |
| GET    | `/announcements/{announcement_id}`           | Get announcement by ID | All           |
| POST   | `/announcements`                             | Create announcement    | Admin         |
| PUT    | `/announcements/{announcement_id}`           | Update announcement    | Admin         |
| DELETE | `/announcements/{announcement_id}`           | Delete announcement    | Admin         |
| POST   | `/announcements/{announcement_id}/publish`   | Publish announcement   | Admin         |
| POST   | `/announcements/{announcement_id}/unpublish` | Unpublish announcement | Admin         |

---

## 🔔 **Notifications** (`/api/v1/notifications`)

| Method | Endpoint                                     | Description             | Auth Required |
| ------ | -------------------------------------------- | ----------------------- | ------------- |
| GET    | `/notifications`                             | Get my notifications    | Yes           |
| GET    | `/notifications/unread-count`                | Get unread count        | Yes           |
| GET    | `/notifications/{notification_id}`           | Get notification by ID  | Yes           |
| POST   | `/notifications`                             | Create notification     | Admin         |
| PUT    | `/notifications/{notification_id}/mark-read` | Mark as read            | Yes           |
| POST   | `/notifications/mark-all-read`               | Mark all as read        | Yes           |
| DELETE | `/notifications/{notification_id}`           | Delete notification     | Yes           |
| DELETE | `/notifications/clear-all`                   | Clear all notifications | Yes           |
| GET    | `/notifications/stream`                      | SSE notification stream | Yes           |

---

## 🎫 **Support Tickets** (`/api/v1/support`)

| Method | Endpoint                              | Description        | Auth Required |
| ------ | ------------------------------------- | ------------------ | ------------- |
| POST   | `/support/tickets`                    | Create ticket      | Yes           |
| GET    | `/support/tickets`                    | Get all tickets    | Admin         |
| GET    | `/support/tickets/{ticket_id}`        | Get ticket details | Admin         |
| PUT    | `/support/tickets/{ticket_id}`        | Update ticket      | Admin         |
| POST   | `/support/tickets/{ticket_id}/events` | Add ticket event   | Admin         |
| GET    | `/support/tickets/{ticket_id}/events` | Get ticket events  | Admin         |
| GET    | `/support/stats/summary`              | Get support stats  | Admin         |

---

## 🗓️ **Schedule** (`/api/v1/schedule`)

| Method | Endpoint                         | Description              | Auth Required |
| ------ | -------------------------------- | ------------------------ | ------------- |
| GET    | `/schedule/calendar`             | Get calendar events      | Yes           |
| GET    | `/schedule/section/{section_id}` | Get section schedule     | All           |
| POST   | `/schedule/check-conflicts`      | Check schedule conflicts | Admin         |
| POST   | `/schedule`                      | Create schedule          | Admin         |
| PUT    | `/schedule/{schedule_id}`        | Update schedule          | Admin         |
| DELETE | `/schedule/{schedule_id}`        | Delete schedule          | Admin         |

---

## 📁 **Files** (`/api/v1/files`)

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| POST   | `/files/upload`             | Upload file         | Teacher/Admin |
| GET    | `/files/library`            | Get file library    | All           |
| GET    | `/files/{file_id}/download` | Download file       | All           |
| GET    | `/files/{file_id}/versions` | Get file versions   | All           |
| GET    | `/files/{file_id}/info`     | Get file info       | All           |
| DELETE | `/files/{file_id}`          | Delete file         | Teacher/Admin |
| GET    | `/files/categories`         | Get file categories | All           |

---

## 🔍 **Search** (`/api/v1/search`)

| Method | Endpoint         | Description   | Auth Required |
| ------ | ---------------- | ------------- | ------------- |
| GET    | `/search/global` | Global search | Yes           |
| GET    | `/search/users`  | Search users  | Admin         |

---

## 🔄 **Bulk Operations** (`/api/v1/bulk`)

| Method | Endpoint                        | Description               | Auth Required |
| ------ | ------------------------------- | ------------------------- | ------------- |
| POST   | `/bulk/users/update`            | Bulk update users         | Admin         |
| POST   | `/bulk/users/delete`            | Bulk delete users         | Admin         |
| POST   | `/bulk/enrollments/update`      | Bulk update enrollments   | Admin         |
| POST   | `/bulk/enrollments/delete`      | Bulk delete enrollments   | Admin         |
| POST   | `/bulk/grades/update`           | Bulk update grades        | Admin         |
| POST   | `/bulk/grades/delete`           | Bulk delete grades        | Admin         |
| POST   | `/bulk/notifications/delete`    | Bulk delete notifications | Admin         |
| POST   | `/bulk/notifications/mark-read` | Bulk mark as read         | Yes           |

---

## 🏫 **Campuses** (`/api/v1/campuses`)

| Method | Endpoint                      | Description             | Auth Required |
| ------ | ----------------------------- | ----------------------- | ------------- |
| POST   | `/campuses`                   | Create campus           | Admin         |
| GET    | `/campuses`                   | Get all campuses        | All           |
| GET    | `/campuses/{campus_id}`       | Get campus by ID        | All           |
| PUT    | `/campuses/{campus_id}`       | Update campus           | Admin         |
| DELETE | `/campuses/{campus_id}`       | Delete campus           | Admin         |
| GET    | `/campuses/{campus_id}/stats` | Get campus stats        | Admin         |
| GET    | `/campuses/stats/all`         | Get all campus stats    | Admin         |
| POST   | `/campuses/transfer`          | Transfer user to campus | Admin         |
| POST   | `/campuses/transfer/bulk`     | Bulk campus transfer    | Admin         |
| GET    | `/campuses/{campus_id}/users` | Get campus users        | Admin         |

---

## 📊 **Student Portal** (`/api/v1/student-portal`)

| Method | Endpoint                             | Description         | Auth Required |
| ------ | ------------------------------------ | ------------------- | ------------- |
| GET    | `/student-portal/dashboard`          | Student dashboard   | Student       |
| GET    | `/student-portal/my-courses`         | My enrolled courses | Student       |
| GET    | `/student-portal/course/{course_id}` | Course details      | Student       |
| GET    | `/student-portal/grades`             | My grades summary   | Student       |
| GET    | `/student-portal/upcoming-classes`   | Upcoming classes    | Student       |

---

## 📑 **Reports** (`/api/v1/reports`)

| Method | Endpoint              | Description           | Auth Required |
| ------ | --------------------- | --------------------- | ------------- |
| GET    | `/reports/available`  | Get available reports | Admin         |
| POST   | `/reports/transcript` | Generate transcript   | Admin/Student |
| POST   | `/reports/grade-card` | Generate grade card   | Admin/Student |

---

## ⚙️ **System Settings** (`/api/v1/settings`)

| Method | Endpoint                        | Description              | Auth Required |
| ------ | ------------------------------- | ------------------------ | ------------- |
| POST   | `/settings`                     | Create setting           | Admin         |
| GET    | `/settings`                     | Get all settings         | Admin         |
| GET    | `/settings/{setting_id}`        | Get setting by ID        | Admin         |
| GET    | `/settings/key/{key}`           | Get setting by key       | Admin         |
| PUT    | `/settings/{setting_id}`        | Update setting           | Admin         |
| DELETE | `/settings/{setting_id}`        | Delete setting           | Admin         |
| GET    | `/settings/category/{category}` | Get settings by category | Admin         |
| POST   | `/settings/bulk-update`         | Bulk update settings     | Admin         |

---

## 🛠️ **Admin Database** (`/api/v1/admin`)

| Method | Endpoint                            | Description         | Auth Required |
| ------ | ----------------------------------- | ------------------- | ------------- |
| GET    | `/admin/tables`                     | Get all table names | Admin         |
| GET    | `/admin/tables/{table_name}/count`  | Get table row count | Admin         |
| GET    | `/admin/stats`                      | Get database stats  | Admin         |
| GET    | `/admin/tables/{table_name}/sample` | Get sample data     | Admin         |

---

## 🧪 **Test Endpoints** (`/api/v1`)

| Method | Endpoint    | Description      | Auth Required |
| ------ | ----------- | ---------------- | ------------- |
| GET    | `/campuses` | Test campus list | No            |
| GET    | `/majors`   | Test major list  | No            |

---

## ❤️ **System Health**

| Method | Endpoint         | Description      | Auth Required |
| ------ | ---------------- | ---------------- | ------------- |
| GET    | `/health`        | Health check     | No            |
| GET    | `/api/v1/health` | API health check | No            |
| GET    | `/`              | Root endpoint    | No            |

---

## 📝 **Import/Export** (Currently Disabled)

| Method | Endpoint                                 | Description          | Auth Required |
| ------ | ---------------------------------------- | -------------------- | ------------- |
| POST   | `/import-export/validate/{entity_type}`  | Validate import file | Admin         |
| POST   | `/import-export/import/users`            | Import users         | Admin         |
| POST   | `/import-export/import/students`         | Import students      | Admin         |
| POST   | `/import-export/import/courses`          | Import courses       | Admin         |
| POST   | `/import-export/import/enrollments`      | Import enrollments   | Admin         |
| GET    | `/import-export/export/users`            | Export users         | Admin         |
| GET    | `/import-export/export/students`         | Export students      | Admin         |
| GET    | `/import-export/export/courses`          | Export courses       | Admin         |
| GET    | `/import-export/export/enrollments`      | Export enrollments   | Admin         |
| GET    | `/import-export/export/grades`           | Export grades        | Admin         |
| GET    | `/import-export/templates/{entity_type}` | Get import template  | Admin         |
| GET    | `/import-export/templates`               | Get all templates    | Admin         |

---

## 📊 **Summary**

**Total Endpoint Categories:** 20+  
**Total Endpoints:** 200+

### **By Category:**

- 🔐 Authentication: 6 endpoints
- 👤 User Management: 8 endpoints
- 🎓 Academic: 60+ endpoints
- 📊 Dashboard: 5 endpoints
- 💰 Finance: 11 endpoints
- 📄 Documents: 9 endpoints
- 📢 Announcements: 7 endpoints
- 🔔 Notifications: 9 endpoints
- 🎫 Support: 7 endpoints
- 🗓️ Schedule: 6 endpoints
- 📁 Files: 7 endpoints
- 🔍 Search: 2 endpoints
- 🔄 Bulk Operations: 8 endpoints
- 🏫 Campuses: 10 endpoints
- 📊 Student Portal: 5 endpoints
- 📑 Reports: 3 endpoints
- ⚙️ Settings: 8 endpoints
- 🛠️ Admin: 4 endpoints
- ❤️ System: 3 endpoints

---

## 🔑 **Authentication Methods**

1. **Firebase Authentication** (Students/Teachers)
   - Send Firebase ID token in `Authorization: Bearer <token>` header
2. **Admin Password Login**

   - Use `/auth/admin-login` endpoint
   - Receive JWT token
   - Send JWT in `Authorization: Bearer <token>` header

3. **No Authentication** (Public endpoints)
   - Health checks
   - Test endpoints
   - Some read-only resources

---

## 📖 **Documentation**

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

**Last Updated:** January 2025  
**API Version:** v1.0.0
