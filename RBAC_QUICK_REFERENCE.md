# RBAC Quick Reference Card

**Role-Based Access Control - Cheat Sheet**

---

## 🎭 Available Roles

| Role             | Description        | Access Level                                |
| ---------------- | ------------------ | ------------------------------------------- |
| `student`        | Regular student    | View own data only                          |
| `teacher`        | Teacher/Instructor | Manage own sections, grades, attendance     |
| `admin:users`    | User admin         | Manage users, accounts, profiles            |
| `admin:academic` | Academic admin     | Manage courses, sections, grades, schedules |
| `admin:finance`  | Finance admin      | Manage invoices, payments, fees             |
| `admin:all`      | Super admin        | Full system access (bypasses all checks)    |

---

## 🔐 How to Protect Endpoints

### Option 1: Require Any of Multiple Roles (OR condition)

```python
from app.core.rbac import require_roles

@router.get("/grades", dependencies=[Depends(require_roles("teacher", "admin:academic", "admin:all"))])
async def list_grades():
    """Accessible by teachers OR academic admins OR super admins"""
    pass
```

### Option 2: Require All Roles (AND condition)

```python
from app.core.rbac import require_all_roles

@router.post("/special", dependencies=[Depends(require_all_roles("teacher", "admin:academic"))])
async def special_action():
    """ONLY accessible if user has BOTH teacher AND admin:academic roles"""
    pass
```

### Option 3: Use Convenience Shortcuts

```python
from app.core.rbac import require_admin, require_teacher_or_admin, require_student

# Any admin role
@router.get("/admin-panel", dependencies=[Depends(require_admin())])

# Teacher or admin
@router.get("/sections", dependencies=[Depends(require_teacher_or_admin())])

# Student only
@router.get("/my-grades", dependencies=[Depends(require_student())])
```

---

## 📋 Common Patterns

### Pattern 1: Admin-Only Endpoints

```python
# Users management
@router.post("/users", dependencies=[Depends(require_roles("admin:users", "admin:all"))])
@router.delete("/users/{id}", dependencies=[Depends(require_roles("admin:users", "admin:all"))])

# Academic data
@router.post("/courses", dependencies=[Depends(require_roles("admin:academic", "admin:all"))])
@router.put("/courses/{id}", dependencies=[Depends(require_roles("admin:academic", "admin:all"))])

# Finance
@router.post("/invoices", dependencies=[Depends(require_roles("admin:finance", "admin:all"))])
@router.get("/payments", dependencies=[Depends(require_roles("admin:finance", "admin:all"))])
```

### Pattern 2: Teacher + Admin Endpoints

```python
# Teachers can manage their own sections, admins can manage all
@router.post("/grades", dependencies=[Depends(require_teacher_or_admin())])
@router.post("/attendance", dependencies=[Depends(require_teacher_or_admin())])
@router.put("/sections/{id}", dependencies=[Depends(require_teacher_or_admin())])
```

### Pattern 3: Everyone Can Read, Only Admins Can Write

```python
# List - anyone authenticated
@router.get("/courses")
async def list_courses(user: dict = Depends(verify_firebase_token)):
    pass

# Create/Update/Delete - admin only
@router.post("/courses", dependencies=[Depends(require_admin())])
@router.put("/courses/{id}", dependencies=[Depends(require_admin())])
@router.delete("/courses/{id}", dependencies=[Depends(require_admin())])
```

### Pattern 4: Access User Roles Inside Endpoint

```python
from app.core.rbac import RBACUtils

@router.get("/dashboard")
async def get_dashboard(user: dict = Depends(verify_firebase_token)):
    roles = user.get("roles", [])

    if RBACUtils.is_admin(roles):
        # Return admin dashboard
        return {"type": "admin", "data": admin_data}

    elif RBACUtils.is_teacher(roles):
        # Return teacher dashboard
        return {"type": "teacher", "data": teacher_data}

    elif RBACUtils.is_student(roles):
        # Return student dashboard
        return {"type": "student", "data": student_data}

    else:
        raise HTTPException(403, "No dashboard available for your role")
```

