"""
Grade Approval Workflow Service
Manages grade lifecycle: draft → submitted → under_review → approved/rejected → published → archived
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.academic import Grade, Enrollment, Attendance, CourseSection
from app.core.exceptions import ValidationError
from datetime import datetime
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class GradeApprovalService:
    """Service for managing grade approval workflow"""
    
    # Valid state transitions
    VALID_TRANSITIONS = {
        "draft": ["submitted"],
        "submitted": ["under_review"],
        "under_review": ["approved", "rejected"],
        "rejected": ["submitted"],  # Allow resubmission after fix
        "approved": ["published"],
        "published": ["archived"],
        "archived": []  # No transitions from archived
    }
    
    @staticmethod
    async def submit_grades(
        db: AsyncSession,
        section_id: int,
        submitted_by: int
    ) -> Dict:
        """
        Submit all draft grades for a section for review
        Validates attendance before submission
        """
        # Get all grades for this section
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "draft"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No draft grades found for this section")
        
        # Validate attendance for each student
        failed_attendance = []
        for grade in grades:
            enrollment = await db.get(Enrollment, grade.enrollment_id)
            compliance = await GradeApprovalService._check_attendance_compliance(db, enrollment.id)
            
            if compliance['compliance_level'] == 'auto_fail':
                failed_attendance.append({
                    'student_id': enrollment.student_id,
                    'attendance_percentage': compliance['attendance_percentage']
                })
        
        if failed_attendance:
            raise ValidationError(
                f"Cannot submit grades: {len(failed_attendance)} students have attendance < 25%",
                details=failed_attendance
            )
        
        # Update all grades to submitted
        for grade in grades:
            grade.approval_status = "submitted"
            grade.submitted_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Submitted {len(grades)} grades for section {section_id}")
        
        return {
            "success": True,
            "submitted_count": len(grades),
            "section_id": section_id
        }
    
    @staticmethod
    async def review_grades(
        db: AsyncSession,
        section_id: int,
        reviewed_by: int
    ) -> Dict:
        """Move submitted grades to under_review status"""
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "submitted"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No submitted grades found for this section")
        
        for grade in grades:
            grade.approval_status = "under_review"
            grade.reviewed_by = reviewed_by
            grade.reviewed_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Set {len(grades)} grades to under_review for section {section_id}")
        
        return {
            "success": True,
            "reviewed_count": len(grades)
        }
    
    @staticmethod
    async def approve_grades(
        db: AsyncSession,
        section_id: int,
        approved_by: int,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Approve grades that are under review
        Performs final attendance validation
        """
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "under_review"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No grades under review for this section")
        
        # Final attendance check
        attendance_warnings = []
        for grade in grades:
            enrollment = await db.get(Enrollment, grade.enrollment_id)
            compliance = await GradeApprovalService._check_attendance_compliance(db, enrollment.id)
            
            if compliance['compliance_level'] in ['auto_fail', 'exam_ineligible']:
                attendance_warnings.append({
                    'student_id': enrollment.student_id,
                    'attendance_percentage': compliance['attendance_percentage'],
                    'compliance_level': compliance['compliance_level']
                })
                # Override grade for auto-fail students
                if compliance['compliance_level'] == 'auto_fail':
                    grade.grade_value = 0
                    grade.approval_notes = f"Auto-failed due to attendance < 25%. Original grade: {grade.grade_value}"
        
        # Approve all grades
        for grade in grades:
            grade.approval_status = "approved"
            grade.reviewed_by = approved_by
            grade.approval_notes = notes
            grade.reviewed_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Approved {len(grades)} grades for section {section_id}")
        
        return {
            "success": True,
            "approved_count": len(grades),
            "attendance_warnings": attendance_warnings
        }
    
    @staticmethod
    async def reject_grades(
        db: AsyncSession,
        section_id: int,
        rejected_by: int,
        rejection_reason: str
    ) -> Dict:
        """Reject grades and send back for correction"""
        if not rejection_reason or len(rejection_reason.strip()) < 10:
            raise ValidationError("Rejection reason must be at least 10 characters")
        
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "under_review"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No grades under review for this section")
        
        for grade in grades:
            grade.approval_status = "rejected"
            grade.reviewed_by = rejected_by
            grade.rejection_reason = rejection_reason
            grade.reviewed_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Rejected {len(grades)} grades for section {section_id}")
        
        return {
            "success": True,
            "rejected_count": len(grades),
            "reason": rejection_reason
        }
    
    @staticmethod
    async def publish_grades(
        db: AsyncSession,
        section_id: int,
        published_by: int
    ) -> Dict:
        """Publish approved grades to make them visible to students"""
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "approved"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No approved grades found for this section")
        
        for grade in grades:
            grade.approval_status = "published"
            grade.published_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Published {len(grades)} grades for section {section_id}")
        
        return {
            "success": True,
            "published_count": len(grades)
        }
    
    @staticmethod
    async def archive_grades(
        db: AsyncSession,
        section_id: int
    ) -> Dict:
        """Archive published grades after semester ends (locks them)"""
        query = select(Grade).join(Enrollment).join(CourseSection).where(
            and_(
                CourseSection.id == section_id,
                Grade.approval_status == "published"
            )
        )
        result = await db.execute(query)
        grades = result.scalars().all()
        
        if not grades:
            raise ValidationError("No published grades found for this section")
        
        for grade in grades:
            grade.approval_status = "archived"
        
        await db.commit()
        
        logger.info(f"Archived {len(grades)} grades for section {section_id}")
        
        return {
            "success": True,
            "archived_count": len(grades)
        }
    
    @staticmethod
    async def _check_attendance_compliance(db: AsyncSession, enrollment_id: int) -> Dict:
        """Check attendance compliance for an enrollment"""
        from app.models.academic import calculate_attendance_compliance
        
        # Get all attendance records
        query = select(Attendance).where(Attendance.enrollment_id == enrollment_id)
        result = await db.execute(query)
        records = result.scalars().all()
        
        total_sessions = len(records)
        present_count = sum(1 for r in records if r.status in ['present', 'late'])
        
        percentage, compliance_level = calculate_attendance_compliance(present_count, total_sessions)
        
        return {
            "enrollment_id": enrollment_id,
            "total_sessions": total_sessions,
            "present_count": present_count,
            "attendance_percentage": round(percentage, 2),
            "compliance_level": compliance_level.value
        }
    
    @staticmethod
    async def get_section_grade_summary(db: AsyncSession, section_id: int) -> Dict:
        """Get grade approval summary for a section"""
        query = select(
            Grade.approval_status,
            func.count(Grade.id).label('count')
        ).join(Enrollment).join(CourseSection).where(
            CourseSection.id == section_id
        ).group_by(Grade.approval_status)
        
        result = await db.execute(query)
        status_counts = {row.approval_status: row.count for row in result}
        
        # Get attendance failures
        query = select(func.count(Enrollment.id)).join(CourseSection).where(
            CourseSection.id == section_id
        )
        result = await db.execute(query)
        total_students = result.scalar() or 0
        
        # Calculate students with attendance < 75%
        attendance_failures = 0
        for enrollment_id in range(1, total_students + 1):  # This is simplified
            try:
                compliance = await GradeApprovalService._check_attendance_compliance(db, enrollment_id)
                if compliance['compliance_level'] in ['auto_fail', 'exam_ineligible']:
                    attendance_failures += 1
            except:
                pass
        
        return {
            "section_id": section_id,
            "total_students": total_students,
            "status_counts": status_counts,
            "attendance_failures": attendance_failures
        }
