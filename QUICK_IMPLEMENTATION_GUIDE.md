# Quick Implementation Guide

**Priority Fixes Implementation - Step by Step**

---

## ✅ COMPLETED (Quick Wins)

### 1. CORS Explicit Allowlist ✅

**File:** `backend/app/main.py`

- Changed from wildcard `["*"]` to explicit lists
- Added `Idempotency-Key` to allowed headers
- Now using: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`

### 2. Remove Password Hack ✅

**File:** `backend/app/routers/auth.py`

- Removed hard-coded `admin123` bypass
- All authentication now goes through proper bcrypt verification
- Improved error handling for password verification failures

### 3. RBAC System Created ✅

**Files Created:**

- `backend/app/models/role.py` - Role model
- `backend/app/models/user_role.py` - UserRole junction table
- `backend/app/core/rbac.py` - RBAC utilities and dependencies
- `backend/alembic/versions/rbac_20251020_232452_add_rbac_tables.py` - Migration

**Features:**

- `require_roles()` dependency for endpoint protection
- `require_all_roles()` for requiring multiple roles
- Helper shortcuts: `require_admin()`, `require_teacher_or_admin()`, `require_student()`
- Firebase custom claims integration
- Seed data for 6 initial roles

---

## 🔄 NEXT STEPS - In Priority Order

### Step 1: Run RBAC Migration

```powershell
cd "d:\Dinh Hieu\Final Year Project\backend"

# Update the down_revision in the migration file first
# Open: alembic/versions/rbac_20251020_232452_add_rbac_tables.py
# Find your latest migration ID and update down_revision

# Run migration
alembic upgrade head
```

**What this does:**

- Creates `roles` and `user_roles` tables
- Seeds 6 initial roles (student, teacher, admin:\*)
- Migrates existing users to new role system

---

### Step 2: Update Endpoints with RBAC Guards

**Example: Update users router**

```python
# backend/app/routers/users.py
from app.core.rbac import require_roles, require_admin, require_teacher_or_admin

# Before:
@router.get("/users", dependencies=[Depends(verify_firebase_token)])

# After:
@router.get("/users", dependencies=[Depends(require_admin())])

# Or for multiple allowed roles:
@router.get("/users", dependencies=[Depends(require_roles("admin:all", "admin:users"))])
```

**Files to Update:**

- `backend/app/routers/users.py` - Use `require_admin()` or `require_roles("admin:users", "admin:all")`
- `backend/app/routers/academic.py` - Use `require_teacher_or_admin()` for most endpoints
- `backend/app/routers/finance.py` - Use `require_roles("admin:finance", "admin:all")`
- `backend/app/routers/documents.py` - Use `require_roles("admin:all", "teacher", "student")` based on action

---

### Step 3: Set User Roles in Firebase When Creating/Updating Users

**Update auth.py and users.py:**

```python
from app.core.rbac import RBACUtils

# After creating/updating user in database:
async def create_user(user_data, db):
    # ... create user in DB ...

    # Set roles in Firebase custom claims
    roles = ["student"]  # or get from user_data
    await RBACUtils.set_user_roles_in_firebase(user.firebase_uid, roles)

    return user
```

---

### Step 4: Firebase-Only Authentication (2-3 hours)

#### 4a. Create Username-to-Email Endpoint

```python
# backend/app/routers/auth.py

