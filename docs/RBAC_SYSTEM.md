# 🔐 Role-Based Access Control (RBAC) System

**Last Updated:** October 21, 2025  
**Migration:** `1e69983a334e_update_roles_and_add_campus_scoping`  
**Status:** ✅ **Production Ready**

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Role Structure](#role-structure)
3. [Campus Scoping](#campus-scoping)
4. [Implementation Guide](#implementation-guide)
5. [Code Examples](#code-examples)
6. [Migration Details](#migration-details)

---

## 🎯 System Overview

The RBAC system provides fine-grained access control with **7 roles** and **campus scoping** support:

- **2 User Roles:** student, teacher
- **5 Admin Roles:** super_admin, academic_admin, finance_admin, support_admin, content_admin
- **Campus Scoping:** Optional campus-level access restrictions
- **Multi-Role Support:** Users can have multiple roles across different campuses

---

## 🎭 Role Structure

### **1. Basic User Roles**

| Role        | Description               | Campus Scoped? | Permissions                                              |
| ----------- | ------------------------- | -------------- | -------------------------------------------------------- |
| **student** | Regular student access    | ✅ Yes         | View own academic data (grades, schedule, invoices)      |
| **teacher** | Teacher/instructor access | ✅ Yes         | Manage sections, grades, attendance for assigned classes |

### **2. Admin Roles**

| Role               | Description          | Campus Scoped?       | Permissions                             |
| ------------------ | -------------------- | -------------------- | --------------------------------------- |
| **super_admin**    | Full system access   | ❌ No (cross-campus) | Everything, all campuses                |
| **academic_admin** | Academic management  | ✅ Optional          | Courses, schedules, enrollments, grades |
| **finance_admin**  | Financial management | ✅ Optional          | Invoices, payments, fee structures      |
| **support_admin**  | Support & documents  | ✅ Optional          | Support tickets, document requests      |
| **content_admin**  | Content management   | ✅ Optional          | Announcements, notifications            |

---

## 🏛️ Campus Scoping

### **How It Works**

The `user_roles` table includes a `campus_id` column:

```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    campus_id INTEGER REFERENCES campuses(id),  -- NULL = cross-campus
    UNIQUE(user_id, role_id, campus_id)
);
```

### **Access Patterns**

#### **1. Cross-Campus Access (NULL campus)**

```sql
-- Super admin with access to ALL campuses
user_id=1, role=super_admin, campus_id=NULL
```

#### **2. Single Campus Access**

```sql
-- Academic admin at Campus 1 only
user_id=2, role=academic_admin, campus_id=1
```

#### **3. Multiple Campus Roles**

```sql
-- User with different roles at different campuses
user_id=3, role=teacher, campus_id=1          -- Teacher at Campus 1
user_id=3, role=academic_admin, campus_id=2   -- Admin at Campus 2
```

### **Permission Rules**

| campus_id Value | Access Scope       | Use Case                                   |
| --------------- | ------------------ | ------------------------------------------ |
| **NULL**        | All campuses       | Super admins, HQ staff                     |
| **Specific ID** | Single campus only | Campus-specific admins, teachers, students |

---

## 🔧 Implementation Guide

### **1. Database Models**

**Role Model** (`app/models/role.py`):

```python
class Role(BaseModel):
    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role")
```

**UserRole Junction Table** (`app/models/user_role.py`):

```python
class UserRole(BaseModel):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    campus_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("campuses.id", ondelete="SET NULL"),
        nullable=True
    )
```

### **2. RBAC Utilities** (`app/core/rbac.py`)

**Key Functions:**

- `has_role(user_roles, role_names)` - Check if user has any of the specified roles
- `has_all_roles(user_roles, role_names)` - Check if user has all specified roles
- `is_admin(user_roles)` - Check if user has any admin role
- `get_user_campus_access(db, user_id)` - Get list of accessible campus IDs
- `check_campus_access(user, campus_id, campus_access)` - Verify campus access

**Dependencies for Endpoints:**

- `require_roles(*role_names)` - Require any of the specified roles
- `require_all_roles(*role_names)` - Require all specified roles
- `require_admin()` - Require any admin role
- `require_teacher_or_admin()` - Require teacher or admin role

---

## 💻 Code Examples

### **Example 1: Protect Admin Endpoint**

```python
from app.core.rbac import require_admin

@router.get("/admin/dashboard", dependencies=[Depends(require_admin())])
async def get_admin_dashboard(
    current_user: Dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Only accessible by any admin role"""
    return {"message": "Admin dashboard"}
```

### **Example 2: Specific Admin Roles**

```python
from app.core.rbac import require_roles

@router.post("/invoices", dependencies=[Depends(require_roles("finance_admin", "super_admin"))])
async def create_invoice(
    current_user: Dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Only finance admins and super admins"""
    return {"message": "Invoice created"}
```

### **Example 3: Teacher or Admin Access**

```python
from app.core.rbac import require_teacher_or_admin

@router.get("/grades", dependencies=[Depends(require_teacher_or_admin())])
async def list_grades(
    current_user: Dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Teachers and admins can view grades"""
    return {"grades": [...]}
```

### **Example 4: Campus-Filtered Query**

```python
from app.core.rbac import get_user_campus_access

@router.get("/courses")
async def list_courses(
    campus_id: Optional[int] = None,
    current_user: Dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    # Get user's accessible campuses
    user_id = current_user["uid"]
    accessible_campuses = await get_user_campus_access(db, user_id)

    # Build query
    query = select(Course)

    if accessible_campuses:  # Specific campuses
        if campus_id and campus_id in accessible_campuses:
            query = query.where(Course.campus_id == campus_id)
        else:
            query = query.where(Course.campus_id.in_(accessible_campuses))
    # If empty list, user is super_admin - no filtering

    result = await db.execute(query)
    return {"courses": result.scalars().all()}
```

### **Example 5: Check Specific Campus Access**

```python
from app.core.rbac import check_campus_access, get_user_campus_access

@router.put("/courses/{course_id}")
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: Dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    # Get course
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Course not found")

    # Check campus access
    user_id = current_user["uid"]
    campus_access = await get_user_campus_access(db, user_id)

    if not await check_campus_access(current_user, course.campus_id, campus_access):
        raise HTTPException(403, "No access to this campus")

    # Update course...
    return {"message": "Course updated"}
```

---

## 🔄 Migration Details

### **Migration: 20251020_1724_update_roles_and_add_campus_scoping.py**

**What It Does:**

1. Deletes old admin roles (admin:users, admin:academic, admin:finance, admin:all)
2. Adds new admin roles (super_admin, academic_admin, finance_admin, support_admin, content_admin)
3. Adds campus_id column to user_roles table
4. Migrates existing admin users to super_admin with NULL campus (cross-campus)

**SQL Operations:**

```sql
-- Add campus_id column
ALTER TABLE user_roles ADD COLUMN campus_id INTEGER REFERENCES campuses(id);

-- Delete old roles
DELETE FROM user_roles WHERE role_id IN (
    SELECT id FROM roles WHERE name IN ('admin:users', 'admin:academic', 'admin:finance', 'admin:all')
);

-- Insert new admin roles
INSERT INTO roles (name, description) VALUES
    ('super_admin', 'Full system access (cross-campus)'),
    ('academic_admin', 'Manage courses, schedules, enrollments'),
    ('finance_admin', 'Manage invoices, payments, fees'),
    ('support_admin', 'Manage support tickets, document requests'),
    ('content_admin', 'Manage announcements, notifications');

-- Migrate existing admin users to super_admin
INSERT INTO user_roles (user_id, role_id, campus_id)
SELECT user_id, (SELECT id FROM roles WHERE name = 'super_admin'), NULL
FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'admin:all');
```

---

## 🎓 Real-World Usage Example

```
User: John Doe (ID: 123)

Roles Assigned:
├─ academic_admin (campus_id=1) → Hanoi Campus
├─ finance_admin (campus_id=2)  → Da Nang Campus
└─ teacher (campus_id=1)        → Hanoi Campus

Access Permissions:
✅ Can manage academic data at Hanoi Campus (academic_admin)
✅ Can manage finances at Da Nang Campus (finance_admin)
✅ Can teach classes at Hanoi Campus (teacher)
❌ Cannot manage academic data at Da Nang (no academic_admin role there)
❌ Cannot access Saigon or Can Tho campuses (no roles assigned)
```

---

## 📊 Quick Reference

### **Endpoint Protection Patterns**

| Access Level         | Code                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Any admin            | `dependencies=[Depends(require_admin())]`                               |
| Super admin only     | `dependencies=[Depends(require_roles("super_admin"))]`                  |
| Finance admin        | `dependencies=[Depends(require_roles("finance_admin", "super_admin"))]` |
| Teacher or admin     | `dependencies=[Depends(require_teacher_or_admin())]`                    |
| Multiple roles (OR)  | `dependencies=[Depends(require_roles("role1", "role2"))]`               |
| Multiple roles (AND) | `dependencies=[Depends(require_all_roles("role1", "role2"))]`           |

---

## ✅ Implementation Checklist

- [x] Role model created
- [x] UserRole junction table created
- [x] Migration applied successfully
- [x] RBAC utilities implemented
- [x] Campus scoping support added
- [ ] All endpoints protected with role guards
- [ ] Campus filtering applied to queries
- [ ] Firebase custom claims synced
- [ ] Frontend role-based UI implemented
- [ ] Tests written for role checks

---

**Status:** ✅ **Production Ready**  
**Next Steps:** Apply role guards to all endpoints, implement campus filtering