---

## 🔧 Setting User Roles

### When Creating a User

```python
from app.models import User, Role, UserRole
from app.core.rbac import RBACUtils

# 1. Create user in database
user = User(
    firebase_uid=firebase_uid,
    username=username,
    email=email,
    full_name=full_name,
    role="student"  # Legacy field, keep for now
)
db.add(user)
await db.flush()  # Get user.id

# 2. Assign role(s) in database
student_role = await db.execute(select(Role).where(Role.name == "student"))
student_role = student_role.scalar_one()

user_role = UserRole(user_id=user.id, role_id=student_role.id)
db.add(user_role)

# 3. Set roles in Firebase custom claims
await RBACUtils.set_user_roles_in_firebase(firebase_uid, ["student"])

await db.commit()
```

### When Updating User Roles

```python
from app.core.rbac import RBACUtils
from app.core.firebase import FirebaseService

# 1. Update roles in database
# Remove old roles
await db.execute(delete(UserRole).where(UserRole.user_id == user_id))

# Add new roles
for role_name in new_roles:
    role = await db.execute(select(Role).where(Role.name == role_name))
    role = role.scalar_one()
    user_role = UserRole(user_id=user_id, role_id=role.id)
    db.add(user_role)

# 2. Update Firebase custom claims
user = await db.get(User, user_id)
await RBACUtils.set_user_roles_in_firebase(user.firebase_uid, new_roles)

# 3. Revoke existing tokens to force re-authentication
FirebaseService.revoke_refresh_tokens(user.firebase_uid)

await db.commit()
```

---

## 🧪 Testing Role Guards

### Test Script

```python
# test_rbac.py
import asyncio
from app.core.firebase import FirebaseService
from app.core.rbac import RBACUtils

async def test_role_guards():
    # Test 1: Student accessing admin endpoint
    student_uid = "test_student_001"
    await RBACUtils.set_user_roles_in_firebase(student_uid, ["student"])
    # Try accessing /api/v1/users → Should get 403

    # Test 2: Teacher accessing their section
    teacher_uid = "test_teacher_001"
    await RBACUtils.set_user_roles_in_firebase(teacher_uid, ["teacher"])
    # Try accessing /api/v1/grades → Should succeed

    # Test 3: Admin accessing everything
    admin_uid = "test_admin_001"
    await RBACUtils.set_user_roles_in_firebase(admin_uid, ["admin:all"])
    # Try accessing any endpoint → Should succeed

    # Test 4: User with multiple roles
    multi_uid = "test_multi_001"
    await RBACUtils.set_user_roles_in_firebase(multi_uid, ["teacher", "admin:academic"])
    # Should have access to both teacher and academic admin endpoints

asyncio.run(test_role_guards())
```

### Manual Testing with curl

```bash
# 1. Get token for student user
STUDENT_TOKEN="<firebase-id-token>"

# 2. Try accessing admin endpoint (should fail)
curl -H "Authorization: Bearer $STUDENT_TOKEN" \
  http://localhost:8000/api/v1/users

# Expected: 403 Forbidden
# {
#   "detail": "Insufficient permissions. Required roles: admin:all, admin:users"
# }

# 3. Get token for admin user
ADMIN_TOKEN="<firebase-id-token>"

# 4. Try accessing admin endpoint (should work)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/v1/users

# Expected: 200 OK with user list
```

---

## 📊 Role Hierarchy Visualization

