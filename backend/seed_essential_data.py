"""
Seed essential data for admin portal pages to show content
"""
import asyncio
from datetime import datetime, timedelta
import random
from app.core.database import AsyncSessionLocal
from app.models.document import Document, Announcement
from app.models.finance import Invoice
from app.models.communication import SupportTicket
from sqlalchemy import select

async def seed_data():
    print("\n🌱 Seeding essential data...")
    
    async with AsyncSessionLocal() as session:
        # Get users for foreign keys
        from sqlalchemy import text
        result = await session.execute(text("SELECT id, role FROM users ORDER BY id"))
        users = result.fetchall()
        
        if not users:
            print("❌ No users found! Run recreate_users.py first")
            return
        
        user_map = {role: uid for uid, role in users}
        student_ids = [uid for uid, role in users if role == 'student']
        teacher_ids = [uid for uid, role in users if role == 'teacher']
        admin_ids = [uid for uid, role in users if 'admin' in role]
        
        print(f"✅ Found {len(users)} users")
        
        # 1. DOCUMENTS (Course Materials)
        print("\n📄 Creating documents...")
        doc_types = ['syllabus', 'lecture_note', 'assignment', 'exam']
        doc_titles = [
            'CS101 Course Syllabus Spring 2025',
            'Introduction to Programming - Week 1 Notes',
            'Data Structures Assignment 1',
            'Database Systems Midterm Exam',
            'Web Development Lecture Slides',
            'Software Engineering Project Guidelines',
            'Algorithms Final Exam Study Guide',
            'Object-Oriented Programming Lab Manual',
            'Computer Networks Assignment 2',
            'Operating Systems Course Outline'
        ]
        
        for i, title in enumerate(doc_titles):
            doc = Document(
                user_id=random.choice(teacher_ids) if teacher_ids else admin_ids[0],
                title=title,
                document_type=doc_types[i % len(doc_types)],
                file_url=f'https://storage.greenwich.edu.vn/documents/doc_{i+1}.pdf',
                file_size=random.randint(100000, 5000000),
                mime_type='application/pdf',
                status='active',
                uploaded_by=random.choice(admin_ids) if admin_ids else users[0][0]
            )
            session.add(doc)
        
        await session.commit()
        print(f"✅ Created {len(doc_titles)} documents")
        
        # 2. ANNOUNCEMENTS
        print("\n📢 Creating announcements...")
        announcements_data = [
            {
                'title': 'Welcome to Spring Semester 2025',
                'content': 'We are excited to welcome all students back for the Spring 2025 semester. Classes begin on January 15th. Please review your course schedule and ensure all fees are paid.',
                'priority': 'High',
                'target_audience': 'all',
                'is_published': True
            },
            {
                'title': 'Library Hours Extended During Exam Period',
                'content': 'The university library will extend its operating hours from 7 AM to 11 PM daily during the final exam period (May 1-15). Additional study rooms are available.',
                'priority': 'Normal',
                'target_audience': 'students',
                'is_published': True
            },
            {
                'title': 'Career Fair - March 20, 2025',
                'content': 'Join us for the Spring Career Fair featuring 50+ companies looking to hire graduates. Bring your resume and dress professionally. Registration opens February 1st.',
                'priority': 'High',
                'target_audience': 'students',
                'is_published': True
            },
            {
                'title': 'New Parking Regulations Effective February 1st',
                'content': 'Updated parking permits are required for all vehicles. Please visit the Campus Services office to obtain your new permit. Old permits expire January 31st.',
                'priority': 'Normal',
                'target_audience': 'all',
                'is_published': True
            },
            {
                'title': 'Research Symposium Call for Papers',
                'content': 'Faculty and graduate students are invited to submit research papers for the Annual Research Symposium on April 15th. Submission deadline: March 1st.',
                'priority': 'Normal',
                'target_audience': 'teachers',
                'is_published': True
            },
            {
                'title': 'Spring Break Schedule - March 10-17',
                'content': 'Campus will be closed for Spring Break. Limited services available. Emergency contact: security@greenwich.edu.vn',
                'priority': 'High',
                'target_audience': 'all',
                'is_published': True
            },
            {
                'title': 'New Student Wellness Program Launched',
                'content': 'Free counseling and mental health services now available. Schedule appointments through the Student Services portal or call ext. 2345.',
                'priority': 'Normal',
                'target_audience': 'students',
                'is_published': True
            },
            {
                'title': 'Course Registration for Fall 2025 Opens April 1st',
                'content': 'Registration opens by class year: Seniors (April 1), Juniors (April 3), Sophomores (April 5), Freshmen (April 7). Meet with your advisor first.',
                'priority': 'High',
                'target_audience': 'students',
                'is_published': True
            }
        ]
        
        for i, ann_data in enumerate(announcements_data):
            ann = Announcement(
                author_id=random.choice(admin_ids) if admin_ids else users[0][0],
                title=ann_data['title'],
                content=ann_data['content'],
                target_audience=ann_data['target_audience'],
                is_published=ann_data['is_published'],
                publish_date=datetime.now() - timedelta(days=random.randint(1, 30)),
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            session.add(ann)
        
        await session.commit()
        print(f"✅ Created {len(announcements_data)} announcements")
        
        # 3. INVOICES
        print("\n💰 Creating invoices...")
        
        # Get semester
        result = await session.execute(text("SELECT id FROM semesters WHERE is_current = true LIMIT 1"))
        semester = result.fetchone()
        semester_id = semester[0] if semester else None
        
        for i, student_id in enumerate(student_ids[:15] if len(student_ids) > 15 else student_ids):
            base_amount = random.choice([15000000, 17500000, 20000000])  # VND
            paid_amount = random.choice([0, base_amount // 2, base_amount])
            status = 'paid' if paid_amount >= base_amount else ('partial' if paid_amount > 0 else 'pending')
            
            invoice = Invoice(
                student_id=student_id,
                semester_id=semester_id,
                invoice_number=f'INV-2025-{str(i+1).zfill(4)}',
                issued_date=datetime.now() - timedelta(days=random.randint(30, 90)),
                total_amount=base_amount,
                paid_amount=paid_amount,
                due_date=datetime.now() + timedelta(days=random.randint(10, 60)),
                status=status,
                notes=f'Spring 2025 Tuition - Student ID {student_id}'
            )
            session.add(invoice)
        
        await session.commit()
        print(f"✅ Created invoices for students")
        
        # 4. SUPPORT TICKETS
        print("\n🎫 Creating support tickets...")
        ticket_subjects = [
            'Cannot access course materials on portal',
            'Grade dispute for CS101 midterm exam',
            'Lost student ID card - need replacement',
            'WiFi connection issues in library',
            'Transcript request for job application',
            'Course registration error - class full',
            'Payment confirmation not showing',
            'Email account locked - need reset',
            'Scholarship application status inquiry',
            'Campus parking permit not received',
            'Lab equipment malfunction - Room 301',
            'Request to drop course after deadline',
            'Financial aid disbursement delay',
            'Broken projector in lecture hall B',
            'Cannot login to student portal'
        ]
        
        priorities = ['Low', 'Normal', 'High', 'Urgent']
        statuses = ['open', 'in_progress', 'resolved', 'closed']
        categories = ['technical', 'academic', 'financial', 'administrative', 'facilities']
        
        for i, subject in enumerate(ticket_subjects):
            days_ago = random.randint(1, 60)
            created = datetime.now() - timedelta(days=days_ago)
            status = random.choice(statuses)
            
            ticket = SupportTicket(
                user_id=random.choice(student_ids) if student_ids else users[0][0],
                subject=subject,
                description=f'Detailed description of the issue: {subject}. This needs to be resolved as soon as possible. Thank you.',
                category=random.choice(categories),
                priority=random.choice(priorities),
                status=status,
                assigned_to=random.choice(admin_ids) if admin_ids and status != 'open' else None,
                created_at=created,
                updated_at=created + timedelta(hours=random.randint(1, 48)) if status != 'open' else created
            )
            session.add(ticket)
        
        await session.commit()
        print(f"✅ Created {len(ticket_subjects)} support tickets")
        
        print("\n" + "="*60)
        print("✅ Database seeding complete!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"  - Documents: {len(doc_titles)}")
        print(f"  - Announcements: {len(announcements_data)}")
        print(f"  - Invoices: {min(15, len(student_ids))}")
        print(f"  - Support Tickets: {len(ticket_subjects)}")
        print("\n🎉 You can now refresh your admin portal pages!")

if __name__ == "__main__":
    asyncio.run(seed_data())
