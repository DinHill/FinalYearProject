# 📚 Complete API Endpoints List

**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Last Updated:** November 11, 2025

---

## 🔐 Authentication (`/api/v1/auth`)

| #   | Method | Endpoint                | Description            | Status        |
| --- | ------ | ----------------------- | ---------------------- | ------------- |
| 1   | POST   | `/auth/register`        | Register new user      | 📱 Mobile App |
| 2   | POST   | `/auth/login`           | Firebase login         | 📱 Mobile App |
| 3   | POST   | `/auth/admin-login`     | Admin password login   | ✅ Used       |
| 4   | POST   | `/auth/logout`          | Logout                 | ✅ Used       |
| 5   | GET    | `/auth/verify`          | Verify JWT token       | 📱 Mobile App |
| 6   | GET    | `/auth/me`              | Get current user       | ✅ Used       |
| 7   | POST   | `/auth/reset-password`  | Password reset request | 📱 Mobile App |
| 8   | PUT    | `/auth/update-password` | Update password        | 📱 Mobile App |

---

## 👤 Users Management (`/api/v1/users`)

| #   | Method | Endpoint                   | Description                    | Status  |
| --- | ------ | -------------------------- | ------------------------------ | ------- |
| 9   | POST   | `/users`                   | Create new user                | ✅ Used |
| 10  | POST   | `/users/create-user`       | Create user (alternate)        | ✅ Used |
| 11  | GET    | `/users`                   | Get all users (paginated)      | ✅ Used |
| 12  | GET    | `/users/{user_id}`         | Get user by ID                 | ✅ Used |
| 13  | PUT    | `/users/{user_id}`         | Update user                    | ✅ Used |
| 14  | DELETE | `/users/{user_id}`         | Delete user                    | ✅ Used |
| 15  | POST   | `/users/{user_id}/approve` | Approve user (create Firebase) | ✅ Used |
| 16  | GET    | `/users/status-counts`     | User counts by status          | ✅ Used |
| 17  | GET    | `/users/count-by-role`     | User counts by role            | ✅ Used |

---

## 👨‍🎓 Current User Profile (`/api/v1/me`)

| #   | Method | Endpoint          | Description        | Status        |
| --- | ------ | ----------------- | ------------------ | ------------- |
| 18  | GET    | `/me/profile`     | Get my profile     | 📱 Mobile App |
| 19  | PATCH  | `/me/profile`     | Update my profile  | 📱 Mobile App |
| 20  | GET    | `/me/schedule`    | Get my schedule    | 📱 Mobile App |
| 21  | GET    | `/me/enrollments` | Get my enrollments | 📱 Mobile App |
| 22  | GET    | `/me/grades`      | Get my grades      | 📱 Mobile App |
| 23  | GET    | `/me/attendance`  | Get my attendance  | 📱 Mobile App |
| 24  | GET    | `/me/invoices`    | Get my invoices    | 📱 Mobile App |
| 25  | GET    | `/me/documents`   | Get my documents   | 📱 Mobile App |
| 26  | GET    | `/me/gpa`         | Get my GPA         | 📱 Mobile App |

---

## 🎓 Academic - Programs/Majors (`/api/v1/academic`)

| #   | Method | Endpoint                                      | Description               | Status    |
| --- | ------ | --------------------------------------------- | ------------------------- | --------- |
| 27  | POST   | `/academic/programs`                          | Create program            | ✅ Used   |
| 28  | GET    | `/academic/programs`                          | Get all programs          | ✅ Used   |
| 29  | GET    | `/academic/programs/{program_id}`             | Get program by ID         | ✅ Used   |
| 30  | PUT    | `/academic/programs/{program_id}`             | Update program            | ✅ Used   |
| 31  | DELETE | `/academic/programs/{program_id}`             | Delete/deactivate program | ✅ Used   |
| 32  | PUT    | `/academic/programs/{program_id}/coordinator` | Assign coordinator        | 🔮 Future |

