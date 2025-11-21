"""
Enrollment service - prerequisite checking, capacity validation, schedule conflicts
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models import (
    User, CourseSection, Course, Enrollment, Semester  # Removed Schedule
)
from app.core.exceptions import (
    ValidationError,
    BusinessLogicError,
    EnrollmentLimitExceededError,
    PrerequisiteNotMetError
)
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EnrollmentService:
    """Business logic for course enrollment"""
    
    @staticmethod
    async def validate_enrollment(
        db: AsyncSession,
        student_id: int,
        section_id: int
    ) -> None:
        """
        Validate if student can enroll in section
        
        Checks:
        1. Student exists and is active
        2. Section exists and is open
        3. Section not full
        4. Student not already enrolled
        5. No schedule conflicts
        6. Prerequisites met (future enhancement)
        7. Credit limit not exceeded (future enhancement)
        
        Args:
            db: Database session
            student_id: Student user ID
            section_id: Course section ID
        
        Raises:
            ValidationError: If validation fails
        """
        # Check student
        student = await db.get(User, student_id)
        if not student or student.role != "student":
            raise ValidationError("Invalid student")
        
        if student.status != "active":
            raise ValidationError("Student account is not active")
        
        # Check section
        section = await db.get(CourseSection, section_id)
        if not section:
            raise ValidationError("Course section not found")
        
        if not section.is_active:
            raise ValidationError(f"Section is not active")
        
        # Check capacity
        enrolled_count = await EnrollmentService.get_enrolled_count(db, section_id)
        if enrolled_count >= section.max_students:
            raise EnrollmentLimitExceededError(
                f"Section is full ({enrolled_count}/{section.max_students})"
            )
        
        # Check if already enrolled
        existing_enrollment = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.course_section_id == section_id,
                    Enrollment.status == "enrolled"
                )
            )
        )
        if existing_enrollment.scalar_one_or_none():
            raise ValidationError("Already enrolled in this section")
        
        # Check schedule conflicts
        has_conflict = await EnrollmentService.check_schedule_conflict(
            db, student_id, section_id
        )
        if has_conflict:
            raise ValidationError("Schedule conflict with existing enrollments")
        
        # Check semester is active
        semester = await db.get(Semester, section.semester_id)
        if not semester or not semester.is_active:
            raise ValidationError("Semester is not active for enrollment")
    
    @staticmethod
    async def enroll_student(
        db: AsyncSession,
        student_id: int,
        section_id: int
    ) -> Enrollment:
        """
        Enroll student in course section
        
        Args:
            db: Database session
            student_id: Student user ID
            section_id: Course section ID
        
        Returns:
            Enrollment object
        
        Raises:
            ValidationError: If validation fails
        """
        # Validate enrollment
        await EnrollmentService.validate_enrollment(db, student_id, section_id)
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            course_section_id=section_id,
            status="enrolled",
            enrollment_date=datetime.utcnow()
        )
        
        db.add(enrollment)
        
        # Update section enrolled_count
        section = await db.get(CourseSection, section_id)
        if section:
            section.enrolled_count = (section.enrolled_count or 0) + 1
        
        await db.commit()
        await db.refresh(enrollment)
        
        logger.info(f"Student {student_id} enrolled in section {section_id}")
        return enrollment
    
    @staticmethod
    async def drop_enrollment(
        db: AsyncSession,
        enrollment_id: int,
        student_id: int
    ) -> Enrollment:
        """
        Drop enrollment
        
        Args:
            db: Database session
            enrollment_id: Enrollment ID
            student_id: Student user ID (for verification)
        
        Returns:
            Updated enrollment
        
        Raises:
            ValidationError: If enrollment not found or unauthorized
        """
        enrollment = await db.get(Enrollment, enrollment_id)
        if not enrollment:
            raise ValidationError("Enrollment not found")
        
        if enrollment.student_id != student_id:
            raise ValidationError("Unauthorized to drop this enrollment")
        
        if enrollment.status != "enrolled":
            raise ValidationError(f"Cannot drop enrollment with status: {enrollment.status}")
        
        # Check if it's past drop deadline (future enhancement)
        # For now, allow dropping anytime
        
        enrollment.status = "dropped"
        enrollment.dropped_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(enrollment)
        
        logger.info(f"Student {student_id} dropped enrollment {enrollment_id}")
        return enrollment
    
    @staticmethod
    async def get_enrolled_count(
        db: AsyncSession,
        section_id: int
    ) -> int:
        """Get number of enrolled students in section"""
        result = await db.execute(
            select(func.count()).select_from(Enrollment).where(
                and_(
                    Enrollment.course_section_id == section_id,
                    Enrollment.status == "enrolled"
                )
            )
        )
        return result.scalar() or 0
    
    @staticmethod
    async def check_schedule_conflict(
        db: AsyncSession,
        student_id: int,
        new_section_id: int
    ) -> bool:
        """
        Check if new section conflicts with student's existing schedule
        
        Note: Schedules are stored as JSONB in course_sections.schedule column
        Format: [{"day": "Monday", "start_time": "09:00", "end_time": "10:30", "room": "A101"}, ...]
        
        Args:
            db: Database session
            student_id: Student user ID
            new_section_id: New section to check
        
        Returns:
            True if conflict exists, False otherwise
        """
        # Get new section with schedules
        new_section_result = await db.execute(
            select(CourseSection).where(CourseSection.id == new_section_id)
        )
        new_section = new_section_result.scalar_one_or_none()
        
        if not new_section or not new_section.schedule:
            return False  # No schedule defined, no conflict
        
        # Get student's current enrollments
        enrollments_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.status == "enrolled"
                )
            )
        )
        enrollments = enrollments_result.scalars().all()
        
        if not enrollments:
            return False  # No existing enrollments, no conflict
        
        # Get course sections for all enrolled sections
        section_ids = [e.course_section_id for e in enrollments]
        existing_sections_result = await db.execute(
            select(CourseSection).where(CourseSection.id.in_(section_ids))
        )
        existing_sections = existing_sections_result.scalars().all()
        
        # Check for time conflicts
        new_schedules = new_section.schedule if isinstance(new_section.schedule, list) else []
        
        for new_sched in new_schedules:
            for existing_section in existing_sections:
                if not existing_section.schedule:
                    continue
                    
                existing_schedules = existing_section.schedule if isinstance(existing_section.schedule, list) else []
                
                for existing_sched in existing_schedules:
                    # Same day?
                    if new_sched.get('day') != existing_sched.get('day'):
                        continue
                    
                    # Time overlap?
                    # Conflict if: new_start < existing_end AND new_end > existing_start
                    try:
                        new_start = new_sched.get('start_time', '')
                        new_end = new_sched.get('end_time', '')
                        existing_start = existing_sched.get('start_time', '')
                        existing_end = existing_sched.get('end_time', '')
                        
                        if (new_start and new_end and existing_start and existing_end):
                            if (new_start < existing_end and new_end > existing_start):
                                return True
                    except (AttributeError, TypeError):
                        # Invalid schedule format, skip
                        continue
        
        return False
    
    @staticmethod
    async def get_student_enrollments(
        db: AsyncSession,
        student_id: int,
        semester_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Enrollment]:
        """
        Get student's enrollments with filters
        
        Args:
            db: Database session
            student_id: Student user ID
            semester_id: Optional semester filter
            status: Optional status filter
        
        Returns:
            List of enrollments
        """
        query = select(Enrollment).where(Enrollment.student_id == student_id)
        
        if semester_id:
            # Join with section to filter by semester
            query = query.join(CourseSection).where(
                CourseSection.semester_id == semester_id
            )
        
        if status:
            query = query.where(Enrollment.status == status)
        
        query = query.order_by(Enrollment.enrolled_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_section_enrollments(
        db: AsyncSession,
        section_id: int,
        status: Optional[str] = None
    ) -> List[Enrollment]:
        """
        Get section's enrollments
        
        Args:
            db: Database session
            section_id: Course section ID
            status: Optional status filter
        
        Returns:
            List of enrollments
        """
        query = select(Enrollment).where(Enrollment.course_section_id == section_id)
        
        if status:
            query = query.where(Enrollment.status == status)
        
        query = query.order_by(Enrollment.enrolled_at.asc())
        
        result = await db.execute(query)
        return result.scalars().all()
