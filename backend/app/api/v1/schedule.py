from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import BaseModel
from datetime import datetime, time

router = APIRouter(prefix="/schedule", tags=["schedule"])

# Mock schedule data
MOCK_SCHEDULE = [
    {
        "id": 1,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science", 
        "day_of_week": "monday",
        "start_time": "09:00",
        "end_time": "10:30",
        "room": "A101",
        "building": "Engineering Building",
        "instructor": "Dr. Smith"
    },
    {
        "id": 2,
        "course_code": "MATH201",
        "course_name": "Calculus I",
        "day_of_week": "tuesday", 
        "start_time": "14:00",
        "end_time": "15:30",
        "room": "B205",
        "building": "Mathematics Building",
        "instructor": "Prof. Johnson"
    },
    {
        "id": 3,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "day_of_week": "wednesday",
        "start_time": "09:00", 
        "end_time": "10:30",
        "room": "A101",
        "building": "Engineering Building",
        "instructor": "Dr. Smith"
    },
    {
        "id": 4,
        "course_code": "CS201",
        "course_name": "Data Structures",
        "day_of_week": "friday",
        "start_time": "11:00",
        "end_time": "12:30", 
        "room": "A203",
        "building": "Engineering Building",
        "instructor": "Dr. Brown"
    }
]

class ScheduleResponse(BaseModel):
    id: int
    course_code: str
    course_name: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    building: str
    instructor: str

@router.get("/", response_model=List[ScheduleResponse])
def get_schedule():
    """Get all schedule entries"""
    return MOCK_SCHEDULE

@router.get("/day/{day_of_week}", response_model=List[ScheduleResponse])
def get_schedule_by_day(day_of_week: str):
    """Get schedule for a specific day"""
    day_lower = day_of_week.lower()
    schedule = [s for s in MOCK_SCHEDULE if s["day_of_week"] == day_lower]
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No classes found for {day_of_week}"
        )
    
    return schedule

@router.get("/course/{course_code}", response_model=List[ScheduleResponse])
def get_schedule_by_course(course_code: str):
    """Get schedule for a specific course"""
    course_upper = course_code.upper()
    schedule = [s for s in MOCK_SCHEDULE if s["course_code"] == course_upper]
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No schedule found for course {course_code}"
        )
    
    return schedule