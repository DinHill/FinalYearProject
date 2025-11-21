"""
Schedule Management Router
Handles calendar views, schedule management, and conflict detection
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from typing import List, Optional, Union
from datetime import datetime, date, time, timedelta
from pydantic import BaseModel, Field
import logging

from app.core.database import get_db
from app.models.academic import SectionSchedule, CourseSection as Section, Course
from app.models.user import User
from app.core.security import verify_firebase_token, require_roles

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/schedule", tags=["Schedule"])

# ============================================================================
# Request/Response Models
# ============================================================================

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def day_index_to_name(day: Union[int, str]) -> str:
    if isinstance(day, int):
        return DAYS[day]
    if isinstance(day, str):
        # allow either name or numeric string
        if day.isdigit():
            return DAYS[int(day)]
        # normalize capitalization
        candidate = day.capitalize()
        if candidate in DAYS:
            return candidate
    raise ValueError(f"Invalid day_of_week: {day}")


def day_name_to_index(day: Union[int, str]) -> int:
    if isinstance(day, int):
        return day
    if isinstance(day, str):
        if day.isdigit():
            return int(day)
        candidate = day.capitalize()
        if candidate in DAYS:
            return DAYS.index(candidate)
    raise ValueError(f"Invalid day_of_week: {day}")


class TimeSlot(BaseModel):
    day_of_week: Union[int, str] = Field(..., description="0=Monday or 'Monday'")
    start_time: str = Field(..., description="HH:MM format")
    end_time: str = Field(..., description="HH:MM format")
    
class ScheduleConflict(BaseModel):
    conflict_type: str  # 'time_overlap', 'room_double_booking', 'teacher_conflict', 'student_conflict'
    severity: str  # 'error', 'warning'
    message: str
    conflicting_sections: List[int] = []
    
class CreateScheduleRequest(BaseModel):
    section_id: int
    day_of_week: Union[int, str]
    start_time: str
    end_time: str
    room: Optional[str] = None
    building: Optional[str] = None
    
class UpdateScheduleRequest(BaseModel):
    day_of_week: Optional[Union[int, str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
    building: Optional[str] = None
    
class ScheduleWithDetails(BaseModel):
    id: int
    section_id: int
    day_of_week: int
    start_time: str
    end_time: str
    room: Optional[str]
    building: Optional[str]
    # Related data
    section_code: str
    course_name: str
    course_code: str
    teacher_name: Optional[str]
    enrolled_count: int
    conflicts: List[ScheduleConflict] = []
    
class CalendarEvent(BaseModel):
    id: int
    title: str
    start: str  # ISO datetime
    end: str    # ISO datetime
    section_id: int
    section_code: str
    course_name: str
    course_code: str
    teacher_name: Optional[str]
    room: Optional[str]
    building: Optional[str]
    color: Optional[str]
    conflicts: List[ScheduleConflict] = []

class ConflictCheckRequest(BaseModel):
    section_id: int
    schedules: List[TimeSlot]
    exclude_schedule_ids: List[int] = []

class ConflictCheckResponse(BaseModel):
    has_conflicts: bool
    conflicts: List[ScheduleConflict]
    
# ============================================================================
# Helper Functions
# ============================================================================

def parse_time(time_str: str) -> time:
    """Parse time string in HH:MM format"""
    try:
        hours, minutes = map(int, time_str.split(':'))
        return time(hour=hours, minute=minutes)
    except Exception:
        raise ValueError(f"Invalid time format: {time_str}. Expected HH:MM")

def time_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """Check if two time ranges overlap"""
    return start1 < end2 and start2 < end1

async def get_section_with_details(db: AsyncSession, section_id: int):
    """Get section with course and teacher details"""
    stmt = (
        select(Section, Course, User)
        .join(Course, Section.course_id == Course.id)
        .outerjoin(User, Section.instructor_id == User.id)
        .where(Section.id == section_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None
    return {
        'section': row[0],
        'course': row[1],
        'teacher': row[2]
    }

async def check_schedule_conflicts(
    db: AsyncSession,
    section_id: int,
    day_of_week: Union[int, str],
    start_time: time,
    end_time: time,
    room: Optional[str] = None,
    exclude_schedule_ids: List[int] = []
) -> List[ScheduleConflict]:
    """Check for scheduling conflicts"""
    conflicts: List[ScheduleConflict] = []

    # Normalize day_of_week to day name for DB comparisons
    try:
        day_name = day_index_to_name(day_of_week)
    except ValueError:
        return conflicts

    # Get section details
    section_details = await get_section_with_details(db, section_id)
    if not section_details:
        return conflicts

    section = section_details['section']

    # Build exclusion filter (SQL expression) or True
    if exclude_schedule_ids:
        exclusion_filter = ~SectionSchedule.id.in_(exclude_schedule_ids)
    else:
        exclusion_filter = True

    # 1. Check for room conflicts (same room, same time)
    if room:
        stmt = (
            select(SectionSchedule, Section, Course)
            .join(Section, SectionSchedule.section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .where(
                and_(
                    SectionSchedule.day_of_week == day_name,
                    SectionSchedule.room == room,
                    SectionSchedule.section_id != section_id,
                    exclusion_filter
                )
            )
        )
        result = await db.execute(stmt)
        room_schedules = result.all()

        for schedule, conflicting_section, course in room_schedules:
            schedule_start = schedule.start_time if isinstance(schedule.start_time, time) else parse_time(schedule.start_time)
            schedule_end = schedule.end_time if isinstance(schedule.end_time, time) else parse_time(schedule.end_time)

            if time_overlap(start_time, end_time, schedule_start, schedule_end):
                conflicts.append(ScheduleConflict(
                    conflict_type='room_double_booking',
                    severity='error',
                    message=f"Room {room} is already booked by {getattr(course, 'course_code', '')} ({getattr(conflicting_section, 'section_code', '')}) from {schedule.start_time} to {schedule.end_time}",
                    conflicting_sections=[getattr(conflicting_section, 'id', None)]
                ))

    # 2. Check for teacher conflicts (same teacher, same time)
    if getattr(section, 'instructor_id', None):
        stmt = (
            select(SectionSchedule, Section, Course)
            .join(Section, SectionSchedule.section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .where(
                and_(
                    SectionSchedule.day_of_week == day_name,
                    Section.instructor_id == section.instructor_id,
                    SectionSchedule.section_id != section_id,
                    exclusion_filter
                )
            )
        )
        result = await db.execute(stmt)
        teacher_schedules = result.all()

        for schedule, conflicting_section, course in teacher_schedules:
            schedule_start = schedule.start_time if isinstance(schedule.start_time, time) else parse_time(schedule.start_time)
            schedule_end = schedule.end_time if isinstance(schedule.end_time, time) else parse_time(schedule.end_time)

            if time_overlap(start_time, end_time, schedule_start, schedule_end):
                teacher_name = getattr(section_details.get('teacher'), 'full_name', 'Unknown') if section_details.get('teacher') else 'Unknown'
                conflicts.append(ScheduleConflict(
                    conflict_type='teacher_conflict',
                    severity='error',
                    message=f"Teacher {teacher_name} is already teaching {getattr(course,'course_code','')} ({getattr(conflicting_section,'section_code','')}) from {schedule.start_time} to {schedule.end_time}",
                    conflicting_sections=[getattr(conflicting_section, 'id', None)]
                ))

    return conflicts

# ============================================================================
# Endpoints
# ============================================================================

@router.get("/calendar", response_model=List[CalendarEvent])
async def get_calendar_view(
    start_date: date = Query(..., description="Start date for calendar view"),
    end_date: date = Query(..., description="End date for calendar view"),
    campus_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """
    Get calendar view of all schedules within a date range.
    Returns events formatted for calendar display.
    """
    try:
        # Build query
        stmt = (
            select(
                SectionSchedule,
                Section,
                Course,
                User
            )
            .join(Section, SectionSchedule.section_id == Section.id)
            .join(Course, Section.course_id == Course.id)
            .outerjoin(User, Section.instructor_id == User.id)
        )
        
        # Apply filters
        filters = []
        if campus_id:
            filters.append(Section.campus_id == campus_id)
        if teacher_id:
            filters.append(Section.instructor_id == teacher_id)
        if course_id:
            filters.append(Section.course_id == course_id)
            
        if filters:
            stmt = stmt.where(and_(*filters))
        
        result = await db.execute(stmt)
        schedules = result.all()
        
        # Convert to calendar events
        events = []
        current = start_date
        while current <= end_date:
            day_of_week = current.weekday()  # 0=Monday, 6=Sunday
            day_name = DAYS[day_of_week]
            
            for schedule, section, course, teacher in schedules:
                if schedule.day_of_week == day_name:
                    # Parse times
                    start_time = schedule.start_time if isinstance(schedule.start_time, time) else parse_time(schedule.start_time)
                    end_time = schedule.end_time if isinstance(schedule.end_time, time) else parse_time(schedule.end_time)
                    
                    # Create datetime objects
                    start_dt = datetime.combine(current, start_time)
                    end_dt = datetime.combine(current, end_time)
                    
                    # Check for conflicts
                    conflicts = await check_schedule_conflicts(
                        db,
                        section.id,
                        day_name,
                        start_time,
                        end_time,
                        schedule.room,
                        exclude_schedule_ids=[schedule.id]
                    )
                    
                    events.append(CalendarEvent(
                        id=schedule.id,
                        title=f"{getattr(course, 'course_code', '')} - {getattr(section, 'section_code', '')}",
                        start=start_dt.isoformat(),
                        end=end_dt.isoformat(),
                        section_id=section.id,
                        section_code=getattr(section, 'section_code', ''),
                        course_name=getattr(course, 'name', ''),
                        course_code=getattr(course, 'course_code', ''),
                        teacher_name=getattr(teacher, 'full_name', None) if teacher else None,
                        room=schedule.room,
                        building=schedule.building,
                        color='#ef4444' if conflicts else '#3b82f6',  # Red if conflicts, blue otherwise
                        conflicts=conflicts
                    ))
            
            current += timedelta(days=1)
        
        return events
        
    except Exception as e:
        logger.error(f"Error fetching calendar view: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/section/{section_id}", response_model=List[ScheduleWithDetails])
async def get_section_schedules(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """Get all schedule entries for a specific section with conflict detection"""
    try:
        # Get section details
        section_details = await get_section_with_details(db, section_id)
        if not section_details:
            raise HTTPException(status_code=404, detail="Section not found")
        
        section = section_details['section']
        course = section_details['course']
        teacher = section_details['teacher']
        
        # Get schedules
        stmt = select(SectionSchedule).where(SectionSchedule.section_id == section_id)
        result = await db.execute(stmt)
        schedules = result.scalars().all()
        
        # Get enrollment count
        from app.models.academic import Enrollment
        count_stmt = select(func.count(Enrollment.id)).where(Enrollment.course_section_id == section_id)
        count_result = await db.execute(count_stmt)
        enrolled_count = count_result.scalar() or 0
        
        # Build response with conflict detection
        schedule_list = []
        for schedule in schedules:
            start_time = schedule.start_time if isinstance(schedule.start_time, time) else parse_time(schedule.start_time)
            end_time = schedule.end_time if isinstance(schedule.end_time, time) else parse_time(schedule.end_time)
            
            conflicts = await check_schedule_conflicts(
                db,
                section_id,
                schedule.day_of_week,
                start_time,
                end_time,
                schedule.room,
                exclude_schedule_ids=[schedule.id]
            )
            
            start_str = start_time.strftime("%H:%M") if isinstance(start_time, time) else str(start_time)
            end_str = end_time.strftime("%H:%M") if isinstance(end_time, time) else str(end_time)

            schedule_list.append(ScheduleWithDetails(
                id=getattr(schedule, 'id', None),
                section_id=getattr(section, 'id', None),
                day_of_week=day_name_to_index(schedule.day_of_week) if isinstance(schedule.day_of_week, str) else schedule.day_of_week,
                start_time=start_str,
                end_time=end_str,
                room=getattr(schedule, 'room', None),
                building=getattr(schedule, 'building', None),
                section_code=getattr(section, 'section_code', None),
                course_name=getattr(course, 'name', None),
                course_code=getattr(course, 'course_code', None),
                teacher_name=getattr(teacher, 'full_name', None) if teacher else None,
                enrolled_count=enrolled_count,
                conflicts=conflicts
            ))
        
        return schedule_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching section schedules: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-conflicts", response_model=ConflictCheckResponse)
async def check_conflicts(
    request: ConflictCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_firebase_token)
):
    """Check for scheduling conflicts before creating/updating schedules"""
    try:
        all_conflicts = []
        
        for slot in request.schedules:
            start_time = parse_time(slot.start_time)
            end_time = parse_time(slot.end_time)
            
            conflicts = await check_schedule_conflicts(
                db,
                request.section_id,
                slot.day_of_week,
                start_time,
                end_time,
                None,  # No room check in this endpoint
                exclude_schedule_ids=request.exclude_schedule_ids
            )
            
            all_conflicts.extend(conflicts)
        
        return ConflictCheckResponse(
            has_conflicts=len(all_conflicts) > 0,
            conflicts=all_conflicts
        )
        
    except Exception as e:
        logger.error(f"Error checking conflicts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ScheduleWithDetails)
async def create_schedule(
    request: CreateScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(['super_admin', 'academic_admin']))
):
    """Create a new schedule entry for a section"""
    try:
        # Validate times
        start_time = parse_time(request.start_time)
        end_time = parse_time(request.end_time)
        
        if start_time >= end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        
        # Normalize day_of_week to day name
        day_name = day_index_to_name(request.day_of_week)
        
        # Check conflicts
        conflicts = await check_schedule_conflicts(
            db,
            request.section_id,
            day_name,
            start_time,
            end_time,
            request.room
        )
        
        if conflicts:
            error_conflicts = [c for c in conflicts if c.severity == 'error']
            if error_conflicts:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "message": "Schedule conflicts detected",
                        "conflicts": [c.dict() for c in error_conflicts]
                    }
                )
        
        # Create schedule (store as day name and time objects)
        schedule = SectionSchedule(
            section_id=request.section_id,
            day_of_week=day_name,
            start_time=start_time,
            end_time=end_time,
            room=request.room,
            building=request.building
        )
        
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)
        
        # Get details for response
        section_details = await get_section_with_details(db, request.section_id)
        section = section_details['section']
        course = section_details['course']
        teacher = section_details['teacher']
        
        # Get enrollment count
        from app.models.academic import Enrollment
        count_stmt = select(func.count(Enrollment.id)).where(Enrollment.course_section_id == request.section_id)
        count_result = await db.execute(count_stmt)
        enrolled_count = count_result.scalar() or 0
        
        logger.info(f"Created schedule {schedule.id} for section {request.section_id}")
        
        start_str = start_time.strftime("%H:%M") if isinstance(start_time, time) else str(start_time)
        end_str = end_time.strftime("%H:%M") if isinstance(end_time, time) else str(end_time)

        return ScheduleWithDetails(
            id=getattr(schedule, 'id', None),
            section_id=getattr(schedule, 'section_id', None),
            day_of_week=day_name_to_index(day_name),
            start_time=start_str,
            end_time=end_str,
            room=getattr(schedule, 'room', None),
            building=getattr(schedule, 'building', None),
            section_code=getattr(section, 'section_code', None),
            course_name=getattr(course, 'name', None),
            course_code=getattr(course, 'course_code', None),
            teacher_name=getattr(teacher, 'full_name', None) if teacher else None,
            enrolled_count=enrolled_count,
            conflicts=conflicts
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{schedule_id}", response_model=ScheduleWithDetails)
async def update_schedule(
    schedule_id: int,
    request: UpdateScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(['super_admin', 'academic_admin']))
):
    """Update an existing schedule entry"""
    try:
        # Get existing schedule
        stmt = select(SectionSchedule).where(SectionSchedule.id == schedule_id)
        result = await db.execute(stmt)
        schedule = result.scalar_one_or_none()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        # Prepare updates
        updates = {}
        if request.day_of_week is not None:
            updates['day_of_week'] = day_index_to_name(request.day_of_week)
        if request.start_time is not None:
            updates['start_time'] = parse_time(request.start_time)
        if request.end_time is not None:
            updates['end_time'] = parse_time(request.end_time)
        if request.room is not None:
            updates['room'] = request.room
        if request.building is not None:
            updates['building'] = request.building
        
        # Validate times if being updated
        start_time_val = updates.get('start_time', schedule.start_time)
        end_time_val = updates.get('end_time', schedule.end_time)
        start_time = start_time_val if isinstance(start_time_val, time) else parse_time(start_time_val)
        end_time = end_time_val if isinstance(end_time_val, time) else parse_time(end_time_val)
        
        if start_time >= end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        
        # Get day_of_week for conflict check
        day_val = updates.get('day_of_week', schedule.day_of_week)
        
        # Check conflicts with updated values
        conflicts = await check_schedule_conflicts(
            db,
            schedule.section_id,
            day_val,
            start_time,
            end_time,
            updates.get('room', schedule.room),
            exclude_schedule_ids=[schedule_id]
        )
        
        if conflicts:
            error_conflicts = [c for c in conflicts if c.severity == 'error']
            if error_conflicts:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "message": "Schedule conflicts detected",
                        "conflicts": [c.dict() for c in error_conflicts]
                    }
                )
        
        # Apply updates
        for key, value in updates.items():
            setattr(schedule, key, value)
        
        await db.commit()
        await db.refresh(schedule)
        
        # Get details for response
        section_details = await get_section_with_details(db, schedule.section_id)
        section = section_details['section']
        course = section_details['course']
        teacher = section_details['teacher']
        
        # Get enrollment count
        from app.models.academic import Enrollment
        count_stmt = select(func.count(Enrollment.id)).where(Enrollment.course_section_id == schedule.section_id)
        count_result = await db.execute(count_stmt)
        enrolled_count = count_result.scalar() or 0
        
        logger.info(f"Updated schedule {schedule_id}")
        
        # Normalize schedule times for response
        resp_start = schedule.start_time if isinstance(schedule.start_time, time) else parse_time(schedule.start_time)
        resp_end = schedule.end_time if isinstance(schedule.end_time, time) else parse_time(schedule.end_time)
        start_str = resp_start.strftime("%H:%M") if isinstance(resp_start, time) else str(resp_start)
        end_str = resp_end.strftime("%H:%M") if isinstance(resp_end, time) else str(resp_end)

        return ScheduleWithDetails(
            id=getattr(schedule, 'id', None),
            section_id=getattr(schedule, 'section_id', None),
            day_of_week=day_name_to_index(schedule.day_of_week) if isinstance(schedule.day_of_week, str) else schedule.day_of_week,
            start_time=start_str,
            end_time=end_str,
            room=getattr(schedule, 'room', None),
            building=getattr(schedule, 'building', None),
            section_code=getattr(section, 'section_code', None),
            course_name=getattr(course, 'name', None),
            course_code=getattr(course, 'course_code', None),
            teacher_name=getattr(teacher, 'full_name', None) if teacher else None,
            enrolled_count=enrolled_count,
            conflicts=conflicts
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(['super_admin', 'academic_admin']))
):
    """Delete a schedule entry"""
    try:
        stmt = select(SectionSchedule).where(SectionSchedule.id == schedule_id)
        result = await db.execute(stmt)
        schedule = result.scalar_one_or_none()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        await db.delete(schedule)
        await db.commit()
        
        logger.info(f"Deleted schedule {schedule_id}")
        
        return {"success": True, "message": "Schedule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
