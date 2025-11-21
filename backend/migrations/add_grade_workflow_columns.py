"""Add grade approval workflow columns to grades table"""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def add_grade_workflow_columns():
    print("\n🔧 Adding grade approval workflow columns to grades table...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Add approval workflow columns
            await session.execute(text("""
                ALTER TABLE grades 
                ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'draft',
                ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id),
                ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
                ADD COLUMN IF NOT EXISTS approval_notes TEXT,
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
            """))
            
            # Create index on approval_status for faster queries
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_grades_approval_status 
                ON grades(approval_status);
            """))
            
            await session.commit()
            print("✅ Successfully added workflow columns to grades table!")
            
            # Verify the changes
            result = await session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name='grades' 
                AND column_name IN (
                    'approval_status', 'submitted_at', 'reviewed_at', 
                    'reviewed_by', 'published_at', 'rejection_reason', 
                    'approval_notes', 'approved_at'
                )
                ORDER BY column_name;
            """))
            
            print("\n📊 New columns added:")
            for row in result:
                print(f"   ✅ {row[0]}: {row[1]}")
                
            print("\n🎉 Database migration complete!")
            print("   You can now run: python seed_enrollments_attendance_grades.py")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(add_grade_workflow_columns())
