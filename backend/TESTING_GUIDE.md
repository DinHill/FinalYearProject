# Firebase Authentication Testing Guide

## 🎯 Goal

Test all API endpoints with proper Firebase authentication using a super_admin test user.

## 📋 Prerequisites

- Python 3.8+ installed
- Backend server running (`uvicorn app.main:app --reload`)
- Firebase project: `final-year-project-ab6b7`

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Firebase Web API Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **final-year-project-ab6b7**
3. Click the ⚙️ gear icon → **Project Settings**
4. Scroll to "Your apps" section or "Web API Key"
5. Copy the **Web API Key**

### Step 2: Generate Test Token

1. Open `get_test_token.py`
2. Replace `YOUR_WEB_API_KEY_HERE` with your actual Web API Key:
   ```python
   FIREBASE_WEB_API_KEY = "AIza..."  # Your actual key
   ```
3. Run the script:
   ```bash
   cd "d:\Dinh Hieu\Final Year Project\backend"
   python get_test_token.py
   ```

**What this does:**

- Creates test user: `test-admin@example.com`
- Sets role: `super_admin` (full access)
- Generates Firebase ID token
- Saves token to `test_token.txt`

### Step 3: Run Tests with Authentication

```bash
python test_endpoints_auth.py
```

**Expected results:**

- ✅ All public endpoints pass (health, docs, etc.)
- ✅ All protected endpoints pass with authentication
- ✅ 100% success rate

## 🔧 Troubleshooting

### Token Expired (after 1 hour)

```bash
python get_test_token.py  # Generate new token
python test_endpoints_auth.py  # Re-run tests
```

### "Web API Key not set" Error

- Make sure you replaced `YOUR_WEB_API_KEY_HERE` in `get_test_token.py`
- The Web API Key looks like: `AIzaSyD...` (39 characters)

### "Cannot connect to server"

- Make sure your backend server is running:
  ```bash
  uvicorn app.main:app --reload
  ```

### "User not found in database" Error

- The test user needs to exist in your PostgreSQL database
- Check if user with `firebase_uid = "test-super-admin-001"` exists
- Or create the user through your admin panel first

## 📝 Test User Details

- **Email:** test-admin@example.com
- **Password:** TestPassword123!
- **UID:** test-super-admin-001
- **Role:** super_admin
- **Campus:** None (cross-campus access)
- **DB User ID:** 1 (update in script if different)

## 🔐 Understanding the Flow

1. **Admin SDK** creates custom token with user claims (roles)
2. **Custom token** is exchanged for **ID token** via Firebase Auth API
3. **ID token** is sent in Authorization header: `Bearer <token>`
4. **Backend** verifies token and extracts user info & roles
5. **RBAC** checks roles and campus access
6. **Endpoint** executes with user context

## 🎓 Next Steps

After testing:

1. ✅ Verify all endpoints return correct data
2. ✅ Check campus filtering works
3. ✅ Test role-based access control
4. 🚀 Ready to deploy!

## 📚 Files Created

- `get_test_token.py` - Token generator
- `test_endpoints_auth.py` - Test runner with auth
- `test_token.txt` - Your ID token (auto-generated)
- `TESTING_GUIDE.md` - This guide
