"""
Seed academic data for the Academic Management System
Creates: Semesters, Programs, Courses, Sections, Schedules, Enrollments, Attendance, Grades
"""
import asyncio
from datetime import datetime, timedelta, time
import random
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models.academic import (
    Semester, Course, CourseSection, SectionSchedule,
    Enrollment, Attendance, Grade, GradeStatus, AttendanceComplianceLevel
)
from app.models.user import Major

async def seed_academic_data():
    print("\n🎓 Seeding Academic Management Data...")
    
    async with AsyncSessionLocal() as session:
        # Get campuses and users
        result = await session.execute(text("SELECT id, name FROM campuses ORDER BY id"))
        campuses = result.fetchall()
        campus_ids = [c[0] for c in campuses]
        
        result = await session.execute(text("SELECT id, role FROM users ORDER BY id"))
        users = result.fetchall()
        student_ids = [uid for uid, role in users if role == 'student']
        teacher_ids = [uid for uid, role in users if role == 'teacher']
        admin_ids = [uid for uid, role in users if 'admin' in role]
        
        if not campuses:
            print("❌ No campuses found! Cannot proceed.")
            return
        
        if not teacher_ids:
            print("⚠️  No teachers found! Some courses will have no instructor.")
        
        if not student_ids:
            print("⚠️  No students found! No enrollments will be created.")
        
        print(f"✅ Found {len(campuses)} campuses, {len(teacher_ids)} teachers, {len(student_ids)} students")
        
        # 1. CREATE SEMESTERS
        print("\n📅 Creating semesters...")
        semesters_data = [
            {
                'code': 'FALL2024',
                'name': 'Fall 2024',
                'type': 'fall',
                'academic_year': '2024-2025',
                'start_date': datetime(2024, 9, 1),
                'end_date': datetime(2024, 12, 20),
                'registration_start': datetime(2024, 8, 1),
                'registration_end': datetime(2024, 8, 31),
                'is_current': False
            },
            {
                'code': 'SPRING2025',
                'name': 'Spring 2025',
                'type': 'spring',
                'academic_year': '2024-2025',
                'start_date': datetime(2025, 1, 15),
                'end_date': datetime(2025, 5, 30),
                'registration_start': datetime(2024, 12, 1),
                'registration_end': datetime(2025, 1, 10),
                'is_current': True
            },
            {
                'code': 'SUMMER2025',
                'name': 'Summer 2025',
                'type': 'summer',
                'academic_year': '2024-2025',
                'start_date': datetime(2025, 6, 1),
                'end_date': datetime(2025, 8, 15),
                'registration_start': datetime(2025, 5, 1),
                'registration_end': datetime(2025, 5, 25),
                'is_current': False
            }
        ]
        
        semester_objects = []
        for sem_data in semesters_data:
            semester = Semester(**sem_data)
            session.add(semester)
            semester_objects.append(semester)
        
        await session.flush()
        print(f"✅ Created {len(semester_objects)} semesters")
        
        # Get current semester
        current_semester = [s for s in semester_objects if s.is_current][0]
        print(f"   Current semester: {current_semester.name}")
        
        # 2. GET OR CREATE PROGRAMS/MAJORS
        print("\n🎓 Getting/creating academic programs (majors)...")
        majors_data = [
            {
                'code': 'C',
                'name': 'Computer Science',
                'description': 'Bachelor of Science in Computer Science - Study algorithms, programming, and software development',
                'is_active': True
            },
            {
                'code': 'B',
                'name': 'Business Administration',
                'description': 'Bachelor of Business Administration - Focus on management, marketing, and finance',
                'is_active': True
            },
            {
                'code': 'E',
                'name': 'Engineering',
                'description': 'Bachelor of Engineering - Core engineering principles and applications',
                'is_active': True
            },
            {
                'code': 'D',
                'name': 'Data Science',
                'description': 'Bachelor of Science in Data Science - Analytics, machine learning, and big data',
                'is_active': True
            }
        ]
        
        major_objects = []
        majors_created = 0
        for major_data in majors_data:
            # Check if major already exists
            result = await session.execute(
                select(Major).where(Major.code == major_data['code'])
            )
            existing_major = result.scalar_one_or_none()
            
            if existing_major:
                major_objects.append(existing_major)
            else:
                major = Major(**major_data)
                session.add(major)
                major_objects.append(major)
                majors_created += 1
        
        await session.flush()
        print(f"✅ Using {len(major_objects)} majors ({majors_created} created, {len(major_objects) - majors_created} existing)")
        
        # 3. CREATE COURSES
        print("\n📚 Creating courses...")
        courses_data = [
            # Computer Science Courses
            {'course_code': 'CS101', 'name': 'Introduction to Programming', 'major': 0, 'credits': 3, 'level': 1},
            {'course_code': 'CS201', 'name': 'Data Structures', 'major': 0, 'credits': 4, 'level': 2},
            {'course_code': 'CS301', 'name': 'Database Systems', 'major': 0, 'credits': 3, 'level': 3},
            {'course_code': 'CS302', 'name': 'Web Development', 'major': 0, 'credits': 3, 'level': 3},
            {'course_code': 'CS401', 'name': 'Software Engineering', 'major': 0, 'credits': 4, 'level': 4},
            
            # Business Administration Courses
            {'course_code': 'BA101', 'name': 'Introduction to Business', 'major': 1, 'credits': 3, 'level': 1},
            {'course_code': 'BA201', 'name': 'Marketing Principles', 'major': 1, 'credits': 3, 'level': 2},
            {'course_code': 'BA301', 'name': 'Financial Management', 'major': 1, 'credits': 4, 'level': 3},
            
            # Engineering Courses
            {'course_code': 'ENG101', 'name': 'Engineering Mathematics', 'major': 2, 'credits': 4, 'level': 1},
            {'course_code': 'ENG201', 'name': 'Mechanics', 'major': 2, 'credits': 4, 'level': 2},
            
            # Data Science Courses
            {'course_code': 'DS101', 'name': 'Statistics for Data Science', 'major': 3, 'credits': 3, 'level': 1},
            {'course_code': 'DS201', 'name': 'Machine Learning', 'major': 3, 'credits': 4, 'level': 2},
        ]
        
        course_objects = []
        for i, course_data in enumerate(courses_data):
            major_idx = course_data.pop('major')
            course = Course(
                **course_data,
                major_id=major_objects[major_idx].id,
                description=f"Course description for {course_data['name']}",
                is_active=True
            )
            session.add(course)
            course_objects.append(course)
        
        await session.flush()
        print(f"✅ Created {len(course_objects)} courses")
        
        # 4. CREATE SECTIONS
        print("\n👥 Creating course sections...")
        section_objects = []
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        rooms = ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Lab A', 'Lab B', 'Hall 301']
        
        for i, course in enumerate(course_objects):
            # Create 1-2 sections per course
            num_sections = random.randint(1, 2)
            for section_num in range(1, num_sections + 1):
                capacity = random.choice([30, 40, 50])
                # Create schedule data
                num_meetings = random.randint(2, 3)
                selected_days = random.sample(days, num_meetings)
                schedule_data = []
                for day in selected_days:
                    start_hour = random.randint(8, 16)
                    schedule_data.append({
                        'day': day,
                        'start_time': f"{start_hour:02d}:00",
                        'end_time': f"{(start_hour + 2):02d}:00",
                        'room': random.choice(rooms)
                    })
                
                section = CourseSection(
                    course_id=course.id,
                    section_code=f"S{section_num:02d}",
                    semester_id=current_semester.id,
                    instructor_id=random.choice(teacher_ids) if teacher_ids else None,
                    max_students=capacity,
                    enrolled_count=0,
                    room=random.choice(rooms),
                    schedule=schedule_data,
                    is_active=True
                )
                session.add(section)
                section_objects.append(section)
        
        await session.flush()
        print(f"✅ Created {len(section_objects)} course sections")
        
        # 5. CREATE ENROLLMENTS
        print("\n📝 Creating enrollments...")
        if student_ids:
            enrollment_objects = []
            for section in section_objects:
                # Enroll 60-90% of capacity
                num_students = int(section.max_students * random.uniform(0.6, 0.9))
                selected_students = random.sample(student_ids, min(num_students, len(student_ids)))
                
                for student_id in selected_students:
                    enrollment = Enrollment(
                        student_id=student_id,
                        section_id=section.id,
                        semester_id=current_semester.id,
                        enrollment_date=current_semester.start_date + timedelta(days=random.randint(0, 10)),
                        status='active'
                    )
                    session.add(enrollment)
                    enrollment_objects.append(enrollment)
                
                # Update enrolled_count for each section
                section.enrolled_count = len([e for e in enrollment_objects if e.section_id == section.id])
            
            await session.flush()
            print(f"✅ Created {len(enrollment_objects)} enrollments")
            
            # 6. CREATE ATTENDANCE RECORDS
            print("\n✅ Creating attendance records...")
            attendance_count = 0
            # Assume 10 sessions have occurred so far
            num_sessions = 10
            
            for enrollment in enrollment_objects:
                for session_num in range(1, num_sessions + 1):
                    # Create varied attendance patterns
                    attendance_percentage = random.random()
                    
                    if attendance_percentage < 0.15:  # 15% of students have poor attendance
                        is_present = random.random() < 0.3  # Only 30% attendance
                    elif attendance_percentage < 0.30:  # 15% at risk (50-74%)
                        is_present = random.random() < 0.65  # 65% attendance
                    else:  # 70% have good attendance
                        is_present = random.random() < 0.90  # 90% attendance
                    
                    attendance = Attendance(
                        enrollment_id=enrollment.id,
                        section_id=enrollment.section_id,
                        date=current_semester.start_date + timedelta(days=session_num * 3),
                        is_present=is_present,
                        is_locked=session_num < 5  # Lock older records
                    )
                    session.add(attendance)
                    attendance_count += 1
            
            await session.flush()
            print(f"✅ Created {attendance_count} attendance records")
            
            # 7. CREATE GRADES
            print("\n📊 Creating grades...")
            
            for idx, enrollment in enumerate(enrollment_objects):
                # Calculate attendance
                result = await session.execute(
                    select(Attendance).where(Attendance.enrollment_id == enrollment.id)
                )
                attendance_records = result.scalars().all()
                
                if attendance_records:
                    present_count = sum(1 for a in attendance_records if a.is_present)
                    total_sessions = len(attendance_records)
                    attendance_rate = (present_count / total_sessions) * 100
                    
                    # Generate grade based on attendance
                    if attendance_rate < 25:
                        grade_value = 0  # Auto-fail
                    elif attendance_rate < 50:
                        grade_value = random.uniform(40, 55)
                    elif attendance_rate < 75:
                        grade_value = random.uniform(50, 70)
                    else:
                        grade_value = random.uniform(70, 95)
                    
                    # Determine grade status (mix of statuses for testing)
                    if idx % 5 == 0:
                        status = GradeStatus.DRAFT
                    elif idx % 5 == 1:
                        status = GradeStatus.SUBMITTED
                    elif idx % 5 == 2:
                        status = GradeStatus.UNDER_REVIEW
                    elif idx % 5 == 3:
                        status = GradeStatus.APPROVED
                    else:
                        status = GradeStatus.PUBLISHED
                    
                    grade = Grade(
                        enrollment_id=enrollment.id,
                        section_id=enrollment.section_id,
                        grade_value=round(grade_value, 2),
                        grade_letter=get_letter_grade(grade_value),
                        approval_status=status,
                        submitted_at=datetime.now() if status != GradeStatus.DRAFT else None,
                        reviewed_at=datetime.now() if status in [GradeStatus.UNDER_REVIEW, GradeStatus.APPROVED, GradeStatus.PUBLISHED] else None,
                        reviewed_by=admin_ids[0] if admin_ids and status in [GradeStatus.UNDER_REVIEW, GradeStatus.APPROVED, GradeStatus.PUBLISHED] else None,
                        published_at=datetime.now() if status == GradeStatus.PUBLISHED else None
                    )
                    session.add(grade)
            
            await session.commit()
            print(f"✅ Created grades for all enrollments")
        
        print("\n🎉 Academic data seeding complete!")
        print("\n📊 Summary:")
        print(f"   • {len(semester_objects)} semesters")
        print(f"   • {len(major_objects)} majors/programs")
        print(f"   • {len(course_objects)} courses")
        print(f"   • {len(section_objects)} course sections")
        if student_ids:
            print(f"   • {len(enrollment_objects)} enrollments")
            print(f"   • {attendance_count} attendance records")
            print(f"   • {len(enrollment_objects)} grades")

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
    asyncio.run(seed_academic_data())