---

## 📚 Academic - Subjects

| #   | Method | Endpoint             | Description      | Status    |
| --- | ------ | -------------------- | ---------------- | --------- |
| 33  | POST   | `/academic/subjects` | Create subject   | ⚠️ Unused |
| 34  | GET    | `/academic/subjects` | Get all subjects | ⚠️ Unused |

---

## 📖 Academic - Courses

| #   | Method | Endpoint            | Description                 | Status  |
| --- | ------ | ------------------- | --------------------------- | ------- |
| 35  | POST   | `/academic/courses` | Create course               | ✅ Used |
| 36  | GET    | `/academic/courses` | Get all courses (paginated) | ✅ Used |

---

## 👥 Academic - Sections

| #   | Method | Endpoint             | Description                  | Status  |
| --- | ------ | -------------------- | ---------------------------- | ------- |
| 37  | POST   | `/academic/sections` | Create section               | ✅ Used |
| 38  | GET    | `/academic/sections` | Get all sections (paginated) | ✅ Used |

---

## 📅 Academic - Semesters

| #   | Method | Endpoint                            | Description          | Status    |
| --- | ------ | ----------------------------------- | -------------------- | --------- |
| 39  | POST   | `/academic/semesters`               | Create semester      | ✅ Used   |
| 40  | GET    | `/academic/semesters`               | Get all semesters    | ✅ Used   |
| 41  | GET    | `/academic/semesters/current`       | Get current semester | ✅ Used   |
| 42  | PUT    | `/academic/semesters/{semester_id}` | Update semester      | 🔮 Future |

---

## 📝 Academic - Enrollments

| #   | Method | Endpoint                                | Description                     | Status        |
| --- | ------ | --------------------------------------- | ------------------------------- | ------------- |
| 43  | POST   | `/academic/enrollments`                 | Create enrollment               | ✅ Used       |
| 44  | GET    | `/academic/enrollments`                 | Get all enrollments (paginated) | ✅ Used       |
| 45  | GET    | `/academic/enrollments/my`              | Get my enrollments (student)    | 📱 Mobile App |
| 46  | DELETE | `/academic/enrollments/{enrollment_id}` | Delete enrollment               | ✅ Used       |

---

## 📊 Academic - Grades

| #   | Method | Endpoint                                       | Description                   | Status        |
| --- | ------ | ---------------------------------------------- | ----------------------------- | ------------- |
| 47  | POST   | `/academic/assignments/{assignment_id}/grades` | Submit assignment grade       | 🔮 Future     |
| 48  | GET    | `/academic/grades`                             | Get all grades (paginated)    | ✅ Used       |
| 49  | GET    | `/academic/grades/{grade_id}`                  | Get grade by ID               | ✅ Used       |
| 50  | PUT    | `/academic/grades/{grade_id}`                  | Update grade                  | ✅ Used       |
| 51  | DELETE | `/academic/grades/{grade_id}`                  | Delete grade                  | ✅ Used       |
| 52  | GET    | `/academic/enrollments/{enrollment_id}/grades` | Get grades for enrollment     | 🔮 Future     |
| 53  | GET    | `/academic/sections/{section_id}/grades`       | Get section grades            | 🔮 Future     |
| 54  | GET    | `/academic/grades/summary/{section_id}`        | Get grade summary for section | ✅ Used       |
| 55  | POST   | `/academic/grades/submit/{section_id}`         | Submit grades for review      | ✅ Used       |
| 56  | POST   | `/academic/grades/review/{section_id}`         | Send grades to review         | ✅ Used       |
| 57  | POST   | `/academic/grades/approve/{section_id}`        | Approve section grades        | ✅ Used       |
| 58  | POST   | `/academic/grades/reject/{section_id}`         | Reject section grades         | ✅ Used       |
| 59  | POST   | `/academic/grades/publish/{section_id}`        | Publish grades to students    | ✅ Used       |
| 60  | GET    | `/academic/students/my/gpa`                    | Get my GPA (student)          | 📱 Mobile App |

