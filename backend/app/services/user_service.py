from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate, RegisterRequest
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create_user_with_password(self, user_data: RegisterRequest) -> User:
        """Create a new user with ID and password authentication"""
        try:
            # Check if user ID already exists
            existing_user = self.get_user_by_user_id(user_data.user_id, user_data.role)
            if existing_user:
                raise ValueError(f"User with ID {user_data.user_id} already exists")
            
            # Check email uniqueness if provided
            if user_data.email:
                existing_email = self.get_user_by_email(user_data.email)
                if existing_email:
                    raise ValueError(f"User with email {user_data.email} already exists")
            
            # Create new user
            db_user = User(
                email=user_data.email,
                full_name=user_data.full_name,
                role=user_data.role,
                phone_number=user_data.phone_number,
                department=user_data.department,
                campus=user_data.campus,
                status=UserStatus.ACTIVE
            )
            
            # Set ID based on role
            if user_data.role == UserRole.STUDENT:
                db_user.student_id = user_data.user_id
            else:
                db_user.employee_id = user_data.user_id
            
            # Set password
            db_user.set_password(user_data.password)
            
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
            
            logger.info(f"Created user: {user_data.user_id} with role {db_user.role.value}")
            return db_user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise

    def get_user_by_user_id(self, user_id: str, role: Optional[UserRole] = None) -> Optional[User]:
        """Get user by student_id or employee_id"""
        query = self.db.query(User)
        
        if role == UserRole.STUDENT:
            query = query.filter(User.student_id == user_id)
        elif role in [UserRole.TEACHER, UserRole.ADMIN]:
            query = query.filter(User.employee_id == user_id)
        else:
            # Search both student_id and employee_id
            query = query.filter(
                or_(User.student_id == user_id, User.employee_id == user_id)
            )
        
        return query.first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        try:
            # Check if user already exists
            existing_user = self.get_user_by_firebase_uid(user_data.firebase_uid)
            if existing_user:
                raise ValueError(f"User with Firebase UID {user_data.firebase_uid} already exists")
            
            # Check email uniqueness
            existing_email = self.get_user_by_email(user_data.email)
            if existing_email:
                raise ValueError(f"User with email {user_data.email} already exists")
            
            # Create new user
            db_user = User(
                firebase_uid=user_data.firebase_uid,
                email=user_data.email,
                full_name=user_data.full_name,
                role=user_data.role,
                phone_number=user_data.phone_number,
                student_id=user_data.student_id,
                employee_id=user_data.employee_id,
                department=user_data.department,
                campus=user_data.campus,
                avatar_url=user_data.avatar_url,
                status=UserStatus.ACTIVE
            )
            
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
            
            logger.info(f"Created user: {db_user.email} with role {db_user.role.value}")
            return db_user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID"""
        return self.db.query(User).filter(User.firebase_uid == firebase_uid).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user"""
        try:
            db_user = self.get_user_by_id(user_id)
            if not db_user:
                return None
            
            # Update only provided fields
            update_data = user_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_user, field, value)
            
            db_user.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_user)
            
            logger.info(f"Updated user: {db_user.email}")
            return db_user
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise

    def update_last_login(self, user_id: int) -> None:
        """Update user's last login timestamp"""
        try:
            db_user = self.get_user_by_id(user_id)
            if db_user:
                db_user.last_login = datetime.utcnow()
                self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating last login for user {user_id}: {str(e)}")

    def get_users(
        self, 
        skip: int = 0, 
        limit: int = 100,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        campus: Optional[str] = None,
        department: Optional[str] = None
    ) -> tuple[List[User], int]:
        """Get users with filtering and pagination"""
        query = self.db.query(User)
        
        # Apply filters
        if role:
            query = query.filter(User.role == role)
        
        if status:
            query = query.filter(User.status == status)
        
        if campus:
            query = query.filter(User.campus == campus)
        
        if department:
            query = query.filter(User.department == department)
        
        if search:
            search_filter = or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.student_id.ilike(f"%{search}%"),
                User.employee_id.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        users = query.offset(skip).limit(limit).all()
        
        return users, total

    def get_users_by_role(self, role: UserRole) -> List[User]:
        """Get all users with a specific role"""
        return self.db.query(User).filter(
            and_(User.role == role, User.status == UserStatus.ACTIVE)
        ).all()