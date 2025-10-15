"""
Seed basic data API endpoint
Run this from the deployed backend on Render
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Dict

from app.core.database import get_db
from app.models.user import User, Campus, Major
from app.models.academic import Semester, Course
from app.core.security import SecurityUtils

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])


async def seed_campuses(db: AsyncSession) -> Dict:
    """Seed campuses"""
    campuses_data = [
        {"code": "H", "name": "Hanoi Campus", "address": "FPT Tower, 10 Pham Van Bach", 
         "city": "Hanoi", "phone": "+84 24 7300 5588", 
         "email": "hanoi@greenwich.edu.vn"},
        {"code": "D", "name": "Da Nang Campus", "address": "Lot 30 Quang Trung Software City",
         "city": "Da Nang", "phone": "+84 236 3525 688",
         "email": "danang@greenwich.edu.vn"},
        {"code": "C", "name": "Can Tho Campus", "address": "600A Nguyen Van Cu Noi Dai",
         "city": "Can Tho", "phone": "+84 292 3731 279",
         "email": "cantho@greenwich.edu.vn"},
        {"code": "S", "name": "Ho Chi Minh Campus", "address": "778/B1 Nguyen Kiem Street, Ward 4",
         "city": "Ho Chi Minh", "phone": "+84 28 7300 5588",
         "email": "hcm@greenwich.edu.vn"},
    ]
    
    created = 0
    for campus_data in campuses_data:
        result = await db.execute(select(Campus).where(Campus.code == campus_data["code"]))
        if not result.scalar_one_or_none():
            db.add(Campus(**campus_data))
            created += 1
    
    await db.commit()
    return {"entity": "campuses", "created": created, "total": len(campuses_data)}


async def seed_majors(db: AsyncSession) -> Dict:
    """Seed majors"""
    majors_data = [
        {"code": "C", "name": "Computer Science",
         "description": "Software development, algorithms, and computing systems"},
        {"code": "B", "name": "Business Administration",
         "description": "Management, finance, and business operations"},
        {"code": "D", "name": "Graphic Design",
         "description": "Visual communication and digital media"},
        {"code": "IT", "name": "Information Technology",
         "description": "IT infrastructure, networks, and systems administration"},
        {"code": "MK", "name": "Marketing",
         "description": "Digital marketing, branding, and consumer behavior"},
    ]
    
    created = 0
    for major_data in majors_data:
        result = await db.execute(select(Major).where(Major.code == major_data["code"]))
        if not result.scalar_one_or_none():
            db.add(Major(**major_data))
            created += 1
    
    await db.commit()
    return {"entity": "majors", "created": created, "total": len(majors_data)}


async def seed_users(db: AsyncSession) -> Dict:
    """Seed test users"""
    # Get campuses and majors
    campuses_result = await db.execute(select(Campus))
    majors_result = await db.execute(select(Major))
    campuses = campuses_result.scalars().all()
    majors = majors_result.scalars().all()
    
    campus_map = {c.code: c.id for c in campuses}
    major_map = {m.code: m.id for m in majors}
    
    users_data = [
        {"firebase_uid": "admin-seed-uid", "username": "admin", "email": "admin@greenwich.edu.vn", "full_name": "System Administrator",
         "password_hash": SecurityUtils.hash_password("admin123"), "role": "admin", "status": "active",
         "campus_id": campus_map.get("D"), "phone_number": "+84 236 3525 688"},
        {"firebase_uid": "teacher1-seed-uid", "username": "nguyen.van.a", "email": "nguyen.van.a@greenwich.edu.vn", "full_name": "Nguyen Van A",
         "password_hash": SecurityUtils.hash_password("teacher123"), "role": "teacher", "status": "active",
         "campus_id": campus_map.get("H"), "major_id": major_map.get("C"), "phone_number": "+84 98 765 4321",
         "date_of_birth": date(1985, 5, 15), "gender": "male"},
        {"firebase_uid": "teacher2-seed-uid", "username": "tran.thi.b", "email": "tran.thi.b@greenwich.edu.vn", "full_name": "Tran Thi B",
         "password_hash": SecurityUtils.hash_password("teacher123"), "role": "teacher", "status": "active",
         "campus_id": campus_map.get("D"), "major_id": major_map.get("B"), "phone_number": "+84 97 654 3210",
         "date_of_birth": date(1987, 8, 20), "gender": "female"},
        {"firebase_uid": "student1-seed-uid", "username": "gch210001", "email": "gch210001@greenwich.edu.vn", "full_name": "Le Van C",
         "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active",
         "campus_id": campus_map.get("H"), "major_id": major_map.get("C"), "phone_number": "+84 96 543 2109",
         "date_of_birth": date(2003, 3, 10), "gender": "male", "year_entered": 2021},
        {"firebase_uid": "student2-seed-uid", "username": "gcd220002", "email": "gcd220002@greenwich.edu.vn", "full_name": "Pham Thi D",
         "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active",
         "campus_id": campus_map.get("D"), "major_id": major_map.get("D"), "phone_number": "+84 95 432 1098",
         "date_of_birth": date(2004, 7, 25), "gender": "female", "year_entered": 2022},
        {"firebase_uid": "student3-seed-uid", "username": "gcb230003", "email": "gcb230003@greenwich.edu.vn", "full_name": "Hoang Van E",
         "password_hash": SecurityUtils.hash_password("student123"), "role": "student", "status": "active",
         "campus_id": campus_map.get("C"), "major_id": major_map.get("B"), "phone_number": "+84 94 321 0987",
         "date_of_birth": date(2005, 11, 5), "gender": "male", "year_entered": 2023},
    ]
    
    created = 0
    for user_data in users_data:
        result = await db.execute(select(User).where(User.username == user_data["username"]))
        if not result.scalar_one_or_none():
            db.add(User(**user_data))
            created += 1
    
    await db.commit()
    return {"entity": "users", "created": created, "total": len(users_data)}


async def seed_semester(db: AsyncSession) -> Dict:
    """Seed current semester"""
    semester_data = {
        "code": "FALL2024", "name": "Fall 2024", "type": "fall", "academic_year": "2024-2025",
        "start_date": date(2024, 9, 1), "end_date": date(2024, 12, 20)
    }
    
    result = await db.execute(select(Semester).where(Semester.code == semester_data["code"]))
    created = 0
    if not result.scalar_one_or_none():
        db.add(Semester(**semester_data))
        created = 1
    
    await db.commit()
    return {"entity": "semester", "created": created, "total": 1}


async def seed_courses(db: AsyncSession) -> Dict:
    """Seed sample courses"""
    # Get majors
    majors_result = await db.execute(select(Major))
    majors = majors_result.scalars().all()
    major_map = {m.code: m.id for m in majors}
    
    courses_data = [
        {"course_code": "COMP1640", "name": "Enterprise Web Software Development", "credits": 15,
         "major_id": major_map.get("C"), "level": 1, 
         "description": "Full-stack web development with modern frameworks"},
        {"course_code": "COMP1841", "name": "Database Development and Design", "credits": 15,
         "major_id": major_map.get("C"), "level": 1,
         "description": "Relational database design and SQL"},
        {"course_code": "COMP1649", "name": "Data Structures & Algorithms", "credits": 15,
         "major_id": major_map.get("C"), "level": 1,
         "description": "Core algorithms and data structure implementations"},
        {"course_code": "BUS1101", "name": "Introduction to Business", "credits": 15,
         "major_id": major_map.get("B"), "level": 1,
         "description": "Fundamentals of business operations"},
        {"course_code": "MKT2201", "name": "Marketing Management", "credits": 15,
         "major_id": major_map.get("B"), "level": 2,
         "description": "Strategic marketing planning and execution"},
        {"course_code": "DES1301", "name": "Design Fundamentals", "credits": 15,
         "major_id": major_map.get("D"), "level": 1,
         "description": "Principles of visual design"},
    ]
    
    created = 0
    for course_data in courses_data:
        result = await db.execute(select(Course).where(Course.course_code == course_data["course_code"]))
        if not result.scalar_one_or_none():
            db.add(Course(**course_data))
            created += 1
    
    await db.commit()
    return {"entity": "courses", "created": created, "total": len(courses_data)}


@router.post("/run")
async def run_seed(db: AsyncSession = Depends(get_db)):
    """
    Run all seeding functions
    WARNING: This endpoint should be protected in production
    """
    try:
        results = []
        
        # Seed in order (respecting foreign key dependencies)
        results.append(await seed_campuses(db))
        results.append(await seed_majors(db))
        results.append(await seed_users(db))
        results.append(await seed_semester(db))
        results.append(await seed_courses(db))
        
        return {
            "success": True,
            "message": "Database seeded successfully",
            "results": results,
            "credentials": {
                "admin": {"username": "admin", "password": "admin123"},
                "teacher": {"username": "nguyen.van.a", "password": "teacher123"},
                "student": {"username": "gch210001", "password": "student123"}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")
