# 🏗️ Academic Portal - Complete Technical Architecture

**Project:** Greenwich Academic Portal System  
**Last Updated:** October 18, 2025  
**Status:** 🚧 In Development (30% Complete)

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Deep Dive](#backend-deep-dive)
6. [Frontend Deep Dive](#frontend-deep-dive)
7. [Mobile App](#mobile-app)
8. [Authentication Flow](#authentication-flow)
9. [API Communication](#api-communication)
10. [Database Design](#database-design)
11. [Deployment Architecture](#deployment-architecture)
12. [Development Workflow](#development-workflow)
13. [Features Roadmap](#features-roadmap)
14. [Security & Performance](#security--performance)

---

## 🌐 System Overview

### What We're Building

**A comprehensive academic management system for Greenwich Vietnam University with 4 campuses (Hanoi, Da Nang, Can Tho, Saigon) across 3 platforms:**

```
┌─────────────────────────────────────────────────────────┐
│                   ACADEMIC PORTAL SYSTEM                │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │  Admin Web  │ │  Student  │ │  Teacher    │
    │  (Next.js)  │ │  Mobile   │ │  Mobile     │
    │  Desktop    │ │  (React   │ │  (React     │
    │  Browser    │ │  Native)  │ │  Native)    │
    └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │  FastAPI    │
                    │  Backend    │
                    │  (Python)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  Database   │
                    └─────────────┘
```

### User Personas

1. **Admins** (Admin Web)

   - Super Admin: Full system access
   - Academic Admin: Manage courses, schedules, enrollments
   - Finance Admin: Handle invoices, payments, fees
   - Support Admin: Manage tickets, document requests
   - Content Admin: Post announcements, manage documents

2. **Students** (Mobile App)

   - View schedules, grades, attendance
   - Enroll in courses
   - Pay tuition fees
   - Request documents (transcripts, certificates)
   - Chat with teachers/staff
   - Submit support tickets

3. **Teachers** (Mobile App)
   - Manage course sections
   - Mark attendance
   - Grade assignments
   - Post announcements
   - Chat with students
   - View class rosters

---

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                 │
├─────────────────────┬────────────────────┬──────────────────────────────┤
│   Admin Web         │  Student Mobile    │  Teacher Mobile              │
│   (Next.js 15)      │  (React Native)    │  (React Native)              │
│                     │                    │                              │
│   - TypeScript      │  - Expo            │  - Expo                      │
│   - Tailwind CSS    │  - Firebase Auth   │  - Firebase Auth             │
│   - shadcn/ui       │  - AsyncStorage    │  - AsyncStorage              │
│   - React Query     │  - Push Notif      │  - Push Notif                │
│                     │                    │                              │
│   localhost:3000    │  iOS/Android       │  iOS/Android                 │
└──────────┬──────────┴────────────┬───────┴───────────┬──────────────────┘
           │                       │                   │
           │   HTTPS/JSON         │   HTTPS/JSON      │
           │                       │                   │
┌──────────▼───────────────────────▼───────────────────▼──────────────────┐
│                         API GATEWAY LAYER                               │
│                    (FastAPI + CORS + Middleware)                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          APPLICATION LAYER                              │
│                           (FastAPI Routers)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │  Users   │ │ Academic │ │ Finance  │ │Documents │   │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router  │   │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘   │
│        │            │            │            │            │          │
│  ┌─────▼────────────▼────────────▼────────────▼────────────▼──────┐  │
│  │                    Business Logic Layer                         │  │
│  │  - Username Generator   - Enrollment Service                    │  │
│  │  - GPA Calculator       - Auth Service                          │  │
│  │  - PDF Generator        - Email Service (future)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                          DATA ACCESS LAYER                              │
│                      (SQLAlchemy 2.x Async ORM)                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         DATABASE LAYER                                  │
│                    PostgreSQL (22 Tables)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Users  │ Courses │ Enrollments │ Grades │ Invoices │ Payments │ ...  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│  Firebase Auth   │  Cloudinary/GCS  │  Payment Gateway (Future)         │
│  - User tokens   │  - File storage  │  - VNPay, Momo, ZaloPay          │
│  - Custom claims │  - Documents     │                                   │
└──────────────────┴──────────────────┴───────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend (FastAPI + Python)

```yaml
Framework: FastAPI 0.100+
Language: Python 3.13
Runtime: Async/Await (uvicorn ASGI server)

Core Dependencies:
  - SQLAlchemy 2.x: ORM with async support
  - Alembic: Database migrations
  - Pydantic v2: Data validation and serialization
  - python-jose: JWT token handling
  - passlib: Password hashing (bcrypt)
  - firebase-admin: Firebase integration
  - python-multipart: File upload handling

Database:
  - Production: PostgreSQL 14+ (Render)
  - Development: PostgreSQL (local)

File Storage:
  - Cloudinary: Document/image storage
  - GCS (Google Cloud Storage): Alternative option

Testing:
  - pytest: Unit/integration tests
  - pytest-asyncio: Async test support
  - httpx: Async HTTP client for tests
```

### Frontend - Admin Web (Next.js)

```yaml
Framework: Next.js 15.5.3 (App Router)
Language: TypeScript 5.x
Build Tool: Turbopack (development)
Styling: Tailwind CSS 3.x

Core Dependencies:
  - React 19: UI library
  - shadcn/ui: Component library
  - lucide-react: Icon library
  - @tanstack/react-query: Server state management
  - axios: HTTP client
  - react-hook-form: Form handling
  - zod: Schema validation
  - recharts: Charts/analytics

Dev Server: http://localhost:3000
Production: Vercel (future deployment)
```

### Frontend - Mobile Apps (React Native)

```yaml
Framework: React Native + Expo
Language: TypeScript
Navigation: React Navigation 6.x

Core Dependencies:
  - Expo SDK: Device APIs, push notifications
  - Firebase: Authentication
  - AsyncStorage: Local data persistence
  - React Query: Server state
  - NativeWind: Tailwind for React Native

Platforms: iOS + Android
Build: EAS Build (Expo Application Services)
```

---

## 📁 Project Structure

```
FinalYearProject/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── core/                    # Core configurations
│   │   │   ├── settings.py          # Environment config
│   │   │   ├── database.py          # DB connection
│   │   │   ├── security.py          # Auth utilities
│   │   │   ├── firebase.py          # Firebase integration
│   │   │   └── exceptions.py        # Custom exceptions
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── user.py              # User, Campus, Major
│   │   │   ├── academic.py          # Course, Enrollment, Grade
│   │   │   ├── finance.py           # Invoice, Payment
│   │   │   ├── document.py          # Document, Announcement
│   │   │   └── communication.py     # Chat, Ticket
│   │   ├── schemas/                 # Pydantic schemas
│   │   │   ├── user.py              # User DTOs
│   │   │   ├── academic.py          # Academic DTOs
│   │   │   ├── finance.py           # Finance DTOs
│   │   │   └── base.py              # Common schemas
│   │   ├── routers/                 # API endpoints
│   │   │   ├── auth.py              # Authentication
│   │   │   ├── users.py             # User management
│   │   │   ├── academic.py          # Courses, enrollments
│   │   │   ├── finance.py           # Invoices, payments
│   │   │   ├── documents.py         # Documents, announcements
│   │   │   ├── support.py           # Support tickets
│   │   │   └── dashboard.py         # Admin dashboard
│   │   ├── services/                # Business logic
│   │   │   ├── username_generator.py
│   │   │   ├── enrollment_service.py
│   │   │   ├── gpa_service.py
│   │   │   ├── auth_service.py
│   │   │   └── pdf_service.py
│   │   └── utils/                   # Utilities
│   ├── migrations/                  # Alembic migrations
│   │   ├── versions/                # Migration files
│   │   └── env.py                   # Alembic config
│   ├── tests/                       # Test suite
│   ├── scripts/                     # Utility scripts
│   ├── .env                         # Environment variables
│   ├── alembic.ini                  # Alembic configuration
│   ├── requirements.txt             # Python dependencies
│   └── README.md
│
├── academic-portal-admin/           # Next.js Admin Web
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── page.tsx             # Home page
│   │   │   ├── login/               # Login page
│   │   │   ├── dashboard/           # Dashboard
│   │   │   ├── users/               # Users management
│   │   │   ├── courses/             # Courses management
│   │   │   ├── finance/             # Finance management
│   │   │   └── ...                  # Other features
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Breadcrumb.tsx
│   │   │   └── features/            # Feature components
│   │   ├── lib/                     # Utilities
│   │   │   ├── api.ts               # API client
│   │   │   ├── auth.ts              # Auth helpers
│   │   │   └── utils.ts             # Helper functions
│   │   ├── hooks/                   # Custom React hooks
│   │   └── types/                   # TypeScript types
│   ├── public/                      # Static assets
│   ├── .env.local                   # Environment variables
│   ├── next.config.js               # Next.js config
│   ├── tailwind.config.js           # Tailwind config
│   ├── tsconfig.json                # TypeScript config
│   └── package.json
│
├── academic-portal-app/             # React Native Mobile App
│   ├── app/                         # Expo Router
│   ├── src/
│   │   ├── components/              # React Native components
│   │   ├── screens/                 # App screens
│   │   ├── navigation/              # Navigation config
│   │   ├── services/                # API services
│   │   ├── context/                 # React Context
│   │   └── utils/                   # Utilities
│   ├── assets/                      # Images, fonts
│   ├── app.json                     # Expo config
│   └── package.json
│
├── BACKEND_OVERVIEW.md              # API documentation
├── TECHNICAL_ARCHITECTURE.md        # This file
└── README.md                        # Project README
```

---

## 🔧 Backend Deep Dive

### FastAPI Application Structure

#### 1. **Main Application** (`app/main.py`)

```python
"""
Entry point of the FastAPI application
Responsibilities:
- Initialize FastAPI app
- Configure CORS middleware
- Setup exception handlers
- Register all routers
- Lifespan management (startup/shutdown)
"""

Key Features:
✅ Async context manager for startup/shutdown
✅ Firebase initialization on startup
✅ Database connection pooling
✅ CORS configuration from environment
✅ Global exception handling
✅ Request logging middleware
✅ Auto-generated OpenAPI docs at /docs
```

#### 2. **Core Configuration** (`app/core/`)

**settings.py** - Environment Configuration

```python
"""
Pydantic Settings management
Loads from .env file and environment variables
"""

Settings:
- APP_NAME, APP_VERSION, APP_ENV
- DATABASE_URL (PostgreSQL connection string)
- SECRET_KEY (JWT signing)
- CORS_ORIGINS (comma-separated allowed origins)
- FIREBASE_CREDENTIALS (path to service account JSON)
- CLOUDINARY/GCS credentials
- LOG_LEVEL, DEBUG mode
```

**database.py** - Database Connection

```python
"""
SQLAlchemy async engine and session management
Uses connection pooling for performance
"""

Features:
✅ Async engine (asyncpg driver)
✅ Session factory with context manager
✅ get_db() dependency for FastAPI routes
✅ Automatic session cleanup
```

**security.py** - Authentication & Authorization

```python
"""
Authentication utilities
Supports both Firebase tokens and JWT tokens
"""

Functions:
- hash_password() - Bcrypt password hashing
- verify_password() - Password verification
- create_access_token() - JWT token generation
- decode_token() - JWT token validation
- verify_firebase_token() - Firebase ID token validation
- require_roles([roles]) - Role-based access control
- require_permissions([perms]) - Permission checks
```

**firebase.py** - Firebase Integration

```python
"""
Firebase Admin SDK integration
"""

Features:
✅ Initialize Firebase app with service account
✅ Verify Firebase ID tokens
✅ Create Firebase users programmatically
✅ Set custom claims (role, campus_id, etc.)
✅ Delete Firebase users
```

#### 3. **Models Layer** (`app/models/`)

**SQLAlchemy Models with Relationships**

Base Model (all models inherit):

```python
class BaseModel:
    id: int (primary key)
    created_at: datetime
    updated_at: datetime
```

Model Categories:

- **User Models:** User, Campus, Major, DeviceToken
- **Academic Models:** Semester, Course, CourseSection, Enrollment, Grade, Attendance
- **Finance Models:** FeeStructure, Invoice, Payment
- **Document Models:** Document, DocumentRequest, Announcement
- **Communication Models:** ChatRoom, SupportTicket, TicketEvent

All models use:
✅ Proper foreign keys with indexes
✅ Enum types for status fields
✅ Relationships with lazy loading
✅ CASCADE delete where appropriate

````

#### 4. **Schemas Layer** (`app/schemas/`)

**Pydantic Models for Request/Response Validation**

```python
# Request schemas (input)
UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole
    campus_id: int
    ...

# Response schemas (output)
UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    campus: CampusResponse
    ...

    class Config:
        from_attributes = True  # SQLAlchemy ORM mode

# Pagination wrapper
PaginatedResponse[T]:
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
````

#### 5. **Routers Layer** (`app/routers/`)

**API Endpoints organized by domain**

Each router handles:
✅ Request validation (Pydantic schemas)
✅ Authentication/authorization (Depends)
✅ Database operations (async SQLAlchemy)
✅ Response formatting (Pydantic schemas)
✅ Error handling (try/catch with custom exceptions)

Example router structure:

```python
router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,                    # Request body
    current_user: Dict = Depends(require_roles(["admin"])),  # Auth
    db: AsyncSession = Depends(get_db)        # Database
) -> UserResponse:
    # Business logic here
    return UserResponse.from_orm(db_user)
```

#### 6. **Services Layer** (`app/services/`)

**Reusable business logic components**

```python
UsernameGenerator:
    - generate_student_username()
      Format: {Major}{Campus}{Year}{Seq} (e.g., GCD210101)
    - generate_teacher_username()
      Format: {Campus}T{Seq} (e.g., HT001)
    - generate_email()
      Format: {username}@greenwich.edu.vn

EnrollmentService:
    - check_enrollment_conflicts()
    - validate_prerequisites()
    - calculate_credit_limits()

GPAService:
    - calculate_semester_gpa()
    - calculate_cumulative_gpa()
    - determine_academic_standing()

AuthService:
    - register_user()
    - login_user()
    - refresh_token()
```

#### 7. **Database Migrations** (`migrations/`)

**Alembic for database schema versioning**

```bash
# Create new migration
alembic revision --autogenerate -m "Add user_roles table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# View history
alembic history
```

Current migrations:
✅ Initial schema (22 tables)
✅ Seed data (campuses, majors, test users)

Future migrations (needed):
⏳ Add RBAC tables (roles, permissions, role_permissions, user_roles)
⏳ Add audit_logs table
⏳ Add notification preferences

---

## 🎨 Frontend Deep Dive

### Admin Web (Next.js)

#### 1. **Next.js App Router** (`src/app/`)

```
app/
├── layout.tsx                 # Root layout (Sidebar + Header)
├── page.tsx                   # Home page (redirects to dashboard)
├── login/
│   └── page.tsx              # Login page
├── dashboard/
│   └── page.tsx              # Admin dashboard (stats)
├── users/
│   ├── page.tsx              # Users list table
│   ├── [id]/
│   │   └── page.tsx          # User detail/edit
│   └── new/
│       └── page.tsx          # Create new user
├── courses/
│   └── page.tsx              # Courses management
├── finance/
│   └── page.tsx              # Finance management
└── ...
```

Features:
✅ File-based routing
✅ Server components (RSC) for initial load
✅ Client components ('use client') for interactivity
✅ Layouts for consistent UI structure
✅ Loading states (loading.tsx)
✅ Error boundaries (error.tsx)

#### 2. **API Client** (`src/lib/api.ts`)

```typescript
/**
 * Centralized API client using fetch
 * All backend communication goes through here
 */

class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Generic request method
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response);
    }

    return response.json();
  }

  // User endpoints
  async getUsers(params: UsersQuery): Promise<PaginatedResponse<User>> {
    return this.request(`/api/v1/users?${queryString(params)}`);
  }

  async createUser(data: UserCreate): Promise<User> {
    return this.request("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ... more methods for each endpoint
}

export const api = new ApiClient();
```

#### 3. **State Management**

**React Query for Server State**

```typescript
// In component:
const { data, isLoading, error } = useQuery({
  queryKey: ["users", page, filters],
  queryFn: () => api.getUsers({ page, ...filters }),
});

// Mutations:
const mutation = useMutation({
  mutationFn: (userData: UserCreate) => api.createUser(userData),
  onSuccess: () => {
    queryClient.invalidateQueries(["users"]);
  },
});
```

**React Context for Auth State**

```typescript
// AuthContext.tsx
export const AuthContext = createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { ... },
  logout: () => { ... },
});
```

#### 4. **Component Structure**

```
components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── layout/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Header.tsx            # Top header with user menu
│   └── Breadcrumb.tsx        # Page breadcrumbs
└── features/
    ├── users/
    │   ├── UsersTable.tsx    # Data table
    │   ├── UserForm.tsx      # Create/edit form
    │   ├── UserFilters.tsx   # Search/filter UI
    │   └── DeleteUserDialog.tsx
    └── dashboard/
        ├── StatCard.tsx
        └── RecentActivity.tsx
```

#### 5. **Data Flow Example: Users Management**

```
User clicks "Users" in sidebar
      ↓
Navigate to /users
      ↓
UsersPage component loads
      ↓
useQuery hook fetches data from API
      ↓
api.getUsers() makes request to:
  GET https://academic-portal-api.onrender.com/api/v1/users?page=1&limit=20
      ↓
Backend validates auth token
      ↓
Backend queries PostgreSQL
      ↓
Backend returns JSON response
      ↓
React Query caches the data
      ↓
UsersTable renders with data
      ↓
User clicks "Create User" button
      ↓
Modal opens with UserForm
      ↓
User fills form and submits
      ↓
useMutation hook sends data to API
      ↓
api.createUser() makes request to:
  POST https://academic-portal-api.onrender.com/api/v1/users
      ↓
Backend creates user in database
Backend creates Firebase user
      ↓
Backend returns created user
      ↓
React Query invalidates cache
      ↓
useQuery refetches users list
      ↓
Table updates with new user
```

### Mobile App (React Native)

**Similar architecture to admin web, but with:**

- Expo Router for navigation
- Firebase Authentication directly (no admin-login)
- AsyncStorage for local persistence
- Push notifications via Expo
- Native components (View, Text, ScrollView, etc.)
- Gestures and animations

---

## 🔐 Authentication Flow

### Admin Login Flow (Admin Web → Backend)

```
1. User enters username + password in admin web
   ↓
2. POST /api/v1/auth/admin-login
   Body: { username, password }
   ↓
3. Backend verifies username exists in database
   ↓
4. Backend checks password_hash with bcrypt
   ↓
5. Backend generates JWT token with payload:
   {
     uid: user.id,
     email: user.email,
     role: user.role,
     campus_id: user.campus_id,
     exp: timestamp + 30 days
   }
   ↓
6. Backend returns:
   {
     access_token: "eyJhbGc...",
     token_type: "bearer",
     user: { id, username, email, role, ... }
   }
   ↓
7. Frontend stores token in localStorage
   ↓
8. Frontend stores user in React Context
   ↓
9. Frontend redirects to /dashboard
   ↓
10. All subsequent requests include header:
    Authorization: Bearer eyJhbGc...
```

### Student/Teacher Login Flow (Mobile → Firebase → Backend)

```
1. User enters email + password in mobile app
   ↓
2. Firebase Authentication (client-side)
   firebase.auth().signInWithEmailAndPassword(email, password)
   ↓
3. Firebase returns ID token
   ↓
4. Mobile app stores token in AsyncStorage
   ↓
5. Mobile app calls backend to get profile:
   GET /api/v1/auth/me
   Header: Authorization: Bearer {firebase_id_token}
   ↓
6. Backend verifies Firebase token
   ↓
7. Backend looks up user by firebase_uid
   ↓
8. Backend returns user profile
   ↓
9. Mobile app stores profile in Context
   ↓
10. All subsequent requests include Firebase token
```

### Token Validation in Backend

```python
async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Supports BOTH Firebase tokens and JWT tokens
    """
    token = credentials.credentials

    # Try JWT first (for admin web)
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded
    except:
        pass

    # Try Firebase token (for mobile app)
    try:
        decoded = FirebaseService.verify_id_token(token)
        return decoded
    except:
        raise HTTPException(401, "Invalid token")
```

---

## 🌐 API Communication

### Request/Response Flow

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│   Mobile)   │
└──────┬──────┘
       │
       │ 1. HTTP Request
       │    Method: GET/POST/PUT/DELETE
       │    Headers: Authorization, Content-Type
       │    Body: JSON (if POST/PUT)
       │
       ▼
┌─────────────┐
│   FastAPI   │
│   Server    │
└──────┬──────┘
       │
       │ 2. CORS Middleware Check
       │    ✓ Verify origin allowed
       │
       │ 3. Request Logging Middleware
       │    📝 Log request details
       │
       │ 4. Route to appropriate handler
       │    Match URL path to router
       │
       │ 5. Authentication (if required)
       │    ✓ Verify token
       │    ✓ Extract user info
       │
       │ 6. Authorization (if required)
       │    ✓ Check user role/permissions
       │
       │ 7. Request Validation
       │    ✓ Validate with Pydantic schema
       │
       │ 8. Business Logic
       │    - Query database
       │    - Process data
       │    - Call services
       │
       │ 9. Response Serialization
       │    ✓ Convert to Pydantic schema
       │    ✓ Serialize to JSON
       │
       │ 10. HTTP Response
       │     Status: 200/201/400/401/403/404/500
       │     Headers: Content-Type, etc.
       │     Body: JSON
       │
       ▼
┌─────────────┐
│   Client    │
│  (Receives  │
│  Response)  │
└─────────────┘
```

### API Endpoints Summary

**Base URL:** `https://academic-portal-api.onrender.com/api/v1`

| Module         | Endpoints      | Count        |
| -------------- | -------------- | ------------ |
| Authentication | `/auth/*`      | 6 endpoints  |
| Users          | `/users/*`     | 7 endpoints  |
| Academic       | `/academic/*`  | 12 endpoints |
| Finance        | `/finance/*`   | 7 endpoints  |
| Documents      | `/documents/*` | 9 endpoints  |
| Support        | `/support/*`   | 7 endpoints  |
| Dashboard      | `/dashboard/*` | 2 endpoints  |
| Admin DB       | `/admin/db/*`  | 4 endpoints  |

**Total: 54 endpoints** (more to be added)

### Error Handling

**Standard Error Response Format:**

```json
{
  "code": "VALIDATION_ERROR",
  "detail": "Invalid email format",
  "timestamp": "2025-10-18T10:30:00Z",
  "path": "/api/v1/users"
}
```

**HTTP Status Codes Used:**

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate username, etc.)
- 422: Unprocessable Entity (Pydantic validation)
- 500: Internal Server Error

---

## 💾 Database Design

### Schema Overview (22 Tables)

```sql
-- User Management
users (6 tables):
  - users: Main user records
  - campuses: University locations
  - majors: Academic programs
  - username_sequences: Username generation tracking
  - student_sequences: Student ID generation
  - device_tokens: Push notification tokens

-- Academic Management
academic (8 tables):
  - semesters: Academic terms
  - courses: Course catalog
  - course_sections: Course offerings
  - schedules: Class times/rooms
  - enrollments: Student registrations
  - assignments: Course assignments
  - grades: Student scores
  - attendance: Attendance records

-- Finance Management
finance (4 tables):
  - fee_structures: Tuition templates
  - invoices: Student bills
  - invoice_lines: Invoice items
  - payments: Payment records

-- Document Management
documents (3 tables):
  - documents: File records
  - document_requests: Student requests
  - announcements: System notices

-- Communication
communication (4 tables):
  - chat_rooms: Chat groups
  - chat_participants: Room members
  - support_tickets: Help tickets
  - ticket_events: Ticket history

-- Future (RBAC)
rbac (4 tables - to be added):
  - roles: System roles
  - permissions: Granular permissions
  - role_permissions: Role-permission mapping
  - user_roles: User-role assignment with campus scope
```

### Key Relationships

```
User ─────< Enrollment >───── CourseSection
  │                              │
  │                              └───── Course
  │                              │
  │                              └───── Semester
  │
  ├────< Grade >───── Assignment ─── CourseSection
  │
  ├────< Attendance >───── CourseSection
  │
  ├────< Invoice >───── Semester
  │         │
  │         └───< InvoiceLine
  │         │
  │         └───< Payment
  │
  ├────< DocumentRequest
  │
  ├────< SupportTicket >───< TicketEvent
  │
  ├────< ChatParticipant >───── ChatRoom
  │
  ├───── Campus
  │
  └───── Major
```

### Indexing Strategy

```sql
-- Primary keys (all tables)
CREATE INDEX idx_{table}_id ON {table}(id);

-- Foreign keys (for joins)
CREATE INDEX idx_users_campus_id ON users(campus_id);
CREATE INDEX idx_users_major_id ON users(major_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_section_id ON enrollments(section_id);

-- Frequently queried fields
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Composite indexes for common queries
CREATE INDEX idx_attendance_section_student_date
  ON attendance(section_id, student_id, attendance_date);
```

---

## 🚀 Deployment Architecture

### Current Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         │               │               │
┌────────▼────────┐ ┌───▼───────┐ ┌────▼─────────┐
│  Admin Web      │ │  Backend  │ │  Mobile Apps │
│  (Vercel)       │ │  (Render) │ │  (App Store/ │
│  FUTURE         │ │  LIVE NOW │ │  Play Store) │
│                 │ │           │ │  FUTURE      │
│  Next.js App    │ │  FastAPI  │ │  React       │
│  Hosted on      │ │  Python   │ │  Native      │
│  Vercel         │ │  3.13     │ │  with Expo   │
│  CDN            │ │           │ │              │
│                 │ │  Auto-    │ │              │
│  Currently:     │ │  Deploy   │ │  Currently:  │
│  localhost:3000 │ │  from     │ │  localhost:  │
│                 │ │  GitHub   │ │  19006       │
└─────────────────┘ └─────┬─────┘ └──────────────┘
                          │
                          │ PostgreSQL
                          │ Connection
                          │
                  ┌───────▼──────────┐
                  │   PostgreSQL DB  │
                  │   (Render)       │
                  │                  │
                  │  - Database:     │
                  │    greenwich_kbjo│
                  │  - 22 Tables     │
                  │  - Seeded Data   │
                  └──────────────────┘
```

### Backend Deployment (Render)

**Service Details:**

- **URL:** https://academic-portal-api.onrender.com
- **Type:** Web Service
- **Region:** Singapore (Asia-Pacific)
- **Instance:** Free tier (will sleep after 15min inactivity)
- **Auto-Deploy:** Enabled from GitHub main branch

**Environment Variables on Render:**

```bash
PYTHON_VERSION=3.13.0
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,https://academic-portal-admin.vercel.app
FIREBASE_CREDENTIALS=/etc/secrets/firebase-credentials.json
APP_ENV=production
LOG_LEVEL=INFO
```

**Build Command:**

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

**Start Command:**

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Health Check:**

- Endpoint: `GET /api/health`
- Response: `{"status": "healthy"}`

**Deployment Flow:**

```
1. Developer pushes code to GitHub (main branch)
   ↓
2. GitHub webhook triggers Render
   ↓
3. Render pulls latest code
   ↓
4. Render runs build command (pip install)
   ↓
5. Render runs database migrations (alembic upgrade head)
   ↓
6. Render starts uvicorn server
   ↓
7. Health check passes
   ↓
8. New version goes live (zero-downtime)
   ↓
9. Old instance shuts down
```

**Rollback:**

- Can rollback to previous deployment in Render dashboard
- Typically automatic if health check fails

### Database Deployment (Render PostgreSQL)

**Database Details:**

- **Name:** greenwich_kbjo
- **Type:** PostgreSQL 14
- **Region:** Singapore
- **Backups:** Daily automatic backups
- **Connection:** Internal network (fast) + external access for dev

**Connection Strings:**

```bash
# Internal (from Render services)
postgresql+asyncpg://user:pass@host:5432/greenwich_kbjo

# External (for local development)
postgresql://user:pass@host:5432/greenwich_kbjo
```

**Migration Strategy:**

```bash
# Local development
alembic upgrade head

# Production (automatic on deploy)
# Render runs migrations before starting server
```

### Frontend Deployment

**Admin Web (Future - Vercel):**

```yaml
Platform: Vercel
Framework: Next.js 15
Build: npm run build
Output: .next/
CDN: Global Edge Network
SSL: Automatic HTTPS

Environment Variables:
  NEXT_PUBLIC_API_BASE_URL: https://academic-portal-api.onrender.com
  NEXT_PUBLIC_APP_ENV: production

Deploy Trigger: Push to main branch
```

**Mobile App (Future - App Stores):**

```yaml
iOS:
  Platform: Apple App Store
  Build: EAS Build (Expo)
  Distribution: TestFlight → Production

Android:
  Platform: Google Play Store
  Build: EAS Build (Expo)
  Distribution: Internal Testing → Production
```

---

## 🔄 Development Workflow

### Local Development Setup

**1. Backend Setup:**

```bash
# Clone repository
git clone https://github.com/DinHill/FinalYearProject.git
cd FinalYearProject/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your local database credentials

# Run migrations
alembic upgrade head

# Seed database (optional)
python scripts/seed_data.py

# Start development server
uvicorn app.main:app --reload --port 8000
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

**2. Admin Web Setup:**

```bash
cd academic-portal-admin

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
# App available at http://localhost:3000
```

**3. Mobile App Setup:**

```bash
cd academic-portal-app

# Install dependencies
npm install

# Start Expo development server
npx expo start
# Scan QR code with Expo Go app
```

### Git Workflow

```
main (production)
  │
  ├─── feature/user-management
  │         └─── Working on users page
  │
  ├─── feature/dashboard-stats
  │         └─── Completed, merged
  │
  └─── feature/rbac-system
            └─── To be created
```

**Branching Strategy:**

```bash
# Create feature branch
git checkout -b feature/user-management

# Work on feature, commit often
git add .
git commit -m "feat: Add users table component"

# Push to GitHub
git push origin feature/user-management

# Create Pull Request on GitHub
# Review code
# Merge to main

# Delete feature branch
git branch -d feature/user-management
```

**Commit Message Convention:**

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code formatting
refactor: Code refactoring
test: Add tests
chore: Build/config changes
```

### Testing Strategy

**Backend Tests (pytest):**

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_users.py

# Run with coverage
pytest --cov=app --cov-report=html

# Test structure:
tests/
├── conftest.py              # Shared fixtures
├── test_auth.py            # Auth endpoint tests
├── test_users.py           # Users endpoint tests
├── test_academic.py        # Academic endpoint tests
└── ...
```

**Frontend Tests (Jest + React Testing Library):**

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Test structure:
src/
├── components/
│   └── UsersTable.test.tsx
├── hooks/
│   └── useAuth.test.ts
└── lib/
    └── api.test.ts
```

---

## 📈 Features Roadmap

### Phase 1: Foundation (✅ COMPLETED - Week 1-2)

- [x] Project setup (backend, frontend, mobile)
- [x] Database schema design (22 tables)
- [x] Database migrations with Alembic
- [x] Database seeding with test data
- [x] Authentication system (Firebase + JWT)
- [x] Basic API endpoints (60+ routes)
- [x] Deployment to Render (backend + database)

### Phase 2: Admin Web Core (🚧 IN PROGRESS - Week 3-4)

- [x] Admin web layout (Sidebar, Header, Breadcrumb)
- [x] Dashboard with real statistics ✅
- [-] Users management (CRUD) 🔨 Current Work
- [ ] Login flow with JWT
- [ ] Protected routes
- [ ] Error handling and loading states

### Phase 3: RBAC System (⏳ NEXT - Week 5)

- [ ] Design RBAC database tables (4 tables)
- [ ] Create Alembic migration
- [ ] Seed default roles and permissions
- [ ] Update security middleware
- [ ] Update all endpoints with permission checks
- [ ] Frontend permission-based UI
- [ ] Admin role assignment UI

### Phase 4: Admin Web Features (Week 6-10)

- [ ] Academic Management (Week 6)
  - [ ] Courses CRUD
  - [ ] Semesters management
  - [ ] Course sections
  - [ ] Schedules
  - [ ] Enrollments
- [ ] Announcements System (Week 7)
  - [ ] Rich text editor
  - [ ] Category/priority
  - [ ] Campus/major targeting
  - [ ] Scheduling
- [ ] Documents Management (Week 7)
  - [ ] File upload UI
  - [ ] Document requests workflow
  - [ ] Approval/rejection
  - [ ] Document library
- [ ] Fee & Finance (Week 8)
  - [ ] Fee structures
  - [ ] Invoice generation
  - [ ] Payment tracking
  - [ ] Financial reports
- [ ] Support Tickets (Week 9)
  - [ ] Ticket list/detail
  - [ ] Assign tickets
  - [ ] Comments/events
  - [ ] Status management
- [ ] Analytics Dashboard (Week 9)
  - [ ] Enrollment charts
  - [ ] Financial overview
  - [ ] Attendance trends
  - [ ] User growth
- [ ] Settings & Configuration (Week 10)
  - [ ] Campus/major management
  - [ ] Semester configuration
  - [ ] System settings
  - [ ] Admin profile

### Phase 5: Mobile App (Week 11-14)

- [ ] Student App Features (Week 11-12)
  - [ ] Login/registration
  - [ ] View schedule
  - [ ] View grades
  - [ ] View attendance
  - [ ] Course enrollment
  - [ ] Pay fees
  - [ ] Request documents
  - [ ] Submit tickets
  - [ ] Chat with teachers
- [ ] Teacher App Features (Week 13-14)
  - [ ] Login
  - [ ] View schedule
  - [ ] Mark attendance
  - [ ] Grade assignments
  - [ ] Post announcements
  - [ ] Chat with students
  - [ ] View class rosters

### Phase 6: Polish & Launch (Week 15-16)

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Monitor and iterate

---

## 🔒 Security & Performance

### Security Measures

**Authentication:**

- ✅ JWT tokens with expiration
- ✅ Firebase token verification
- ✅ Bcrypt password hashing (12 rounds)
- ✅ CORS configuration
- ⏳ Rate limiting (to be added)
- ⏳ Refresh token mechanism (to be added)

**Authorization:**

- ✅ Role-based access control (basic)
- ⏳ Permission-based access control (RBAC)
- ⏳ Campus-scoped access
- ⏳ Audit logging (to be added)

**Data Protection:**

- ✅ HTTPS in production
- ✅ Environment variables for secrets
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS prevention (React auto-escaping)
- ⏳ CSRF protection (to be added)
- ⏳ Input sanitization (to be enhanced)

**File Security:**

- ✅ Pre-signed URLs for uploads
- ✅ File type validation
- ⏳ File size limits (to be enforced)
- ⏳ Virus scanning (to be added)

### Performance Optimizations

**Backend:**

- ✅ Async/await for I/O operations
- ✅ Database connection pooling
- ✅ Indexed database queries
- ⏳ Redis caching (to be added)
- ⏳ Query optimization (N+1 problem)
- ⏳ Pagination on all list endpoints
- ⏳ Background tasks for heavy operations

**Frontend:**

- ✅ React Query for server state caching
- ✅ Code splitting (Next.js automatic)
- ✅ Image optimization (Next.js Image)
- ✅ Lazy loading components
- ⏳ Service worker for offline support
- ⏳ Virtual scrolling for long lists

**Database:**

- ✅ Proper indexes on foreign keys
- ✅ Composite indexes for common queries
- ⏳ Database query monitoring
- ⏳ Slow query optimization
- ⏳ Read replicas (if needed)

---

## 📊 Current Status

### What's Built ✅

- 🟢 **Backend API** - 60+ endpoints, fully functional
- 🟢 **Database** - 22 tables, seeded with test data
- 🟢 **Authentication** - Firebase + JWT working
- 🟢 **Deployment** - Production backend on Render
- 🟢 **Admin Dashboard** - Stats page with real data
- 🟡 **Admin Users Page** - In progress (CORS issue)

### What's Next 🔨

- 🔴 **Fix CORS** - Users endpoint blocked by CORS
- 🔴 **Complete Users Page** - Table, forms, actions
- 🔴 **RBAC System** - 4 tables, permissions
- 🔴 **8 More Admin Features** - Academic, Finance, etc.
- 🔴 **Mobile Apps** - Student and teacher apps

### Progress Metrics

```
Overall Progress:     ██████░░░░░░░░░░░░░░  30%

Backend API:          ████████████████░░░░  80%
Database:             ████████████████████  100%
Admin Web:            ████░░░░░░░░░░░░░░░░  20%
Mobile Apps:          ░░░░░░░░░░░░░░░░░░░░  0%
Testing:              ██░░░░░░░░░░░░░░░░░░  10%
Documentation:        ██████░░░░░░░░░░░░░░  30%
```

---

## 🎯 Immediate Next Steps

### To Continue Development:

1. **Fix CORS Issue** (15 minutes)

   - Add `/api/v1/users` to CORS_ORIGINS on Render
   - Or temporarily disable auth on users endpoint

2. **Complete Users Management** (3 hours)

   - Finish users table with real data
   - Add search and filters
   - Create/edit user modals
   - Delete confirmation
   - Test full CRUD workflow

3. **Implement RBAC** (4 hours)

   - Create 4 database tables
   - Seed roles and permissions
   - Update security middleware
   - Update endpoints
   - Test permissions

4. **Continue with remaining features** (40+ hours)
   - Follow the todo list
   - Build one feature at a time
   - Test after each feature
   - Deploy and iterate

---

## 📞 Questions to Answer

Before we continue building, please clarify:

1. **RBAC Priority**: Do you want to implement full RBAC now, or finish basic features first and add RBAC later?

2. **CORS Issue**: Should we fix the CORS error now for users endpoint, or temporarily disable auth for development?

3. **Feature Priority**: Are you happy with the current feature order in the todo list, or want to adjust?

4. **Development Approach**: Do you prefer to:
   - Build all admin features first, then mobile?
   - Build backend + frontend + mobile for each feature?
   - Focus on one complete workflow at a time?

Let me know and we'll continue! 🚀
