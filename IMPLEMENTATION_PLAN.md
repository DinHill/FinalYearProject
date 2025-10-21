# Implementation Plan - Technical Review Fixes

**Created:** October 20, 2025  
**Priority:** Top-priority fixes from technical review  
**Estimated Time:** 2-3 days for all critical fixes

---

## 🎯 Phase 1: Top-Priority Fixes (DO THESE FIRST)

### 1. Auth Consistency - Firebase-only ✅ PRIORITY 1

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create username-to-email mapping endpoint
- [ ] Update admin login flow to use Firebase
- [ ] Remove JWT token generation from `auth.py`
- [ ] Simplify `verify_firebase_token()` to only check Firebase
- [ ] Update frontend login to use Firebase SDK
- [ ] Migrate existing admin accounts to Firebase
- [ ] Update all documentation

**Files to Modify:**

- `backend/app/routers/auth.py` - Remove admin-login JWT flow
- `backend/app/core/security.py` - Remove JWT verification
- `backend/app/core/config.py` - Remove JWT_SECRET_KEY
- `academic-portal-admin/src/app/login/page.tsx` - Use Firebase signInWithEmailAndPassword
- `academic-portal-admin/src/lib/api.ts` - Use Firebase ID token as bearer token

---

### 2. Finance Separation ✅ PRIORITY 2

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Remove `payment_status`, `amount_paid`, `due_date` from `enrollments` table
- [ ] Ensure all payment logic uses `invoices → invoice_lines → payments`
- [ ] Create migration to move existing payment data
- [ ] Update enrollment endpoints to not return payment info
- [ ] Create proper invoice endpoints with line items
- [ ] Add partial payment support
- [ ] Add refund support

**Files to Modify:**

- `backend/alembic/versions/` - New migration to restructure
- `backend/app/models/enrollment.py` - Remove payment fields
- `backend/app/routers/enrollments.py` - Remove payment logic
- `backend/app/routers/invoices.py` - Add full CRUD with line items
- `backend/app/schemas/` - Update schemas

---

### 3. Dimensions, Not Enums ✅ PRIORITY 3

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create `campuses` table with proper structure
- [ ] Create `majors` table with proper structure
- [ ] Add foreign keys to users, sections, etc.
- [ ] Migrate existing enum data to tables
- [ ] Create admin endpoints for campus/major management
- [ ] Keep only truly fixed enums (grades, document types, etc.)

**Files to Create/Modify:**

- `backend/app/models/campus.py` - New model
- `backend/app/models/major.py` - New model
- `backend/alembic/versions/` - Migration to create tables and migrate data
- `backend/app/routers/campuses.py` - New CRUD endpoints
- `backend/app/routers/majors.py` - New CRUD endpoints

---

### 4. RBAC Minimal-Now ✅ PRIORITY 4

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create `roles` table (id, name, description)
- [ ] Create `user_roles` junction table (user_id, role_id)
- [ ] Seed initial roles: student, teacher, admin:users, admin:academic, admin:finance, admin:all
- [ ] Update Firebase custom claims to include roles array
- [ ] Implement `require_roles()` dependency
- [ ] Apply role guards to all endpoints
- [ ] Remove hard-coded role checks

**Files to Create/Modify:**

- `backend/app/models/role.py` - New model
- `backend/app/models/user_role.py` - New model
- `backend/app/core/security.py` - Add require_roles() dependency
- `backend/app/core/rbac.py` - New file for role utilities
- `backend/alembic/versions/` - Migration + seed data
- All router files - Add require_roles() to endpoints

---

### 5. Files via Presigned URLs ✅ PRIORITY 5

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Verify Firebase Storage bucket is private
- [ ] Create presigned upload URL endpoint
- [ ] Create presigned download URL endpoint
- [ ] Remove any file streaming through API
- [ ] Update document upload flow to use presigned URLs
- [ ] Update frontend to upload directly to Firebase Storage
- [ ] Add file size limits and validation

**Files to Create/Modify:**

- `backend/app/routers/storage.py` - New endpoints for presigned URLs
- `backend/app/services/storage_service.py` - Firebase Storage utilities
- `academic-portal-admin/src/lib/storage.ts` - Frontend upload utilities
- `backend/app/routers/documents.py` - Use presigned URLs

---

## 🏗️ Phase 2: Architecture & Code Quality

### 6. "Me"-scoped Endpoints

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Endpoints to Create:**

