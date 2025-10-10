"""Unit tests for username generation service."""
import pytest
from app.services.username_service import UsernameService


class TestUsernameService:
    """Test username generation with Vietnamese names."""
    
    def test_generate_username_simple_name(self):
        """Test username generation with simple Vietnamese name."""
        username = UsernameService.generate_username(
            full_name="Nguyen Van A",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert username == "ANGVGCD220001"
    
    def test_generate_username_complex_name(self):
        """Test username generation with complex Vietnamese name."""
        username = UsernameService.generate_username(
            full_name="Nguyen Dinh Hieu",
            campus_code="GCD",
            year=2022,
            sequence=33
        )
        assert username == "HieuNDGCD220033"
    
    def test_generate_username_with_accents(self):
        """Test username generation with Vietnamese accents."""
        username = UsernameService.generate_username(
            full_name="Trần Thị Hương",
            campus_code="GCD",
            year=2023,
            sequence=15
        )
        assert username == "HuongTTGCD230015"
    
    def test_generate_username_single_name(self):
        """Test username generation with single name."""
        username = UsernameService.generate_username(
            full_name="John",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert username == "JohnGCD220001"
    
    def test_generate_username_two_names(self):
        """Test username generation with two names."""
        username = UsernameService.generate_username(
            full_name="John Doe",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert username == "DoeJGCD220001"
    
    def test_generate_username_long_middle_name(self):
        """Test username generation with multiple middle names."""
        username = UsernameService.generate_username(
            full_name="Nguyen Thi Kim Anh",
            campus_code="GCD",
            year=2022,
            sequence=99
        )
        assert username == "AnhNTKGCD220099"
    
    def test_generate_username_special_characters(self):
        """Test username generation with special characters."""
        username = UsernameService.generate_username(
            full_name="O'Brien",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert username == "OBrienGCD220001"
    
    def test_generate_username_sequence_padding(self):
        """Test username generation with different sequence numbers."""
        # Test single digit
        username1 = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert username1.endswith("0001")
        
        # Test two digits
        username2 = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2022,
            sequence=42
        )
        assert username2.endswith("0042")
        
        # Test four digits
        username3 = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2022,
            sequence=9999
        )
        assert username3.endswith("9999")
    
    def test_generate_username_different_campus(self):
        """Test username generation with different campus codes."""
        username_gcd = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert "GCD" in username_gcd
        
        username_hcm = UsernameService.generate_username(
            full_name="Test User",
            campus_code="HCM",
            year=2022,
            sequence=1
        )
        assert "HCM" in username_hcm
    
    def test_generate_username_different_years(self):
        """Test username generation with different years."""
        username_22 = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2022,
            sequence=1
        )
        assert "22" in username_22
        
        username_23 = UsernameService.generate_username(
            full_name="Test User",
            campus_code="GCD",
            year=2023,
            sequence=1
        )
        assert "23" in username_23
    
    def test_remove_vietnamese_accents(self):
        """Test Vietnamese accent removal."""
        # Test lowercase
        assert UsernameService._remove_vietnamese_accents("à") == "a"
        assert UsernameService._remove_vietnamese_accents("ế") == "e"
        assert UsernameService._remove_vietnamese_accents("ộ") == "o"
        assert UsernameService._remove_vietnamese_accents("ư") == "u"
        assert UsernameService._remove_vietnamese_accents("đ") == "d"
        
        # Test uppercase
        assert UsernameService._remove_vietnamese_accents("Đ") == "D"
        assert UsernameService._remove_vietnamese_accents("Ư") == "U"
        
        # Test full words
        assert UsernameService._remove_vietnamese_accents("Hương") == "Huong"
        assert UsernameService._remove_vietnamese_accents("Việt Nam") == "Viet Nam"
    
    def test_parse_vietnamese_name_three_parts(self):
        """Test Vietnamese name parsing with three parts."""
        first, middle, last = UsernameService._parse_vietnamese_name("Nguyen Van A")
        assert first == "Nguyen"
        assert middle == "V"
        assert last == "A"
    
    def test_parse_vietnamese_name_four_parts(self):
        """Test Vietnamese name parsing with four parts."""
        first, middle, last = UsernameService._parse_vietnamese_name("Nguyen Dinh Hieu")
        assert first == "Nguyen"
        assert middle == "D"
        assert last == "Hieu"
    
    def test_parse_vietnamese_name_five_parts(self):
        """Test Vietnamese name parsing with five parts."""
        first, middle, last = UsernameService._parse_vietnamese_name("Nguyen Thi Kim Anh")
        assert first == "Nguyen"
        assert middle == "TK"
        assert last == "Anh"
    
    def test_username_uniqueness(self):
        """Test that usernames are unique for different sequences."""
        usernames = set()
        for seq in range(1, 101):
            username = UsernameService.generate_username(
                full_name="Nguyen Van A",
                campus_code="GCD",
                year=2022,
                sequence=seq
            )
            usernames.add(username)
        
        # All usernames should be unique
        assert len(usernames) == 100
