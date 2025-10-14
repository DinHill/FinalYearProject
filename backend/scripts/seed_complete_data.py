"""
Complete Seed Data Script - Initialize all test data
Creates realistic test data for all models in the database
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
from uuid import uuid4
import random

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db, engine
from app.models import (
    Campus, Major, User, Course, 
    Enrollment, Grade, Invoice, Payment, Document,
    SupportTicket, Announcement
)
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import SecurityUtils


# Test user passwords (for demo purposes)
TEST_PASSWORD = "Test123!@#"

async def seed_campuses(db: AsyncSession):
    """Seed campus data"""
    print("🏫 Creating campuses...")
    campuses = [
        Campus(
            code="H",
            name="Hanoi Campus",
            address="Tran Duy Hung Street, Cau Giay District, Hanoi"
        ),
        Campus(
            code="D",
            name="Da Nang Campus",
            address="Nguyen Van Linh Street, Thanh Khe District, Da Nang"
        ),
        Campus(
            code="C",
            name="Can Tho Campus",
            address="Nguyen Van Cu Street, Ninh Kieu District, Can Tho"
        ),
        Campus(
            code="S",
            name="Ho Chi Minh Campus",
            address="Nguyen Thi Minh Khai Street, District 1, Ho Chi Minh City"
        )
    ]
    
    for campus in campuses:
        db.add(campus)
    
    await db.commit()
    print(f"✅ Created {len(campuses)} campuses")
    return campuses


async def seed_majors(db: AsyncSession):
    """Seed major data"""
    print("📚 Creating majors...")
    majors = [
        Major(
            code="CS",
            name="Computer Science",
            description="Bachelor of Science in Computer Science - Software Engineering, AI, Data Science"
        ),
        Major(
            code="BA",
            name="Business Administration",
            description="Bachelor of Business Administration - Management, Marketing, Finance"
        ),
        Major(
            code="GD",
            name="Graphic Design",
            description="Bachelor of Arts in Design - Graphics, UX/UI, Digital Media"
        ),
        Major(
            code="IT",
            name="Information Technology",
            description="Bachelor of Information Technology - Networks, Security, Cloud Computing"
        ),
        Major(
            code="MK",
            name="Marketing",
            description="Bachelor of Marketing - Digital Marketing, Brand Management, Analytics"
        )
    ]
    
    for major in majors:
        db.add(major)
    
    await db.commit()
    print(f"✅ Created {len(majors)} majors")
    return majors


async def seed_users(db: AsyncSession, campuses):
    """Seed user data (admin, students, teachers)"""
    print("👥 Creating users...")
    users = []
    
    # Hashed password for all test users
    hashed_password = SecurityUtils.hash_password(TEST_PASSWORD)
    
    # 1. Admin User
    admin = User(
        firebase_uid=f"admin_{uuid4().hex[:8]}",
        email="admin@greenwich.edu.vn",
        username="admin",
        full_name="System Administrator",
        phone="0901234567",
        role="admin",
        is_active=True,
        hashed_password=hashed_password
    )
    db.add(admin)
    users.append(admin)
    
    # 2. Students
    student_names = [
        ("John", "Doe", "john.doe"),
        ("Jane", "Smith", "jane.smith"),
        ("Michael", "Johnson", "michael.johnson"),
        ("Emily", "Brown", "emily.brown"),
        ("David", "Lee", "david.lee"),
        ("Sarah", "Wilson", "sarah.wilson"),
        ("James", "Taylor", "james.taylor"),
        ("Emma", "Anderson", "emma.anderson"),
        ("Daniel", "Thomas", "daniel.thomas"),
        ("Olivia", "Martinez", "olivia.martinez")
    ]
    
    for i, (first, last, username) in enumerate(student_names, 1):
        user = User(
            firebase_uid=f"student_{uuid4().hex[:8]}",
            email=f"{username}@student.greenwich.edu.vn",
            username=username,
            full_name=f"{first} {last}",
            phone=f"090{1000000 + i}",
            role="student",
            is_active=True,
            hashed_password=hashed_password
        )
        db.add(user)
        users.append(user)
    
    # 3. Teachers
    teacher_names = [
        ("Dr. Robert", "Williams", "robert.williams"),
        ("Prof. Linda", "Garcia", "linda.garcia"),
        ("Dr. William", "Martinez", "william.martinez"),
        ("Prof. Jennifer", "Rodriguez", "jennifer.rodriguez"),
        ("Dr. Richard", "Davis", "richard.davis")
    ]
    
    for i, (title_first, last, username) in enumerate(teacher_names, 1):
        user = User(
            firebase_uid=f"teacher_{uuid4().hex[:8]}",
            email=f"{username}@teacher.greenwich.edu.vn",
            username=username,
            full_name=f"{title_first} {last}",
            phone=f"091{2000000 + i}",
            role="teacher",
            is_active=True,
            hashed_password=hashed_password
        )
        db.add(user)
        users.append(user)
    
    await db.commit()
    print(f"✅ Created {len(users)} users (1 admin, 10 students, 5 teachers)")
    return users


async def seed_students(db: AsyncSession, users, campuses, majors):
    """Seed student records"""
    print("🎓 Creating student records...")
    students = []
    
    student_users = [u for u in users if u.role == "student"]
    
    for i, user in enumerate(student_users, 1):
        student = Student(
            user_id=user.id,
            student_code=f"GW{2024000 + i}",
            campus_code=random.choice(campuses).code,
            major_code=random.choice(majors).code,
            intake="2024.1",
            year_of_study=random.randint(1, 4),
            status="active",
            gpa=round(random.uniform(2.5, 4.0), 2),
            date_of_birth=datetime.now() - timedelta(days=random.randint(7300, 9125)),  # 20-25 years old
            address=f"{random.randint(1, 100)} Main Street, Hanoi",
            emergency_contact_name=f"Parent of {user.full_name}",
            emergency_contact_phone=f"090{3000000 + i}"
        )
        db.add(student)
        students.append(student)
    
    await db.commit()
    print(f"✅ Created {len(students)} student records")
    return students


async def seed_teachers(db: AsyncSession, users, campuses):
    """Seed teacher records"""
    print("👨‍🏫 Creating teacher records...")
    teachers = []
    
    teacher_users = [u for u in users if u.role == "teacher"]
    departments = ["Computer Science", "Business", "Design", "Engineering", "Mathematics"]
    
    for i, user in enumerate(teacher_users, 1):
        teacher = Teacher(
            user_id=user.id,
            teacher_code=f"TCH{2024000 + i}",
            campus_code=random.choice(campuses).code,
            department=random.choice(departments),
            position=random.choice(["Lecturer", "Senior Lecturer", "Associate Professor", "Professor"]),
            specialization=random.choice(["Software Engineering", "Data Science", "Web Development", "Mobile Development", "AI/ML"]),
            hire_date=datetime.now() - timedelta(days=random.randint(365, 3650)),
            office_location=f"Building A, Room {random.randint(100, 500)}",
            office_hours="Monday-Friday, 2PM-4PM"
        )
        db.add(teacher)
        teachers.append(teacher)
    
    await db.commit()
    print(f"✅ Created {len(teachers)} teacher records")
    return teachers


async def seed_courses(db: AsyncSession, teachers, majors):
    """Seed course data"""
    print("📖 Creating courses...")
    courses = []
    
    course_data = [
        ("COMP1640", "Web Development Fundamentals", "CS", 4),
        ("COMP1841", "Database Systems", "CS", 4),
        ("COMP1842", "Object-Oriented Programming", "CS", 3),
        ("COMP2640", "Advanced Web Development", "CS", 4),
        ("COMP2841", "Mobile Application Development", "CS", 4),
        ("COMP3640", "Cloud Computing", "IT", 3),
        ("BUS1001", "Introduction to Business", "BA", 3),
        ("BUS2001", "Marketing Management", "MK", 4),
        ("BUS3001", "Strategic Management", "BA", 4),
        ("DES1001", "Graphic Design Basics", "GD", 3),
        ("DES2001", "UX/UI Design", "GD", 4),
        ("DES3001", "Digital Media Production", "GD", 4),
        ("COMP3841", "Artificial Intelligence", "CS", 4),
        ("COMP3842", "Data Science & Analytics", "CS", 4),
        ("BUS2002", "Financial Management", "BA", 3)
    ]
    
    current_semester = "2024.2"
    
    for code, name, major_code, credits in course_data:
        teacher = random.choice(teachers)
        course = Course(
            code=code,
            name=name,
            major_code=major_code,
            credits=credits,
            teacher_id=teacher.id,
            semester=current_semester,
            description=f"This course covers the fundamentals and advanced topics in {name}.",
            max_students=random.randint(30, 50),
            schedule=f"{random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])} {random.randint(8, 16)}:00-{random.randint(9, 18)}:00",
            room=f"Room {random.randint(100, 500)}",
            status="active"
        )
        db.add(course)
        courses.append(course)
    
    await db.commit()
    print(f"✅ Created {len(courses)} courses")
    return courses


async def seed_enrollments(db: AsyncSession, students, courses):
    """Seed enrollment data"""
    print("📝 Creating enrollments...")
    enrollments = []
    
    # Each student enrolls in 3-5 courses
    for student in students:
        num_courses = random.randint(3, 5)
        student_courses = random.sample(courses, num_courses)
        
        for course in student_courses:
            enrollment = Enrollment(
                student_id=student.id,
                course_id=course.id,
                semester=course.semester,
                status=random.choice(["active", "active", "active", "completed"]),
                enrollment_date=datetime.now() - timedelta(days=random.randint(30, 90))
            )
            db.add(enrollment)
            enrollments.append(enrollment)
    
    await db.commit()
    print(f"✅ Created {len(enrollments)} enrollments")
    return enrollments


async def seed_grades(db: AsyncSession, enrollments):
    """Seed grade data"""
    print("📊 Creating grades...")
    grades = []
    
    for enrollment in enrollments:
        if enrollment.status == "completed":
            # Create grades for completed courses
            grade = Grade(
                enrollment_id=enrollment.id,
                assessment_type=random.choice(["assignment", "midterm", "final"]),
                score=round(random.uniform(60, 100), 1),
                max_score=100.0,
                weight=random.choice([0.2, 0.3, 0.5]),
                grade_date=datetime.now() - timedelta(days=random.randint(1, 60)),
                comments=random.choice([
                    "Excellent work!",
                    "Good effort, keep it up!",
                    "Meets expectations",
                    "Outstanding performance",
                    "Well done!"
                ])
            )
            db.add(grade)
            grades.append(grade)
    
    await db.commit()
    print(f"✅ Created {len(grades)} grades")
    return grades


async def seed_invoices(db: AsyncSession, students):
    """Seed invoice data"""
    print("💰 Creating invoices...")
    invoices = []
    
    for student in students:
        # Create 1-2 invoices per student
        for i in range(random.randint(1, 2)):
            amount = random.choice([15000000, 18000000, 20000000])  # VND
            invoice = Invoice(
                student_id=student.id,
                invoice_number=f"INV{2024}{random.randint(10000, 99999)}",
                semester="2024.2",
                amount=amount,
                due_date=datetime.now() + timedelta(days=random.randint(10, 60)),
                status=random.choice(["pending", "paid", "overdue"]),
                description=f"Tuition fee for semester 2024.{i+1}",
                issue_date=datetime.now() - timedelta(days=random.randint(30, 90))
            )
            db.add(invoice)
            invoices.append(invoice)
    
    await db.commit()
    print(f"✅ Created {len(invoices)} invoices")
    return invoices


async def seed_payments(db: AsyncSession, invoices):
    """Seed payment data"""
    print("💳 Creating payments...")
    payments = []
    
    for invoice in invoices:
        if invoice.status == "paid":
            payment = Payment(
                invoice_id=invoice.id,
                amount=invoice.amount,
                payment_method=random.choice(["bank_transfer", "credit_card", "cash"]),
                transaction_id=f"TXN{uuid4().hex[:12].upper()}",
                payment_date=datetime.now() - timedelta(days=random.randint(1, 30)),
                status="completed"
            )
            db.add(payment)
            payments.append(payment)
    
    await db.commit()
    print(f"✅ Created {len(payments)} payments")
    return payments


async def seed_documents(db: AsyncSession, users):
    """Seed document metadata"""
    print("📄 Creating document records...")
    documents = []
    
    doc_categories = ["assignment", "transcript", "certificate", "document"]
    
    for user in users[:15]:  # First 15 users
        for i in range(random.randint(1, 3)):
            doc = Document(
                uploader_id=user.id,
                filename=f"document_{uuid4().hex[:8]}.pdf",
                file_type="pdf",
                file_path=f"documents/{user.id}/{uuid4().hex}.pdf",
                file_size=random.randint(100000, 5000000),
                category=random.choice(doc_categories),
                title=f"Sample Document {i+1}",
                description="Test document uploaded for demonstration",
                is_public=random.choice([True, False])
            )
            db.add(doc)
            documents.append(doc)
    
    await db.commit()
    print(f"✅ Created {len(documents)} document records")
    return documents


async def seed_support_tickets(db: AsyncSession, users):
    """Seed support ticket data"""
    print("🎫 Creating support tickets...")
    tickets = []
    
    categories = ["technical", "academic", "financial", "account"]
    priorities = ["low", "normal", "high"]
    statuses = ["open", "in_progress", "resolved", "closed"]
    
    student_users = [u for u in users if u.role == "student"][:5]
    
    for user in student_users:
        for i in range(random.randint(1, 2)):
            ticket = SupportTicket(
                user_id=user.id,
                subject=f"Issue with {random.choice(['login', 'grades', 'payment', 'enrollment'])}",
                description="I'm having an issue that needs assistance. Please help!",
                category=random.choice(categories),
                priority=random.choice(priorities),
                status=random.choice(statuses)
            )
            db.add(ticket)
            tickets.append(ticket)
    
    await db.commit()
    print(f"✅ Created {len(tickets)} support tickets")
    return tickets


async def seed_announcements(db: AsyncSession, users):
    """Seed announcement data"""
    print("📢 Creating announcements...")
    announcements = []
    
    admin_users = [u for u in users if u.role == "admin"]
    if admin_users:
        admin = admin_users[0]
        
        announcement_data = [
            ("Welcome to New Semester!", "academic", "high"),
            ("Holiday Schedule Update", "administrative", "normal"),
            ("Campus Maintenance Notice", "maintenance", "normal"),
            ("Registration Period Extended", "academic", "high"),
            ("New Course Offerings", "academic", "normal")
        ]
        
        for title, category, priority in announcement_data:
            announcement = Announcement(
                author_id=admin.id,
                title=title,
                content=f"This is an important announcement regarding {title.lower()}. Please read carefully.",
                category=category,
                target_audience="all",
                priority=priority,
                is_published=True
            )
            db.add(announcement)
            announcements.append(announcement)
    
    await db.commit()
    print(f"✅ Created {len(announcements)} announcements")
    return announcements


async def main():
    """Main seed function"""
    print("=" * 60)
    print("🌱 Starting comprehensive database seeding...")
    print("=" * 60)
    print()
    
    try:
        async with AsyncSession(engine) as db:
            # Seed in order (respecting foreign key dependencies)
            campuses = await seed_campuses(db)
            print()
            
            majors = await seed_majors(db)
            print()
            
            users = await seed_users(db, campuses)
            print()
            
            students = await seed_students(db, users, campuses, majors)
            print()
            
            teachers = await seed_teachers(db, users, campuses)
            print()
            
            courses = await seed_courses(db, teachers, majors)
            print()
            
            enrollments = await seed_enrollments(db, students, courses)
            print()
            
            grades = await seed_grades(db, enrollments)
            print()
            
            invoices = await seed_invoices(db, students)
            print()
            
            payments = await seed_payments(db, invoices)
            print()
            
            documents = await seed_documents(db, users)
            print()
            
            tickets = await seed_support_tickets(db, users)
            print()
            
            announcements = await seed_announcements(db, users)
            print()
            
            print("=" * 60)
            print("✨ Database seeding completed successfully!")
            print("=" * 60)
            print()
            print("📋 Summary:")
            print(f"   • Campuses: 4")
            print(f"   • Majors: 5")
            print(f"   • Users: 16 (1 admin, 10 students, 5 teachers)")
            print(f"   • Students: 10")
            print(f"   • Teachers: 5")
            print(f"   • Courses: 15")
            print(f"   • Enrollments: ~40")
            print(f"   • Grades: ~20")
            print(f"   • Invoices: ~20")
            print(f"   • Payments: ~10")
            print(f"   • Documents: ~30")
            print(f"   • Support Tickets: ~10")
            print(f"   • Announcements: 5")
            print()
            print("🔐 Test Login Credentials:")
            print(f"   Admin:   admin@greenwich.edu.vn / {TEST_PASSWORD}")
            print(f"   Student: john.doe@student.greenwich.edu.vn / {TEST_PASSWORD}")
            print(f"   Teacher: robert.williams@teacher.greenwich.edu.vn / {TEST_PASSWORD}")
            print()
            
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Error during seeding: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