@router.post("/username-to-email")
async def username_to_email(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """Convert username to email for Firebase login"""
    user = await db.execute(select(User).where(User.username == username))
    user = user.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    return {"email": user.email}
```

#### 4b. Update Frontend Login

```typescript
// academic-portal-admin/src/app/login/page.tsx
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

async function handleLogin(username: string, password: string) {
  // First, get email from username
  const { email } = await fetch("/api/v1/auth/username-to-email", {
    method: "POST",
    body: JSON.stringify({ username }),
  }).then((r) => r.json());

  // Then sign in with Firebase
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const idToken = await userCredential.user.getIdToken();

  // Use idToken as bearer token for API calls
  setAuthToken(idToken);
}
```

#### 4c. Remove JWT Generation

```python
# backend/app/routers/auth.py
# Delete the admin-login endpoint entirely
# Or keep it but return Firebase token instead of JWT

@router.post("/admin-login")
async def admin_login(request: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    # ... verify user and password ...

    # Create Firebase custom token instead of JWT
    custom_token = FirebaseService.create_custom_token(
        user.firebase_uid,
        additional_claims={
            "roles": [role.role.name for role in user.user_roles],
            "campus_id": user.campus_id,
            "major_id": user.major_id
        }
    )

    return {"custom_token": custom_token}
```

#### 4d. Simplify Security.py

```python
# backend/app/core/security.py
# Remove JWT verification logic - only keep Firebase

async def verify_firebase_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Verify Firebase ID token ONLY"""
    try:
        token = credentials.credentials

        # Only Firebase verification - remove JWT try/catch
        decoded_token = FirebaseService.verify_id_token(token, check_revoked=True)

        # Add user info to request state
        request.state.user_id = decoded_token.get('uid')
        request.state.user_email = decoded_token.get('email')
        request.state.user_roles = decoded_token.get('roles', [])

        return decoded_token

    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")
```

---

### Step 5: Finance Separation (3-4 hours)

#### 5a. Create Migration to Remove Payment Fields from Enrollments

```python
# alembic/versions/xxx_remove_enrollment_payments.py

def upgrade():
    # Remove payment columns from enrollments
    op.drop_column('enrollments', 'payment_status')
    op.drop_column('enrollments', 'amount_paid')
    op.drop_column('enrollments', 'due_date')

def downgrade():
    op.add_column('enrollments', sa.Column('payment_status', sa.String(20)))
    op.add_column('enrollments', sa.Column('amount_paid', sa.Numeric(10, 2)))
    op.add_column('enrollments', sa.Column('due_date', sa.Date()))
```

#### 5b. Update Enrollment Model

```python
# backend/app/models/enrollment.py
class Enrollment(BaseModel):
    # Remove these fields:
    # payment_status = ...
    # amount_paid = ...
    # due_date = ...

    # Keep enrollment logic only
    section_id = Column(Integer, ForeignKey("course_sections.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    enrollment_date = Column(Date)
    status = Column(String(20))  # enrolled, dropped, completed
    grade = Column(String(2))
```

#### 5c. Enhance Invoice System

```python
# backend/app/routers/invoices.py

@router.post("/invoices")
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("admin:finance", "admin:all"))
):
    """Create invoice with line items"""
    # Create invoice
    invoice = Invoice(**invoice_data.dict(exclude={"line_items"}))
    db.add(invoice)

    # Add line items
    for item in invoice_data.line_items:
        line = InvoiceLine(invoice=invoice, **item.dict())
        db.add(line)

    await db.commit()
    return invoice

@router.post("/invoices/{invoice_id}/payments")
async def create_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record payment (supports partial payments)"""
    payment = Payment(invoice_id=invoice_id, **payment_data.dict())
    db.add(payment)

    # Update invoice paid amount
    invoice = await db.get(Invoice, invoice_id)
    invoice.amount_paid += payment.amount

    if invoice.amount_paid >= invoice.total_amount:
        invoice.status = "paid"
    elif invoice.amount_paid > 0:
        invoice.status = "partial"

    await db.commit()
    return payment
```

---

### Step 6: Dimensions Not Enums (2-3 hours)

Currently campuses and majors are already tables! ✅

**What to check:**

- Ensure all references use ForeignKey (not enum)
- Remove any enum definitions for Campus/Major from code
- Add admin CRUD endpoints if missing

```python
# backend/app/routers/campuses.py
@router.get("/campuses", dependencies=[Depends(verify_firebase_token)])
async def list_campuses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campus).where(Campus.is_active == True))
    return result.scalars().all()

@router.post("/campuses", dependencies=[Depends(require_admin())])
async def create_campus(campus_data: CampusCreate, db: AsyncSession = Depends(get_db)):
    campus = Campus(**campus_data.dict())
    db.add(campus)
    await db.commit()
    return campus
```

---

### Step 7: Add Database Indexes (1-2 hours)

```python
# alembic/versions/xxx_add_performance_indexes.py

def upgrade():
    # Composite indexes
    op.create_index('ix_sections_course_semester', 'course_sections', ['course_id', 'semester_id'])
    op.create_index('ix_enrollments_section_student', 'enrollments', ['section_id', 'student_id'])
    op.create_index('ix_grades_student_section', 'grades', ['student_id', 'section_id'])
    op.create_index('ix_attendance_section_date', 'attendance', ['section_id', 'date'])
    op.create_index('ix_messages_user_created', 'messages', ['user_id', 'created_at'])

    # Unique indexes
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

def downgrade():
    # Drop indexes in reverse order
    pass
```

---

### Step 8: Create /me Endpoints (3-4 hours)

```python
# backend/app/routers/me.py
from fastapi import APIRouter, Depends
from app.core.security import verify_firebase_token
from app.core.database import get_db

router = APIRouter(prefix="/me", tags=["My Data"])

