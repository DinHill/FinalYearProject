"""
Comprehensive Database Seeding - ALL 22 Tables
Run this from the deployed backend on Render
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime, timedelta
from typing import Dict
import random

from app.core.database import get_db
from app.models.user import User, Campus, Major, UsernameSequence, StudentSequence, DeviceToken
from app.models.academic import Semester, Course, CourseSection, Schedule, Enrollment, Assignment, Grade, Attendance
from app.models.finance import FeeStructure, Invoice, InvoiceLine, Payment
from app.models.communication import ChatRoom, ChatParticipant, SupportTicket, TicketEvent
from app.models.document import Document, DocumentRequest, Announcement
from app.core.security import SecurityUtils

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])


# -------------------------
# Helper - safe add
# -------------------------
async def _safe_add(db: AsyncSession, model, unique_filters: Dict = None, data: Dict = None):
    if unique_filters:
        q = select(model)
        for k, v in unique_filters.items():
            q = q.where(getattr(model, k) == v)
        res = await db.execute(q)
        if res.scalar_one_or_none():
            return False
    db.add(model(**data))
    return True


# ============================================
# USER MANAGEMENT TABLES (6 tables)
# ============================================
async def seed_campuses(db: AsyncSession) -> Dict:
    campuses_data = [
        {"code": "H", "name": "Hanoi Campus", "address": "FPT Tower, 10 Pham Van Bach", "city": "Hanoi", "timezone": "Asia/Ho_Chi_Minh", "phone": "+84 24 7300 5588", "email": "hanoi@greenwich.edu.vn", "is_active": True},
        {"code": "D", "name": "Da Nang Campus", "address": "Lot 30 Quang Trung Software City", "city": "Da Nang", "timezone": "Asia/Ho_Chi_Minh", "phone": "+84 236 3525 688", "email": "danang@greenwich.edu.vn", "is_active": True},
        {"code": "C", "name": "Can Tho Campus", "address": "600A Nguyen Van Cu Noi Dai", "city": "Can Tho", "timezone": "Asia/Ho_Chi_Minh", "phone": "+84 292 3731 279", "email": "cantho@greenwich.edu.vn", "is_active": True},
        {"code": "S", "name": "Ho Chi Minh Campus", "address": "778/B1 Nguyen Kiem Street, Ward 4", "city": "Ho Chi Minh", "timezone": "Asia/Ho_Chi_Minh", "phone": "+84 28 7300 5588", "email": "hcm@greenwich.edu.vn", "is_active": True},
    ]
    created = 0
    for c in campuses_data:
        q = await db.execute(select(Campus).where(Campus.code == c["code"]))
        if not q.scalar_one_or_none():
            db.add(Campus(**c))
            created += 1
    await db.commit()
    return {"entity": "campuses", "created": created, "total": len(campuses_data)}


async def seed_majors(db: AsyncSession) -> Dict:
    majors_data = [
        {"code": "C", "name": "Computer Science", "description": "Software development, algorithms, and computing systems", "is_active": True},
        {"code": "B", "name": "Business Administration", "description": "Management, finance, and business operations", "is_active": True},
        {"code": "D", "name": "Graphic Design", "description": "Visual communication and digital media", "is_active": True},
        {"code": "IT", "name": "Information Technology", "description": "IT infrastructure, networks, and systems administration", "is_active": True},
        {"code": "MK", "name": "Marketing", "description": "Digital marketing, branding, and consumer behavior", "is_active": True},
    ]
    created = 0
    for m in majors_data:
        q = await db.execute(select(Major).where(Major.code == m["code"]))
        if not q.scalar_one_or_none():
            db.add(Major(**m))
            created += 1
    await db.commit()
    return {"entity": "majors", "created": created, "total": len(majors_data)}


async def seed_users(db: AsyncSession) -> Dict:
    campuses = (await db.execute(select(Campus))).scalars().all()
    majors = (await db.execute(select(Major))).scalars().all()
    campus_map = {c.code: c.id for c in campuses}
    major_map = {m.code: m.id for m in majors}

    users_data = [
        {"firebase_uid": "admin-seed-uid", "username": "admin", "email": "admin@greenwich.edu.vn", "full_name": "System Administrator", "password_hash": SecurityUtils.hash_password("admin123"), "role": "admin", "status": "active", "campus_id": campus_map.get("H"), "phone_number": "+84 24 7300 5588"},
        {"firebase_uid": "teacher1-seed-uid", "username": "nguyen.van.a", "email": "nguyen.van.a@greenwich.edu.vn", "full_name": "Nguyen Van A", "password_hash": SecurityUtils.hash_password("teacher123"), "role": "teacher", "status": "active", "campus_id": campus_map.get("H"), "major_id": major_map.get("C"), "phone_number": "+84 98 765 4321", "date_of_birth": date(1985, 5, 15)},
        {"firebase_uid": "teacher2-seed-uid", "username": "tran.thi.b", "email": "tran.thi.b@greenwich.edu.vn", "full_name": "Tran Thi B", "password_hash": SecurityUtils.hash_password("teacher123"), "role": "teacher", "status": "active", "campus_id": campus_map.get("D"), "major_id": major_map.get("B"), "phone_number": "+84 97 654 3210", "date_of_birth": date(1987, 8, 20)},
        {"firebase_uid": "teacher3-seed-uid", "username": "pham.van.c", "email": "pham.van.c@greenwich.edu.vn", "full_name": "Pham Van C", "password_hash": SecurityUtils.hash_password("teacher123"), "role": "teacher", "status": "active", "campus_id": campus_map.get("H"), "major_id": major_map.get("IT"), "phone_number": "+84 96 543 2109", "date_of_birth": date(1988, 3, 10)},
        {"firebase_uid": "student1-seed-uid", "username": "gch210001", "email": "gch210001@greenwich.edu.vn", "full_name": "Le Van D", "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active", "campus_id": campus_map.get("H"), "major_id": major_map.get("C"), "phone_number": "+84 95 432 1098", "date_of_birth": date(2003, 3, 10), "year_entered": 2021},
        {"firebase_uid": "student2-seed-uid", "username": "gcd220002", "email": "gcd220002@greenwich.edu.vn", "full_name": "Pham Thi E", "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active", "campus_id": campus_map.get("D"), "major_id": major_map.get("D"), "phone_number": "+84 94 321 0987", "date_of_birth": date(2004, 7, 25), "year_entered": 2022},
        {"firebase_uid": "student3-seed-uid", "username": "gcb230003", "email": "gcb230003@greenwich.edu.vn", "full_name": "Hoang Van F", "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active", "campus_id": campus_map.get("C"), "major_id": major_map.get("B"), "phone_number": "+84 93 210 9876", "date_of_birth": date(2005, 11, 5), "year_entered": 2023},
        {"firebase_uid": "student4-seed-uid", "username": "gch230004", "email": "gch230004@greenwich.edu.vn", "full_name": "Nguyen Thi G", "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active", "campus_id": campus_map.get("H"), "major_id": major_map.get("C"), "phone_number": "+84 92 109 8765", "date_of_birth": date(2005, 2, 14), "year_entered": 2023},
        {"firebase_uid": "student5-seed-uid", "username": "gcit240005", "email": "gcit240005@greenwich.edu.vn", "full_name": "Tran Van H", "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active", "campus_id": campus_map.get("H"), "major_id": major_map.get("IT"), "phone_number": "+84 91 098 7654", "date_of_birth": date(2006, 6, 20), "year_entered": 2024},
    ]
    created = 0
    for u in users_data:
        q = await db.execute(select(User).where(User.username == u["username"]))
        if not q.scalar_one_or_none():
            db.add(User(**u))
            created += 1
    await db.commit()
    return {"entity": "users", "created": created, "total": len(users_data)}


async def seed_username_sequences(db: AsyncSession) -> Dict:
    seqs = [
        {"base_username": "admin", "user_type": "admin", "count": 1},
        {"base_username": "teacher", "user_type": "teacher", "count": 3},
        {"base_username": "student", "user_type": "student", "count": 5},
    ]
    created = 0
    for s in seqs:
        q = await db.execute(select(UsernameSequence).where(UsernameSequence.base_username == s["base_username"]))
        if not q.scalar_one_or_none():
            db.add(UsernameSequence(**s))
            created += 1
    await db.commit()
    return {"entity": "username_sequences", "created": created, "total": len(seqs)}


async def seed_student_sequences(db: AsyncSession) -> Dict:
    seqs = [
        {"major_code": "C", "campus_code": "H", "year_entered": 2021, "last_sequence": 1},
        {"major_code": "D", "campus_code": "D", "year_entered": 2022, "last_sequence": 2},
        {"major_code": "B", "campus_code": "C", "year_entered": 2023, "last_sequence": 3},
    ]
    created = 0
    for s in seqs:
        q = await db.execute(select(StudentSequence).where(StudentSequence.major_code == s["major_code"]))
        if not q.scalar_one_or_none():
            db.add(StudentSequence(**s))
            created += 1
    await db.commit()
    return {"entity": "student_sequences", "created": created, "total": len(seqs)}


async def seed_device_tokens(db: AsyncSession) -> Dict:
    users = (await db.execute(select(User).where(User.role.in_(["student", "teacher"])))).scalars().all()
    tokens = []
    for u in users[:3]:
        tokens.append({"user_id": u.id, "token": f"fcm_{u.username}", "platform": "android", "is_active": True})
    created = 0
    for t in tokens:
        q = await db.execute(select(DeviceToken).where(DeviceToken.token == t["token"]))
        if not q.scalar_one_or_none():
            db.add(DeviceToken(**t))
            created += 1
    await db.commit()
    return {"entity": "device_tokens", "created": created, "total": len(tokens)}


# ============================================
# ACADEMIC (8)
# ============================================
async def seed_semesters(db: AsyncSession) -> Dict:
    data = [
        {"code": "FALL2024", "name": "Fall 2024", "type": "FALL", "academic_year": 2024, "start_date": date(2024,9,1), "end_date": date(2024,12,20), "is_current": True},
        {"code": "SPRING2025", "name": "Spring 2025", "type": "SPRING", "academic_year": 2025, "start_date": date(2025,1,6), "end_date": date(2025,5,15), "is_current": False},
    ]
    created = 0
    for s in data:
        q = await db.execute(select(Semester).where(Semester.code == s["code"]))
        if not q.scalar_one_or_none():
            db.add(Semester(**s))
            created += 1
    await db.commit()
    return {"entity": "semesters", "created": created, "total": len(data)}


async def seed_courses(db: AsyncSession) -> Dict:
    majors = (await db.execute(select(Major))).scalars().all()
    mm = {m.code: m.id for m in majors}
    data = [
        {"course_code": "COMP1640", "name": "Enterprise Web Software Development", "credits": 15, "major_id": mm.get("C"), "level": 1},
        {"course_code": "COMP1841", "name": "Database Development and Design", "credits": 15, "major_id": mm.get("C"), "level": 1},
        {"course_code": "BUS1101", "name": "Introduction to Business", "credits": 15, "major_id": mm.get("B"), "level": 1},
    ]
    created = 0
    for c in data:
        q = await db.execute(select(Course).where(Course.course_code == c["course_code"]))
        if not q.scalar_one_or_none():
            db.add(Course(**c))
            created += 1
    await db.commit()
    return {"entity": "courses", "created": created, "total": len(data)}


async def seed_course_sections(db: AsyncSession) -> Dict:
    semester = (await db.execute(select(Semester).where(Semester.code=="FALL2024"))).scalar_one_or_none()
    courses = (await db.execute(select(Course))).scalars().all()
    teachers = (await db.execute(select(User).where(User.role=="teacher"))).scalars().all()
    campuses = (await db.execute(select(Campus))).scalars().all()
    if not semester or not courses:
        return {"entity": "course_sections", "created": 0, "total": 0, "error": "missing deps"}
    data = []
    for i, course in enumerate(courses):
        data.append({"course_id": course.id, "semester_id": semester.id, "section_number": "01", "instructor_id": teachers[i%len(teachers)].id if teachers else None, "campus_id": campuses[i%len(campuses)].id if campuses else None, "room": f"R{i+100}", "max_students": 30, "enrolled_count": 0, "status": "active"})
    created = 0
    for d in data:
        q = await db.execute(select(CourseSection).where(CourseSection.course_id==d["course_id"], CourseSection.semester_id==d["semester_id"]))
        if not q.scalar_one_or_none():
            db.add(CourseSection(**d))
            created += 1
    await db.commit()
    return {"entity": "course_sections", "created": created, "total": len(data)}


async def seed_schedules(db: AsyncSession) -> Dict:
    sections = (await db.execute(select(CourseSection))).scalars().all()
    days = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]
    times = [("08:00","10:00"),("10:00","12:00"),("13:00","15:00")]
    data = []
    for i, s in enumerate(sections):
        day = days[i%len(days)]
        st, et = times[i%len(times)]
        data.append({"section_id": s.id, "day_of_week": day, "start_time": st, "end_time": et, "room": s.room, "building": "A"})
    created = 0
    for d in data:
        q = await db.execute(select(Schedule).where(Schedule.section_id==d["section_id"], Schedule.day_of_week==d["day_of_week"]))
        if not q.scalar_one_or_none():
            db.add(Schedule(**d))
            created += 1
    await db.commit()
    return {"entity": "schedules", "created": created, "total": len(data)}


async def seed_enrollments(db: AsyncSession) -> Dict:
    students = (await db.execute(select(User).where(User.role=="student"))).scalars().all()
    sections = (await db.execute(select(CourseSection))).scalars().all()
    data = []
    for st in students:
        chosen = random.sample(sections, min(3, len(sections))) if sections else []
        for sec in chosen:
            data.append({"student_id": st.id, "section_id": sec.id, "status": "enrolled", "enrolled_at": datetime.now() - timedelta(days=random.randint(10,50))})
    created = 0
    for d in data:
        q = await db.execute(select(Enrollment).where(Enrollment.student_id==d["student_id"], Enrollment.section_id==d["section_id"]))
        if not q.scalar_one_or_none():
            db.add(Enrollment(**d))
            created += 1
    await db.commit()
    # update counts
    for s in sections:
        cnt = len((await db.execute(select(Enrollment).where(Enrollment.section_id==s.id))).scalars().all())
        s.enrolled_count = cnt
    await db.commit()
    return {"entity": "enrollments", "created": created, "total": len(data)}


async def seed_assignments(db: AsyncSession) -> Dict:
    sections = (await db.execute(select(CourseSection))).scalars().all()
    data = []
    for s in sections:
        for i in range(3):
            data.append({"section_id": s.id, "title": f"HW {i+1}", "description": "Do this", "type": "HOMEWORK", "max_points": 100, "weight_percent": 10, "due_date": date.today()+timedelta(days=7*(i+1)), "is_published": True})
    created = 0
    for d in data:
        db.add(Assignment(**d))
        created += 1
    await db.commit()
    return {"entity": "assignments", "created": created, "total": len(data)}


async def seed_grades(db: AsyncSession) -> Dict:
    enrollments = (await db.execute(select(Enrollment))).scalars().all()
    assignments = (await db.execute(select(Assignment))).scalars().all()
    data = []
    for e in enrollments:
        a_for_sec = [a for a in assignments if a.section_id==e.section_id]
        for a in a_for_sec[:2]:
            data.append({"assignment_id": a.id, "student_id": e.student_id, "points_earned": random.uniform(50, 95), "submitted_at": datetime.now()-timedelta(days=random.randint(1,10)), "graded_at": datetime.now()-timedelta(days=random.randint(0,5)), "status": "graded"})
    created = 0
    for d in data:
        q = await db.execute(select(Grade).where(Grade.assignment_id==d["assignment_id"], Grade.student_id==d["student_id"]))
        if not q.scalar_one_or_none():
            db.add(Grade(**d))
            created += 1
    await db.commit()
    return {"entity": "grades", "created": created, "total": len(data)}


async def seed_attendance(db: AsyncSession) -> Dict:
    enrollments = (await db.execute(select(Enrollment))).scalars().all()
    data = []
    for week in range(4):
        dt = date.today() - timedelta(days=7*week)
        for e in enrollments:
            data.append({"section_id": e.section_id, "student_id": e.student_id, "attendance_date": dt, "status": random.choice(["present"]*9+["absent"]), "notes": None})
    created = 0
    for d in data:
        q = await db.execute(select(Attendance).where(Attendance.section_id==d["section_id"], Attendance.student_id==d["student_id"], Attendance.attendance_date==d["attendance_date"]))
        if not q.scalar_one_or_none():
            db.add(Attendance(**d))
            created += 1
    await db.commit()
    return {"entity": "attendance", "created": created, "total": len(data)}


# ============================================
# FINANCE (4)
# ============================================
async def seed_fee_structures(db: AsyncSession) -> Dict:
    data = [{"code": "UG_FALL2024", "name": "Undergraduate Fall 2024", "tuition_amount": 5000.0, "lab_fee": 200.0, "library_fee": 100.0, "total_amount": 5300.0, "is_active": True}]
    created = 0
    for d in data:
        q = await db.execute(select(FeeStructure).where(FeeStructure.code==d["code"]))
        if not q.scalar_one_or_none():
            db.add(FeeStructure(**d))
            created += 1
    await db.commit()
    return {"entity": "fee_structures", "created": created, "total": len(data)}


async def seed_invoices(db: AsyncSession) -> Dict:
    students = (await db.execute(select(User).where(User.role=="student"))).scalars().all()
    sem = (await db.execute(select(Semester).where(Semester.code=="FALL2024"))).scalar_one_or_none()
    fee = (await db.execute(select(FeeStructure))).scalars().first()
    if not sem or not fee:
        return {"entity": "invoices", "created": 0, "total": 0, "error": "deps"}
    data = []
    for i, st in enumerate(students):
        inv_num = f"INV-2024-{1000+i}"
        total = fee.total_amount
        status = random.choice(["paid","partial","pending"])
        paid = total if status=="paid" else (total*random.uniform(0.2,0.7) if status=="partial" else 0)
        data.append({"student_id": st.id, "semester_id": sem.id, "invoice_number": inv_num, "issue_date": date(2024,8,15), "due_date": date(2024,9,15), "total_amount": total, "paid_amount": round(paid,2), "status": status})
    created = 0
    for d in data:
        q = await db.execute(select(Invoice).where(Invoice.invoice_number==d["invoice_number"]))
        if not q.scalar_one_or_none():
            db.add(Invoice(**d))
            created += 1
    await db.commit()
    return {"entity": "invoices", "created": created, "total": len(data)}


async def seed_invoice_lines(db: AsyncSession) -> Dict:
    invoices = (await db.execute(select(Invoice))).scalars().all()
    data = []
    for inv in invoices:
        data.extend([
            {"invoice_id": inv.id, "description": "Tuition", "amount": 5000.0, "quantity": 1},
            {"invoice_id": inv.id, "description": "Lab", "amount": 200.0, "quantity": 1},
            {"invoice_id": inv.id, "description": "Library", "amount": 100.0, "quantity": 1},
        ])
    created = 0
    for d in data:
        db.add(InvoiceLine(**d))
        created += 1
    await db.commit()
    return {"entity": "invoice_lines", "created": created, "total": len(data)}


async def seed_payments(db: AsyncSession) -> Dict:
    invoices = (await db.execute(select(Invoice).where(Invoice.status.in_(["paid","partial"])))).scalars().all()
    data = []
    for i, inv in enumerate(invoices):
        data.append({"invoice_id": inv.id, "amount": inv.paid_amount, "payment_method": random.choice(["bank_transfer","credit_card"]), "reference_number": f"PAY-{2000+i}", "paid_at": datetime.now()-timedelta(days=random.randint(1,30)), "status": "completed"})
    created = 0
    for d in data:
        q = await db.execute(select(Payment).where(Payment.reference_number==d["reference_number"]))
        if not q.scalar_one_or_none():
            db.add(Payment(**d))
            created += 1
    await db.commit()
    return {"entity": "payments", "created": created, "total": len(data)}


# ============================================
# COMMUNICATION (4)
# ============================================
async def seed_chat_rooms(db: AsyncSession) -> Dict:
    sections = (await db.execute(select(CourseSection))).scalars().all()
    campuses = (await db.execute(select(Campus))).scalars().all()
    data = []
    for s in sections[:4]:
        data.append({"firebase_room_id": f"course_{s.id}", "name": f"Course {s.id}", "type": "course", "section_id": s.id, "is_active": True})
    for c in campuses[:2]:
        data.append({"firebase_room_id": f"campus_{c.id}", "name": f"{c.name} - General", "type": "campus", "campus_id": c.id, "is_active": True})
    created = 0
    for d in data:
        q = await db.execute(select(ChatRoom).where(ChatRoom.firebase_room_id==d["firebase_room_id"]))
        if not q.scalar_one_or_none():
            db.add(ChatRoom(**d))
            created += 1
    await db.commit()
    return {"entity": "chat_rooms", "created": created, "total": len(data)}


async def seed_chat_participants(db: AsyncSession) -> Dict:
    rooms = (await db.execute(select(ChatRoom))).scalars().all()
    users = (await db.execute(select(User))).scalars().all()
    data = []
    for r in rooms:
        for u in users[:5]:
            data.append({"room_id": r.id, "user_id": u.id, "role": "member", "joined_at": datetime.now()-timedelta(days=random.randint(1,60))})
    created = 0
    for d in data:
        q = await db.execute(select(ChatParticipant).where(ChatParticipant.room_id==d["room_id"], ChatParticipant.user_id==d["user_id"]))
        if not q.scalar_one_or_none():
            db.add(ChatParticipant(**d))
            created += 1
    await db.commit()
    return {"entity": "chat_participants", "created": created, "total": len(data)}


async def seed_support_tickets(db: AsyncSession) -> Dict:
    students = (await db.execute(select(User).where(User.role=="student"))).scalars().all()
    admin = (await db.execute(select(User).where(User.role=="admin"))).scalar_one_or_none()
    data = []
    for i, st in enumerate(students[:4]):
        data.append({"ticket_number": f"TKT-{1000+i}", "requester_id": st.id, "assigned_to": admin.id if admin else None, "subject": "Help needed", "description": "Issue", "category": "general", "priority": "medium", "status": "open"})
    created = 0
    for d in data:
        q = await db.execute(select(SupportTicket).where(SupportTicket.ticket_number==d["ticket_number"]))
        if not q.scalar_one_or_none():
            db.add(SupportTicket(**d))
            created += 1
    await db.commit()
    return {"entity": "support_tickets", "created": created, "total": len(data)}


async def seed_ticket_events(db: AsyncSession) -> Dict:
    tickets = (await db.execute(select(SupportTicket))).scalars().all()
    data = []
    for t in tickets:
        data.append({"ticket_id": t.id, "event_type": "created", "description": "Created", "created_at": datetime.now()-timedelta(days=random.randint(1,20))})
    created = 0
    for d in data:
        db.add(TicketEvent(**d))
        created += 1
    await db.commit()
    return {"entity": "ticket_events", "created": created, "total": len(data)}


# ============================================
# DOCUMENTS (3)
# ============================================
async def seed_documents(db: AsyncSession) -> Dict:
    teachers = (await db.execute(select(User).where(User.role=="teacher"))).scalars().all()
    sections = (await db.execute(select(CourseSection))).scalars().all()
    data = []
    for i, s in enumerate(sections[:4]):
        teacher = teachers[i%len(teachers)] if teachers else None
        data.append({"owner_id": teacher.id if teacher else None, "section_id": s.id, "title": "Syllabus", "file_path": f"/docs/syllabus_{s.id}.pdf", "mime_type": "application/pdf", "file_size": 102400, "category": "SYLLABUS", "visibility": "section", "file_hash": f"h_{s.id}"})
    created = 0
    for d in data:
        q = await db.execute(select(Document).where(Document.file_hash==d["file_hash"]))
        if not q.scalar_one_or_none():
            db.add(Document(**d))
            created += 1
    await db.commit()
    return {"entity": "documents", "created": created, "total": len(data)}


async def seed_document_requests(db: AsyncSession) -> Dict:
    students = (await db.execute(select(User).where(User.role=="student"))).scalars().all()
    data = []
    for i, s in enumerate(students[:3]):
        data.append({"student_id": s.id, "document_type": "TRANSCRIPT", "purpose": "Job", "status": "pending", "delivery_method": "pickup"})
    created = 0
    for d in data:
        db.add(DocumentRequest(**d))
        created += 1
    await db.commit()
    return {"entity": "document_requests", "created": created, "total": len(data)}


async def seed_announcements(db: AsyncSession) -> Dict:
    campuses = (await db.execute(select(Campus))).scalars().all()
    majors = (await db.execute(select(Major))).scalars().all()
    data = [
        {"title": "Welcome Fall", "body": "Welcome back", "campus_id": campuses[0].id if campuses else None, "category": "ACADEMIC", "priority": "high", "is_published": True, "publish_at": datetime.now()-timedelta(days=10)},
    ]
    created = 0
    for d in data:
        db.add(Announcement(**d))
        created += 1
    await db.commit()
    return {"entity": "announcements", "created": created, "total": len(data)}


# Main endpoint
@router.post("/run")
async def run_seed(db: AsyncSession = Depends(get_db)):
    try:
        results = []
        # User mgmt
        results.append(await seed_campuses(db))
        results.append(await seed_majors(db))
        results.append(await seed_users(db))
        results.append(await seed_username_sequences(db))
        results.append(await seed_student_sequences(db))
        results.append(await seed_device_tokens(db))
        # Academic
        results.append(await seed_semesters(db))
        results.append(await seed_courses(db))
        results.append(await seed_course_sections(db))
        results.append(await seed_schedules(db))
        results.append(await seed_enrollments(db))
        results.append(await seed_assignments(db))
        results.append(await seed_grades(db))
        results.append(await seed_attendance(db))
        # Finance
        results.append(await seed_fee_structures(db))
        results.append(await seed_invoices(db))
        results.append(await seed_invoice_lines(db))
        results.append(await seed_payments(db))
        # Communication
        results.append(await seed_chat_rooms(db))
        results.append(await seed_chat_participants(db))
        results.append(await seed_support_tickets(db))
        results.append(await seed_ticket_events(db))
        # Documents
        results.append(await seed_documents(db))
        results.append(await seed_document_requests(db))
        results.append(await seed_announcements(db))

        total_created = sum(r.get("created", 0) for r in results)
        return {"success": True, "message": f"Seeded {total_created} records", "results": results}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=str(e)+"\n"+tb)