- [ ] `GET /api/v1/me/profile` - Current user profile
- [ ] `PATCH /api/v1/me/profile` - Update own profile
- [ ] `GET /api/v1/me/schedule` - My class schedule
- [ ] `GET /api/v1/me/enrollments` - My enrollments
- [ ] `GET /api/v1/me/grades` - My grades
- [ ] `GET /api/v1/me/invoices` - My invoices
- [ ] `GET /api/v1/me/attendance` - My attendance records
- [ ] `GET /api/v1/me/documents` - Documents accessible to me

**Files to Create:**

- `backend/app/routers/me.py` - All /me endpoints

---

### 7. Idempotency Keys

**Time Estimate:** 2 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create `idempotency_keys` table
- [ ] Implement idempotency middleware
- [ ] Apply to payment endpoints
- [ ] Apply to document upload finalization
- [ ] Add Idempotency-Key to CORS allowed headers

---

### 8. Pagination Everywhere

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create pagination schema (page, page_size, total, items)
- [ ] Update all list endpoints to use pagination
- [ ] Set max page_size = 100
- [ ] Update frontend to handle paginated responses

---

### 9. Record-Level Guards

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Implement `require_section_owner()` dependency
- [ ] Implement `require_own_record()` dependency
- [ ] Apply to teacher endpoints (sections, grades, attendance)
- [ ] Apply to student endpoints (profile, grades, enrollments)

---

## 🔒 Phase 3: Security & Compliance

### 10. Firebase Verification Hardening

**Time Estimate:** 30 minutes  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Add `check_revoked=True` to all Firebase token verifications
- [ ] Create token revocation endpoint
- [ ] Revoke tokens on role changes
- [ ] Revoke tokens on account disable

---

### 11. CORS Explicit Allowlist

**Time Estimate:** 15 minutes  
**Status:** 🟡 PARTIAL (currently allows localhost:3000)

**Tasks:**

- [ ] Add Vercel domain to CORS allowlist
- [ ] Remove any wildcard origins
- [ ] Add Idempotency-Key to allowed headers
- [ ] Test from both localhost and production

---

### 12. Admin Session Cookies

**Time Estimate:** 2 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Implement Firebase session cookie creation
- [ ] Set HttpOnly, Secure flags
- [ ] Add CSRF token for cookie-auth POSTs
- [ ] Update Next.js middleware to verify session cookies

---

### 13. Secrets Management

**Time Estimate:** 30 minutes  
**Status:** 🟡 PARTIAL (service account in repo)

**Tasks:**

- [ ] Move Firebase service account to Render environment variables
- [ ] Update code to load from environment
- [ ] Remove service account JSON from repo
- [ ] Add to .gitignore

---

### 14. Audit Trails

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create `audit_logs` table
- [ ] Log role changes
- [ ] Log grade edits
- [ ] Log payment transactions
- [ ] Log ticket status changes
- [ ] Create audit log viewer in admin UI

---

## 📈 Phase 4: Performance & Reliability

### 15. Database Indexes

**Time Estimate:** 1-2 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Add composite index on (course_id, semester_id) for sections
- [ ] Add composite index on (section_id, student_id) for enrollments
- [ ] Add composite index on (student_id, section_id) for grades
- [ ] Add composite index on (section_id, date) for attendance
- [ ] Add index on (user_id, created_at) for messages
- [ ] Add unique index on users.email
- [ ] Add unique index on users.username

---

### 16. Statement Timeouts

**Time Estimate:** 15 minutes  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Set statement_timeout = 5000 (5 seconds) in database connection
- [ ] Test with slow queries
- [ ] Add query monitoring

---

### 17. Pre-aggregations for Analytics

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Create materialized view for enrollment statistics
- [ ] Create materialized view for financial summary
- [ ] Create materialized view for attendance summary
- [ ] Schedule refresh job (nightly)
- [ ] Update dashboard to use pre-aggregated data

---

### 18. Background Worker

**Time Estimate:** 2-3 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Install Dramatiq or RQ
- [ ] Create worker configuration
- [ ] Move PDF generation to background
- [ ] Move export generation to background
- [ ] Move notification fanout to background
- [ ] Deploy worker process to Render

---

## 💬 Phase 5: Realtime & Notifications

### 19. Chat on Firestore

**Time Estimate:** 4-5 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Design Firestore chat schema
- [ ] Implement chat service in Firebase
- [ ] Mirror minimal metadata to Postgres
- [ ] Add message_read_receipts
- [ ] Implement real-time listeners in mobile app

---

### 20. FCM Hygiene

**Time Estimate:** 2 hours  
**Status:** 🔴 NOT STARTED

**Tasks:**

