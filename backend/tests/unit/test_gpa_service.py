"""Unit tests for GPA calculation service."""
import pytest
from datetime import datetime
from app.services.gpa_service import GPAService


class TestGPAService:
    """Test GPA calculation logic."""
    
    def test_letter_grade_to_points_valid_grades(self):
        """Test conversion of letter grades to grade points."""
        assert GPAService.letter_grade_to_points("A+") == 4.0
        assert GPAService.letter_grade_to_points("A") == 4.0
        assert GPAService.letter_grade_to_points("B+") == 3.5
        assert GPAService.letter_grade_to_points("B") == 3.0
        assert GPAService.letter_grade_to_points("C+") == 2.5
        assert GPAService.letter_grade_to_points("C") == 2.0
        assert GPAService.letter_grade_to_points("D") == 1.0
        assert GPAService.letter_grade_to_points("F") == 0.0
    
    def test_letter_grade_to_points_invalid_grade(self):
        """Test conversion with invalid grade."""
        assert GPAService.letter_grade_to_points("Z") == 0.0
        assert GPAService.letter_grade_to_points("") == 0.0
        assert GPAService.letter_grade_to_points(None) == 0.0
    
    def test_letter_grade_to_points_case_insensitive(self):
        """Test that grade conversion is case-insensitive."""
        assert GPAService.letter_grade_to_points("a") == 4.0
        assert GPAService.letter_grade_to_points("b+") == 3.5
        assert GPAService.letter_grade_to_points("C") == 2.0
    
    def test_calculate_gpa_single_course(self):
        """Test GPA calculation with single course."""
        grades = [
            {"credits": 3, "grade": "A"}
        ]
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 4.0
    
    def test_calculate_gpa_multiple_courses_same_grade(self):
        """Test GPA calculation with multiple courses, same grade."""
        grades = [
            {"credits": 3, "grade": "A"},
            {"credits": 3, "grade": "A"},
            {"credits": 3, "grade": "A"}
        ]
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 4.0
    
    def test_calculate_gpa_multiple_courses_different_grades(self):
        """Test GPA calculation with different grades."""
        grades = [
            {"credits": 3, "grade": "A"},   # 3 * 4.0 = 12.0
            {"credits": 3, "grade": "B"},   # 3 * 3.0 = 9.0
            {"credits": 3, "grade": "C"}    # 3 * 2.0 = 6.0
        ]
        # Total: 27.0 / 9 credits = 3.0
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 3.0
    
    def test_calculate_gpa_weighted_by_credits(self):
        """Test GPA calculation is weighted by credits."""
        grades = [
            {"credits": 4, "grade": "A"},   # 4 * 4.0 = 16.0
            {"credits": 2, "grade": "C"}    # 2 * 2.0 = 4.0
        ]
        # Total: 20.0 / 6 credits = 3.333...
        gpa = GPAService.calculate_gpa(grades)
        assert round(gpa, 2) == 3.33
    
    def test_calculate_gpa_with_failing_grade(self):
        """Test GPA calculation with failing grade."""
        grades = [
            {"credits": 3, "grade": "A"},   # 3 * 4.0 = 12.0
            {"credits": 3, "grade": "F"}    # 3 * 0.0 = 0.0
        ]
        # Total: 12.0 / 6 credits = 2.0
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 2.0
    
    def test_calculate_gpa_all_failing(self):
        """Test GPA calculation with all failing grades."""
        grades = [
            {"credits": 3, "grade": "F"},
            {"credits": 3, "grade": "F"}
        ]
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 0.0
    
    def test_calculate_gpa_empty_list(self):
        """Test GPA calculation with empty grade list."""
        gpa = GPAService.calculate_gpa([])
        assert gpa == 0.0
    
    def test_calculate_gpa_zero_credits(self):
        """Test GPA calculation with zero credits."""
        grades = [
            {"credits": 0, "grade": "A"}
        ]
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 0.0
    
    def test_calculate_gpa_precision(self):
        """Test GPA calculation precision."""
        grades = [
            {"credits": 3, "grade": "A"},   # 12.0
            {"credits": 3, "grade": "B+"},  # 10.5
            {"credits": 3, "grade": "B"},   # 9.0
            {"credits": 3, "grade": "C+"}   # 7.5
        ]
        # Total: 39.0 / 12 credits = 3.25
        gpa = GPAService.calculate_gpa(grades)
        assert gpa == 3.25
    
    def test_calculate_gpa_rounds_to_two_decimals(self):
        """Test that GPA is rounded to 2 decimal places."""
        grades = [
            {"credits": 3, "grade": "A"},
            {"credits": 3, "grade": "B"},
            {"credits": 3, "grade": "B"}
        ]
        # (12.0 + 9.0 + 9.0) / 9 = 30/9 = 3.333...
        gpa = GPAService.calculate_gpa(grades)
        assert len(str(gpa).split('.')[1]) <= 2
    
    def test_determine_academic_standing_deans_list(self):
        """Test Dean's List determination."""
        standing = GPAService.determine_academic_standing(3.75, 30)
        assert standing == "Dean's List"
    
    def test_determine_academic_standing_good_standing(self):
        """Test Good Standing determination."""
        standing = GPAService.determine_academic_standing(3.0, 30)
        assert standing == "Good Standing"
        
        standing = GPAService.determine_academic_standing(2.5, 30)
        assert standing == "Good Standing"
    
    def test_determine_academic_standing_probation(self):
        """Test Academic Probation determination."""
        standing = GPAService.determine_academic_standing(1.8, 30)
        assert standing == "Academic Probation"
        
        standing = GPAService.determine_academic_standing(2.0, 30)
        assert standing == "Good Standing"  # Exactly 2.0 is good standing
    
    def test_determine_academic_standing_disqualification(self):
        """Test Academic Disqualification determination."""
        standing = GPAService.determine_academic_standing(1.5, 30)
        assert standing == "Academic Disqualification"
        
        standing = GPAService.determine_academic_standing(0.8, 30)
        assert standing == "Academic Disqualification"
    
    def test_determine_academic_standing_insufficient_credits(self):
        """Test standing with insufficient credits."""
        # With less than 12 credits, no standing assigned
        standing = GPAService.determine_academic_standing(3.8, 9)
        assert standing == "Good Standing"  # Default to good standing
    
    def test_calculate_degree_progress(self):
        """Test degree progress calculation."""
        progress = GPAService.calculate_degree_progress(60, 120)
        assert progress == 50.0
        
        progress = GPAService.calculate_degree_progress(90, 120)
        assert progress == 75.0
        
        progress = GPAService.calculate_degree_progress(120, 120)
        assert progress == 100.0
    
    def test_calculate_degree_progress_exceeds_required(self):
        """Test degree progress when earned exceeds required."""
        progress = GPAService.calculate_degree_progress(130, 120)
        assert progress == 100.0  # Capped at 100%
    
    def test_calculate_degree_progress_zero_required(self):
        """Test degree progress with zero required credits."""
        progress = GPAService.calculate_degree_progress(60, 0)
        assert progress == 0.0
    
    def test_is_eligible_for_graduation_eligible(self):
        """Test graduation eligibility check - eligible."""
        is_eligible = GPAService.is_eligible_for_graduation(3.0, 120, 120)
        assert is_eligible is True
    
    def test_is_eligible_for_graduation_insufficient_gpa(self):
        """Test graduation eligibility - insufficient GPA."""
        is_eligible = GPAService.is_eligible_for_graduation(1.9, 120, 120)
        assert is_eligible is False
    
    def test_is_eligible_for_graduation_insufficient_credits(self):
        """Test graduation eligibility - insufficient credits."""
        is_eligible = GPAService.is_eligible_for_graduation(3.5, 110, 120)
        assert is_eligible is False
    
    def test_is_eligible_for_graduation_border_cases(self):
        """Test graduation eligibility - border cases."""
        # Exactly minimum GPA and credits
        is_eligible = GPAService.is_eligible_for_graduation(2.0, 120, 120)
        assert is_eligible is True
        
        # Just below minimum GPA
        is_eligible = GPAService.is_eligible_for_graduation(1.99, 120, 120)
        assert is_eligible is False
        
        # Just below required credits
        is_eligible = GPAService.is_eligible_for_graduation(3.0, 119, 120)
        assert is_eligible is False