---

## ✅ Academic - Attendance

| #   | Method | Endpoint                                                  | Description                        | Status    |
| --- | ------ | --------------------------------------------------------- | ---------------------------------- | --------- |
| 61  | POST   | `/academic/attendance/bulk`                               | Bulk create attendance             | ✅ Used   |
| 62  | GET    | `/academic/attendance`                                    | Get attendance records (paginated) | ✅ Used   |
| 63  | GET    | `/academic/attendance/{attendance_id}`                    | Get attendance by ID               | 🔮 Future |
| 64  | PUT    | `/academic/attendance/{attendance_id}`                    | Update attendance                  | 🔮 Future |
| 65  | DELETE | `/academic/attendance/{attendance_id}`                    | Delete attendance                  | 🔮 Future |
| 66  | GET    | `/academic/sections/{section_id}/attendance/records`      | Section attendance records         | 🔮 Future |
| 67  | GET    | `/academic/sections/{section_id}/attendance/{student_id}` | Student attendance summary         | 🔮 Future |
| 68  | GET    | `/academic/attendance/compliance/semester/{semester_id}`  | Semester attendance compliance     | ✅ Used   |
| 69  | GET    | `/academic/attendance/at-risk`                            | Get at-risk students               | ✅ Used   |
| 70  | GET    | `/academic/attendance/export/{section_id}`                | Export attendance                  | ✅ Used   |

---

## 🗓️ Academic - Timetable

| #   | Method | Endpoint                                               | Description             | Status  |
| --- | ------ | ------------------------------------------------------ | ----------------------- | ------- |
| 71  | GET    | `/academic/timetable/conflicts/semester/{semester_id}` | Get timetable conflicts | ✅ Used |

---

## 📊 Academic - Dashboard

| #   | Method | Endpoint                    | Description                   | Status  |
| --- | ------ | --------------------------- | ----------------------------- | ------- |
| 72  | GET    | `/academic/dashboard/stats` | Academic dashboard statistics | ✅ Used |

---

## 📄 Documents (`/api/v1/documents`)

| #   | Method | Endpoint                                | Description                       | Status    |
| --- | ------ | --------------------------------------- | --------------------------------- | --------- |
| 73  | POST   | `/documents/upload-url`                 | Get upload URL for document       | ✅ Used   |
| 74  | POST   | `/documents`                            | Create document record            | ✅ Used   |
| 75  | GET    | `/documents`                            | Get all documents (paginated)     | ✅ Used   |
| 76  | GET    | `/documents/{document_id}/download-url` | Get download URL                  | ✅ Used   |
| 77  | DELETE | `/documents/{document_id}`              | Delete document                   | ✅ Used   |
| 78  | POST   | `/documents/requests`                   | Create document request           | ✅ Used   |
| 79  | GET    | `/documents/requests`                   | Get document requests (paginated) | ✅ Used   |
| 80  | PUT    | `/documents/requests/{request_id}`      | Update document request           | ✅ Used   |
| 81  | POST   | `/documents/announcements`              | Create document announcement      | 🔮 Future |
| 82  | GET    | `/documents/announcements`              | Get document announcements        | 🔮 Future |

---

## 💰 Finance (`/api/v1/finance`)

