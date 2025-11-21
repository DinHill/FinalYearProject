"""
Username generation service - Greenwich University pattern
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import User, UsernameSequence, StudentSequence, Campus, Major
from typing import Optional
import re


class UsernameGenerator:
    """
    Generate usernames following Greenwich University Vietnam patterns
    
    Student format: FirstNameLastInitialGCDYYYYSSSS
    Example: HieuNDGCD220033
    - Hieu: First name
    - ND: Last name initials (Nguyen Dinh)
    - G: Greenwich
    - C: Major code (Computing)
    - D: Campus code (Da Nang)
    - 22: Year (2022)
    - 0033: Sequence number
    
    Teacher format: FirstNameLastInitialGCDT
    Example: JohnSGCDT
    
    Staff format: FirstNameLastInitialGCDS
    Example: MaryJGCDS
    """
    
    @staticmethod
    def parse_vietnamese_name(full_name: str) -> tuple[str, str]:
        """
        Parse Vietnamese name into first name and last name initials
        
        Args:
            full_name: Full name (e.g., "Nguyen Dinh Hieu")
        
        Returns:
            tuple: (first_name, last_initials)
            Example: ("Hieu", "ND")
        """
        # Clean and split name
        parts = full_name.strip().split()
        
        if len(parts) < 2:
            raise ValueError("Name must have at least first and last name")
        
        # First name is the last part
        first_name = parts[-1]
        
        # Last name is everything before the first name
        last_parts = parts[:-1]
        
        # Get initials from last name parts
        last_initials = "".join([part[0].upper() for part in last_parts])
        
        return first_name, last_initials
    
    @staticmethod
    async def generate_student_username(
        db: AsyncSession,
        full_name: str,
        major_code: str,
        campus_code: str,
        year_entered: int
    ) -> str:
        """
        Generate student username
        
        Format: FirstNameLastInitialG{MajorCode}{CampusCode}{YY}{SSSS}
        Example: HieuNDGCD220033
        
        Args:
            db: Database session
            full_name: Student full name
            major_code: Major code (C, B, D)
            campus_code: Campus code (H, D, C, S)
            year_entered: Year entered (e.g., 2022)
        
        Returns:
            Generated username
        """
        # Parse name
        first_name, last_initials = UsernameGenerator.parse_vietnamese_name(full_name)
        
        # Get year suffix (last 2 digits)
        year_suffix = str(year_entered)[-2:]
        
        # Get or create sequence
        stmt = select(StudentSequence).where(
            StudentSequence.major_code == major_code,
            StudentSequence.campus_code == campus_code,
            StudentSequence.year_entered == year_entered
        )
        result = await db.execute(stmt)
        sequence = result.scalar_one_or_none()
        
        if not sequence:
            # Create new sequence
            sequence = StudentSequence(
                major_code=major_code,
                campus_code=campus_code,
                year_entered=year_entered,
                last_sequence=0
            )
            db.add(sequence)
            await db.flush()
        
        # Increment sequence
        sequence.last_sequence += 1
        sequence_number = str(sequence.last_sequence).zfill(4)
        
        # Build username
        username = f"{first_name}{last_initials}G{major_code}{campus_code}{year_suffix}{sequence_number}"
        
        # Check for collisions (should be rare)
        collision_count = 0
        original_username = username
        
        while await UsernameGenerator._username_exists(db, username):
            collision_count += 1
            # Increment sequence again
            sequence.last_sequence += 1
            sequence_number = str(sequence.last_sequence).zfill(4)
            username = f"{first_name}{last_initials}G{major_code}{campus_code}{year_suffix}{sequence_number}"
            
            if collision_count > 100:
                raise ValueError("Too many username collisions")
        
        await db.commit()
        return username
    
    @staticmethod
    async def generate_teacher_username(
        db: AsyncSession,
        full_name: str,
        campus_code: str = None  # Not used anymore but kept for compatibility
    ) -> str:
        """
        Generate teacher username
        
        Format: FirstNameLastInitial[number]
        Example: JohnS, JohnS2, JohnS3 (John Smith)
        
        Args:
            db: Database session
            full_name: Teacher full name
            campus_code: Campus code (not used, kept for compatibility)
        
        Returns:
            Generated username
        """
        # Parse name
        first_name, last_initials = UsernameGenerator.parse_vietnamese_name(full_name)
        
        # Build base username (no campus code, no G, no T)
        base_username = f"{first_name}{last_initials}"
        
        # Handle collisions - add number if needed
        username = base_username
        counter = 2  # Start from 2 for first collision
        
        while await UsernameGenerator._username_exists(db, username):
            username = f"{base_username}{counter}"
            counter += 1
            
            if counter > 100:
                raise ValueError("Too many username collisions")
        
        # Track sequence (optional, for analytics)
        await UsernameGenerator._track_username_sequence(db, base_username, "teacher")
        
        return username
    
    @staticmethod
    async def generate_staff_username(
        db: AsyncSession,
        full_name: str,
        campus_code: str = None,  # Not used anymore but kept for compatibility
        role: str = "staff"
    ) -> str:
        """
        Generate staff/admin username
        
        Format: FirstNameLastInitial[number]
        Example: MaryJ, MaryJ2, MaryJ3 (Mary Johnson)
        
        Args:
            db: Database session
            full_name: Staff full name
            campus_code: Campus code (not used, kept for compatibility)
            role: Role type (staff, admin)
        
        Returns:
            Generated username
        """
        # Parse name
        first_name, last_initials = UsernameGenerator.parse_vietnamese_name(full_name)
        
        # Build base username (no campus code, no G, no suffix)
        base_username = f"{first_name}{last_initials}"
        
        # Handle collisions - add number if needed
        username = base_username
        counter = 2  # Start from 2 for first collision
        
        while await UsernameGenerator._username_exists(db, username):
            username = f"{base_username}{counter}"
            counter += 1
            
            if counter > 100:
                raise ValueError("Too many username collisions")
        
        # Track sequence
        await UsernameGenerator._track_username_sequence(db, base_username, role)
        
        return username
    
    @staticmethod
    async def _username_exists(db: AsyncSession, username: str) -> bool:
        """Check if username already exists"""
        stmt = select(User).where(func.lower(User.username) == username.lower())
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    @staticmethod
    async def _track_username_sequence(
        db: AsyncSession,
        base_username: str,
        user_type: str
    ) -> None:
        """Track username sequence for analytics"""
        stmt = select(UsernameSequence).where(
            UsernameSequence.base_username == base_username,
            UsernameSequence.user_type == user_type
        )
        result = await db.execute(stmt)
        sequence = result.scalar_one_or_none()
        
        if sequence:
            sequence.count += 1
        else:
            sequence = UsernameSequence(
                base_username=base_username,
                user_type=user_type,
                count=1
            )
            db.add(sequence)
        
        await db.flush()
    
    @staticmethod
    def generate_email(username: str, role: str) -> str:
        """
        Generate email address from username
        
        Args:
            username: Generated username
            role: User role (student, teacher, admin, staff)
        
        Returns:
            Email address (all users use @fpt.edu.vn)
        """
        # All users use the same domain now
        return f"{username.lower()}@fpt.edu.vn"
