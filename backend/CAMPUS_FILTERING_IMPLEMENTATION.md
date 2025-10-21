# Campus Filtering Implementation

## Overview

Implemented campus-based access control to ensure users (especially campus-scoped admins, teachers, and students) only see and interact with data from their assigned campuses.

## Architecture

### Core RBAC Utilities (`app/core/rbac.py`)

Added two key helper functions:

#### 1. `get_user_campus_access(user, db) -> Optional[List[int]]`

Returns campus access for a user:

- **Returns `None`**: User has cross-campus access (super_admin with no campus_id)
- **Returns `List[int]`**: User is campus-scoped, returns list of campus IDs
- **Returns `[]`**: User has no campus assignments

Logic:

```python
# super_admin with no campus-scoped roles = access all campuses
if "super_admin" in user_roles:
    campus_ids = query user_roles where campus_id IS NOT NULL
    if no campus_ids:
        return None  # Cross-campus access
    return campus_ids

# Other users: get their campus IDs from user_roles
return list of campus_ids from user_roles
```

#### 2. `check_campus_access(user, campus_id, db, raise_error=True) -> bool`

Verifies user has access to a specific campus:

- Gets user's campus access via `get_user_campus_access()`
- If `None` (cross-campus), returns `True`
- If `campus_id in campus_ids`, returns `True`
- Otherwise, raises `HTTP 403` (if `raise_error=True`) or returns `False`

## Implementation in Routers

### 1. Academic Router (`app/routers/academic.py`)

#### `POST /academic/sections` - Create Section

- Verifies admin has access to section's campus before creation
- Calls `check_campus_access()` if `section_data.campus_id` is set

#### `GET /academic/sections` - List Sections

**Campus Filtering Logic:**

```python
user_campus_access = await get_user_campus_access(current_user, db)

if campus_id (query param):
    # User wants specific campus - verify access
    if user_campus_access is not None:  # Not cross-campus
        await check_campus_access(current_user, campus_id, db)
    query.where(CourseSection.campus_id == campus_id)
else:
    # No specific campus - filter by user's access
    if user_campus_access is not None:  # Campus-scoped
        if user_campus_access:  # Has campuses
            query.where(CourseSection.campus_id.in_(user_campus_access))
        else:  # No campuses assigned
            return empty result
```

**Result:**

- super_admins with no campus see all sections
- Campus-scoped admins see only their campus sections
- Users can request specific campus if they have access

### 2. Finance Router (`app/routers/finance.py`)

#### `GET /finance/invoices` - List Invoices

- Added `campus_id` query parameter
- **Joins with User table** to access student's campus:
  ```python
  query = select(Invoice).join(User, Invoice.student_id == User.id)
  ```
- Students see only their own invoices (existing logic)
- Admins see invoices filtered by campus access (new logic)
- Same filtering pattern as academic sections

**Result:**

- finance_admin in Campus A sees only invoices for students in Campus A
- super_admin with no campus sees all invoices
- Students unaffected (still see only their own)

### 3. Users Router (`app/routers/users.py`)

#### `GET /users` - List Users

- Campus filtering applied to user listing
- Teachers and admins see only users from their campuses
- Same filtering pattern as sections/invoices

**Result:**

- academic_admin in Campus B sees only users assigned to Campus B
- Teachers see students in their campus
- super_admin sees all users

## Database Schema

### `user_roles` Table

```sql
user_roles (
    user_id INT FK users.id,
    role_id INT FK roles.id,
    campus_id INT FK campuses.id (nullable),
    UNIQUE (user_id, role_id, campus_id)
)
```

### Key Scenarios

| User Type      | campus_id in user_roles | Campus Access               |
| -------------- | ----------------------- | --------------------------- |
| super_admin    | `NULL`                  | All campuses (cross-campus) |
| super_admin    | `1`                     | Campus 1 only               |
| academic_admin | `2`                     | Campus 2 only               |
| finance_admin  | `1, 3`                  | Campuses 1 and 3            |
| teacher        | `2`                     | Campus 2 only               |
| student        | `2`                     | Campus 2 only               |

## Testing Scenarios

### Scenario 1: Cross-Campus Super Admin

```json
{
  "user_id": 1,
  "roles": ["super_admin"],
  "user_roles": [{ "role_id": 1, "campus_id": null }]
}
```

- `GET /academic/sections` → Returns all sections
- `GET /users?campus_id=1` → Returns users from Campus 1
- No restrictions

