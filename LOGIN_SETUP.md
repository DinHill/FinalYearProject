# 🔐 Login Setup Guide

## ⚠️ Current Issue

Your database is **empty** (0 rows in all tables). You cannot login because there are no user accounts yet.

## ✅ Solution: Create Admin User

### Option 1: Use the Production API (Recommended)

1. **First, check API health:**

```powershell
curl https://academic-portal-api.onrender.com/api/v1/health
```

2. **Create admin user directly in database using PgAdmin or similar:**
   Connect to your Render PostgreSQL database and run:

```sql
INSERT INTO users (
    firebase_uid, username, email, full_name, password_hash,
    role, status, created_at, updated_at
)
VALUES (
    'admin_' || gen_random_uuid(),  -- Generate random Firebase UID
    'admin',
    'admin@greenwich.edu.vn',
    'System Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lkQCjW8fQ6pO', -- This is hashed "admin123"
    'admin',
    'active',
    NOW(),
    NOW()
);
```

### Option 2: Use Python Script (When DATABASE_URL is Set)

1. **Set the production DATABASE_URL:**

```powershell
$env:DATABASE_URL="postgresql+asyncpg://greenwich_kbjo_user:YOUR_PASSWORD@dpg-d3lriijipnbc73a94bu0-a.oregon-postgres.render.com/greenwich_kbjo"
```

2. **Run the create admin script:**

```powershell
cd backend
python scripts\create_admin_sql.py
```

### Option 3: Use Render Dashboard

1. Go to: https://dashboard.render.com
2. Find your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Use the SQL query from Option 1 above

## 🎯 Login Credentials (After Creating Admin)

**Admin Portal** (http://localhost:3000/login):

- Username: `admin`
- Password: `admin123`

## 🔧 What I Fixed

1. ✅ Changed login endpoint from `/api/v1/auth/login` to `/api/v1/auth/admin-login`
2. ✅ Fixed the API proxy configuration
3. ✅ Updated login page to show proper error message

## 📝 Next Steps

After you create the admin user:

1. **Login to admin portal:**

   ```
   http://localhost:3000/login
   ```

2. **Navigate to Users page:**

   ```
   http://localhost:3000/users
   ```

3. **Create more users** through the UI:
   - Click "Add User" button
   - Fill in the form
   - Set role (admin/teacher/student)
   - Assign campus and major

## 🐛 Troubleshooting

**"Not Found" error?**

- ✅ Fixed: API endpoint corrected to `/api/v1/auth/admin-login`

**"Forbidden" error?**

- Database has no admin user yet
- Follow steps above to create one

**"Network error"?**

- Check if API is running: https://academic-portal-api.onrender.com/docs
- Check your internet connection

**"Invalid credentials"?**

- Make sure you created the user with exact password hash above
- Username must be exactly: `admin`
- Case sensitive!

## 💡 For Future Development

To properly seed the database with test data:

1. **Fix the model relationships** (User.grades has ambiguous foreign keys)
2. **Run the complete seed script:**
   ```powershell
   python backend\scripts\seed_complete_data.py
   ```

This will create:

- 1 admin
- 10 students
- 5 teachers
- 4 campuses
- 5 majors
- Sample courses, enrollments, grades, etc.

All test accounts use password: `Test123!@#`
