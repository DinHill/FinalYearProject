# 🚀 Getting Started with Greenwich Academic Portal

**Quick guide to get the project running in 5 minutes!**

---

## ✅ Prerequisites Check

Before starting, make sure you have:

- [ ] **Node.js 18+** installed

  ```powershell
  node --version  # Should show v18.x.x or higher
  ```

- [ ] **Python 3.11+** installed

  ```powershell
  python --version  # Should show Python 3.11.x or higher
  ```

- [ ] **PostgreSQL 16** installed and running

  ```powershell
  psql --version  # Should show psql 16.x
  ```

- [ ] **Git** installed
  ```powershell
  git --version
  ```

---

## 📦 Step 1: Install Dependencies

### Backend Dependencies

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend Dependencies

```powershell
cd academic-portal-admin
npm install
```

---

## 🗄️ Step 2: Setup Local Database

```powershell
cd backend
python setup_complete_local_db.py
```

This will create:

- ✅ Database: `greenwich_local`
- ✅ 35 users (5 admins, 10 teachers, 20 students)
- ✅ 7 roles with RBAC
- ✅ 4 campuses (Hanoi, Da Nang, Can Tho, Ho Chi Minh)
- ✅ 3 majors (Computing, Business, Design)
- ✅ 543 rows of seed data

**Expected Output:**

```
✅ Database reset complete!

📊 Final Statistics:
   👥 Total users: 35
   🎓 Students: 20
   👨‍🏫 Teachers: 10
   👨‍💼 Admins: 5
   🏢 Campuses: 4
   📚 Programs: 9
   ...
```

---

## 🎯 Step 3: Start the Project

### Option A: Start Everything (Recommended)

```powershell
cd "d:\Dinh Hieu\Final Year Project"
npm start
```

This opens 2 PowerShell windows:

- 🔧 **Backend** at http://localhost:8000
- 🌐 **Frontend** at http://localhost:3000

### Option B: Start Manually

**Terminal 1 (Backend):**

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**

```powershell
cd academic-portal-admin
npm run dev
```

---

## 🔑 Step 4: Login & Test

### Open the Admin Portal

Navigate to: http://localhost:3000/login

### Test Accounts

| Role               | Username          | Password     | Campus Access    |
| ------------------ | ----------------- | ------------ | ---------------- |
| **Super Admin**    | `super_admin`     | `Test123!@#` | All Campuses     |
| **Academic Admin** | `academic_admin`  | `Test123!@#` | Hanoi Only       |
| **Finance Admin**  | `finance_admin`   | `Test123!@#` | Da Nang Only     |
| **Content Admin**  | `content_admin`   | `Test123!@#` | All Campuses     |
| **Support Admin**  | `support_admin`   | `Test123!@#` | All Campuses     |
| **Teacher**        | `teacher1`        | `Test123!@#` | Hanoi            |
| **Student**        | `HieuNDGCD220001` | `Test123!@#` | Hanoi, Computing |

### What to Test

1. **Login Flow**

   - Login with `super_admin` / `Test123!@#`
   - You should see the admin dashboard

2. **API Endpoints**

   - Visit http://localhost:8000/docs
   - Try the `/auth/login` endpoint
   - Test with student ID: `HieuNDGCD220001`

3. **RBAC Verification**

   ```powershell
   cd backend
   python check_rbac.py
   ```

   Expected: 35 user-role assignments, 32 campus-specific

4. **User Data Verification**
   ```powershell
   cd backend
   python check_users.py
   ```
   Expected: 35 users with Greenwich ID format

---

## 🛑 Stop the Project

```powershell
npm run stop
```

This will kill all Python and Node processes.

---

## 🔍 Troubleshooting

### Issue: Database Connection Error

**Solution:**

1. Make sure PostgreSQL is running
2. Check credentials in `backend/.env`
3. Verify database exists:
   ```powershell
   psql -U postgres -c "\l" | findstr greenwich_local
   ```

### Issue: Port Already in Use

**Solution:**

```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Virtual Environment Not Activated

**Solution:**

```powershell
cd backend
.\venv\Scripts\Activate.ps1
# You should see (venv) in your prompt
```

### Issue: npm start doesn't work

**Solution:**

```powershell
# Make sure you're in the root directory
cd "d:\Dinh Hieu\Final Year Project"
npm install  # Install root dependencies
npm start
```

---

## 📖 Next Steps

Now that you have the project running:

1. **Explore the API**

   - Visit http://localhost:8000/docs
   - Test different endpoints with different roles
   - Check the authentication flow

2. **Test Campus Scoping**

   - Login as `academic_admin` (Hanoi only)
   - Try to access Da Nang campus data
   - Should be restricted

3. **Check the Database**

   ```powershell
   cd backend
   python check_tables.py  # See all tables
   python check_users.py   # See all users
   python check_rbac.py    # See RBAC setup
   ```

4. **Read the Documentation**
   - [README.md](./README.md) - Project overview
   - [DOCUMENTATION.md](./DOCUMENTATION.md) - Full technical docs
   - [backend/docs/ARCHITECTURE.md](./backend/docs/ARCHITECTURE.md) - System architecture

---

## 🎯 Development Workflow

### Daily Development

```powershell
# 1. Start the project
npm start

# 2. Make changes to code
# Backend auto-reloads on save
# Frontend auto-reloads on save

# 3. Test your changes
# Visit http://localhost:3000

# 4. When done
npm run stop
```

### Reset Database

```powershell
cd backend
python setup_complete_local_db.py
```

### Run Tests

```powershell
cd backend
pytest
```

---

## 🆘 Need Help?

1. Check [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed info
2. Check [backend/docs/TESTING_GUIDE.md](./backend/docs/TESTING_GUIDE.md) for testing
3. Check [backend/API_REFERENCE.md](./backend/API_REFERENCE.md) for API details

---

## ✅ You're All Set!

If you can:

- ✅ Access http://localhost:3000/login
- ✅ Login with `super_admin` / `Test123!@#`
- ✅ See the dashboard
- ✅ Access http://localhost:8000/docs

**Congratulations! You're ready to start developing! 🎉**
