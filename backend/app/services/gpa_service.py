"""
GPA calculation service
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models import (
    User, Enrollment, CourseSection, Course, Grade, Assignment
)
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class GPAService:
    """GPA calculation and academic progress tracking"""
    
    # Grade point mapping
    GRADE_POINTS = {
        "A+": Decimal("4.0"),
        "A": Decimal("4.0"),
        "A-": Decimal("3.7"),
        "B+": Decimal("3.3"),
        "B": Decimal("3.0"),
        "B-": Decimal("2.7"),
        "C+": Decimal("2.3"),
        "C": Decimal("2.0"),
        "C-": Decimal("1.7"),
        "D+": Decimal("1.3"),
        "D": Decimal("1.0"),
        "F": Decimal("0.0")
    }
    
    @staticmethod
    def score_to_letter_grade(score: Decimal) -> str:
        """
        Convert numeric score to letter grade
        
        Grading scale:
        97-100: A+
        93-96: A
        90-92: A-
        87-89: B+
        83-86: B
        80-82: B-
        77-79: C+
        73-76: C
        70-72: C-
        67-69: D+
        60-66: D
        0-59: F
        """
        if score >= 97:
            return "A+"
        elif score >= 93:
            return "A"
        elif score >= 90:
            return "A-"
        elif score >= 87:
            return "B+"
        elif score >= 83:
            return "B"
        elif score >= 80:
            return "B-"
        elif score >= 77:
            return "C+"
        elif score >= 73:
            return "C"
        elif score >= 70:
            return "C-"
        elif score >= 67:
            return "D+"
        elif score >= 60:
            return "D"
        else:
            return "F"
    
    @staticmethod
    async def calculate_course_grade(
        db: AsyncSession,
        student_id: int,
        section_id: int
    ) -> Optional[Dict]:
        """
        Calculate final grade for a course
        
        Weighted average of all assignment grades
        
        Args:
            db: Database session
            student_id: Student user ID
            section_id: Course section ID
        
        Returns:
            dict with score, letter_grade, grade_points, or None if incomplete
        """
        # Get all assignments for section
        assignments_result = await db.execute(
            select(Assignment).where(Assignment.section_id == section_id)
        )
        assignments = assignments_result.scalars().all()
        
        if not assignments:
            return None
        
        # Get student's grades
        assignment_ids = [a.id for a in assignments]
        grades_result = await db.execute(
            select(Grade).where(
                and_(
                    Grade.student_id == student_id,
                    Grade.assignment_id.in_(assignment_ids)
                )
            )
        )
        grades = {g.assignment_id: g for g in grades_result.scalars().all()}
        
        # Calculate weighted average
        total_weight = Decimal("0")
        weighted_score = Decimal("0")
        
        for assignment in assignments:
            grade = grades.get(assignment.id)
            if not grade or grade.score is None:
                # Missing grade - return None (incomplete)
                return None
            
            # Calculate percentage for this assignment
            percentage = (grade.score / assignment.max_score) * 100
            
            # Add to weighted score
            weighted_score += percentage * (assignment.weight / 100)
            total_weight += assignment.weight
        
        # Normalize if weights don't add up to 100
        if total_weight > 0:
            final_score = (weighted_score / total_weight * 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            final_score = Decimal("0")
        
        # Convert to letter grade
        letter_grade = GPAService.score_to_letter_grade(final_score)
        grade_points = GPAService.GRADE_POINTS.get(letter_grade, Decimal("0"))
        
        return {
            "score": final_score,
            "letter_grade": letter_grade,
            "grade_points": grade_points
        }
    
    @staticmethod
    async def calculate_semester_gpa(
        db: AsyncSession,
        student_id: int,
        semester_id: int
    ) -> Dict:
        """
        Calculate GPA for a semester
        
        Args:
            db: Database session
            student_id: Student user ID
            semester_id: Semester ID
        
        Returns:
            dict with gpa, credits_attempted, credits_earned, course_grades
        """
        # Get enrollments for semester
        enrollments_result = await db.execute(
            select(Enrollment)
            .join(CourseSection)
            .where(
                and_(
                    Enrollment.student_id == student_id,
                    CourseSection.semester_id == semester_id,
                    Enrollment.status.in_(["enrolled", "completed"])
                )
            )
        )
        enrollments = enrollments_result.scalars().all()
        
        if not enrollments:
            return {
                "gpa": Decimal("0.00"),
                "credits_attempted": 0,
                "credits_earned": 0,
                "course_grades": []
            }
        
        total_grade_points = Decimal("0")
        total_credits = 0
        earned_credits = 0
        course_grades = []
        
        for enrollment in enrollments:
            # Get section and course
            section = await db.get(CourseSection, enrollment.section_id)
            course = await db.get(Course, section.course_id)
            
            # Calculate course grade
            grade_info = await GPAService.calculate_course_grade(
                db, student_id, section.id
            )
            
            if grade_info:
                # Add to totals
                total_grade_points += grade_info["grade_points"] * course.credits
                total_credits += course.credits
                
                # Count earned credits (D or better)
                if grade_info["grade_points"] >= Decimal("1.0"):
                    earned_credits += course.credits
                
                course_grades.append({
                    "course_code": course.code,
                    "course_name": course.name,
                    "credits": course.credits,
                    "score": grade_info["score"],
                    "letter_grade": grade_info["letter_grade"],
                    "grade_points": grade_info["grade_points"]
                })
        
        # Calculate GPA
        if total_credits > 0:
            gpa = (total_grade_points / total_credits).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            gpa = Decimal("0.00")
        
        return {
            "gpa": gpa,
            "credits_attempted": total_credits,
            "credits_earned": earned_credits,
            "course_grades": course_grades
        }
    
    @staticmethod
    async def calculate_cumulative_gpa(
        db: AsyncSession,
        student_id: int
    ) -> Dict:
        """
        Calculate cumulative GPA across all semesters
        
        Args:
            db: Database session
            student_id: Student user ID
        
        Returns:
            dict with cumulative_gpa, total_credits_attempted, total_credits_earned
        """
        # Get all enrollments
        enrollments_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.status.in_(["enrolled", "completed"])
                )
            )
        )
        enrollments = enrollments_result.scalars().all()
        
        if not enrollments:
            return {
                "cumulative_gpa": Decimal("0.00"),
                "total_credits_attempted": 0,
                "total_credits_earned": 0
            }
        
        total_grade_points = Decimal("0")
        total_credits = 0
        earned_credits = 0
        
        for enrollment in enrollments:
            # Get section and course
            section = await db.get(CourseSection, enrollment.section_id)
            course = await db.get(Course, section.course_id)
            
            # Calculate course grade
            grade_info = await GPAService.calculate_course_grade(
                db, student_id, section.id
            )
            
            if grade_info:
                total_grade_points += grade_info["grade_points"] * course.credits
                total_credits += course.credits
                
                if grade_info["grade_points"] >= Decimal("1.0"):
                    earned_credits += course.credits
        
        # Calculate cumulative GPA
        if total_credits > 0:
            cumulative_gpa = (total_grade_points / total_credits).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            cumulative_gpa = Decimal("0.00")
        
        return {
            "cumulative_gpa": cumulative_gpa,
            "total_credits_attempted": total_credits,
            "total_credits_earned": earned_credits
        }
    
    @staticmethod
    async def get_academic_standing(
        db: AsyncSession,
        student_id: int
    ) -> Dict:
        """
        Get student's academic standing
        
        Standing based on cumulative GPA:
        - Dean's List: GPA >= 3.5
        - Good Standing: GPA >= 2.0
        - Academic Probation: GPA < 2.0
        
        Args:
            db: Database session
            student_id: Student user ID
        
        Returns:
            dict with standing, gpa, message
        """
        gpa_info = await GPAService.calculate_cumulative_gpa(db, student_id)
        gpa = gpa_info["cumulative_gpa"]
        
        if gpa >= Decimal("3.5"):
            standing = "Dean's List"
            message = "Excellent academic performance"
        elif gpa >= Decimal("2.0"):
            standing = "Good Standing"
            message = "Satisfactory academic progress"
        else:
            standing = "Academic Probation"
            message = "Below minimum GPA requirement"
        
        return {
            "standing": standing,
            "cumulative_gpa": gpa,
            "total_credits": gpa_info["total_credits_earned"],
            "message": message
        }
    
    @staticmethod
    async def calculate_degree_progress(
        db: AsyncSession,
        student_id: int,
        required_credits: int = 120
    ) -> Dict:
        """
        Calculate degree completion progress
        
        Args:
            db: Database session
            student_id: Student user ID
            required_credits: Total credits required for degree (default 120)
        
        Returns:
            dict with progress_percentage, credits_earned, credits_remaining
        """
        gpa_info = await GPAService.calculate_cumulative_gpa(db, student_id)
        credits_earned = gpa_info["total_credits_earned"]
        credits_remaining = max(0, required_credits - credits_earned)
        progress_percentage = min(100, (credits_earned / required_credits * 100))
        
        return {
            "progress_percentage": Decimal(str(progress_percentage)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            "credits_earned": credits_earned,
            "credits_remaining": credits_remaining,
            "required_credits": required_credits
        }
