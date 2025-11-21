"""
Timetable Conflict Detection Service
Checks for room and instructor scheduling conflicts
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.academic import SectionSchedule, CourseSection
from app.core.exceptions import ValidationError
from datetime import time
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class TimetableConflictService:
    """Service for detecting timetable conflicts"""
    
    @staticmethod
    def times_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
        """Check if two time ranges overlap"""
        return start1 < end2 and end1 > start2
    
    @staticmethod
    async def check_room_conflict(
        db: AsyncSession,
        room: str,
        day_of_week: str,
        start_time: time,
        end_time: time,
        exclude_schedule_id: Optional[int] = None
    ) -> List[Dict]:
        """
        Check if a room is available at the given time
        Returns list of conflicting schedules
        """
        # Get all schedules for this room and day
        query = select(SectionSchedule).where(
            and_(
                SectionSchedule.room == room,
                SectionSchedule.day_of_week == day_of_week
            )
        )
        
        if exclude_schedule_id:
            query = query.where(SectionSchedule.id != exclude_schedule_id)
        
        result = await db.execute(query)
        schedules = result.scalars().all()
        
        conflicts = []
        for schedule in schedules:
            if TimetableConflictService.times_overlap(
                start_time, end_time,
                schedule.start_time, schedule.end_time
            ):
                # Get section details
                section = await db.get(CourseSection, schedule.section_id)
                
                conflicts.append({
                    "schedule_id": schedule.id,
                    "section_id": schedule.section_id,
                    "section_code": section.section_code if section else "N/A",
                    "room": schedule.room,
                    "day": schedule.day_of_week,
                    "start_time": str(schedule.start_time),
                    "end_time": str(schedule.end_time),
                    "conflict_type": "room"
                })
        
        return conflicts
    
    @staticmethod
    async def check_instructor_conflict(
        db: AsyncSession,
        instructor_id: int,
        day_of_week: str,
        start_time: time,
        end_time: time,
        exclude_section_id: Optional[int] = None
    ) -> List[Dict]:
        """
        Check if an instructor is available at the given time
        Returns list of conflicting schedules
        """
        # Get all sections taught by this instructor
        query = select(CourseSection).where(
            CourseSection.instructor_id == instructor_id
        )
        
        if exclude_section_id:
            query = query.where(CourseSection.id != exclude_section_id)
        
        result = await db.execute(query)
        sections = result.scalars().all()
        
        conflicts = []
        
        # For each section, check its schedules
        for section in sections:
            schedule_query = select(SectionSchedule).where(
                and_(
                    SectionSchedule.section_id == section.id,
                    SectionSchedule.day_of_week == day_of_week
                )
            )
            schedule_result = await db.execute(schedule_query)
            schedules = schedule_result.scalars().all()
            
            for schedule in schedules:
                if TimetableConflictService.times_overlap(
                    start_time, end_time,
                    schedule.start_time, schedule.end_time
                ):
                    conflicts.append({
                        "schedule_id": schedule.id,
                        "section_id": section.id,
                        "section_code": section.section_code,
                        "instructor_id": instructor_id,
                        "day": schedule.day_of_week,
                        "start_time": str(schedule.start_time),
                        "end_time": str(schedule.end_time),
                        "room": schedule.room,
                        "conflict_type": "instructor"
                    })
        
        return conflicts
    
    @staticmethod
    async def validate_schedule_creation(
        db: AsyncSession,
        section_id: int,
        room: str,
        day_of_week: str,
        start_time: time,
        end_time: time
    ) -> Dict:
        """
        Validate schedule before creation
        Checks both room and instructor conflicts
        Raises ValidationError if conflicts found
        """
        # Validate time range
        if start_time >= end_time:
            raise ValidationError("Start time must be before end time")
        
        # Get section to check instructor
        section = await db.get(CourseSection, section_id)
        if not section:
            raise ValidationError("Section not found")
        
        # Check room conflicts
        room_conflicts = await TimetableConflictService.check_room_conflict(
            db, room, day_of_week, start_time, end_time
        )
        
        # Check instructor conflicts
        instructor_conflicts = []
        if section.instructor_id:
            instructor_conflicts = await TimetableConflictService.check_instructor_conflict(
                db, section.instructor_id, day_of_week, start_time, end_time
            )
        
        all_conflicts = room_conflicts + instructor_conflicts
        
        if all_conflicts:
            conflict_messages = []
            for conflict in all_conflicts:
                if conflict['conflict_type'] == 'room':
                    conflict_messages.append(
                        f"Room {conflict['room']} is already booked by {conflict['section_code']} "
                        f"on {conflict['day']} {conflict['start_time']}-{conflict['end_time']}"
                    )
                else:
                    conflict_messages.append(
                        f"Instructor is already teaching {conflict['section_code']} "
                        f"on {conflict['day']} {conflict['start_time']}-{conflict['end_time']} in {conflict['room']}"
                    )
            
            raise ValidationError(
                "Schedule conflicts detected",
                details={
                    "conflicts": all_conflicts,
                    "messages": conflict_messages
                }
            )
        
        return {
            "valid": True,
            "message": "No conflicts detected"
        }
    
    @staticmethod
    async def get_section_conflicts(
        db: AsyncSession,
        section_id: int
    ) -> List[Dict]:
        """Get all conflicts for a specific section"""
        # Get all schedules for this section
        query = select(SectionSchedule).where(SectionSchedule.section_id == section_id)
        result = await db.execute(query)
        schedules = result.scalars().all()
        
        all_conflicts = []
        
        for schedule in schedules:
            # Check room conflicts
            room_conflicts = await TimetableConflictService.check_room_conflict(
                db, schedule.room, schedule.day_of_week,
                schedule.start_time, schedule.end_time,
                exclude_schedule_id=schedule.id
            )
            
            # Check instructor conflicts
            section = await db.get(CourseSection, section_id)
            instructor_conflicts = []
            if section and section.instructor_id:
                instructor_conflicts = await TimetableConflictService.check_instructor_conflict(
                    db, section.instructor_id, schedule.day_of_week,
                    schedule.start_time, schedule.end_time,
                    exclude_section_id=section_id
                )
            
            all_conflicts.extend(room_conflicts + instructor_conflicts)
        
        return all_conflicts
    
    @staticmethod
    async def get_all_conflicts_for_semester(
        db: AsyncSession,
        semester_id: int
    ) -> List[Dict]:
        """Get all scheduling conflicts for a semester"""
        # Get all sections for this semester
        query = select(CourseSection).where(
            and_(
                CourseSection.semester_id == semester_id,
                CourseSection.is_active == True
            )
        )
        result = await db.execute(query)
        sections = result.scalars().all()
        
        all_conflicts = []
        checked_pairs = set()  # Avoid duplicate conflict reports
        
        for section in sections:
            conflicts = await TimetableConflictService.get_section_conflicts(db, section.id)
            
            for conflict in conflicts:
                # Create unique key for this conflict pair
                pair_key = tuple(sorted([section.id, conflict['section_id']]))
                
                if pair_key not in checked_pairs:
                    all_conflicts.append(conflict)
                    checked_pairs.add(pair_key)
        
        logger.info(f"Found {len(all_conflicts)} conflicts for semester {semester_id}")
        
        return all_conflicts
    
    @staticmethod
    async def get_available_rooms(
        db: AsyncSession,
        day_of_week: str,
        start_time: time,
        end_time: time,
        campus_id: Optional[int] = None
    ) -> List[str]:
        """Get list of available rooms for a given time slot"""
        # Get all schedules for this day and overlapping time
        query = select(SectionSchedule).where(SectionSchedule.day_of_week == day_of_week)
        result = await db.execute(query)
        schedules = result.scalars().all()
        
        # Get all unique rooms from database (this would need a rooms table ideally)
        all_rooms_query = select(SectionSchedule.room).distinct()
        if campus_id:
            all_rooms_query = all_rooms_query.where(SectionSchedule.campus_id == campus_id)
        
        all_rooms_result = await db.execute(all_rooms_query)
        all_rooms = [row[0] for row in all_rooms_result]
        
        # Filter out busy rooms
        busy_rooms = set()
        for schedule in schedules:
            if TimetableConflictService.times_overlap(
                start_time, end_time,
                schedule.start_time, schedule.end_time
            ):
                busy_rooms.add(schedule.room)
        
        available_rooms = [room for room in all_rooms if room not in busy_rooms]
        
        return available_rooms