- [ ] Add device_tokens table with last_seen_at
- [ ] Update FCM send to prune invalid tokens
- [ ] Handle FCM errors gracefully
- [ ] Add token refresh endpoint

---

## 🧪 Phase 6: Testing Strategy

### 21. Unit Tests

**Time Estimate:** 4-5 hours  
**Status:** 🔴 NOT STARTED

**Tests to Write:**

- [ ] GPA calculation
- [ ] Enrollment pre-checks (prerequisites, capacity)
- [ ] Role guard dependency
- [ ] Presigned URL flow
- [ ] Invoice calculation with line items

---

### 22. API Tests

**Time Estimate:** 5-6 hours  
**Status:** 🔴 NOT STARTED

**Happy Path Tests:**

- [ ] Users CRUD
- [ ] Sections CRUD
- [ ] Enrollments flow
- [ ] Grades submission
- [ ] Invoices creation and payment
- [ ] Documents upload and download

---

### 23. E2E Demo Path

**Time Estimate:** 3-4 hours  
**Status:** 🔴 NOT STARTED

**Demo Flow:**

- [ ] Student login
- [ ] View schedule
- [ ] Submit assignment
- [ ] View grade
- [ ] Receive announcement
- [ ] View invoice

---

## 🧭 Phase 7: Project Management

### 24. Definition of Done Checklist

**Per Feature:**

- [ ] API endpoints implemented
- [ ] Admin UI implemented
- [ ] Minimal mobile "me" endpoint
- [ ] Tests written
- [ ] Documentation with screenshot
- [ ] ERD snippet if schema changes
- [ ] Test notes documented

---

## 📊 Implementation Order (Recommended)

### Week 1 - Critical Fixes

**Day 1-2:**

1. ✅ Auth consistency (Firebase-only) - 2-3 hours
2. ✅ RBAC minimal-now - 2-3 hours
3. ✅ CORS explicit allowlist - 15 minutes
4. ✅ Secrets management - 30 minutes

**Day 3-4:** 5. ✅ Finance separation - 3-4 hours 6. ✅ Dimensions not enums - 2-3 hours 7. ✅ Database indexes - 1-2 hours

**Day 5:** 8. ✅ Files via presigned URLs - 2-3 hours 9. ✅ Firebase verification hardening - 30 minutes 10. ✅ Statement timeouts - 15 minutes

### Week 2 - Architecture & Quality

**Day 1-2:** 11. ✅ "Me"-scoped endpoints - 3-4 hours 12. ✅ Record-level guards - 3-4 hours 13. ✅ Pagination everywhere - 2-3 hours

**Day 3-4:** 14. ✅ Idempotency keys - 2 hours 15. ✅ Audit trails - 3-4 hours 16. ✅ Admin session cookies - 2 hours

**Day 5:** 17. ✅ Unit tests (critical paths) - 4-5 hours

### Week 3 - Performance & Polish

**Day 1-2:** 18. ✅ Background worker - 2-3 hours 19. ✅ Pre-aggregations - 3-4 hours

**Day 3-4:** 20. ✅ API tests - 5-6 hours 21. ✅ E2E demo path - 3-4 hours

**Day 5:** 22. ✅ FCM hygiene - 2 hours 23. ✅ Documentation & screenshots - 2-3 hours

---

## 🎯 Quick Wins (Do Today)

These can be done in <30 minutes each:

1. **CORS Allowlist** - Update `main.py` with explicit origins
2. **Secrets Management** - Move Firebase service account to env vars
3. **Firebase check_revoked** - Add parameter to token verification
4. **Statement Timeout** - Add to database connection string
5. **Remove Password Hack** - Delete the admin123 bypass

---

## 📝 Notes

- **Focus on Phase 1 first** - These fixes prevent architectural debt
- **Test incrementally** - Don't wait until the end to test
- **Document as you go** - Screenshot each feature for FYP report
- **Keep main branch stable** - Use feature branches for each fix
- **Warm up Render before demos** - Free tier sleeps after inactivity

---

## 🚨 Breaking Changes

These changes will require coordination:

1. **Auth Migration** - All users need to be migrated to Firebase
2. **Finance Restructure** - Existing enrollment payment data needs migration
3. **Campuses/Majors** - Enum values need to be converted to FK references
4. **RBAC** - All endpoints will require proper roles

---

## 📞 Next Steps

1. Review this plan with your advisor
2. Start with Quick Wins to build momentum
3. Tackle Phase 1 in order
4. Test each fix before moving to the next
5. Update this document as you complete tasks

---

**Last Updated:** October 20, 2025  
**Next Review:** After Phase 1 completion
