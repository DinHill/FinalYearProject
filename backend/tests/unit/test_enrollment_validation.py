"""Unit tests for enrollment validation service."""
import pytest
from datetime import datetime, time
from app.services.enrollment_service import EnrollmentService


class TestEnrollmentValidation:
    """Test enrollment validation logic."""
    
    def test_check_time_conflict_no_conflict(self):
        """Test no time conflict between schedules."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        schedule2 = {
            "day_of_week": "monday",
            "start_time": time(10, 0),
            "end_time": time(12, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is False
    
    def test_check_time_conflict_different_days(self):
        """Test no conflict on different days."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        schedule2 = {
            "day_of_week": "tuesday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is False
    
    def test_check_time_conflict_overlap_start(self):
        """Test conflict when second schedule starts during first."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        schedule2 = {
            "day_of_week": "monday",
            "start_time": time(9, 0),
            "end_time": time(11, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is True
    
    def test_check_time_conflict_overlap_end(self):
        """Test conflict when first schedule ends during second."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(9, 0),
            "end_time": time(11, 0)
        }
        schedule2 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is True
    
    def test_check_time_conflict_complete_overlap(self):
        """Test conflict when one schedule completely contains another."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(12, 0)
        }
        schedule2 = {
            "day_of_week": "monday",
            "start_time": time(9, 0),
            "end_time": time(11, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is True
    
    def test_check_time_conflict_exact_same_time(self):
        """Test conflict with exact same time."""
        schedule1 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        schedule2 = {
            "day_of_week": "monday",
            "start_time": time(8, 0),
            "end_time": time(10, 0)
        }
        
        has_conflict = EnrollmentService.check_time_conflict(schedule1, schedule2)
        assert has_conflict is True
    
    def test_check_capacity_available(self):
        """Test capacity check with available spots."""
        section = type('Section', (), {
            'max_capacity': 30,
            'current_enrollment': 25
        })()
        
        has_capacity = EnrollmentService.check_capacity(section)
        assert has_capacity is True
    
    def test_check_capacity_full(self):
        """Test capacity check when section is full."""
        section = type('Section', (), {
            'max_capacity': 30,
            'current_enrollment': 30
        })()
        
        has_capacity = EnrollmentService.check_capacity(section)
        assert has_capacity is False
    
    def test_check_capacity_over_full(self):
        """Test capacity check when enrollment exceeds capacity."""
        section = type('Section', (), {
            'max_capacity': 30,
            'current_enrollment': 31
        })()
        
        has_capacity = EnrollmentService.check_capacity(section)
        assert has_capacity is False
    
    def test_check_capacity_exactly_one_spot(self):
        """Test capacity check with exactly one spot left."""
        section = type('Section', (), {
            'max_capacity': 30,
            'current_enrollment': 29
        })()
        
        has_capacity = EnrollmentService.check_capacity(section)
        assert has_capacity is True
    
    def test_check_prerequisites_no_prerequisites(self):
        """Test prerequisite check when course has no prerequisites."""
        course = type('Course', (), {'prerequisites': []})()
        completed_courses = []
        
        has_prerequisites = EnrollmentService.check_prerequisites(course, completed_courses)
        assert has_prerequisites is True
    
    def test_check_prerequisites_all_completed(self):
        """Test prerequisite check when all prerequisites are completed."""
        course = type('Course', (), {'prerequisites': [
            type('Course', (), {'id': 1})(),
            type('Course', (), {'id': 2})()
        ]})()
        completed_courses = [1, 2, 3]
        
        has_prerequisites = EnrollmentService.check_prerequisites(course, completed_courses)
        assert has_prerequisites is True
    
    def test_check_prerequisites_missing_one(self):
        """Test prerequisite check when one prerequisite is missing."""
        course = type('Course', (), {'prerequisites': [
            type('Course', (), {'id': 1})(),
            type('Course', (), {'id': 2})()
        ]})()
        completed_courses = [1]  # Missing course 2
        
        has_prerequisites = EnrollmentService.check_prerequisites(course, completed_courses)
        assert has_prerequisites is False
    
    def test_check_prerequisites_missing_all(self):
        """Test prerequisite check when all prerequisites are missing."""
        course = type('Course', (), {'prerequisites': [
            type('Course', (), {'id': 1})(),
            type('Course', (), {'id': 2})()
        ]})()
        completed_courses = []
        
        has_prerequisites = EnrollmentService.check_prerequisites(course, completed_courses)
        assert has_prerequisites is False
    
    def test_validate_enrollment_period_active(self):
        """Test enrollment period validation when period is active."""
        now = datetime(2024, 1, 15, 12, 0)
        semester = type('Semester', (), {
            'enrollment_start': datetime(2024, 1, 1),
            'enrollment_end': datetime(2024, 1, 31)
        })()
        
        is_valid = EnrollmentService.validate_enrollment_period(semester, now)
        assert is_valid is True
    
    def test_validate_enrollment_period_before_start(self):
        """Test enrollment period validation before period starts."""
        now = datetime(2023, 12, 25, 12, 0)
        semester = type('Semester', (), {
            'enrollment_start': datetime(2024, 1, 1),
            'enrollment_end': datetime(2024, 1, 31)
        })()
        
        is_valid = EnrollmentService.validate_enrollment_period(semester, now)
        assert is_valid is False
    
    def test_validate_enrollment_period_after_end(self):
        """Test enrollment period validation after period ends."""
        now = datetime(2024, 2, 5, 12, 0)
        semester = type('Semester', (), {
            'enrollment_start': datetime(2024, 1, 1),
            'enrollment_end': datetime(2024, 1, 31)
        })()
        
        is_valid = EnrollmentService.validate_enrollment_period(semester, now)
        assert is_valid is False
    
    def test_validate_enrollment_period_on_boundaries(self):
        """Test enrollment period validation on exact boundaries."""
        # On start date
        start_time = datetime(2024, 1, 1, 0, 0)
        semester = type('Semester', (), {
            'enrollment_start': datetime(2024, 1, 1),
            'enrollment_end': datetime(2024, 1, 31)
        })()
        
        is_valid = EnrollmentService.validate_enrollment_period(semester, start_time)
        assert is_valid is True
        
        # On end date
        end_time = datetime(2024, 1, 31, 23, 59)
        is_valid = EnrollmentService.validate_enrollment_period(semester, end_time)
        assert is_valid is True
