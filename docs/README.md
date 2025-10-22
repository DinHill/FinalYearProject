# 📚 Greenwich Academic Portal - Complete Documentation

**Project:** Greenwich University Academic Portal System  
**Version:** 1.0  
**Last Updated:** October 22, 2025

---

## 📑 Quick Navigation

- **[Project Overview](#-project-overview)** - What is this system?
- **[Architecture](#-system-architecture)** - Technical design
- **[Getting Started](#-quick-start)** - Setup instructions
- **[API Reference](#-api-endpoints)** - Backend API
- **[RBAC System](./RBAC_SYSTEM.md)** - Role-based access control
- **[Project Status](./PROJECT_STATUS.md)** - Current progress
- **[Deployment](#-deployment)** - Production setup

---

## 🎯 Project Overview

A comprehensive academic management system for Greenwich University Vietnam with support for 4 campuses (Hanoi, Da Nang, Can Tho, Saigon).

### **Key Features:**

- 👥 User management (students, teachers, admins)
- 📚 Academic management (courses, enrollments, grades, attendance)
- 💰 Financial system (invoices, payments, fee structures)
- 📄 Document management (requests, announcements)
- 🎫 Support ticket system
- 🔐 Role-based access control with campus scoping
- 📱 Mobile-friendly REST API

### **Target Users:**

1. **Admins** (5 types) - System and campus administration
2. **Teachers** - Course and grade management
3. **Students** - View academic information, pay fees, request documents

---

## 🏗️ System Architecture

### **Technology Stack**

#### **Backend**

- **Framework:** FastAPI 0.115+ (Python 3.12.6)
- **Database:** PostgreSQL 15+ (Render)
- **ORM:** SQLAlchemy 2.0.36 (async)
- **Migrations:** Alembic 1.13.1
- **Authentication:** Firebase Admin SDK + JWT
- **Validation:** Pydantic 2.9+

#### **Frontend - Admin Portal**

- **Framework:** Next.js 15.5.3 (App Router)
- **Language:** TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui
- **State:** TanStack React Query 5.87.4
- **Forms:** React Hook Form + Zod

#### **Frontend - Mobile App**

- **Framework:** React Native 0.79.4
- **Platform:** Expo SDK 53.0.15
- **Language:** TypeScript 5.8.3
- **Navigation:** React Navigation 7
- **UI:** React Native Paper 5.14.5

### **Deployment**

- **Backend:** Render.com (https://academic-portal-api.onrender.com)
- **Database:** Render PostgreSQL (28 tables)
- **Admin Portal:** Localhost (not yet deployed)
- **Mobile App:** Development (not yet deployed)

---

## 🗄️ Database Schema

### **28 Tables in 6 Domains:**

#### **1. User Management (6 tables)**

- `users` - User accounts (students, teachers, admins)
- `campuses` - University campuses (4 locations)
- `majors` - Academic programs
- `roles` - System roles (7 roles)
- `user_roles` - User-role assignments with campus scoping
- `device_tokens` - FCM push notification tokens

#### **2. Academic (8 tables)**

- `semesters` - Academic terms
- `courses` - Course catalog
- `course_sections` - Class sections
- `schedules` - Class timetables
- `enrollments` - Student registrations
- `assignments` - Course assignments
- `grades` - Student scores
- `attendance` - Attendance records

#### **3. Finance (4 tables)**

- `fee_structures` - Tuition templates
- `invoices` - Student bills
- `invoice_lines` - Invoice details
- `payments` - Payment records

#### **4. Documents (3 tables)**

- `documents` - File metadata
- `document_requests` - Student requests
- `announcements` - System announcements

#### **5. Communication (4 tables)**

- `chat_rooms` - Chat groups
- `chat_participants` - Room members
- `support_tickets` - Help tickets
- `ticket_events` - Ticket history

#### **6. System (3 tables)**

- `username_sequences` - Username generation
- `student_sequences` - Student ID generation
- `idempotency_keys` - Payment idempotency

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+
- Python 3.12+
- PostgreSQL 15+
- Git

### **1. Clone Repository**

```bash
git clone https://github.com/DinHill/FinalYearProject.git
cd FinalYearProject
```

### **2. Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### **3. Admin Portal Setup**

```bash
cd academic-portal-admin

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
# App: http://localhost:3000
```

### **4. Mobile App Setup**

```bash
cd academic-portal-app

# Install dependencies
npm install

# Start Expo
npx expo start
# Scan QR code with Expo Go app
```

---

## 🔐 Authentication & Authorization

### **Authentication Methods**

#### **1. Firebase Authentication (Mobile App)**

- Used by students and teachers
- Firebase ID tokens validated via Firebase Admin SDK
- Tokens contain: uid, email, role, campus_id

#### **2. JWT Authentication (Admin Portal)**

- Used by admin users
- JWT tokens signed with SECRET_KEY
- Tokens contain: uid, email, role, admin_type
- 30-day expiry

### **Role-Based Access Control (RBAC)**

See detailed documentation: **[RBAC_SYSTEM.md](./RBAC_SYSTEM.md)**

**7 Roles:**

1. `student` - View own academic data
2. `teacher` - Manage sections, grades
3. `super_admin` - Full system access (cross-campus)
4. `academic_admin` - Academic management
5. `finance_admin` - Financial management
6. `support_admin` - Support & documents
7. `content_admin` - Content management

**Campus Scoping:**

- NULL campus_id = Cross-campus access
- Specific campus_id = Single campus only

---

## 🔌 API Endpoints

**Base URL:** `https://academic-portal-api.onrender.com/api/v1`

### **Authentication**

```
POST   /auth/admin-login         # Admin login (JWT)
POST   /auth/student-register    # Student registration
GET    /auth/me                  # Current user profile
POST   /auth/logout              # Logout
```

### **Users**

```
GET    /users                    # List users (admin only)
POST   /users                    # Create user (admin only)
GET    /users/{id}               # Get user by ID
PUT    /users/{id}               # Update user (admin only)
DELETE /users/{id}               # Delete user (admin only)
GET    /users/campuses           # List campuses
GET    /users/majors             # List majors
```

### **Academic**

```
GET    /academic/courses         # List courses
POST   /academic/courses         # Create course (admin)
GET    /academic/sections        # List sections
POST   /academic/enrollments     # Enroll student
GET    /academic/enrollments/my  # My enrollments
GET    /academic/grades          # Get grades
POST   /academic/grades          # Submit grade (teacher)
POST   /academic/attendance/bulk # Mark attendance (teacher)
```

### **Finance**

```
GET    /finance/invoices         # List invoices
POST   /finance/invoices         # Create invoice (admin)
POST   /finance/payments         # Record payment
GET    /finance/students/{id}/summary  # Financial summary
```

### **Documents**

```
POST   /documents/upload-url     # Get presigned upload URL
GET    /documents                # List documents
POST   /documents/requests       # Request document
GET    /documents/announcements  # List announcements
POST   /documents/announcements  # Create announcement (admin)
```

### **Support**

```
POST   /support/tickets          # Create ticket
GET    /support/tickets          # List tickets
PUT    /support/tickets/{id}     # Update ticket
POST   /support/tickets/{id}/events  # Add comment
```

### **Dashboard**

```
GET    /dashboard/stats          # Dashboard statistics (admin)
GET    /dashboard/recent-activity  # Recent activity
```

**Total: 60+ endpoints**  
**Full Documentation:** https://academic-portal-api.onrender.com/docs

---

## 🧪 Testing

### **Test Credentials**

**Admin:**

- Username: `admin`
- Password: `admin123`

**Student:**

- Email: `student001@greenwich.edu.vn`
- Password: `Test123!@#`

**Teacher:**

- Email: `teacher001@greenwich.edu.vn`
- Password: `Test123!@#`

### **Running Tests**

**Backend:**

```bash
cd backend
pytest
pytest --cov=app --cov-report=html
```

**Frontend:**

```bash
cd academic-portal-admin
npm test
npm test -- --coverage
```

---

## 🚀 Deployment

### **Backend (Render.com)**

**Current Deployment:**

- URL: https://academic-portal-api.onrender.com
- Region: Singapore
- Auto-deploy from GitHub (main branch)

**Environment Variables:**

```bash
PYTHON_VERSION=3.12.6
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000,https://academic-portal-admin.vercel.app
FIREBASE_CREDENTIALS=/etc/secrets/firebase-credentials.json
APP_ENV=production
```

**Build & Start:**

```bash
# Build
pip install -r requirements.txt

# Start
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### **Database (Render PostgreSQL)**

**Connection String:**

```
postgresql+asyncpg://greenwich_kbjo_user:PASSWORD@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo
```

**Migrations:**

```bash
alembic upgrade head
```

### **Admin Portal (Vercel) - Future**

**Configuration:**

```yaml
Framework: Next.js 15
Build: npm run build
Environment:
  NEXT_PUBLIC_API_BASE_URL: https://academic-portal-api.onrender.com
```

### **Mobile App (App Stores) - Future**

**iOS:**

```bash
eas build -p ios --profile production
eas submit -p ios
```

**Android:**

```bash
eas build -p android --profile production
eas submit -p android
```

---

## 📊 Project Status

**Overall Completion: 75%**

- ✅ Backend API: 95% (deployed)
- ✅ Database: 100% (28 tables)
- ✅ RBAC System: 100% (7 roles)
- 🔨 Admin Portal: 30% (in development)
- 📋 Mobile App: 15% (basic setup)

**See detailed status:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## 🐛 Known Issues

### **Critical:**

- ⚠️ Some endpoints have auth disabled for testing
- ⚠️ No rate limiting on API

### **Medium:**

- ⚠️ Limited test coverage
- ⚠️ No caching layer
- ⚠️ Some N+1 query problems

### **Low:**

- ⚠️ Mobile app incomplete
- ⚠️ Documentation needs updates

---

## 📝 Development Guidelines

### **Code Style**

- Python: PEP 8, Black formatter
- TypeScript: ESLint, Prettier
- Commit messages: Conventional Commits

### **Git Workflow**

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
```

### **Testing**

- Write tests for all new features
- Maintain >80% code coverage
- Test edge cases

---

## 📞 Support

**Documentation:**

- API Docs: https://academic-portal-api.onrender.com/docs
- Technical Architecture: [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
- RBAC System: [RBAC_SYSTEM.md](./RBAC_SYSTEM.md)
- Project Status: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

**Contact:**

- GitHub Issues: https://github.com/DinHill/FinalYearProject/issues
- Email: support@greenwich.edu.vn

---

## 📄 License

This project is developed for educational purposes as part of the Final Year Project at Greenwich University Vietnam.

---

**Last Updated:** October 22, 2025  
**Version:** 1.0  
**Status:** In Active Development