| #   | Method | Endpoint                                   | Description                  | Status        |
| --- | ------ | ------------------------------------------ | ---------------------------- | ------------- |
| 83  | POST   | `/finance/invoices`                        | Create invoice               | ✅ Used       |
| 84  | GET    | `/finance/invoices`                        | Get all invoices (paginated) | ✅ Used       |
| 85  | GET    | `/finance/invoices/{invoice_id}`           | Get invoice details          | ✅ Used       |
| 86  | PUT    | `/finance/invoices/{invoice_id}`           | Update invoice               | ✅ Used       |
| 87  | DELETE | `/finance/invoices/{invoice_id}`           | Delete invoice               | ✅ Used       |
| 88  | POST   | `/finance/payments`                        | Record payment               | ✅ Used       |
| 89  | GET    | `/finance/payments`                        | Get all payments (paginated) | ✅ Used       |
| 90  | GET    | `/finance/students/{student_id}/summary`   | Student financial summary    | 🔮 Future     |
| 91  | GET    | `/finance/students/my/summary`             | My financial summary         | 📱 Mobile App |
| 92  | GET    | `/finance/semesters/{semester_id}/summary` | Semester financial summary   | 🔮 Future     |
| 93  | GET    | `/finance/fee-structures`                  | Get fee structures           | ✅ Used       |

---

## 📢 Announcements (`/api/v1/announcements`)

| #   | Method | Endpoint                                     | Description                       | Status  |
| --- | ------ | -------------------------------------------- | --------------------------------- | ------- |
| 94  | POST   | `/announcements`                             | Create announcement               | ✅ Used |
| 95  | GET    | `/announcements`                             | Get all announcements (paginated) | ✅ Used |
| 96  | GET    | `/announcements/{announcement_id}`           | Get announcement by ID            | ✅ Used |
| 97  | PUT    | `/announcements/{announcement_id}`           | Update announcement               | ✅ Used |
| 98  | DELETE | `/announcements/{announcement_id}`           | Delete announcement               | ✅ Used |
| 99  | POST   | `/announcements/{announcement_id}/publish`   | Publish announcement              | ✅ Used |
| 100 | POST   | `/announcements/{announcement_id}/unpublish` | Unpublish announcement            | ✅ Used |

---

## 🔔 Notifications (`/api/v1/notifications`)

| #   | Method | Endpoint                                     | Description                       | Status    |
| --- | ------ | -------------------------------------------- | --------------------------------- | --------- |
| 101 | POST   | `/notifications`                             | Create notification               | ✅ Used   |
| 102 | POST   | `/notifications/send`                        | Send notification                 | ✅ Used   |
| 103 | GET    | `/notifications`                             | Get all notifications (paginated) | ✅ Used   |
| 104 | GET    | `/notifications/unread-count`                | Get unread count                  | ✅ Used   |
| 105 | GET    | `/notifications/{notification_id}`           | Get notification by ID            | ✅ Used   |
| 106 | PUT    | `/notifications/{notification_id}/mark-read` | Mark as read                      | ✅ Used   |
| 107 | POST   | `/notifications/mark-all-read`               | Mark all as read                  | ✅ Used   |
| 108 | DELETE | `/notifications/{notification_id}`           | Delete notification               | ✅ Used   |
| 109 | DELETE | `/notifications/clear-all`                   | Clear all notifications           | ✅ Used   |
| 110 | GET    | `/notifications/stream`                      | SSE stream for real-time          | 🔮 Future |

---

## 🎫 Support Tickets (`/api/v1/support`)

| #   | Method | Endpoint                               | Description                 | Status    |
| --- | ------ | -------------------------------------- | --------------------------- | --------- |
| 111 | POST   | `/support/tickets`                     | Create ticket               | ✅ Used   |
| 112 | GET    | `/support/tickets`                     | Get all tickets (paginated) | ✅ Used   |
| 113 | GET    | `/support/tickets/{ticket_id}`         | Get ticket details          | 🔮 Future |
| 114 | PUT    | `/support/tickets/{ticket_id}`         | Update ticket               | 🔮 Future |
| 115 | POST   | `/support/tickets/{ticket_id}/replies` | Add reply to ticket         | ✅ Used   |
| 116 | PUT    | `/support/tickets/{ticket_id}/assign`  | Assign ticket               | ✅ Used   |
| 117 | PUT    | `/support/tickets/{ticket_id}/status`  | Update ticket status        | ✅ Used   |
| 118 | POST   | `/support/tickets/{ticket_id}/events`  | Add ticket event            | 🔮 Future |
| 119 | GET    | `/support/tickets/{ticket_id}/events`  | Get ticket events           | 🔮 Future |
| 120 | GET    | `/support/stats/summary`               | Support statistics          | ✅ Used   |

