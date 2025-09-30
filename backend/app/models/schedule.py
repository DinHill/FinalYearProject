from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Time, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .user import Base
import enum

class DayOfWeek(enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class ScheduleType(enum.Enum):
    LECTURE = "lecture"
    LAB = "lab"
    SEMINAR = "seminar"
    EXAM = "exam"
    SPECIAL = "special"

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    course_section_id = Column(Integer, ForeignKey("course_sections.id"), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50))
    building = Column(String(100))
    campus = Column(String(100))
    schedule_type = Column(Enum(ScheduleType), default=ScheduleType.LECTURE)
    is_recurring = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_section = relationship("CourseSection", backref="schedules")

class SpecialEvent(Base):
    __tablename__ = "special_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    location = Column(String(255))
    campus = Column(String(100))
    event_type = Column(String(50))  # exam, holiday, workshop, etc.
    target_audience = Column(String(100))  # all, students, teachers, specific_course
    course_section_id = Column(Integer, ForeignKey("course_sections.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course_section = relationship("CourseSection", backref="special_events")
    creator = relationship("User", backref="created_events")