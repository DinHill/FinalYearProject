"""
Seed enrollments, attendance records, and grades for existing sections
"""
import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.academic import (
    Semester, CourseSection, Enrollment, Attendance, Grade, GradeStatus
)
from app.models.user import User

async def seed_full_academic_data():
    print("\n🎓 Seeding Complete Academic Data...")
    
    async with AsyncSessionLocal() as session:
        # Get current semester
        result = await session.execute(
            select(Semester).where(Semester.is_current == True)
        )
        current_semester = result.scalar_one()
        print(f"✅ Current semester: {current_semester.name}")
        
        # Get all sections for current semester
        result = await session.execute(
            select(CourseSection).where(
                CourseSection.semester_id == current_semester.id,
                CourseSection.is_active == True
            )
        )
        sections = result.scalars().all()
        print(f"✅ Found {len(sections)} sections")
        
        # Get students
        result = await session.execute(
            select(User).where(User.role == 'student')
        )
        students = result.scalars().all()
        student_ids = [s.id for s in students]
        print(f"✅ Found {len(student_ids)} students")
        
        # Get admins for grade review
        result = await session.execute(
            select(User).where(User.role.like('%admin%'))
        )
        admins = result.scalars().all()
        admin_ids = [a.id for a in admins] if admins else []
        
        if not student_ids:
            print("❌ No students found! Cannot create enrollments.")
            return
        
        # 1. CREATE ENROLLMENTS
        print("\n📝 Creating enrollments...")
        enrollment_objects = []
        
        for section in sections:
            # Enroll 60-95% of capacity
            enrollment_rate = random.uniform(0.6, 0.95)
            num_students = int(section.max_students * enrollment_rate)
            
            # Randomly select students for this section
            available_students = random.sample(
                student_ids, 
                min(num_students, len(student_ids))
            )
            
            for student_id in available_students:
                enrollment = Enrollment(
                    student_id=student_id,
                    course_section_id=section.id,
                    enrollment_date=current_semester.start_date + timedelta(days=random.randint(0, 10)),
                    status='enrolled'
                )
                session.add(enrollment)
                enrollment_objects.append(enrollment)
            
            # Update section enrolled_count
            section.enrolled_count = len(available_students)
        
        await session.flush()
        print(f"✅ Created {len(enrollment_objects)} enrollments")
        
        # 2. CREATE ATTENDANCE RECORDS
        print("\n✅ Creating attendance records...")
        attendance_count = 0
        # Assume 15 class sessions have occurred
        num_sessions = 15
        
        # Create attendance patterns for different student types
        for idx, enrollment in enumerate(enrollment_objects):
            # Determine student attendance pattern
            pattern = random.random()
            
            if pattern < 0.10:  # 10% poor attendance (<25%)
                base_attendance_rate = random.uniform(0.10, 0.24)
            elif pattern < 0.20:  # 10% exam ineligible (25-49%)
                base_attendance_rate = random.uniform(0.25, 0.49)
            elif pattern < 0.35:  # 15% at risk (50-74%)
                base_attendance_rate = random.uniform(0.50, 0.74)
            else:  # 65% compliant (75-100%)
                base_attendance_rate = random.uniform(0.75, 0.98)
            
            # Create attendance records
            for session_num in range(1, num_sessions + 1):
                # Add some randomness to attendance
                is_present = random.random() < base_attendance_rate
                
                attendance = Attendance(
                    enrollment_id=enrollment.id,
                    date=current_semester.start_date + timedelta(days=session_num * 3),
                    status='present' if is_present else 'absent'
                )
                session.add(attendance)
                attendance_count += 1
        
        await session.flush()
        print(f"✅ Created {attendance_count} attendance records")
        
        # 3. CREATE GRADES
        print("\n📊 Creating grades with workflow states...")
        grades_created = 0
        
        for idx, enrollment in enumerate(enrollment_objects):
            # Calculate attendance rate
            result = await session.execute(
                select(Attendance).where(Attendance.enrollment_id == enrollment.id)
            )
            attendance_records = result.scalars().all()
            
            if attendance_records:
                present_count = sum(1 for a in attendance_records if a.status == 'present')
                total_sessions = len(attendance_records)
                attendance_rate = (present_count / total_sessions) * 100
                
                # Generate grade based on attendance
                if attendance_rate < 25:
                    grade_value = 0  # Auto-fail
                elif attendance_rate < 50:
                    grade_value = random.uniform(40, 55)  # Failing but tried
                elif attendance_rate < 75:
                    grade_value = random.uniform(55, 75)  # Passing to average
                else:
                    grade_value = random.uniform(70, 95)  # Good to excellent
                
                # Distribute across different workflow states
                # 20% Draft, 20% Submitted, 20% Under Review, 20% Approved, 20% Published
                state_selector = idx % 5
                
                if state_selector == 0:
                    status = "draft"
                    submitted_at = None
                    reviewed_at = None
                    reviewed_by = None
                    published_at = None
                elif state_selector == 1:
                    status = "submitted"
                    submitted_at = datetime.now() - timedelta(days=random.randint(1, 10))
                    reviewed_at = None
                    reviewed_by = None
                    published_at = None
                elif state_selector == 2:
                    status = "under_review"
                    submitted_at = datetime.now() - timedelta(days=random.randint(5, 15))
                    reviewed_at = datetime.now() - timedelta(days=random.randint(1, 5))
                    reviewed_by = admin_ids[0] if admin_ids else None
                    published_at = None
                elif state_selector == 3:
                    status = "approved"
                    submitted_at = datetime.now() - timedelta(days=random.randint(10, 20))
                    reviewed_at = datetime.now() - timedelta(days=random.randint(5, 10))
                    reviewed_by = admin_ids[0] if admin_ids else None
                    published_at = None
                else:
                    status = "published"
                    submitted_at = datetime.now() - timedelta(days=random.randint(15, 30))
                    reviewed_at = datetime.now() - timedelta(days=random.randint(10, 20))
                    reviewed_by = admin_ids[0] if admin_ids else None
                    published_at = datetime.now() - timedelta(days=random.randint(1, 5))
                
                # Create a midterm grade
                # Note: grade_value is NUMERIC(3,2) so max is 9.99
                # Store as percentage: 0-1.0 (where 1.0 = 100%)
                grade_percentage = grade_value / 100.0  # Convert 0-100 to 0-1.0
                
                grade = Grade(
                    enrollment_id=enrollment.id,
                    assignment_name="Midterm Exam",
                    grade_value=round(grade_percentage, 2),  # 0.00 to 1.00
                    max_grade=1.0,  # Max is 1.0 (100%)
                    weight=0.30,  # 30% weight as decimal
                    graded_at=datetime.now() - timedelta(days=random.randint(10, 30)),
                    approval_status=status,
                    submitted_at=submitted_at,
                    reviewed_at=reviewed_at,
                    reviewed_by=reviewed_by,
                    published_at=published_at
                )
                session.add(grade)
                grades_created += 1
        
        await session.commit()
        print(f"✅ Created {grades_created} grades")
        
        # Print summary
        print("\n🎉 Complete Academic Data Seeding Finished!")
        print("\n📊 Final Summary:")
        print(f"   • Semester: {current_semester.name}")
        print(f"   • Sections: {len(sections)}")
        print(f"   • Enrollments: {len(enrollment_objects)}")
        print(f"   • Attendance Records: {attendance_count}")
        print(f"   • Grades: {grades_created}")
        
        # Calculate grade distribution
        draft_count = sum(1 for g in range(grades_created) if g % 5 == 0)
        submitted_count = sum(1 for g in range(grades_created) if g % 5 == 1)
        review_count = sum(1 for g in range(grades_created) if g % 5 == 2)
        approved_count = sum(1 for g in range(grades_created) if g % 5 == 3)
        published_count = sum(1 for g in range(grades_created) if g % 5 == 4)
        
        print(f"\n   Grade Status Distribution:")
        print(f"      • Draft: ~{draft_count}")
        print(f"      • Submitted: ~{submitted_count}")
        print(f"      • Under Review: ~{review_count}")
        print(f"      • Approved: ~{approved_count}")
        print(f"      • Published: ~{published_count}")
        
        print("\n✅ Ready to test full Academic Management System!")
        print("   → Navigate to http://localhost:3000/academics")
        print("   → All tabs should now show data")
        print("   → Test grade approval workflow: Draft → Submit → Review → Approve → Publish")

def get_letter_grade(grade_value: float) -> str:
    """Convert numeric grade to letter grade"""
    if grade_value >= 90:
        return 'A'
    elif grade_value >= 80:
        return 'B'
    elif grade_value >= 70:
        return 'C'
    elif grade_value >= 60:
        return 'D'
    else:
        return 'F'

if __name__ == "__main__":
    asyncio.run(seed_full_academic_data())