---

## 📊 Dashboard (`/api/v1/dashboard`)

| #   | Method | Endpoint                                 | Description             | Status    |
| --- | ------ | ---------------------------------------- | ----------------------- | --------- |
| 121 | GET    | `/dashboard/stats`                       | Dashboard statistics    | ✅ Used   |
| 122 | GET    | `/dashboard/recent-activity`             | Recent activity         | ✅ Used   |
| 123 | GET    | `/dashboard/analytics/user-activity`     | User activity analytics | 🔮 Future |
| 124 | GET    | `/dashboard/analytics/enrollment-trends` | Enrollment trends       | 🔮 Future |
| 125 | GET    | `/dashboard/analytics/revenue`           | Revenue analytics       | 🔮 Future |

---

## 📊 Analytics (`/api/v1/analytics`)

| #   | Method | Endpoint           | Description    | Status  |
| --- | ------ | ------------------ | -------------- | ------- |
| 126 | GET    | `/analytics/users` | User analytics | ✅ Used |

---

## ⚙️ Settings (`/api/v1/settings`)

| #   | Method | Endpoint                        | Description                  | Status  |
| --- | ------ | ------------------------------- | ---------------------------- | ------- |
| 127 | POST   | `/settings`                     | Create setting               | ✅ Used |
| 128 | GET    | `/settings`                     | Get all settings (paginated) | ✅ Used |
| 129 | GET    | `/settings/{setting_id}`        | Get setting by ID            | ✅ Used |
| 130 | GET    | `/settings/key/{key}`           | Get setting by key           | ✅ Used |
| 131 | GET    | `/settings/category/{category}` | Get settings by category     | ✅ Used |
| 132 | PUT    | `/settings/{setting_id}`        | Update setting               | ✅ Used |
| 133 | DELETE | `/settings/{setting_id}`        | Delete setting               | ✅ Used |
| 134 | POST   | `/settings/bulk-update`         | Bulk update settings         | ✅ Used |

---

## 🔍 Search (`/api/v1/search`)

| #   | Method | Endpoint              | Description        | Status  |
| --- | ------ | --------------------- | ------------------ | ------- |
| 135 | GET    | `/search/global`      | Global search      | ✅ Used |
| 136 | GET    | `/search/suggestions` | Search suggestions | ✅ Used |

---

## 📦 Bulk Operations (`/api/v1/bulk`)

| #   | Method | Endpoint                        | Description               | Status  |
| --- | ------ | ------------------------------- | ------------------------- | ------- |
| 137 | POST   | `/bulk/users/update`            | Bulk update users         | ✅ Used |
| 138 | POST   | `/bulk/users/delete`            | Bulk delete users         | ✅ Used |
| 139 | POST   | `/bulk/enrollments/update`      | Bulk update enrollments   | ✅ Used |
| 140 | POST   | `/bulk/enrollments/delete`      | Bulk delete enrollments   | ✅ Used |
| 141 | POST   | `/bulk/grades/update`           | Bulk update grades        | ✅ Used |
| 142 | POST   | `/bulk/grades/delete`           | Bulk delete grades        | ✅ Used |
| 143 | POST   | `/bulk/notifications/delete`    | Bulk delete notifications | ✅ Used |
| 144 | POST   | `/bulk/notifications/mark-read` | Bulk mark as read         | ✅ Used |

---

## 🗓️ Schedule (`/api/v1/schedule`)

