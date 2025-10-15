"""
Seed basic data for Greenwich Academic Portal

This script creates:
- Campuses (4)
- Majors (5)
- Test users (admin, teachers, students)
- Current semester
- Sample subjects
- Sample courses

Run against Render PostgreSQL database
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime, timedelta, date
import uuid

from app.models.user import User, Campus, Major
from app.models.academic import Semester, Course
from app.core.security import SecurityUtils


# Database URL from environment or use Render production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://greenwich_kbjo_user:y0YK5JkjEPLAEBEFaJ4H2xajKaZMt46d@dpg-ctf2v8jtq21c73ctm940-a.singapore-postgres.render.com/greenwich_kbjo"
)

# Add SSL parameter for Render PostgreSQL (requires SSL)
if "?ssl=" not in DATABASE_URL and "singapore-postgres.render.com" in DATABASE_URL:
    DATABASE_URL += "?ssl=require"

# Create async engine with proper SSL configuration
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Disable echo for cleaner output
    pool_pre_ping=True,  # Verify connections before using
    connect_args={
        "ssl": "require",
        "server_settings": {"jit": "off"},
    } if "singapore-postgres.render.com" in DATABASE_URL else {}
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed_campuses(session: AsyncSession):
    """Seed campus data"""
    print("\n🏫 Seeding Campuses...")
    
    campuses_data = [
        {
            "code": "H",
            "name": "Hanoi Campus",
            "address": "248 Pho Hue, Dong Da District",
            "city": "Hanoi",
            "phone": "+84-24-3974-3456",
            "email": "hanoi@greenwich.edu.vn"
        },
        {
            "code": "D",
            "name": "Da Nang Campus",
            "address": "51 Nguyen Luong Bang Street, Hoa Khanh Nam Ward",
            "city": "Da Nang",
            "phone": "+84-236-3650-403",
            "email": "danang@greenwich.edu.vn"
        },
        {
            "code": "C",
            "name": "Can Tho Campus",
            "address": "144 Nguyen Van Cu Street, An Khanh Ward",
            "city": "Can Tho",
            "phone": "+84-292-3830-588",
            "email": "cantho@greenwich.edu.vn"
        },
        {
            "code": "S",
            "name": "Ho Chi Minh City Campus",
            "address": "190 Pasteur, Ben Nghe Ward, District 1",
            "city": "Ho Chi Minh City",
            "phone": "+84-28-3829-7954",
            "email": "hcmc@greenwich.edu.vn"
        }
    ]
    
    created = 0
    for campus_data in campuses_data:
        # Check if campus already exists
        result = await session.execute(
            select(Campus).where(Campus.code == campus_data["code"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            campus = Campus(**campus_data)
            session.add(campus)
            created += 1
            print(f"  ✅ Created: {campus.name}")
        else:
            print(f"  ⏭️  Exists: {existing.name}")
    
    await session.commit()
    print(f"✅ Campuses seeded: {created} new, {len(campuses_data) - created} existing\n")


async def seed_majors(session: AsyncSession):
    """Seed major/program data"""
    print("🎓 Seeding Majors...")
    
    majors_data = [
        {
            "code": "C",
            "name": "Computer Science",
            "degree_type": "BSc",
            "credits_required": 120,
            "description": "Bachelor of Science in Computer Science - Focus on software development, algorithms, and computing systems"
        },
        {
            "code": "B",
            "name": "Business Administration",
            "degree_type": "BA",
            "credits_required": 120,
            "description": "Bachelor of Arts in Business Administration - Management, marketing, and business strategy"
        },
        {
            "code": "D",
            "name": "Graphic Design",
            "degree_type": "BA",
            "credits_required": 120,
            "description": "Bachelor of Arts in Graphic Design - Visual communication and digital design"
        },
        {
            "code": "IT",
            "name": "Information Technology",
            "degree_type": "BSc",
            "credits_required": 120,
            "description": "Bachelor of Science in Information Technology - Network systems and IT infrastructure"
        },
        {
            "code": "MK",
            "name": "Marketing",
            "degree_type": "BA",
            "credits_required": 120,
            "description": "Bachelor of Arts in Marketing - Digital marketing, branding, and consumer behavior"
        }
    ]
    
    created = 0
    for major_data in majors_data:
        result = await session.execute(
            select(Major).where(Major.code == major_data["code"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            major = Major(**major_data)
            session.add(major)
            created += 1
            print(f"  ✅ Created: {major.name}")
        else:
            print(f"  ⏭️  Exists: {existing.name}")
    
    await session.commit()
    print(f"✅ Majors seeded: {created} new, {len(majors_data) - created} existing\n")


async def seed_users(session: AsyncSession):
    """Seed test users"""
    print("👥 Seeding Users...")
    
    # Get campuses and majors for foreign keys
    campuses = (await session.execute(select(Campus))).scalars().all()
    majors = (await session.execute(select(Major))).scalars().all()
    
    campus_map = {c.code: c.id for c in campuses}
    major_map = {m.code: m.id for m in majors}
    
    users_data = [
        # Keep existing admin (if exists)
        {
            "firebase_uid": f"admin_{uuid.uuid4().hex[:8]}",
            "username": "admin",
            "email": "admin@greenwich.edu.vn",
            "full_name": "System Administrator",
            "password": "admin123",
            "role": "admin",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "phone_number": "+84-236-3650-403"
        },
        # Teachers
        {
            "firebase_uid": f"teacher_{uuid.uuid4().hex[:8]}",
            "username": "nguyen.van.a",
            "email": "nguyen.van.a@greenwich.edu.vn",
            "full_name": "Nguyen Van A",
            "password": "teacher123",
            "role": "teacher",
            "status": "active",
            "campus_id": campus_map.get("H"),  # Hanoi
            "major_id": major_map.get("C"),  # Computer Science
            "phone_number": "+84-24-3974-3456",
            "gender": "male",
            "date_of_birth": date(1985, 5, 15)
        },
        {
            "firebase_uid": f"teacher_{uuid.uuid4().hex[:8]}",
            "username": "tran.thi.b",
            "email": "tran.thi.b@greenwich.edu.vn",
            "full_name": "Tran Thi B",
            "password": "teacher123",
            "role": "teacher",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "major_id": major_map.get("B"),  # Business
            "phone_number": "+84-236-3650-404",
            "gender": "female",
            "date_of_birth": date(1988, 8, 20)
        },
        # Students
        {
            "firebase_uid": f"student_{uuid.uuid4().hex[:8]}",
            "username": "gch210001",
            "email": "gch210001@student.greenwich.edu.vn",
            "full_name": "Le Van Nam",
            "password": "student123",
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("H"),  # Hanoi
            "major_id": major_map.get("C"),  # Computer Science
            "year_entered": 2021,
            "phone_number": "+84-987-654-321",
            "gender": "male",
            "date_of_birth": date(2003, 3, 10)
        },
        {
            "firebase_uid": f"student_{uuid.uuid4().hex[:8]}",
            "username": "gcd220002",
            "email": "gcd220002@student.greenwich.edu.vn",
            "full_name": "Pham Thi Lan",
            "password": "student123",
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("D"),  # Da Nang
            "major_id": major_map.get("D"),  # Design
            "year_entered": 2022,
            "phone_number": "+84-976-543-210",
            "gender": "female",
            "date_of_birth": date(2004, 7, 25)
        },
        {
            "firebase_uid": f"student_{uuid.uuid4().hex[:8]}",
            "username": "gcb230003",
            "email": "gcb230003@student.greenwich.edu.vn",
            "full_name": "Hoang Van Minh",
            "password": "student123",
            "role": "student",
            "status": "active",
            "campus_id": campus_map.get("C"),  # Can Tho
            "major_id": major_map.get("B"),  # Business
            "year_entered": 2023,
            "phone_number": "+84-965-432-109",
            "gender": "male",
            "date_of_birth": date(2005, 11, 5)
        }
    ]
    
    created = 0
    for user_data in users_data:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.username == user_data["username"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            # Hash password
            password = user_data.pop("password")
            user_data["password_hash"] = SecurityUtils.hash_password(password)
            
            user = User(**user_data)
            session.add(user)
            created += 1
            print(f"  ✅ Created: {user.username} ({user.role}) - Password: {password}")
        else:
            print(f"  ⏭️  Exists: {existing.username} ({existing.role})")
    
    await session.commit()
    print(f"✅ Users seeded: {created} new, {len(users_data) - created} existing\n")


async def seed_semester(session: AsyncSession):
    """Seed current semester"""
    print("📅 Seeding Semester...")
    
    # Create Fall 2024 semester
    current_year = 2024
    semester_data = {
        "code": f"{current_year}_FALL",
        "name": f"Fall {current_year}",
        "type": "fall",
        "academic_year": current_year,
        "start_date": date(2024, 9, 1),
        "end_date": date(2024, 12, 20),
        "registration_start": date(2024, 8, 1),
        "registration_end": date(2024, 8, 25),
        "is_current": True
    }
    
    result = await session.execute(
        select(Semester).where(Semester.code == semester_data["code"])
    )
    existing = result.scalar_one_or_none()
    
    if not existing:
        semester = Semester(**semester_data)
        session.add(semester)
        await session.commit()
        print(f"  ✅ Created: {semester.name}")
    else:
        print(f"  ⏭️  Exists: {existing.name}")
    
    print("✅ Semester seeded\n")


async def seed_courses(session: AsyncSession):
    """Seed sample courses"""
    print("📚 Seeding Courses...")
    
    # Get majors
    majors = (await session.execute(select(Major))).scalars().all()
    major_map = {m.code: m.id for m in majors}
    
    courses_data = [
        # Computer Science
        {
            "course_code": "COMP1640",
            "name": "Enterprise Web Software Development",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Full-stack web development with modern frameworks"
        },
        {
            "course_code": "COMP1841",
            "name": "Database Development and Design",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Relational database design and SQL"
        },
        {
            "course_code": "COMP1649",
            "name": "Data Structures & Algorithms",
            "credits": 15,
            "major_id": major_map.get("C"),
            "level": 1,
            "description": "Core algorithms and data structure implementations"
        },
        # Business
        {
            "course_code": "BUS1101",
            "name": "Introduction to Business",
            "credits": 15,
            "major_id": major_map.get("B"),
            "level": 1,
            "description": "Fundamentals of business operations"
        },
        {
            "course_code": "MKT2201",
            "name": "Marketing Management",
            "credits": 15,
            "major_id": major_map.get("B"),
            "level": 2,
            "description": "Strategic marketing planning and execution"
        },
        # Design
        {
            "course_code": "DES1301",
            "name": "Design Fundamentals",
            "credits": 15,
            "major_id": major_map.get("D"),
            "level": 1,
            "description": "Principles of visual design"
        },
    ]
    
    created = 0
    for course_data in courses_data:
        result = await session.execute(
            select(Course).where(Course.course_code == course_data["course_code"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            course = Course(**course_data)
            session.add(course)
            created += 1
            print(f"  ✅ Created: {course.course_code} - {course.name}")
        else:
            print(f"  ⏭️  Exists: {existing.course_code} - {existing.name}")
    
    await session.commit()
    print(f"✅ Courses seeded: {created} new, {len(courses_data) - created} existing\n")


async def main():
    """Main seeding function"""
    print("=" * 60)
    print("🌱 SEEDING GREENWICH ACADEMIC PORTAL DATABASE")
    print("=" * 60)
    print(f"📍 Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Local'}")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        try:
            # Seed in order (respecting foreign key dependencies)
            await seed_campuses(session)
            await seed_majors(session)
            await seed_users(session)
            await seed_semester(session)
            await seed_courses(session)
            
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
            await session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