### Scenario 2: Campus-Scoped Admin

```json
{
  "user_id": 2,
  "roles": ["academic_admin"],
  "user_roles": [{ "role_id": 2, "campus_id": 2 }]
}
```

- `GET /academic/sections` → Returns only Campus 2 sections
- `GET /users?campus_id=1` → **403 Forbidden** (no access)
- `POST /academic/sections` with `campus_id=3` → **403 Forbidden**

### Scenario 3: Multi-Campus Admin

```json
{
  "user_id": 3,
  "roles": ["finance_admin"],
  "user_roles": [
    { "role_id": 3, "campus_id": 1 },
    { "role_id": 3, "campus_id": 3 }
  ]
}
```

- `GET /finance/invoices` → Returns invoices from Campuses 1 and 3
- `GET /users?campus_id=2` → **403 Forbidden**
- `GET /users` → Returns users from Campuses 1 and 3

### Scenario 4: Student

```json
{
  "user_id": 4,
  "roles": ["student"],
  "user_roles": [{ "role_id": 7, "campus_id": 2 }]
}
```

- `GET /finance/invoices` → Returns only their own invoices (existing logic)
- `GET /academic/sections?campus_id=2` → Returns Campus 2 sections (if endpoint allows)

## Migration Path

1. **Already Complete:**

   - Added `campus_id` column to `user_roles` table
   - Updated RBAC models and utilities
   - Migrated existing admins to super_admin with `campus_id=NULL`

2. **To Assign Campus Roles:**

   ```sql
   -- Assign existing academic_admin to Campus 1
   UPDATE user_roles
   SET campus_id = 1
   WHERE role_id = (SELECT id FROM roles WHERE name = 'academic_admin')
   AND user_id = 123;

   -- Assign new multi-campus finance_admin
   INSERT INTO user_roles (user_id, role_id, campus_id)
   VALUES (456, (SELECT id FROM roles WHERE name = 'finance_admin'), 1),
          (456, (SELECT id FROM roles WHERE name = 'finance_admin'), 3);
   ```

## Endpoints Updated

### ✅ Fully Implemented

- `POST /academic/sections` - Campus access verification
- `GET /academic/sections` - Campus filtering
- `GET /finance/invoices` - Campus filtering with join
- `GET /users` - Campus filtering

### 🔄 Partially Implemented

- Other academic endpoints (courses, enrollments, grades) - Need campus filtering
- Other finance endpoints (payments) - Need campus filtering
- Support tickets - Need campus filtering

### ❌ Not Implemented

- Documents endpoints - Need campus filtering
- Schedule endpoints - Need campus filtering
- Dashboard statistics - Need campus-aware aggregations

## Next Steps

1. **Apply campus filtering to remaining GET endpoints:**

   - `/academic/courses`
   - `/academic/enrollments`
   - `/finance/payments`
   - `/support/tickets`
   - `/documents`

2. **Apply campus verification to remaining CREATE/UPDATE endpoints:**

   - Verify admin has access to target campus before allowing resource creation
   - Prevent cross-campus operations

3. **Add campus filtering to dashboard statistics:**

   - Aggregate counts by campus
   - Filter statistics based on admin's campus access

4. **Frontend Updates:**

   - Add campus selector for cross-campus admins
   - Hide campus selector for campus-scoped admins
   - Display user's campus access in profile

5. **Testing:**
   - Write integration tests for each scenario
   - Test edge cases (no campus assignments, multiple campuses)
   - Test permission boundaries

## Security Considerations

✅ **Implemented:**

- super_admin privilege elevation (access all if no campus assigned)
- Campus access verification on specific requests
- Automatic filtering for campus-scoped users

⚠️ **To Implement:**

- Audit logging for cross-campus access
- Rate limiting per campus
- Campus-aware caching

## Performance Impact

- Added database joins to filter by campus (e.g., Invoice → User)
- Query complexity increased slightly
- Mitigated by existing indexes on:
  - `user_roles(campus_id)`
  - `users(campus_id)`
  - `course_sections(campus_id)`

## Documentation

- [x] Architecture documented
- [x] Implementation examples provided
- [x] Testing scenarios defined
- [ ] API documentation updated
- [ ] Frontend integration guide

---

**Status:** Core campus filtering infrastructure complete. Ready for expansion to remaining endpoints.
**Date:** 2025-01-21
