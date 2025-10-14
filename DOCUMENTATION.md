# 📚 Academic Portal - Complete Documentation

## 🏗️ System Architecture

### Technology Stack

- **Backend**: FastAPI (Python 3.13+) + PostgreSQL
- **Admin Portal**: Next.js 14 + TypeScript + Tailwind CSS
- **Mobile App**: React Native + Expo
- **Authentication**: Firebase + JWT
- **Deployment**:
  - Backend API: Render.com (https://academic-portal-api.onrender.com)
  - Database: Render PostgreSQL
  - File Storage: Cloudinary

---

## 📊 Database Schema (26 Tables)

### User Management

- `users` - All users (students, teachers, admin)
- `campuses` - Campus locations
- `majors` - Academic programs
- `username_sequences` - Username generation tracking
- `student_sequences` - Student ID generation
- `device_tokens` - Push notifications

### Academic

- `semesters` - Academic terms
- `courses` - Course catalog
- `course_sections` - Class sections
- `schedules` - Class timetables
- `enrollments` - Student enrollments
- `assignments` - Homework/projects
- `grades` - Student grades
- `attendance` - Attendance records

### Finance

- `fee_structures` - Tuition structures
- `invoices` - Student invoices
- `invoice_lines` - Invoice details
- `payments` - Payment records

### Documents

- `documents` - Document metadata
- `document_requests` - Document requests
- `announcements` - System announcements

### Communication

- `chat_rooms` - Chat rooms
- `chat_participants` - Chat members
- `support_tickets` - Support requests
- `ticket_events` - Ticket history

---

## 🔐 Authentication System

### User Roles

1. **Admin** - Full system access
2. **Student** - Academic portal access
3. **Teacher** - Course management access

### Username Generation

**Student Format**: `[FirstName][LastInitials][UniversityCode][MajorCode][CampusCode][Year][Sequence]`

- Example: `HieuNDGCD220033`
  - Hieu = First name
  - ND = Last name initials (Nguyen Dinh)
  - G = Greenwich
  - C = Computing
  - D = Da Nang
  - 22 = Year 2022
  - 0033 = 33rd student

**Teacher Format**: `[FirstName].[LastName]`

- Example: `john.doe`

### Authentication Flow

1. User logs in with username/password
2. Backend validates credentials
3. JWT token issued (24-hour expiry)
4. Token stored securely
5. Token sent with API requests
6. Backend validates token middleware

---

## 🚀 API Endpoints

### Base URL

- **Production**: https://academic-portal-api.onrender.com
- **Local**: http://localhost:8000

### Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

### Key Endpoints

#### Authentication

```
POST   /api/v1/auth/login           # Student/Teacher login
POST   /api/v1/auth/admin-login     # Admin login
POST   /api/v1/auth/logout          # Logout
GET    /api/v1/auth/me              # Get current user
```

#### Users

```
GET    /api/v1/users                # List all users
GET    /api/v1/users/{id}           # Get user by ID
POST   /api/v1/users                # Create user
PUT    /api/v1/users/{id}           # Update user
DELETE /api/v1/users/{id}           # Delete user
GET    /api/v1/users/students       # List students
GET    /api/v1/users/teachers       # List teachers
```

#### Academic

```
GET    /api/v1/academic/campuses    # List campuses
GET    /api/v1/academic/majors      # List majors
GET    /api/v1/academic/courses     # List courses
GET    /api/v1/academic/enrollments # List enrollments
GET    /api/v1/academic/grades      # Get grades
```

#### Finance

```
GET    /api/v1/finance/invoices     # List invoices
POST   /api/v1/finance/payments     # Create payment
```

#### Admin Database Tools

```
GET    /api/v1/admin/db/tables                      # List all tables
GET    /api/v1/admin/db/tables/{table}/count        # Count rows
GET    /api/v1/admin/db/stats                       # Database statistics
GET    /api/v1/admin/db/tables/{table}/sample       # Sample data
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Python 3.13+
- PostgreSQL (for local dev)
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Admin Portal Setup

```bash
cd academic-portal-admin

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
```

### Mobile App Setup

```bash
cd academic-portal-app

# Install dependencies
npm install

# Start Expo
npx expo start
```

---

## 🌐 Deployment

### Backend (Render.com)

1. **Push to GitHub**

```bash
git add .
git commit -m "Deploy backend"
git push origin main
```

2. **Render auto-deploys** from GitHub

   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app.main:app`
   - Environment variables set in Render dashboard

3. **Database migrations**
   - Automatic via Render build process
   - Alembic runs on each deploy

### Database Connection

**Production PostgreSQL**:

```
Host: dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com
Port: 5432
Database: greenwich_kbjo
User: greenwich_kbjo_user
Password: [Set in Render]
```

**Connection String**:

```
postgresql+asyncpg://greenwich_kbjo_user:PASSWORD@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo
```

---

## 📱 Mobile App Distribution

### Android (APK)

```bash
cd academic-portal-app
eas build -p android --profile production
```

### iOS (TestFlight)

```bash
eas build -p ios --profile production
eas submit -p ios
```

---

## 🧪 Testing

### Test Credentials

**Admin**:

- Username: `admin@greenwich.edu.vn`
- Password: `Test123!@#`

**Student**:

- Username: `john.doe@student.greenwich.edu.vn`
- Password: `Test123!@#`

**Teacher**:

- Username: `robert.williams@teacher.greenwich.edu.vn`
- Password: `Test123!@#`

### Seeding Database

```bash
cd backend
python scripts/seed_complete_data.py
```

This creates:

- 1 admin
- 10 students
- 5 teachers
- 4 campuses
- 5 majors
- 15 courses
- ~40 enrollments
- ~20 grades
- ~20 invoices
- Sample data for all tables

---

## 📦 Project Structure

```
Final Year Project/
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── core/               # Config, database
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── routers/            # API endpoints
│   │   └── services/           # Business logic
│   ├── migrations/             # Alembic migrations
│   ├── scripts/                # Utility scripts
│   └── requirements.txt        # Python dependencies
│
├── academic-portal-admin/       # Next.js Admin Portal
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── academic-portal-app/         # React Native Mobile
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── screens/            # App screens
│   │   ├── navigation/         # Navigation
│   │   └── services/           # API services
│   └── package.json
│
├── README.md                    # Project overview
└── DOCUMENTATION.md            # This file
```

---

## 🔧 Troubleshooting

### Backend Issues

**Port already in use**:

```bash
# Find process
netstat -ano | findstr :8000
# Kill process
taskkill /PID <PID> /F
```

**Database connection failed**:

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check firewall settings

**Import errors**:

```bash
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Node modules issues**:

```bash
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 in use**:

```bash
# Change port in package.json or kill process
```

### Mobile App Issues

**Expo not starting**:

```bash
npx expo start --clear
```

**Build errors**:

```bash
npm run clean
npm install
```

---

## 📞 Support & Contact

For issues or questions:

1. Check this documentation
2. Review API docs at `/docs`
3. Check GitHub issues
4. Contact development team

---

## 📝 Changelog

### v1.0.0 (Current)

- ✅ Complete backend API deployed
- ✅ 26 database tables with migrations
- ✅ Authentication system
- ✅ Admin portal integration
- ✅ Mobile app foundation
- ✅ Comprehensive documentation
- ✅ Production deployment on Render

---

## 🚧 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app deployment to stores
- [ ] Payment gateway integration
- [ ] Email notification system
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Export to PDF/Excel
- [ ] Multi-language support

---

**Last Updated**: October 14, 2025
