"""
Seed data script - Initialize campuses and majors
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db, engine
from app.models import Campus, Major
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_campuses(db: AsyncSession):
    """Seed campus data"""
    campuses = [
        Campus(
            code="H",
            name="Hanoi Campus",
            address="Tran Duy Hung Street, Cau Giay District, Hanoi"
        ),
        Campus(
            code="D",
            name="Da Nang Campus",
            address="Nguyen Van Linh Street, Thanh Khe District, Da Nang"
        ),
        Campus(
            code="C",
            name="Can Tho Campus",
            address="Nguyen Van Cu Street, Ninh Kieu District, Can Tho"
        ),
        Campus(
            code="S",
            name="Ho Chi Minh Campus",
            address="Nguyen Thi Minh Khai Street, District 1, Ho Chi Minh City"
        )
    ]
    
    for campus in campuses:
        db.add(campus)
    
    await db.commit()
    print(f"✅ Created {len(campuses)} campuses")


async def seed_majors(db: AsyncSession):
    """Seed major data"""
    majors = [
        Major(
            code="C",
            name="Computing",
            description="Bachelor of Science in Computing - Software Engineering, AI, Data Science"
        ),
        Major(
            code="B",
            name="Business",
            description="Bachelor of Business Administration - Management, Marketing, Finance"
        ),
        Major(
            code="D",
            name="Design",
            description="Bachelor of Arts in Design - Graphics, UX/UI, Digital Media"
        )
    ]
    
    for major in majors:
        db.add(major)
    
    await db.commit()
    print(f"✅ Created {len(majors)} majors")


async def main():
    """Main seed function"""
    print("🌱 Starting database seeding...")
    
    # Create async session
    async with AsyncSession(engine) as db:
        try:
            await seed_campuses(db)
            await seed_majors(db)
            print("\n✨ Database seeding completed successfully!")
            
        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            await db.rollback()
            raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