@router.get("/profile")
async def get_my_profile(
    user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile"""
    uid = user['uid']
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    return result.scalar_one()

@router.get("/schedule")
async def get_my_schedule(
    user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Get my class schedule"""
    # Return enrollments with section details
    pass

@router.get("/grades")
async def get_my_grades(
    user: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """Get my grades"""
    pass

# Add more /me endpoints...
```

**Register in main.py:**

```python
from app.routers.me import router as me_router
app.include_router(me_router, prefix="/api/v1")
```

---

### Step 9: Add Presigned URLs for Files (2-3 hours)

```python
# backend/app/services/storage_service.py
from firebase_admin import storage
from datetime import timedelta

class StorageService:
    @staticmethod
    def generate_upload_url(file_path: str, content_type: str) -> str:
        """Generate presigned URL for upload"""
        bucket = storage.bucket()
        blob = bucket.blob(file_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="PUT",
            content_type=content_type
        )
        return url

    @staticmethod
    def generate_download_url(file_path: str) -> str:
        """Generate presigned URL for download"""
        bucket = storage.bucket()
        blob = bucket.blob(file_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=1),
            method="GET"
        )
        return url

# backend/app/routers/storage.py
@router.post("/storage/upload-url")
async def get_upload_url(
    file_name: str,
    content_type: str,
    user: dict = Depends(verify_firebase_token)
):
    """Get presigned URL for file upload"""
    file_path = f"uploads/{user['uid']}/{file_name}"
    url = StorageService.generate_upload_url(file_path, content_type)
    return {"upload_url": url, "file_path": file_path}

@router.post("/storage/download-url")
async def get_download_url(
    file_path: str,
    user: dict = Depends(verify_firebase_token)
):
    """Get presigned URL for file download"""
    url = StorageService.generate_download_url(file_path)
    return {"download_url": url}
```

---

## 🎯 Testing Checklist

After each implementation:

### RBAC Testing

- [ ] Create test user with student role
- [ ] Try accessing admin endpoint - should get 403
- [ ] Create user with admin:all role
- [ ] Verify admin can access all endpoints
- [ ] Test role inheritance (admin:all can do everything)

### Firebase Auth Testing

- [ ] Login with username/password via Firebase
- [ ] Verify ID token works for API calls
- [ ] Test token revocation
- [ ] Verify custom claims include roles array

### Finance Testing

- [ ] Create invoice with multiple line items
- [ ] Record partial payment
- [ ] Verify invoice status updates correctly
- [ ] Test full payment flow
- [ ] Ensure enrollments don't have payment fields

### Performance Testing

- [ ] Run query EXPLAIN on large tables
- [ ] Verify indexes are being used
- [ ] Test list endpoints with pagination
- [ ] Check response times < 200ms

---

## 📝 Documentation Updates Needed

After implementation, update these files:

1. **BACKEND_OVERVIEW.md**

   - Add RBAC section
   - Update authentication flow
   - Document /me endpoints
   - Add presigned URL flow

2. **TECHNICAL_ARCHITECTURE.md**

   - Update auth diagrams
   - Add RBAC flow diagram
   - Update security section

3. **API Documentation**
   - Generate new OpenAPI docs
   - Update Postman collection
   - Add role requirements to each endpoint

---

## 🚀 Deployment Steps

When ready to deploy:

1. **Run all migrations:**

   ```bash
   alembic upgrade head
   ```

2. **Update environment variables on Render:**

   - Add Vercel domain to `CORS_ORIGINS`
   - Ensure Firebase credentials are set
   - Set `statement_timeout` in DATABASE_URL

3. **Seed initial data:**

   ```bash
   # Roles are auto-seeded in migration
   # Verify with:
   psql $DATABASE_URL -c "SELECT * FROM roles;"
   ```

4. **Test critical flows:**

   - Admin login with Firebase
   - Student accessing /me endpoints
   - Teacher accessing their sections
   - Admin managing users

5. **Monitor logs:**
   - Check for CORS errors
   - Verify role checks working
   - Monitor slow queries

---

## ⚠️ Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution:** Check if tables were created manually. Drop them first or update migration.

### Issue: Firebase token verification fails

**Solution:** Verify Firebase credentials are correct. Check token isn't expired.

### Issue: CORS errors from Vercel

**Solution:** Add exact Vercel domain to CORS_ORIGINS (no trailing slash).

### Issue: Roles not in Firebase custom claims

**Solution:** Call `set_custom_user_claims()` after creating/updating user.

### Issue: Slow queries after adding indexes

**Solution:** Run `ANALYZE` on tables. Check index is being used with EXPLAIN.

---

## 📞 Next Review Points

Schedule review after:

- [ ] RBAC migration complete
- [ ] 3 endpoints updated with role guards
- [ ] Firebase-only auth tested
- [ ] First /me endpoint working
- [ ] Performance benchmarks done

**Estimated Total Time: 2-3 days for all critical fixes**

Good luck! 🚀
