# 🎓 Academic Portal - Final Year Project

A comprehensive academic management system with mobile app, web admin portal, and RESTful API backend.

**Tech Stack:** FastAPI (Python) • Next.js 14 (TypeScript) • React Native (Expo)

---

## 📖 Documentation

**Complete documentation is available in the [`docs/`](./docs/) folder:**

- 📚 **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** - Navigate all documentation
- 🏗️ **[Project Architecture](./docs/PROJECT_ARCHITECTURE.md)** ⭐ **NEW** - Complete technical breakdown
  - 200+ API endpoints across 23 routers
  - 26 admin pages, 15 mobile screens
  - Full tech stack & database schema
- 🚀 **[Getting Started](./docs/GETTING_STARTED.md)** - Setup and installation guide
- 📊 **[System Audit Report](./docs/SYSTEM_AUDIT_REPORT.md)** - Comprehensive system overview
- 🔧 **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- 📝 **[API Reference](./docs/API_ENDPOINTS.md)** - Complete API documentation
- 📋 **[Project Summary](./docs/PROJECT_SUMMARY_FOR_REPORT.md)** - For thesis/report writing

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or SQLite for local development)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/DinHill/FinalYearProject.git
cd FinalYearProject

# Start all services
npm start
```

This will start:

- 🔧 Backend API at http://localhost:8000
- 🌐 Admin Portal at http://localhost:3000

### Stop Services

```bash
npm run stop
```

---

## 📁 Project Structure

```
FinalYearProject/
├── backend/                    # FastAPI Backend (Python)
│   ├── app/                   # Application code
│   ├── requirements.txt       # Python dependencies
│   └── README.md
├── academic-portal-admin/      # Next.js Admin Web Portal
│   ├── src/                   # Source code
│   ├── package.json
│   └── README.md
├── academic-portal-app/        # React Native Mobile App
│   ├── src/                   # Source code
│   ├── package.json
│   └── README.md
├── docs/                       # 📚 All project documentation
├── start-all.ps1              # Start all services
├── stop-all.ps1               # Stop all services
└── README.md                  # This file
```

---

## 🎯 Key Features

### ✅ Backend API (FastAPI)

- 200+ REST API endpoints
- JWT + Firebase authentication
- Role-based access control (RBAC)
- Multi-campus support
- PostgreSQL database

### ✅ Admin Web Portal (Next.js)

- 26 admin pages
- User management (students, teachers, admins)
- Academic management (courses, programs, schedules)
- Finance management (invoices, payments)
- Analytics dashboard

### ✅ Mobile App (React Native)

- Student & teacher interfaces
- Schedule viewing
- Grade checking
- Document access
- Support tickets
- Cross-platform (iOS/Android)

---

## 🔐 Test Credentials

| Role        | Username          | Password     |
| ----------- | ----------------- | ------------ |
| Super Admin | `super_admin`     | `Test123!@#` |
| Student     | `HieuNDGCD220001` | `Test123!@#` |
| Teacher     | `teacher1`        | `Test123!@#` |

---

## 🌐 Live Deployment

- **Backend API:** https://academic-portal-api.onrender.com
- **API Docs:** https://academic-portal-api.onrender.com/docs
- **Status:** ✅ Production Ready (85% complete)

---

## 🛠️ Technology Stack

| Component     | Technologies                              |
| ------------- | ----------------------------------------- |
| **Backend**   | FastAPI, SQLAlchemy, PostgreSQL, Firebase |
| **Admin Web** | Next.js 14, TypeScript, Tailwind CSS      |
| **Mobile**    | React Native, Expo, TypeScript            |
| **Auth**      | Firebase Authentication, JWT              |
| **Database**  | PostgreSQL (Production), SQLite (Dev)     |

---

## 📊 System Statistics

- **Total Endpoints:** 200+
- **Admin Pages:** 26
- **Mobile Screens:** 11
- **Database Tables:** 30+
- **User Roles:** 6 (Super Admin, Academic Admin, Finance Admin, Support Admin, Teacher, Student)
- **Campuses:** Multi-campus support (4 campuses)

---

## 📝 Development

For detailed development instructions, see:

- [Getting Started Guide](./docs/GETTING_STARTED.md)
- [Backend Setup](./backend/README.md)
- [Admin Portal Setup](./academic-portal-admin/README.md)
- [Mobile App Setup](./academic-portal-app/README.md)

---

## 🤝 Contributing

See [Pre-Commit Checklist](./docs/PRE_COMMIT_CHECKLIST.md) for contribution guidelines.

---

## 📄 License

This project is part of a Final Year Project at Greenwich University.

---

## 👨‍💻 Author

**Dinh Hieu**

- GitHub: [@DinHill](https://github.com/DinHill)
- Repository: [FinalYearProject](https://github.com/DinHill/FinalYearProject)

---

**For complete documentation, visit the [`docs/`](./docs/) folder**
