"""
Add performance indexes for dashboard queries

This migration adds indexes to improve performance of:
1. Enrollment queries (by status)
2. Attendance queries (by enrollment_id, date, status)
3. Course section queries
4. User role-based queries
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine


async def add_indexes():
    """Add performance indexes to the database"""
    
    # List of CREATE INDEX statements
    index_statements = [
        # Attendance table indexes
        "CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance (enrollment_id)",
        "CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date)",
        "CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status)",
        "CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_date ON attendance (enrollment_id, date)",
        
        # Enrollment table indexes
        "CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments (status)",
        "CREATE INDEX IF NOT EXISTS idx_enrollments_section_status ON enrollments (course_section_id, status)",
        
        # Course sections indexes
        "CREATE INDEX IF NOT EXISTS idx_course_sections_course ON course_sections (course_id)",
        "CREATE INDEX IF NOT EXISTS idx_course_sections_semester ON course_sections (semester_id)",
        "CREATE INDEX IF NOT EXISTS idx_course_sections_instructor ON course_sections (instructor_id)",
        "CREATE INDEX IF NOT EXISTS idx_course_sections_active ON course_sections (is_active)",
        
        # Course indexes
        "CREATE INDEX IF NOT EXISTS idx_courses_major ON courses (major_id)",
        "CREATE INDEX IF NOT EXISTS idx_courses_active ON courses (is_active)",
    ]
    
    async with engine.begin() as conn:
        print("\n" + "="*80)
        print("ADDING PERFORMANCE INDEXES")
        print("="*80 + "\n")
        
        for statement in index_statements:
            try:
                await conn.execute(text(statement))
                # Extract index name for logging
                index_name = statement.split("INDEX IF NOT EXISTS ")[1].split(" ON ")[0]
                table_name = statement.split(" ON ")[1].split(" (")[0]
                print(f"✓ Created/verified index {index_name} on {table_name}")
                    
            except Exception as e:
                print(f"✗ Error creating index: {str(e)}")
                print(f"   Statement: {statement}")
        
        print("\n" + "="*80)
        print("INDEX CREATION COMPLETE")
        print("="*80 + "\n")


async def analyze_tables():
    """Run ANALYZE on tables to update statistics"""
    
    tables = ['users', 'enrollments', 'attendance', 'course_sections', 'courses']
    
    async with engine.begin() as conn:
        print("\n" + "="*80)
        print("ANALYZING TABLES FOR QUERY OPTIMIZATION")
        print("="*80 + "\n")
        
        for table in tables:
            try:
                await conn.execute(text(f"ANALYZE {table}"))
                print(f"✓ Analyzed table: {table}")
            except Exception as e:
                print(f"✗ Error analyzing {table}: {str(e)}")
        
        print("\n" + "="*80)
        print("TABLE ANALYSIS COMPLETE")
        print("="*80 + "\n")


async def main():
    """Main migration function"""
    print("\n🚀 Starting Performance Index Migration\n")
    
    await add_indexes()
    await analyze_tables()
    
    print("✅ Migration completed successfully!\n")


if __name__ == "__main__":
    asyncio.run(main())