| #   | Method | Endpoint                         | Description              | Status  |
| --- | ------ | -------------------------------- | ------------------------ | ------- |
| 145 | POST   | `/schedule`                      | Create schedule          | ✅ Used |
| 146 | GET    | `/schedule/calendar`             | Get calendar events      | ✅ Used |
| 147 | GET    | `/schedule/section/{section_id}` | Get section schedule     | ✅ Used |
| 148 | POST   | `/schedule/check-conflicts`      | Check schedule conflicts | ✅ Used |
| 149 | PUT    | `/schedule/{schedule_id}`        | Update schedule          | ✅ Used |
| 150 | DELETE | `/schedule/{schedule_id}`        | Delete schedule          | ✅ Used |

---

## 📁 Files (`/api/v1/files`)

| #   | Method | Endpoint                    | Description         | Status  |
| --- | ------ | --------------------------- | ------------------- | ------- |
| 151 | POST   | `/files/upload`             | Upload file         | ✅ Used |
| 152 | GET    | `/files/library`            | Get file library    | ✅ Used |
| 153 | GET    | `/files/{file_id}/download` | Download file       | ✅ Used |
| 154 | GET    | `/files/{file_id}/versions` | Get file versions   | ✅ Used |
| 155 | GET    | `/files/{file_id}/info`     | Get file metadata   | ✅ Used |
| 156 | DELETE | `/files/{file_id}`          | Delete file         | ✅ Used |
| 157 | GET    | `/files/categories`         | Get file categories | ✅ Used |

---

## 🏛️ Campuses (`/api/v1/campuses`)

| #   | Method | Endpoint                      | Description          | Status   |
| --- | ------ | ----------------------------- | -------------------- | -------- |
| 158 | POST   | `/campuses`                   | Create campus        | 🚧 Later |
| 159 | GET    | `/campuses`                   | Get all campuses     | 🚧 Later |
| 160 | GET    | `/campuses/{campus_id}`       | Get campus by ID     | 🚧 Later |
| 161 | PUT    | `/campuses/{campus_id}`       | Update campus        | 🚧 Later |
| 162 | DELETE | `/campuses/{campus_id}`       | Delete campus        | 🚧 Later |
| 163 | GET    | `/campuses/{campus_id}/stats` | Campus statistics    | 🚧 Later |
| 164 | GET    | `/campuses/stats/all`         | All campus stats     | 🚧 Later |
| 165 | POST   | `/campuses/transfer`          | Transfer student     | 🚧 Later |
| 166 | POST   | `/campuses/transfer/bulk`     | Bulk campus transfer | 🚧 Later |
| 167 | GET    | `/campuses/{campus_id}/users` | Get campus users     | 🚧 Later |

---

## 🧪 Test Endpoints (`/api/v1/test`)

| #   | Method | Endpoint         | Description                         | Status  |
| --- | ------ | ---------------- | ----------------------------------- | ------- |
| 168 | GET    | `/test/campuses` | Get campuses (temporary workaround) | ✅ Used |
| 169 | GET    | `/test/majors`   | Get majors (temporary workaround)   | ✅ Used |

---

## 🎓 Student Portal (`/api/v1/student-portal`)

| #   | Method | Endpoint                             | Description        | Status  |
| --- | ------ | ------------------------------------ | ------------------ | ------- |
| 170 | GET    | `/student-portal/dashboard`          | Student dashboard  | ✅ Used |
| 171 | GET    | `/student-portal/my-courses`         | Get my courses     | ✅ Used |
| 172 | GET    | `/student-portal/course/{course_id}` | Get course details | ✅ Used |
| 173 | GET    | `/student-portal/grades`             | Get my grades      | ✅ Used |
| 174 | GET    | `/student-portal/upcoming-classes`   | Upcoming classes   | ✅ Used |

---

## 📊 Reports (`/api/v1/reports`)

| #   | Method | Endpoint              | Description           | Status  |
| --- | ------ | --------------------- | --------------------- | ------- |
| 175 | GET    | `/reports/available`  | Get available reports | ✅ Used |
| 176 | POST   | `/reports/transcript` | Generate transcript   | ✅ Used |
| 177 | POST   | `/reports/grade-card` | Generate grade card   | ✅ Used |

