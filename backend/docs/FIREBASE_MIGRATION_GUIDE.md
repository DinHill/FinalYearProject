# Firebase Authentication Migration Guide

## Overview

This guide describes the migration from JWT-based authentication to Firebase-only authentication for the Academic Portal system.

---

## Current State (Hybrid System)

### Backend

- **Student Login:** Firebase custom tokens (already implemented)
- **Admin/Teacher Login:** JWT tokens (to be migrated)
- **API Authentication:** Accepts both JWT and Firebase tokens

### Issues with Current Approach

1. **Dual Token Systems:** Maintaining two authentication systems adds complexity
2. **Security:** JWT secret management in .env file
3. **Consistency:** Different flows for students vs admin/teachers
4. **Maintenance:** Double the auth code to maintain

---

## Target State (Firebase-Only)

### Backend

- **All Users:** Firebase authentication
- **API Authentication:** Firebase tokens only
- **No JWT:** Remove all JWT generation and verification

### Benefits

1. **Single Auth System:** Firebase manages all authentication
2. **Better Security:** Firebase handles password storage, token management
3. **Consistency:** Same flow for all user types
4. **Less Code:** Remove JWT logic entirely

---

## Implementation Plan

### ✅ Phase 1: Add Firebase Support for Admins (COMPLETED)

#### 1.1 Create Username-to-Email Endpoint

**Status:** ✅ Complete

**Endpoint:** `POST /auth/username-to-email`

```http
POST /api/auth/username-to-email
Content-Type: application/json

{
  "username": "admin.user"
}

Response:
{
  "email": "admin.user@university.edu",
  "full_name": "Admin User"
}
```

**Purpose:** Frontend converts username to email for Firebase login

#### 1.2 Deprecate JWT Endpoint

**Status:** ✅ Complete

- Marked `POST /auth/admin-login` as deprecated
- Added migration instructions in API docs
- Endpoint still works (backward compatible)

---

### ⏳ Phase 2: Frontend Migration (IN PROGRESS)

#### 2.1 Update Admin Portal Login Flow

**Current Flow (JWT):**

```typescript
// Old - JWT based
const response = await fetch("/api/auth/admin-login", {
  method: "POST",
  body: JSON.stringify({
    user_id: username,
    password: password,
  }),
});
const { access_token } = await response.json();
localStorage.setItem("token", access_token);
```

**New Flow (Firebase):**

```typescript
// Step 1: Get email from username
const lookupResponse = await fetch("/api/auth/username-to-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username }),
});
const { email } = await lookupResponse.json();

// Step 2: Sign in with Firebase
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Step 3: Get ID token
const idToken = await userCredential.user.getIdToken();

// Step 4: Use ID token for API calls
localStorage.setItem("firebaseToken", idToken);
```

#### 2.2 Update API Client

**Current:**

```typescript
const token = localStorage.getItem("token");
headers["Authorization"] = `Bearer ${token}`;
```

**New:**

```typescript
import { getAuth } from "firebase/auth";

// Get fresh token for each request
const auth = getAuth();
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  headers["Authorization"] = `Bearer ${token}`;
}
```

**Why Get Fresh Token Each Time:**

- Firebase tokens expire after 1 hour
- `getIdToken()` automatically refreshes if expired
- Ensures requests never fail due to stale token

#### 2.3 Update Login Component

**File:** `academic-portal-admin/src/pages/Login.tsx` (or similar)

```typescript
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Get email from username
      const response = await fetch("/api/auth/username-to-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("User not found");
      }

      const { email } = await response.json();

      // Step 2: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 3: Store user state
      // Firebase SDK handles token storage automatically
      console.log("Logged in:", userCredential.user);

      // Step 4: Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

#### 2.4 Update Protected Routes

```typescript
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

#### 2.5 Testing Checklist

Frontend Testing:

- [ ] Can login with username + password
- [ ] Username-to-email lookup works
- [ ] Firebase authentication succeeds
- [ ] Token is automatically refreshed
- [ ] Protected routes work
- [ ] Logout works
- [ ] Token persists across page refresh
- [ ] API calls include Firebase token
- [ ] API calls work with Firebase token

---

### ⏳ Phase 3: Backend JWT Removal (BREAKING CHANGE)

**Warning:** This phase breaks backward compatibility. Ensure frontend is fully migrated first.

#### 3.1 Remove JWT Generation

**File:** `backend/app/routers/auth.py`

```python
# Delete the entire admin-login endpoint
# Users must use Firebase
```

#### 3.2 Update verify_firebase_token

**File:** `backend/app/core/security.py`

**Current Code:**

```python
async def verify_firebase_token(token: str):
    # Try Firebase verification
    try:
        decoded = firebase_admin.auth.verify_id_token(token)
        return decoded
    except:
        pass

    # Fallback to JWT verification
    try:
        decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return decoded
    except:
        raise HTTPException(401, "Invalid token")
```

**New Code:**

