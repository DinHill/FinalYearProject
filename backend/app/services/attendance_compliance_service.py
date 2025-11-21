"""
Attendance Compliance Service
Monitors attendance, calculates compliance levels, and identifies at-risk students
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.academic import Attendance, Enrollment, CourseSection, Course, Semester, calculate_attendance_compliance, AttendanceComplianceLevel
from app.models.user import User
from typing import Dict, List, Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class AttendanceComplianceService:
    """Service for attendance compliance monitoring"""
    
    @staticmethod
    async def get_enrollment_compliance(
        db: AsyncSession,
        enrollment_id: int
    ) -> Dict:
        """Get attendance compliance for a single enrollment"""
        enrollment = await db.get(Enrollment, enrollment_id)
        if not enrollment:
            return None
        
        # Get all attendance records
        query = select(Attendance).where(Attendance.enrollment_id == enrollment_id)
        result = await db.execute(query)
        records = result.scalars().all()
        
        total_sessions = len(records)
        present_count = sum(1 for r in records if r.status in ['present', 'late'])
        absent_count = sum(1 for r in records if r.status == 'absent')
        excused_count = sum(1 for r in records if r.status == 'excused')
        
        percentage, compliance_level = calculate_attendance_compliance(present_count, total_sessions)
        
        return {
            "enrollment_id": enrollment_id,
            "student_id": enrollment.student_id,
            "total_sessions": total_sessions,
            "present_count": present_count,
            "absent_count": absent_count,
            "excused_count": excused_count,
            "attendance_percentage": round(percentage, 2),
            "compliance_level": compliance_level.value,
            "is_auto_failed": compliance_level == AttendanceComplianceLevel.AUTO_FAIL,
            "is_at_risk": compliance_level in [AttendanceComplianceLevel.AT_RISK, AttendanceComplianceLevel.EXAM_INELIGIBLE]
        }
    
    @staticmethod
    async def get_section_compliance_summary(
        db: AsyncSession,
        section_id: int
    ) -> Dict:
        """Get attendance compliance summary for a section"""
        # Get all enrollments for this section
        query = select(Enrollment).where(
            and_(
                Enrollment.course_section_id == section_id,
                Enrollment.status == 'enrolled'
            )
        )
        result = await db.execute(query)
        enrollments = result.scalars().all()
        
        if not enrollments:
            return {
                "section_id": section_id,
                "total_students": 0,
                "avg_attendance": 0,
                "compliant_count": 0,
                "at_risk_count": 0,
                "exam_ineligible_count": 0,
                "auto_failed_count": 0,
                "students": []
            }
        
        students_data = []
        total_percentage = 0
        compliant = 0
        at_risk = 0
        exam_ineligible = 0
        auto_failed = 0
        
        for enrollment in enrollments:
            compliance = await AttendanceComplianceService.get_enrollment_compliance(db, enrollment.id)
            if compliance:
                students_data.append(compliance)
                total_percentage += compliance['attendance_percentage']
                
                if compliance['compliance_level'] == 'compliant':
                    compliant += 1
                elif compliance['compliance_level'] == 'at_risk':
                    at_risk += 1
                elif compliance['compliance_level'] == 'ineligible':
                    exam_ineligible += 1
                elif compliance['compliance_level'] == 'auto_fail':
                    auto_failed += 1
        
        avg_attendance = total_percentage / len(enrollments) if enrollments else 0
        
        # Get section details
        section = await db.get(CourseSection, section_id)
        course = await db.get(Course, section.course_id) if section else None
        
        return {
            "section_id": section_id,
            "course_code": course.course_code if course else "N/A",
            "course_name": course.name if course else "N/A",
            "section_code": section.section_code if section else "N/A",
            "total_students": len(enrollments),
            "avg_attendance": round(avg_attendance, 2),
            "compliant_count": compliant,
            "at_risk_count": at_risk,
            "exam_ineligible_count": exam_ineligible,
            "auto_failed_count": auto_failed,
            "students": students_data
        }
    
    @staticmethod
    async def get_semester_compliance_overview(
        db: AsyncSession,
        semester_id: int
    ) -> Dict:
        """Get attendance compliance overview for entire semester"""
        # Get all sections for this semester
        query = select(CourseSection).where(
            and_(
                CourseSection.semester_id == semester_id,
                CourseSection.is_active == True
            )
        )
        result = await db.execute(query)
        sections = result.scalars().all()
        
        if not sections:
            return {
                "semester_id": semester_id,
                "total_sections": 0,
                "total_students": 0,
                "overall_compliance": 0,
                "sections_summary": []
            }
        
        sections_summary = []
        total_students = 0
        total_avg = 0
        total_at_risk = 0
        total_failed = 0
        
        for section in sections:
            summary = await AttendanceComplianceService.get_section_compliance_summary(db, section.id)
            sections_summary.append(summary)
            total_students += summary['total_students']
            total_avg += summary['avg_attendance'] * summary['total_students']
            total_at_risk += summary['at_risk_count'] + summary['exam_ineligible_count']
            total_failed += summary['auto_failed_count']
        
        overall_avg = total_avg / total_students if total_students > 0 else 0
        
        return {
            "semester_id": semester_id,
            "total_sections": len(sections),
            "total_students": total_students,
            "overall_compliance": round(overall_avg, 2),
            "students_at_risk": total_at_risk,
            "students_auto_failed": total_failed,
            "compliance_rate": round((total_students - total_failed) / total_students * 100, 2) if total_students > 0 else 0,
            "sections_summary": sections_summary
        }
    
    @staticmethod
    async def get_at_risk_students(
        db: AsyncSession,
        semester_id: Optional[int] = None,
        section_id: Optional[int] = None
    ) -> List[Dict]:
        """Get list of students with attendance < 75%"""
        query = select(Enrollment).join(CourseSection)
        
        conditions = [Enrollment.status == 'enrolled']
        
        if semester_id:
            conditions.append(CourseSection.semester_id == semester_id)
        if section_id:
            conditions.append(Enrollment.course_section_id == section_id)
        
        query = query.where(and_(*conditions))
        result = await db.execute(query)
        enrollments = result.scalars().all()
        
        at_risk_students = []
        
        for enrollment in enrollments:
            compliance = await AttendanceComplianceService.get_enrollment_compliance(db, enrollment.id)
            
            if compliance and compliance['is_at_risk']:
                # Get student details
                student = await db.get(User, enrollment.student_id)
                section = await db.get(CourseSection, enrollment.course_section_id)
                course = await db.get(Course, section.course_id) if section else None
                
                at_risk_students.append({
                    **compliance,
                    "student_name": student.full_name if student else "Unknown",
                    "student_email": student.email if student else "N/A",
                    "course_code": course.course_code if course else "N/A",
                    "course_name": course.name if course else "N/A",
                    "section_code": section.section_code if section else "N/A"
                })
        
        return at_risk_students
    
    @staticmethod
    async def lock_attendance_for_section(
        db: AsyncSession,
        section_id: int
    ) -> Dict:
        """Lock attendance records after semester ends (prevents editing)"""
        query = select(Attendance).join(Enrollment).where(
            Enrollment.course_section_id == section_id
        )
        result = await db.execute(query)
        records = result.scalars().all()
        
        for record in records:
            record.is_locked = True
        
        await db.commit()
        
        logger.info(f"Locked {len(records)} attendance records for section {section_id}")
        
        return {
            "success": True,
            "locked_count": len(records),
            "section_id": section_id
        }
    
    @staticmethod
    async def export_attendance_report(
        db: AsyncSession,
        section_id: int
    ) -> List[Dict]:
        """Export attendance data for CSV/Excel download"""
        summary = await AttendanceComplianceService.get_section_compliance_summary(db, section_id)
        
        export_data = []
        for student in summary.get('students', []):
            # Get student details
            student_obj = await db.get(User, student['student_id'])
            
            export_data.append({
                "Student ID": student['student_id'],
                "Student Name": student_obj.full_name if student_obj else "Unknown",
                "Email": student_obj.email if student_obj else "N/A",
                "Total Sessions": student['total_sessions'],
                "Present": student['present_count'],
                "Absent": student['absent_count'],
                "Excused": student['excused_count'],
                "Attendance %": student['attendance_percentage'],
                "Status": student['compliance_level'].upper(),
                "Auto Failed": "YES" if student['is_auto_failed'] else "NO"
            })
        
        return export_data
