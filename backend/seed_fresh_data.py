"""
Fresh database seeding script based on user requirements.
Clears specific tables and creates new data.
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, time as datetime_time
import random

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text, select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, AsyncSessionLocal
from app.models.academic import Semester, Course, CourseSection, Enrollment, Attendance, Grade
from app.models.user import User, Campus, Major
from app.models.role import Role
from app.models.finance import FeeStructure, Invoice, InvoiceLine
from app.models.communication import SupportTicket
from app.models.document import DocumentRequest, Announcement
from app.models.audit import AuditLog
from app.core.security import SecurityUtils
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth


# Helper function to create Firebase user
def create_firebase_user(email: str, password: str, display_name: str):
    """Create Firebase user and return UID."""
    try:
        user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=False
        )
        print(f"  ✅ Firebase user created: {email}")
        return user.uid
    except Exception as e:
        # User might already exist, try to get it
        try:
            user = firebase_auth.get_user_by_email(email)
            print(f"  ⚠️  Firebase user exists: {email}")
            return user.uid
        except:
            print(f"  ❌ Failed to create Firebase user {email}: {e}")
            return None


async def clear_tables(session: AsyncSession):
    """Clear specific tables as per requirements."""
    print("\n🗑️  Clearing specified tables...")
    
    tables_to_clear = [
        'audit_logs',  # 4. Clear audit logs
        'majors',  # 6. Clear majors
        'courses',  # 8. Clear courses (cascades to sections, schedules)
        'course_sections',
        'section_schedules',
        'enrollments',  # 11. Clear enrollments
        'attendance',  # 12. Clear attendance
        'grades',  # 13. Clear grades
        'assignments',  # 14. Remove assignments
        'fee_structures',  # 15. Clear fee structures
        'invoices',  # 16. Clear invoices
        'invoice_lines',
        'payments',  # 18. Remove payments
        'document_requests',  # 20. Clear document requests
        'announcements',  # 21. Clear announcements
        'support_tickets',  # 22. Clear support tickets
        'ticket_events',
        'chat_rooms',  # 24. Remove chat
        'chat_participants',  # 25. Remove chat participants
        'device_tokens',  # 26. Remove device tokens
        'users',  # 1. Clear users (will recreate)
        'user_roles',
    ]
    
    await session.execute(text("SET session_replication_role = 'replica';"))
    
    for table in tables_to_clear:
        try:
            result = await session.execute(text(f"DELETE FROM {table}"))
            print(f"  ✅ Cleared {table}: {result.rowcount} rows")
        except Exception as e:
            print(f"  ⚠️  Error clearing {table}: {e}")
    
    await session.execute(text("SET session_replication_role = 'origin';"))
    
    # Reset sequences for tables with auto-increment IDs
    sequences_to_reset = [
        'users_id_seq',
        'majors_id_seq',
        'courses_id_seq',
        'course_sections_id_seq',
        'enrollments_id_seq',
        'attendance_id_seq',
        'grades_id_seq',
        'invoices_id_seq',
        'invoice_lines_id_seq',
        'fee_structures_id_seq',
        'document_requests_id_seq',
        'announcements_id_seq',
        'support_tickets_id_seq'
    ]
    
    for seq in sequences_to_reset:
        try:
            await session.execute(text(f"ALTER SEQUENCE {seq} RESTART WITH 1"))
        except Exception as e:
            # Sequence might not exist
            pass
    
    await session.commit()


async def get_campuses(session: AsyncSession):
    """Get existing campuses."""
    result = await session.execute(select(Campus))
    return result.scalars().all()


async def get_role_by_code(session: AsyncSession, code: str):
    """Get role by code."""
    result = await session.execute(select(Role).where(Role.code == code))
    return result.scalar_one_or_none()


async def create_majors(session: AsyncSession):
    """Create new majors."""
    print("\n📚 Creating majors...")
    
    majors_data = [
        {"code": "COMP", "name": "Computing", "description": "Computer Science and IT programs"},
        {"code": "BUSM", "name": "Business Management", "description": "Business and Management programs"},
        {"code": "GDES", "name": "Graphic Design", "description": "Graphic Design and Visual Arts programs"},
    ]
    
    majors = []
    for data in majors_data:
        major = Major(**data)
        session.add(major)
        majors.append(major)
        print(f"  ✅ Created major: {data['name']}")
    
    await session.flush()
    return majors


async def create_users(session: AsyncSession, campuses: list):
    """Create users with Vietnamese names: students (including Nguyen Dinh Hieu), teachers, and admins."""
    print("\n👥 Creating users...")
    
    users = []
    
    # Vietnamese names for students (first_name, last_name)
    vietnamese_student_names = {
        'H': [
            ("Tran Minh", "An"),
            ("Le Hoang", "Bao"),
            ("Pham Thi", "Linh"),
        ],
        'D': [
            ("Nguyen Dinh", "Hieu"),  # Special student - Da Nang
            ("Pham Thanh", "Chi"),
            ("Nguyen Thi", "Dung"),
        ],
        'C': [
            ("Vo Minh", "Tam"),
            ("Dang Quoc", "Vinh"),
            ("Bui Thi", "Mai"),
        ],
        'S': [
            ("Truong Gia", "Huy"),
            ("Ly Thanh", "Nhan"),
            ("Do Hai", "Yen"),
        ],
    }
    
    # Vietnamese names for teachers
    vietnamese_teacher_names = {
        'H': ("Dr. Nguyen Van", "Tuan"),
        'D': ("Dr. Pham Thi", "Lan"),
        'C': ("Dr. Le Minh", "Quang"),
        'S': ("Dr. Tran Hoang", "Nam"),
    }
    
    # Major codes: C=Computing, B=Business, D=Graphic Design
    major_codes = {
        'Computing': 'C',
        'Business Management': 'B',
        'Graphic Design': 'D',
    }
    
    # 1. Create superadmin
    print("\n  Creating Super Admin...")
    superadmin_email = "superadmin@greenwich.edu.vn"
    firebase_uid = create_firebase_user(superadmin_email, "Admin@123", "Super Administrator")
    
    superadmin = User(
        username="super_admin",
        email=superadmin_email,
        full_name="Super Administrator",
        firebase_uid=firebase_uid,
        role="super_admin",
        status="active",
        password_hash=SecurityUtils.hash_password("Admin@123")
    )
    session.add(superadmin)
    await session.flush()
    
    # Assign super_admin role
    super_admin_role = await get_role_by_code(session, "super_admin")
    if super_admin_role:
        await session.execute(text(
            "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
        ), {"user_id": superadmin.id, "role_id": super_admin_role.id})
        print(f"  ✅ Created: {superadmin.username} ({superadmin_email})")
    
    users.append(superadmin)
    
    # 2. Get all majors to assign students
    result = await session.execute(select(Major))
    majors = result.scalars().all()
    
    # 3. For each campus, create students with different majors, teachers, and admins
    admin_types = ['academic_admin', 'finance_admin', 'support_admin']
    
    for campus in campuses:
        campus_code = campus.code
        print(f"\n  Creating users for Campus {campus_code}...")
        
        # Get student names for this campus
        student_names = vietnamese_student_names.get(campus_code, [])
        
        # Create students (one per major)
        for idx, major in enumerate(majors):
            if idx >= len(student_names):
                break
                
            first_name, last_name = student_names[idx]
            major_code = major_codes.get(major.name, 'C')
            
            # Special case for Nguyen Dinh Hieu
            if first_name == "Nguyen Dinh" and last_name == "Hieu":
                student_id = "0033"
            else:
                student_id = f"{idx+1:04d}"
            
            # Generate username: NameInitialsGCampusMajorYYXXXX
            # Example: HieuNDGCD220033 (Hieu ND, Greenwich, Computing, Da Nang)
            first_initial = ''.join([word[0] for word in first_name.split()])
            last_initial = last_name[0]
            student_username = f"{last_name}{first_initial}G{major_code}{campus_code}22{student_id}"
            student_email = f"{student_username}@student.greenwich.edu.vn"
            
            full_name = f"{first_name} {last_name}"
            firebase_uid = create_firebase_user(student_email, "Student@123", full_name)
            
            student = User(
                username=student_username,
                email=student_email,
                full_name=full_name,
                firebase_uid=firebase_uid,
                campus_id=campus.id,
                role="student",
                status="active",
                password_hash=SecurityUtils.hash_password("Student@123")
            )
            session.add(student)
            await session.flush()
            
            student_role = await get_role_by_code(session, "student")
            if student_role:
                await session.execute(text(
                    "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
                ), {"user_id": student.id, "role_id": student_role.id})
            
            print(f"    ✅ Student: {student_username} ({full_name})")
            users.append(student)
        
        # Create 1 teacher with Vietnamese name
        teacher_first, teacher_last = vietnamese_teacher_names.get(campus_code, ("Dr.", "Teacher"))
        teacher_full_name = f"{teacher_first} {teacher_last}"
        
        # Extract first name and get initials from middle/last names
        # Format: FirstnameLastnameInitial + sequence
        # E.g., "Dr. Nguyen Van Tuan" -> "TuanNV1"
        name_parts = teacher_full_name.replace("Dr. ", "").split()
        first_name = name_parts[-1]  # Last word is the first name in Vietnamese
        middle_last = name_parts[:-1]  # Everything before is middle/last name
        initials = ''.join([n[0].upper() for n in middle_last])
        teacher_username = f"{first_name}{initials}1"
        teacher_email = f"{teacher_username}@greenwich.edu.vn"
        firebase_uid = create_firebase_user(teacher_email, "Teacher@123", teacher_full_name)
        
        teacher = User(
            username=teacher_username,
            email=teacher_email,
            full_name=teacher_full_name,
            firebase_uid=firebase_uid,
            campus_id=campus.id,
            role="teacher",
            status="active",
            password_hash=SecurityUtils.hash_password("Teacher@123")
        )
        session.add(teacher)
        await session.flush()
        
        teacher_role = await get_role_by_code(session, "teacher")
        if teacher_role:
            await session.execute(text(
                "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
            ), {"user_id": teacher.id, "role_id": teacher_role.id})
        
        print(f"    ✅ Teacher: {teacher_username} ({teacher_full_name})")
        users.append(teacher)
        
        # Create all admin types
        for admin_type in admin_types:
            admin_username = f"{admin_type}_{campus_code.lower()}"
            admin_email = f"{admin_username}@greenwich.edu.vn"
            admin_name = admin_type.replace('_', ' ').title()
            firebase_uid = create_firebase_user(admin_email, "Admin@123", f"{admin_name} {campus_code}")
            
            admin = User(
                username=admin_username,
                email=admin_email,
                full_name=f"{admin_name} {campus_code}",
                firebase_uid=firebase_uid,
                campus_id=campus.id,
                role=admin_type,
                status="active",
                password_hash=SecurityUtils.hash_password("Admin@123")
            )
            session.add(admin)
            await session.flush()
            
            admin_role = await get_role_by_code(session, admin_type)
            if admin_role:
                await session.execute(text(
                    "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
                ), {"user_id": admin.id, "role_id": admin_role.id})
            
            print(f"    ✅ Admin: {admin_username}")
            users.append(admin)
    
    await session.commit()
    return users


async def create_courses(session: AsyncSession, majors: list):
    """Create 2 courses for each major."""
    print("\n📖 Creating courses...")
    
    course_templates = {
        "Computing": [
            {"course_code": "COMP1001", "name": "Introduction to Programming", "credits": 15, "description": "Basic programming concepts"},
            {"course_code": "COMP1002", "name": "Data Structures and Algorithms", "credits": 15, "description": "Advanced data structures"},
        ],
        "Business Management": [
            {"course_code": "BUSM1001", "name": "Business Fundamentals", "credits": 15, "description": "Core business principles"},
            {"course_code": "BUSM1002", "name": "Marketing Management", "credits": 15, "description": "Marketing strategies"},
        ],
        "Graphic Design": [
            {"course_code": "GDES1001", "name": "Design Principles", "credits": 15, "description": "Foundation of design"},
            {"course_code": "GDES1002", "name": "Digital Illustration", "credits": 15, "description": "Digital art techniques"},
        ],
    }
    
    courses = []
    for major in majors:
        templates = course_templates.get(major.name, [])
        for template in templates:
            course = Course(
                **template,
                major_id=major.id
            )
            session.add(course)
            courses.append(course)
            print(f"  ✅ Created: {template['course_code']} - {template['name']}")
    
    await session.flush()
    return courses


async def create_sections_and_schedules(session: AsyncSession, courses: list, teachers: list, campuses: list):
    """Create 2 sections per course with schedules."""
    print("\n🏫 Creating course sections and schedules...")
    
    # Get current semester
    result = await session.execute(
        select(Semester)
        .where(Semester.is_current == True)
        .limit(1)
    )
    current_semester = result.scalar_one_or_none()
    
    if not current_semester:
        print("  ⚠️  No current semester found!")
        return []
    
    sections = []
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    time_slots = [
        (datetime_time(8, 0), datetime_time(10, 0)),
        (datetime_time(10, 0), datetime_time(12, 0)),
        (datetime_time(13, 0), datetime_time(15, 0)),
        (datetime_time(15, 0), datetime_time(17, 0)),
    ]
    
    section_counter = 1
    for course in courses:
        # Assign to a random campus and teacher
        campus = random.choice(campuses)
        teacher = random.choice([t for t in teachers if t.campus_id == campus.id])
        
        for i in range(2):  # 2 sections per course
            section_code = f"S{section_counter:02d}"  # Just S01, S02, etc.
            
            section = CourseSection(
                course_id=course.id,
                section_code=section_code,
                semester_id=current_semester.id,
                instructor_id=teacher.id,
                max_students=30,
                enrolled_count=0
            )
            session.add(section)
            await session.flush()
            
            # Create schedule (2 sessions per week) - store in JSONB
            selected_days = random.sample(days, 2)
            time_slot = random.choice(time_slots)
            
            schedule_data = {
                "sessions": [
                    {
                        "day": selected_days[0],
                        "start_time": time_slot[0].strftime("%H:%M"),
                        "end_time": time_slot[1].strftime("%H:%M"),
                        "room": "Room-" + str(random.randint(101, 999))
                    },
                    {
                        "day": selected_days[1],
                        "start_time": time_slot[0].strftime("%H:%M"),
                        "end_time": time_slot[1].strftime("%H:%M"),
                        "room": "Room-" + str(random.randint(101, 999))
                    }
                ]
            }
            section.schedule = schedule_data
            
            sections.append(section)
            section_counter += 1
            print(f"  ✅ Created: {section_code} ({selected_days[0]} {time_slot[0]}-{time_slot[1]})")
    
    await session.flush()
    return sections


async def check_schedule_conflict(session: AsyncSession, student_id: int, section_id: int):
    """Check if enrolling in this section causes schedule conflict."""
    # Get the new section's schedule
    result = await session.execute(
        select(CourseSection)
        .where(CourseSection.id == section_id)
    )
    new_section = result.scalar_one_or_none()
    if not new_section or not new_section.schedule:
        return False
    
    new_schedule = new_section.schedule.get('sessions', [])
    
    # Get all student's current enrollments with their schedules
    result = await session.execute(
        select(Enrollment, CourseSection)
        .join(CourseSection, Enrollment.course_section_id == CourseSection.id)
        .where(Enrollment.student_id == student_id)
    )
    enrollments_with_sections = result.all()
    
    # Check for conflicts
    for enrollment, existing_section in enrollments_with_sections:
        if not existing_section.schedule:
            continue
            
        existing_schedule = existing_section.schedule.get('sessions', [])
        
        for new_sess in new_schedule:
            for exist_sess in existing_schedule:
                if (new_sess['day'] == exist_sess['day'] and
                    new_sess['start_time'] < exist_sess['end_time'] and
                    new_sess['end_time'] > exist_sess['start_time']):
                    return True  # Conflict found
    
    return False  # No conflict


async def enroll_students(session: AsyncSession, students: list, sections: list):
    """Enroll students to sections, checking for conflicts."""
    print("\n📝 Enrolling students...")
    
    enrollments = []
    for student in students:
        # Enroll each student in 4-6 sections
        num_courses = random.randint(4, 6)
        enrolled_count = 0
        attempts = 0
        max_attempts = len(sections) * 2
        
        available_sections = sections.copy()
        random.shuffle(available_sections)
        
        while enrolled_count < num_courses and attempts < max_attempts:
            if not available_sections:
                break
                
            section = available_sections.pop(0)
            attempts += 1
            
            # Check for conflict
            has_conflict = await check_schedule_conflict(session, student.id, section.id)
            
            if not has_conflict:
                enrollment = Enrollment(
                    student_id=student.id,
                    course_section_id=section.id,
                    enrollment_date=datetime.now(),
                    status='enrolled'
                )
                session.add(enrollment)
                enrollments.append(enrollment)
                enrolled_count += 1
                
                # Update section enrollment count
                section.enrolled_count += 1
        
        print(f"  ✅ Enrolled {student.username}: {enrolled_count} sections")
    
    await session.flush()
    
    # Query back all enrollments to ensure we have IDs
    result = await session.execute(select(Enrollment))
    enrollments_with_ids = result.scalars().all()
    
    return enrollments_with_ids


async def create_attendance(session: AsyncSession, enrollments: list):
    """Create attendance records. Make 1 student at risk in 2 courses."""
    print("\n📅 Creating attendance records...")
    
    # Group enrollments by student
    from collections import defaultdict
    student_enrollments = defaultdict(list)
    for enrollment in enrollments:
        student_enrollments[enrollment.student_id].append(enrollment)
    
    # Pick one student to be at risk
    at_risk_student_id = random.choice(list(student_enrollments.keys()))
    at_risk_sections = random.sample(student_enrollments[at_risk_student_id], min(2, len(student_enrollments[at_risk_student_id])))
    at_risk_section_ids = [e.course_section_id for e in at_risk_sections]
    
    for enrollment in enrollments:
        # Create 10 attendance records
        for i in range(10):
            date = datetime.now() - timedelta(days=70-i*7)
            
            # If this is an at-risk section, make attendance poor (40% present)
            if enrollment.course_section_id in at_risk_section_ids:
                is_present = random.random() < 0.4
            else:
                is_present = random.random() < 0.85  # Normal 85% attendance
            
            attendance = Attendance(
                enrollment_id=enrollment.id,
                date=date.date(),
                status='present' if is_present else 'absent'
            )
            session.add(attendance)
    
    await session.flush()
    print(f"  ✅ Created attendance records (Student {at_risk_student_id} at risk)")


async def create_grades(session: AsyncSession, enrollments: list):
    """Create grades for students."""
    print("\n📊 Creating grades...")
    
    for enrollment in enrollments:
        # Random grade between 50-95
        grade_value = random.uniform(50, 95)
        
        grade = Grade(
            enrollment_id=enrollment.id,
            assignment_name='Final Exam',
            grade_value=grade_value,
            max_grade=100.0,
            weight=1.0,
            graded_at=datetime.now(),
            approval_status='published'
        )
        session.add(grade)
    
    await session.flush()
    print(f"  ✅ Created {len(enrollments)} grade records")


async def create_fee_structures(session: AsyncSession, students: list, majors: list):
    """Create fee structures for students."""
    print("\n💰 Creating fee structures...")
    
    # Get current semester
    result = await session.execute(
        select(Semester).where(Semester.is_current == True).limit(1)
    )
    current_semester = result.scalar_one_or_none()
    
    if not current_semester:
        return
    
    for student in students:
        # Get student's major
        result = await session.execute(
            select(User).where(User.id == student.id)
        )
        user = result.scalar_one()
        
        # Create fee structure
        fee = FeeStructure(
            student_id=student.id,
            semester_id=current_semester.id,
            tuition_fee=5000.00,
            due_date=(datetime.now() + timedelta(days=30)).date()
        )
        session.add(fee)
    
    await session.flush()
    print(f"  ✅ Created fee structures for {len(students)} students")


async def create_invoices(session: AsyncSession, students: list):
    """Create invoices for students."""
    print("\n🧾 Creating invoices...")
    
    # Get current semester
    result = await session.execute(
        select(Semester).where(Semester.is_current == True).limit(1)
    )
    current_semester = result.scalar_one_or_none()
    
    for student in students:
        invoice = Invoice(
            student_id=student.id,
            semester_id=current_semester.id,
            invoice_number=f"INV-{student.id:04d}-{current_semester.id:02d}",
            issue_date=datetime.now().date(),
            due_date=(datetime.now() + timedelta(days=30)).date(),
            total_amount=5000.00,
            status='pending'
        )
        session.add(invoice)
        await session.flush()
        
        # Add invoice line
        line = InvoiceLine(
            invoice_id=invoice.id,
            description="Tuition Fee",
            amount=5000.00
        )
        session.add(line)
    
    await session.flush()
    print(f"  ✅ Created invoices for {len(students)} students")


async def create_document_requests(session: AsyncSession, students: list):
    """Create document requests for students."""
    print("\n📄 Creating document requests...")
    
    doc_types = ['transcript', 'certificate', 'letter']
    
    for student in students:
        # Create 1-2 document requests per student
        num_requests = random.randint(1, 2)
        for _ in range(num_requests):
            doc_request = DocumentRequest(
                student_id=student.id,
                document_type=random.choice(doc_types),
                purpose=f"Request for {random.choice(['job application', 'further study', 'personal use'])}",
                status=random.choice(['pending', 'processing', 'completed']),
                requested_at=datetime.now(),
                notes=""
            )
            session.add(doc_request)
    
    await session.flush()
    print(f"  ✅ Created document requests")


async def create_fee_structures_and_invoices(session: AsyncSession, students: list):
    """Create fee structures and invoices for students."""
    print("\n💰 Creating fee structures and invoices...")
    
    # Create fee structures for different programs
    result = await session.execute(select(Major))
    majors = result.scalars().all()
    
    fee_structures = []
    for major in majors:
        # Tuition fee
        tuition = FeeStructure(
            major_id=major.id,
            fee_type='tuition',
            amount=15000000,  # 15 million VND per semester
            description=f'Tuition fee for {major.name}',
            is_active=True
        )
        session.add(tuition)
        fee_structures.append(tuition)
        
        # Facility fee
        facility = FeeStructure(
            major_id=major.id,
            fee_type='facility',
            amount=2000000,  # 2 million VND per semester
            description='Facility and maintenance fee',
            is_active=True
        )
        session.add(facility)
        fee_structures.append(facility)
    
    await session.flush()
    
    # Create invoices for students
    invoice_count = 0
    for student in students:
        # Get student's major from enrollments
        result = await session.execute(
            select(Course).join(CourseSection, Course.id == CourseSection.course_id)
            .join(Enrollment, Enrollment.course_section_id == CourseSection.id)
            .where(Enrollment.student_id == student.id)
            .limit(1)
        )
        course = result.scalar_one_or_none()
        
        if not course or not course.major_id:
            continue
        
        # Create invoice
        invoice = Invoice(
            student_id=student.id,
            invoice_number=f'INV-2024-{student.id:04d}',
            issued_date=datetime.now() - timedelta(days=30),
            due_date=datetime.now() + timedelta(days=30),
            total_amount=17000000,  # Tuition + Facility
            paid_amount=random.choice([0, 8500000, 17000000]),  # Some paid, some partially paid, some unpaid
            status=random.choice(['pending', 'partial', 'paid'])
        )
        session.add(invoice)
        await session.flush()
        
        # Add invoice lines
        # Tuition line
        tuition_line = InvoiceLine(
            invoice_id=invoice.id,
            description='Tuition Fee - Semester 1 2024',
            qty=1,
            unit_price=15000000,
            amount=15000000
        )
        session.add(tuition_line)
        
        # Facility line
        facility_line = InvoiceLine(
            invoice_id=invoice.id,
            description='Facility Fee - Semester 1 2024',
            qty=1,
            unit_price=2000000,
            amount=2000000
        )
        session.add(facility_line)
        
        invoice_count += 1
    
    await session.flush()
    print(f"  ✅ Created {len(fee_structures)} fee structures and {invoice_count} invoices")


async def create_announcements(session: AsyncSession):
    """Create 5 announcements."""
    print("\n📢 Creating announcements...")
    
    announcements_data = [
        {"title": "Welcome to New Semester", "content": "Welcome back students! The new semester has begun."},
        {"title": "Library Hours Extended", "content": "Library will be open until 10 PM during exam week."},
        {"title": "Career Fair Next Week", "content": "Join us for the annual career fair next Wednesday."},
        {"title": "Campus Maintenance Notice", "content": "Building A will be closed for maintenance on Saturday."},
        {"title": "Exam Schedule Released", "content": "Final exam schedule is now available on the portal."},
    ]
    
    for data in announcements_data:
        announcement = Announcement(
            **data,
            is_published=True
        )
        session.add(announcement)
    
    await session.flush()
    print(f"  ✅ Created 5 announcements")


async def create_support_tickets(session: AsyncSession, students: list):
    """Create support tickets for students."""
    print("\n🎫 Creating support tickets...")
    
    categories = ['technical', 'academic', 'financial', 'account', 'other']
    subjects = [
        "Cannot access my grades",
        "Need help with enrollment",
        "Payment issue",
        "Password reset request",
        "Question about course schedule"
    ]
    
    for student in students:
        # Create 1-2 tickets per student
        num_tickets = random.randint(1, 2)
        for _ in range(num_tickets):
            ticket = SupportTicket(
                user_id=student.id,
                subject=random.choice(subjects),
                description=f"Support request from {student.username}",
                category=random.choice(categories),
                status=random.choice(['open', 'in_progress', 'resolved']),
                priority=random.choice(['low', 'medium', 'high']),
                created_at=datetime.now()
            )
            session.add(ticket)
    
    await session.flush()
    print(f"  ✅ Created support tickets")


async def main():
    """Main seeding function."""
    print("\n" + "="*60)
    print("FRESH DATABASE SEEDING")
    print("="*60)
    
    # Initialize Firebase
    try:
        cred_path = Path(__file__).parent / "credentials" / "serviceAccountKey.json"
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized")
    except Exception as e:
        print(f"⚠️  Firebase already initialized or error: {e}")
    
    async with AsyncSessionLocal() as session:
        # Clear tables
        await clear_tables(session)
        
        # Get existing data
        campuses = await get_campuses(session)
        print(f"\n📍 Found {len(campuses)} campuses")
        
        # Create new data
        majors = await create_majors(session)
        users = await create_users(session, campuses)
        
        # Separate users by role
        students = [u for u in users if u.role == 'student']
        teachers = [u for u in users if u.role == 'teacher']
        
        # Create courses and sections
        courses = await create_courses(session, majors)
        sections = await create_sections_and_schedules(session, courses, teachers, campuses)
        
        # Enroll students
        enrollments = await enroll_students(session, students, sections)
        await session.commit()  # Commit enrollments before creating dependent data
        
        # Create related data
        await create_attendance(session, enrollments)
        await create_grades(session, enrollments)
        await create_fee_structures_and_invoices(session, students)
        await create_document_requests(session, students)
        await create_announcements(session)
        await create_support_tickets(session, students)
        
        # Commit all changes before session closes
        await session.commit()
    
    print("\n" + "="*60)
    print("✅ DATABASE SEEDING COMPLETED!")
    print("="*60)
    print("\n📝 Summary:")
    print(f"  - Campuses: {len(campuses)} (kept)")
    print(f"  - Majors: 3 new (Computing, Business Management, Graphic Design)")
    print(f"  - Users: {len(users)} total")
    print(f"    • Students: {len(students)}")
    print(f"    • Teachers: {len(teachers)}")
    print(f"    • Admins: {len(users) - len(students) - len(teachers)}")
    print(f"  - Courses: {len(courses)}")
    print(f"  - Sections: {len(sections)}")
    print(f"  - Enrollments: {len(enrollments)}")
    print(f"  - Announcements: 5")
    print("\n🔑 Login Credentials:")
    print(f"  Superadmin: superadmin@greenwich.edu.vn / Admin@123")
    print(f"\n  📚 Sample Student Logins (by major):")
    print(f"    Computing (C):   HieuNDGCD220033@student.greenwich.edu.vn / Student@123 (Nguyen Dinh Hieu - Da Nang)")
    print(f"    Business (B):    AnTMGBH220001@student.greenwich.edu.vn / Student@123 (Tran Minh An - Ha Noi)")
    print(f"    Design (D):      BaoLHGDH220002@student.greenwich.edu.vn / Student@123 (Le Hoang Bao - Ha Noi)")
    print(f"\n  👨‍🏫 Sample Teacher Login:")
    print(f"    teacher_h001@greenwich.edu.vn / Teacher@123")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
