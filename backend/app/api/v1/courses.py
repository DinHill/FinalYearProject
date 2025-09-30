from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.schemas.user import UserResponse

router = APIRouter(prefix="/courses", tags=["courses"])

# Mock data for testing without database
MOCK_COURSES = [
    {
        "id": 1,
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "description": "Basic programming concepts and problem solving",
        "credits": 3,
        "department": "Computer Science",
        "prerequisite_codes": None
    },
    {
        "id": 2,
        "code": "MATH201", 
        "name": "Calculus I",
        "description": "Differential and integral calculus",
        "credits": 4,
        "department": "Mathematics",
        "prerequisite_codes": None
    },
    {
        "id": 3,
        "code": "CS201",
        "name": "Data Structures",
        "description": "Advanced data structures and algorithms", 
        "credits": 3,
        "department": "Computer Science",
        "prerequisite_codes": "CS101"
    }
]

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    credits: int
    department: str
    prerequisite_codes: Optional[str] = None

@router.get("/", response_model=List[CourseResponse])
def get_courses(
    department: Optional[str] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search course name or code")
):
    """Get all courses with optional filtering"""
    courses = MOCK_COURSES.copy()
    
    if department:
        courses = [c for c in courses if c["department"].lower() == department.lower()]
    
    if search:
        search_lower = search.lower()
        courses = [c for c in courses if 
                  search_lower in c["name"].lower() or 
                  search_lower in c["code"].lower()]
    
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int):
    """Get course by ID"""
    course = next((c for c in MOCK_COURSES if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return course

@router.get("/department/{department}", response_model=List[CourseResponse])
def get_courses_by_department(department: str):
    """Get courses by department"""
    courses = [c for c in MOCK_COURSES if c["department"].lower() == department.lower()]
    return courses