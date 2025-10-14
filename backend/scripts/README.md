# Database Seeding Scripts

This folder contains scripts to populate your database with test data.

## Scripts

### 1. `seed_data.py` (Basic)

Creates minimal data:

- 4 Campuses
- 3 Majors

### 2. `seed_complete_data.py` (Comprehensive) ⭐ **RECOMMENDED**

Creates complete realistic test data:

- 4 Campuses
- 5 Majors
- 16 Users (1 admin, 10 students, 5 teachers)
- 10 Student records
- 5 Teacher records
- 15 Courses
- ~40 Enrollments
- ~20 Grades
- ~20 Invoices
- ~10 Payments
- ~30 Documents
- ~10 Support Tickets
- 5 Announcements

## How to Run

### Prerequisites

Make sure you have the database URL in your environment.

### For Local Database (Development)

```powershell
cd backend
python scripts/seed_complete_data.py
```

### For Render Database (Production)

```powershell
cd backend
$env:DATABASE_URL="postgresql+asyncpg://greenwich_kbjo_user:D1h4oQ2f1ZN2Y6XFbfN68LxqVvPako5y@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo"
python scripts/seed_complete_data.py
```

## Test Credentials

After seeding, you can log in with these accounts:

**Admin:**

- Email: `admin@greenwich.edu.vn`
- Password: `Test123!@#`

**Student:**

- Email: `john.doe@student.greenwich.edu.vn`
- Password: `Test123!@#`

**Teacher:**

- Email: `robert.williams@teacher.greenwich.edu.vn`
- Password: `Test123!@#`

## Notes

⚠️ **Important:**

- These scripts create test data only
- Use `Test123!@#` as password for all test users
- Do NOT run in production with real user data
- Firebase UIDs are generated randomly for testing

## What Gets Created

### Users & Profiles

- 1 Admin with full system access
- 10 Students (GW2024001-GW2024010) with student profiles
- 5 Teachers with teacher profiles and specializations

### Academic Data

- 15 Courses across different majors
- ~40 Student enrollments in various courses
- ~20 Grades for completed courses
- Realistic GPAs and academic records

### Financial Data

- ~20 Invoices (tuition fees)
- ~10 Payments (for paid invoices)
- Different payment methods and statuses

### Other Data

- ~30 Document records (assignments, transcripts, certificates)
- ~10 Support tickets (various categories and statuses)
- 5 System announcements

## Troubleshooting

### Error: "Module not found"

Make sure you're running from the `backend` directory:

```powershell
cd "d:\Dinh Hieu\Final Year Project\backend"
```

### Error: "Connection refused"

Check your DATABASE_URL is correct and database is accessible.

### Error: "Duplicate key violation"

The database might already have data. You may need to:

1. Clear existing data first
2. Or use different email addresses in the script

## Clean Database (Optional)

To start fresh, you can drop and recreate tables:

```powershell
cd backend
alembic downgrade base
alembic upgrade head
python scripts/seed_complete_data.py
```

## Next Steps

After seeding:

1. Test authentication endpoints at `/docs`
2. Try logging in with test credentials
3. Explore different user roles (admin, student, teacher)
4. Test CRUD operations on various endpoints
5. Connect your mobile app to the seeded data
