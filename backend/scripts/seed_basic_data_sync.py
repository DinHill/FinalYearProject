"""
Seed basic data for Greenwich Academic Portal (Synchronous version)

This script creates:
- Campuses (4)
- Majors (5)
- Test users (admin, teachers, students)
- Current semester
- Sample courses

Run against Render PostgreSQL database
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
import uuid

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session
from app.models.user import User, Campus, Major
from app.models.academic import Semester, Course
from app.core.security import SecurityUtils

# Database URL from environment or use Render production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://greenwich_kbjo_user:y0YK5JkjEPLAEBEFaJ4H2xajKaZMt46d@dpg-ctf2v8jtq21c73ctm940-a.singapore-postgres.render.com/greenwich_kbjo"
)

# Add SSL parameter for Render PostgreSQL (requires SSL)
if "?sslmode=" not in DATABASE_URL and "singapore-postgres.render.com" in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

# Create synchronous engine
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def seed_campuses(session: Session):
    """Seed campuses"""
    print("🏫 Seeding Campuses...")
    
    campuses_data = [
        {
            "code": "H",
            "name": "Hanoi Campus",
            "address": "FPT Tower, 10 Pham Van Bach",
            "city": "Hanoi",
            "country": "Vietnam",
            "phone": "+84 24 7300 5588",
            "email": "hanoi@greenwich.edu.vn",
            "is_active": True
        },
        {
            "code": "D",
            "name": "Da Nang Campus", 
            "address": "Lot 30 Quang Trung Software City",
            "city": "Da Nang",
            "country": "Vietnam",
            "phone": "+84 236 3525 688",
            "email": "danang@greenwich.edu.vn",
            "is_active": True
        },
        {
            "code": "C",
            "name": "Can Tho Campus",
            "address": "600A Nguyen Van Cu Noi Dai",
            "city": "Can Tho",
            "country": "Vietnam",
            "phone": "+84 292 3731 279",
            "email": "cantho@greenwich.edu.vn",
            "is_active": True
        },
        {
            "code": "S",
            "name": "Ho Chi Minh Campus",
            "address": "778/B1 Nguyen Kiem Street, Ward 4",
            "city": "Ho Chi Minh",
            "country": "Vietnam",
            "phone": "+84 28 7300 5588",
            "email": "hcm@greenwich.edu.vn",
            "is_active": True
        },
    ]
    
    created = 0
    for campus_data in campuses_data:
        existing = session.execute(
            select(Campus).where(Campus.code == campus_data["code"])
        ).scalar_one_or_none()
        
        if not existing:
            campus = Campus(**campus_data)
            session.add(campus)
            created += 1
            print(f"  ✅ Created: {campus.code} - {campus.name}")
        else:
            print(f"  ⏭️  Exists: {existing.code} - {existing.name}")
    
    session.commit()
    print(f"✅ Campuses seeded: {created} new, {len(campuses_data) - created} existing\n")


def seed_majors(session: Session):
    """Seed majors"""
    print("📚 Seeding Majors...")
    
    majors_data = [
        {
            "code": "C",
            "name": "Computer Science",
            "degree_type": "Bachelor",
            "credits_required": 360,
            "description": "Software development, algorithms, and computing systems"
        },
        {
            "code": "B",
            "name": "Business Administration",
            "degree_type": "Bachelor",
            "credits_required": 360,
            "description": "Management, finance, and business operations"
        },
        {
            "code": "D",
            "name": "Graphic Design",
            "degree_type": "Bachelor",
            "credits_required": 360,
            "description": "Visual communication and digital media"
        },
        {
            "code": "IT",
            "name": "Information Technology",
            "degree_type": "Bachelor",
            "credits_required": 360,
            "description": "IT infrastructure, networks, and systems administration"
        },
        {
            "code": "MK",
            "name": "Marketing",
            "degree_type": "Bachelor",
            "credits_required": 360,
            "description": "Digital marketing, branding, and consumer behavior"
        },
    ]
    
    created = 0
    for major_data in majors_data:
        existing = session.execute(
            select(Major).where(Major.code == major_data["code"])
        ).scalar_one_or_none()
        
        if not existing:
            major = Major(**major_data)
            session.add(major)
            created += 1
            print(f"  ✅ Created: {major.code} - {major.name}")
        else:
            print(f"  ⏭️  Exists: {existing.code} - {existing.name}")
    
    session.commit()
    print(f"✅ Majors seeded: {created} new, {len(majors_data) - created} existing\n")


def seed_users(session: Session):
    """Seed test users"""
    print("👥 Seeding Users...")
    
    # Get campuses and majors
    campuses = session.execute(select(Campus)).scalars().all()
    majors = session.execute(select(Major)).scalars().all()
    
    campus_map = {c.code: c.id for c in campuses}
    major_map = {m.code: m.id for m in majors}
    
    users_data = [
        # Admin
        {
            "username": "admin",
            "email": "admin@greenwich.edu.vn",
            "full_name": "System Administrator",
            "hashed_password": SecurityUtils.get_password_hash("admin123"),
            "role": "admin",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "phone_number": "+84 236 3525 688",
            "is_active": True
        },
        # Teachers
        {
            "username": "nguyen.van.a",
            "email": "nguyen.van.a@greenwich.edu.vn",
            "full_name": "Nguyen Van A",
            "hashed_password": SecurityUtils.get_password_hash("teacher123"),
            "role": "teacher",
            "status": "active",
            "campus_id": campus_map.get("H"),  # Hanoi
            "major_id": major_map.get("C"),  # Computer Science
            "phone_number": "+84 98 765 4321",
            "date_of_birth": date(1985, 5, 15),
            "gender": "male",
            "is_active": True
        },
        {
            "username": "tran.thi.b",
            "email": "tran.thi.b@greenwich.edu.vn",
            "full_name": "Tran Thi B",
            "hashed_password": SecurityUtils.get_password_hash("teacher123"),
            "role": "teacher",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "major_id": major_map.get("B"),  # Business
            "phone_number": "+84 97 654 3210",
            "date_of_birth": date(1987, 8, 20),
            "gender": "female",
            "is_active": True
        },
        # Students
        {
            "username": "gch210001",
            "email": "gch210001@greenwich.edu.vn",
            "full_name": "Le Van C",
            "hashed_password": SecurityUtils.get_password_hash("student123"),
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("H"),  # Hanoi
            "major_id": major_map.get("C"),  # Computer Science
            "phone_number": "+84 96 543 2109",
            "date_of_birth": date(2003, 3, 10),
            "gender": "male",
            "year_entered": 2021,
            "is_active": True
        },
        {
            "username": "gcd220002",
            "email": "gcd220002@greenwich.edu.vn",
            "full_name": "Pham Thi D",
            "hashed_password": SecurityUtils.get_password_hash("student123"),
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "major_id": major_map.get("D"),  # Design
            "phone_number": "+84 95 432 1098",
            "date_of_birth": date(2004, 7, 25),
            "gender": "female",
            "year_entered": 2022,
            "is_active": True
        },
        {
            "username": "gcb230003",
            "email": "gcb230003@greenwich.edu.vn",
            "full_name": "Hoang Van E",
            "hashed_password": SecurityUtils.get_password_hash("student123"),
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("C"),  # Can Tho
            "major_id": major_map.get("B"),  # Business
            "phone_number": "+84 94 321 0987",
            "date_of_birth": date(2005, 11, 5),
            "gender": "male",
            "year_entered": 2023,
            "is_active": True
        },
    ]
    
    created = 0
    for user_data in users_data:
        existing = session.execute(
            select(User).where(User.username == user_data["username"])
        ).scalar_one_or_none()
        
        if not existing:
            user = User(**user_data)
            session.add(user)
            created += 1
            print(f"  ✅ Created: {user.username} - {user.full_name} ({user.role})")
        else:
            print(f"  ⏭️  Exists: {existing.username} - {existing.full_name} ({existing.role})")
    
    session.commit()
    print(f"✅ Users seeded: {created} new, {len(users_data) - created} existing\n")


def seed_semester(session: Session):
    """Seed current semester"""
    print("📅 Seeding Semester...")
    
    semester_data = {
        "code": "FALL2024",
        "name": "Fall 2024",
        "type": "fall",
        "academic_year": "2024-2025",
        "start_date": date(2024, 9, 1),
        "end_date": date(2024, 12, 20),
        "is_active": True
    }
    
    existing = session.execute(
        select(Semester).where(Semester.code == semester_data["code"])
    ).scalar_one_or_none()
    
    if not existing:
        semester = Semester(**semester_data)
        session.add(semester)
        session.commit()
        print(f"  ✅ Created: {semester.code} - {semester.name}")
    else:
        print(f"  ⏭️  Exists: {existing.code} - {existing.name}")
    
    print("✅ Semester seeded\n")


def seed_courses(session: Session):
    """Seed sample courses"""
    print("📚 Seeding Courses...")
    
    # Get majors
    majors = session.execute(select(Major)).scalars().all()
    major_map = {m.code: m.id for m in majors}
    
    courses_data = [
        # Computer Science
        {
            "course_code": "COMP1640",
            "name": "Enterprise Web Software Development",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Full-stack web development with modern frameworks",
            "is_active": True
        },
        {
            "course_code": "COMP1841",
            "name": "Database Development and Design",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Relational database design and SQL",
            "is_active": True
        },
        {
            "course_code": "COMP1649",
            "name": "Data Structures & Algorithms",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Core algorithms and data structure implementations",
            "is_active": True
        },
        # Business
        {
            "course_code": "BUS1101",
            "name": "Introduction to Business",
            "credits": 15,
            "major_id": major_map.get("B"),
            "level": 1,
            "description": "Fundamentals of business operations",
            "is_active": True
        },
        {
            "course_code": "MKT2201",
            "name": "Marketing Management",
            "credits": 15,
            "major_id": major_map.get("B"),
            "level": 2,
            "description": "Strategic marketing planning and execution",
            "is_active": True
        },
        # Design
        {
            "course_code": "DES1301",
            "name": "Design Fundamentals",
            "credits": 15,
            "major_id": major_map.get("D"),
            "level": 1,
            "description": "Principles of visual design",
            "is_active": True
        },
    ]
    
    created = 0
    for course_data in courses_data:
        existing = session.execute(
            select(Course).where(Course.course_code == course_data["course_code"])
        ).scalar_one_or_none()
        
        if not existing:
            course = Course(**course_data)
            session.add(course)
            created += 1
            print(f"  ✅ Created: {course.course_code} - {course.name}")
        else:
            print(f"  ⏭️  Exists: {existing.course_code} - {existing.name}")
    
    session.commit()
    print(f"✅ Courses seeded: {created} new, {len(courses_data) - created} existing\n")


def main():
    """Main seeding function"""
    print("=" * 60)
    print("🌱 SEEDING GREENWICH ACADEMIC PORTAL DATABASE")
    print("=" * 60)
    print(f"📍 Database: {DATABASE_URL.split('@')[1].split('?')[0] if '@' in DATABASE_URL else 'Local'}")
    print("=" * 60)
    
    session = SessionLocal()
    try:
        # Seed in order (respecting foreign key dependencies)
        seed_campuses(session)
        seed_majors(session)
        seed_users(session)
        seed_semester(session)
        seed_courses(session)
        
        print("=" * 60)
        print("✅ SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📋 Summary:")
        print("  • 4 Campuses (H, D, C, S)")
        print("  • 5 Majors (C, B, D, IT, MK)")
        print("  • 6 Users (1 admin, 2 teachers, 3 students)")
        print("  • 1 Semester (Fall 2024)")
        print("  • 6 Courses")
        print("\n🔐 Default Credentials:")
        print("  Admin:   username: admin          password: admin123")
        print("  Teacher: username: nguyen.van.a   password: teacher123")
        print("  Student: username: gch210001      password: student123")
        print("\n🚀 You can now continue building the admin portal!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        session.rollback()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