```
┌─────────────────────────────────────┐
│          admin:all                  │  ← Full access to everything
│     (Super Administrator)           │
└─────────────────────────────────────┘
              ▲
              │ bypasses all checks
              │
    ┌─────────┴──────────┬──────────────┬────────────┐
    │                    │              │            │
┌───────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────┐
│admin:users│  │admin:academic│  │admin:finance│  │teacher │
│           │  │              │  │             │  │        │
│ • Users   │  │ • Courses    │  │ • Invoices  │  │ • Own  │
│ • Profiles│  │ • Sections   │  │ • Payments  │  │ sections│
│ • Accounts│  │ • Grades     │  │ • Fees      │  │ • Grades│
│           │  │ • Schedule   │  │             │  │        │
└───────────┘  └──────────────┘  └─────────────┘  └────────┘
                                                        │
                                                        │
                                                   ┌────────┐
                                                   │student │
                                                   │        │
                                                   │ • Own  │
                                                   │ data   │
                                                   │ only   │
                                                   └────────┘
```

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Use role string comparison directly

```python
@router.get("/admin")
async def admin_panel(user: dict = Depends(verify_firebase_token)):
    if user.get("role") == "admin":  # DON'T do this
        # ...
```

### ✅ DO: Use require_roles() dependency

```python
@router.get("/admin", dependencies=[Depends(require_admin())])
async def admin_panel(user: dict = Depends(verify_firebase_token)):
    # User already verified to have admin role
    # ...
```

---

### ❌ DON'T: Forget to update Firebase custom claims

```python
# Update roles in DB but forget Firebase
user_role = UserRole(user_id=user_id, role_id=role_id)
db.add(user_role)
await db.commit()
# User's token will still have old roles! ❌
```

### ✅ DO: Always sync with Firebase

```python
# Update DB
user_role = UserRole(user_id=user_id, role_id=role_id)
db.add(user_role)

# Update Firebase
await RBACUtils.set_user_roles_in_firebase(user.firebase_uid, new_roles)

# Revoke old tokens
FirebaseService.revoke_refresh_tokens(user.firebase_uid)

await db.commit()
```

---

### ❌ DON'T: Check roles in endpoint when you can use dependency

```python
@router.get("/teachers")
async def list_teachers(user: dict = Depends(verify_firebase_token)):
    if "admin:users" not in user.get("roles", []):
        raise HTTPException(403, "Forbidden")
    # ... ❌ Repetitive, error-prone
```

### ✅ DO: Use dependency to enforce automatically

```python
@router.get("/teachers", dependencies=[Depends(require_roles("admin:users", "admin:all"))])
async def list_teachers():
    # User already verified ✅
    # ...
```

---

## 📚 Additional Resources

- **Full Implementation Guide:** `QUICK_IMPLEMENTATION_GUIDE.md`
- **Architecture Documentation:** `TECHNICAL_ARCHITECTURE.md`
- **Backend Overview:** `BACKEND_OVERVIEW.md`
- **RBAC Code:** `backend/app/core/rbac.py`

---

## 🆘 Troubleshooting

### Problem: "Insufficient permissions" but user has correct role

**Solution:** Check Firebase custom claims

```python
from app.core.firebase import FirebaseService
user = FirebaseService.get_user(firebase_uid)
print(user.custom_claims)  # Should show roles array
```

### Problem: Role not taking effect after update

**Solution:** Revoke tokens to force re-authentication

```python
FirebaseService.revoke_refresh_tokens(firebase_uid)
```

### Problem: admin:all not bypassing checks

**Solution:** Verify `admin:all` is first in `has_role()` logic

```python
# In rbac.py, this should be first:
if "admin:all" in user_roles:
    return True
```

---

**Quick Tips:**

- Use `admin:all` for super admins that can do everything
- Use specific admin roles (`admin:users`, `admin:academic`, `admin:finance`) for department admins
- Always sync roles between database and Firebase custom claims
- Revoke tokens when changing roles
- Test with different role combinations
- Use helper functions in `RBACUtils` for role checks

---

**Last Updated:** October 20, 2025  
**Version:** 1.0.0  
**Author:** Implementation Team