---

## 📥 Import/Export (`/api/v1/import-export`)

| #   | Method | Endpoint                                 | Description            | Status   |
| --- | ------ | ---------------------------------------- | ---------------------- | -------- |
| 178 | POST   | `/import-export/validate/{entity_type}`  | Validate import data   | 🚧 Later |
| 179 | POST   | `/import-export/import/users`            | Import users CSV       | 🚧 Later |
| 180 | POST   | `/import-export/import/students`         | Import students CSV    | 🚧 Later |
| 181 | POST   | `/import-export/import/courses`          | Import courses CSV     | 🚧 Later |
| 182 | POST   | `/import-export/import/enrollments`      | Import enrollments CSV | 🚧 Later |
| 183 | GET    | `/import-export/export/users`            | Export users CSV       | 🚧 Later |
| 184 | GET    | `/import-export/export/students`         | Export students CSV    | 🚧 Later |
| 185 | GET    | `/import-export/export/courses`          | Export courses CSV     | 🚧 Later |
| 186 | GET    | `/import-export/export/enrollments`      | Export enrollments CSV | 🚧 Later |
| 187 | GET    | `/import-export/export/grades`           | Export grades CSV      | 🚧 Later |
| 188 | GET    | `/import-export/templates/{entity_type}` | Download CSV template  | 🚧 Later |
| 189 | GET    | `/import-export/templates`               | List all templates     | 🚧 Later |

---

## 🔍 Admin Database (`/api/v1/admin-db`)

| #   | Method | Endpoint                          | Description          | Status   |
| --- | ------ | --------------------------------- | -------------------- | -------- |
| 190 | GET    | `/admin-db/tables`                | List all tables      | 🛠️ Debug |
| 191 | GET    | `/admin-db/tables/{table}/count`  | Count table records  | 🛠️ Debug |
| 192 | GET    | `/admin-db/stats`                 | Database statistics  | 🛠️ Debug |
| 193 | GET    | `/admin-db/tables/{table}/sample` | Sample table records | 🛠️ Debug |

---

## 📋 Audit Logs (`/api/v1/audit`)

| #   | Method | Endpoint        | Description                | Status  |
| --- | ------ | --------------- | -------------------------- | ------- |
| 194 | GET    | `/audit/logs`   | Get audit logs (paginated) | ✅ Used |
| 195 | GET    | `/audit/stats`  | Audit statistics           | ✅ Used |
| 196 | GET    | `/audit/export` | Export audit logs          | ✅ Used |

---

## 🏥 System Health

| #   | Method | Endpoint         | Description      | Status  |
| --- | ------ | ---------------- | ---------------- | ------- |
| 197 | GET    | `/health`        | Health check     | ✅ Used |
| 198 | GET    | `/api/v1/health` | API health check | ✅ Used |
| 199 | GET    | `/`              | Root endpoint    | ✅ Used |

---

## 📊 Summary

### **By Status**

- ✅ **Used** (Active in Frontend): ~130 endpoints (67%)
- 📱 **Mobile App** (Future Implementation): ~20 endpoints (10%)
- 🚧 **Later** (Campus & Import/Export): ~22 endpoints (11%)
- 🔮 **Future** (Advanced Features): ~20 endpoints (10%)
- 🛠️ **Debug** (Development Only): ~4 endpoints (2%)

### **Total: 196 Active Endpoints**

### **Status Legend**

- ✅ **Used** - Actively used in admin panel
- 📱 **Mobile App** - Kept for future mobile app
- 🚧 **Later** - Will implement in admin panel later
- 🔮 **Future** - Advanced features for future
- 🛠️ **Debug** - Development/debugging only
- ⚠️ **Unused** - May not be needed

---

## 🔗 Quick Links

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

**Note:** Parent Portal endpoints (7 endpoints) were removed as they are not needed for this project.