```python
async def verify_firebase_token(token: str):
    """Verify Firebase ID token only"""
    try:
        decoded = firebase_admin.auth.verify_id_token(token)
        return decoded
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(401, "Invalid Firebase token")
    except firebase_admin.auth.ExpiredIdTokenError:
        raise HTTPException(401, "Token expired")
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(401, "Authentication failed")
```

#### 3.3 Remove JWT Dependencies

**File:** `backend/app/core/config.py`

```python
# Remove JWT_SECRET_KEY
# Remove jwt library from imports
```

**File:** `backend/requirements.txt`

```diff
- PyJWT==2.8.0
```

#### 3.4 Remove Password Hash Logic (Optional)

If all users authenticate via Firebase, password hashes in database are no longer needed:

```python
# Consider removing password_hash column in future migration
# Keep for now if some users still use database passwords
```

---

## Migration Timeline

### Week 1: Preparation ✅

- [x] Create username-to-email endpoint
- [x] Deprecate admin-login endpoint
- [x] Document migration path
- [x] Test Firebase token acceptance

### Week 2: Frontend Migration ⏳

- [ ] Update admin portal login component
- [ ] Update API client to use Firebase tokens
- [ ] Update protected routes
- [ ] Test all functionality
- [ ] Deploy frontend to staging

### Week 3: Testing ⏳

- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security review
- [ ] User acceptance testing

### Week 4: Cleanup ⏳

- [ ] Remove JWT code from backend
- [ ] Update API documentation
- [ ] Remove deprecated endpoints
- [ ] Deploy to production

---

## Rollback Plan

If issues occur during migration:

### Before Phase 3 (JWT Removal)

- **Easy Rollback:** Revert frontend to use old login
- Admin-login endpoint still works
- No backend changes needed

### After Phase 3 (JWT Removed)

- **Requires Restore:** Restore previous backend version
- Re-enable admin-login endpoint
- Redeploy frontend

**Recommendation:** Keep Phase 3 separate, deploy only after Phase 2 is stable.

---

## Security Considerations

### Firebase Token Validation

- ✅ Verify token signature
- ✅ Check token expiration
- ✅ Validate issuer
- ✅ Check audience

### Additional Security

- [ ] Implement rate limiting on username-to-email
- [ ] Add captcha for login attempts
- [ ] Monitor failed login attempts
- [ ] Set up Firebase security rules

### Token Management

- ✅ Tokens auto-refresh via Firebase SDK
- ✅ Tokens expire after 1 hour
- ✅ Revoke tokens on logout
- [ ] Monitor active sessions

---

## API Changes Summary

### New Endpoints ✅

```
POST /auth/username-to-email
```

### Deprecated Endpoints ⚠️

```
POST /auth/admin-login (still works, will be removed)
```

### Removed Endpoints (Phase 3) ⏳

```
POST /auth/admin-login (complete removal)
```

### Authentication Header

```
Before: Authorization: Bearer <JWT_TOKEN>
After:  Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## Testing Guide

### Manual Testing

1. **Test Username Lookup**

```bash
curl -X POST http://localhost:8000/api/auth/username-to-email \
  -H "Content-Type: application/json" \
  -d '{"username": "admin.user"}'
```

2. **Test Firebase Login** (use Firebase SDK or REST API)

```bash
curl -X POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.user@university.edu",
    "password": "password123",
    "returnSecureToken": true
  }'
```

3. **Test API Call with Firebase Token**

```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### Automated Tests

```python
# tests/test_auth_migration.py

async def test_username_to_email():
    response = await client.post("/auth/username-to-email",
        json={"username": "test.admin"})
    assert response.status_code == 200
    assert "email" in response.json()

async def test_firebase_token_accepted():
    # Get Firebase token
    token = get_test_firebase_token()

    # Call API
    response = await client.get("/users",
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
```

---

## FAQ

### Q: Do students need to change anything?

**A:** No, students already use Firebase authentication. This migration only affects admin/teacher login.

### Q: Will users need to reset passwords?

**A:** No, passwords remain the same. Only the authentication flow changes.

### Q: What if Firebase is down?

**A:** Consider implementing a backup authentication method or monitoring Firebase status closely.

### Q: Can we keep JWT as fallback?

**A:** Not recommended. Maintaining two auth systems increases complexity and security risk. Choose one.

### Q: How to handle password resets?

**A:** Use Firebase password reset:

```typescript
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const auth = getAuth();
await sendPasswordResetEmail(auth, email);
```

---

## Support

### Issues During Migration

1. Check Firebase console for authentication logs
2. Check backend logs for token verification errors
3. Verify Firebase config is correct
4. Test with fresh token (not cached)

### Contacts

- Backend: Check `backend/app/core/security.py`
- Frontend: Check `academic-portal-admin/src/lib/auth.ts`
- Firebase: Check Firebase Console → Authentication

---

**Last Updated:** 2025-10-21  
**Status:** Phase 1 Complete, Phase 2 In Progress
