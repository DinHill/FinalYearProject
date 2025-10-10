# Testing Guide

## Overview

This testing suite provides comprehensive test coverage for the Greenwich University Academic Portal Backend.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and configuration
├── unit/                    # Unit tests (isolated component tests)
│   ├── test_username_service.py
│   ├── test_gpa_service.py
│   └── test_enrollment_validation.py
└── integration/             # Integration tests (API endpoint tests)
    ├── test_auth_endpoints.py
    ├── test_enrollment_endpoints.py
    └── test_finance_endpoints.py
```

## Running Tests

### Install Test Dependencies

```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
# With coverage report
pytest

# Or use the test runner
python run_tests.py
```

### Run Specific Test Types

```bash
# Unit tests only
pytest -m unit
python run_tests.py unit

# Integration tests only
pytest -m integration
python run_tests.py integration

# Quick run (no coverage)
python run_tests.py quick
```

### Run Specific Test Files

```bash
# Run single test file
pytest tests/unit/test_username_service.py

# Run specific test class
pytest tests/unit/test_gpa_service.py::TestGPAService

# Run specific test method
pytest tests/unit/test_gpa_service.py::TestGPAService::test_calculate_gpa_single_course
```

### Run with Different Verbosity

```bash
# Verbose output
pytest -v

# Very verbose (show all test names)
pytest -vv

# Quiet (only show summary)
pytest -q
```

## Test Markers

Tests are organized with markers for easy filtering:

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.academic` - Academic module tests
- `@pytest.mark.finance` - Finance module tests
- `@pytest.mark.documents` - Documents module tests
- `@pytest.mark.support` - Support module tests
- `@pytest.mark.slow` - Slow-running tests

### Filter by Markers

```bash
# Run only authentication tests
pytest -m auth

# Run only finance tests
pytest -m finance

# Run unit tests for academic module
pytest -m "unit and academic"

# Exclude slow tests
pytest -m "not slow"
```

## Coverage Reports

### Generate Coverage Report

```bash
# HTML report (opens in browser)
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Terminal report
pytest --cov=app --cov-report=term-missing

# XML report (for CI/CD)
pytest --cov=app --cov-report=xml
```

### Coverage Targets

- **Overall Coverage**: 80%+ required
- **Service Layer**: 90%+ target
- **API Endpoints**: 85%+ target
- **Models**: 70%+ acceptable

## Test Database

Tests use SQLite in-memory database for speed and isolation:

- Each test gets a fresh database
- No need to clean up after tests
- Fast parallel execution
- No external dependencies

## Fixtures

### Common Fixtures (conftest.py)

**Database Fixtures:**

- `db_session` - Fresh database session for each test
- `client` - FastAPI test client with DB override

**User Fixtures:**

- `test_student` - Student user
- `test_teacher` - Teacher user
- `test_admin` - Admin user

**Auth Fixtures:**

- `student_token` - Mock student auth token
- `teacher_token` - Mock teacher auth token
- `admin_token` - Mock admin auth token
- `mock_firebase_auth` - Mock Firebase authentication

**Data Fixtures:**

- `test_campus` - Campus record
- `test_major` - Major record
- `test_semester` - Semester record
- `test_course` - Course record
- `test_section` - Course section
- `test_enrollment` - Enrollment record
- `test_invoice` - Invoice record
- `test_document` - Document record
- `test_support_ticket` - Support ticket

### Using Fixtures

```python
def test_example(test_student, db_session):
    """Test with student fixture."""
    assert test_student.role == "student"
    assert test_student.is_active is True
```

## Mocking Firebase

Firebase Admin SDK is mocked for testing:

```python
def test_with_firebase(mock_firebase_auth, student_token):
    """Firebase is automatically mocked."""
    # student_token = "mock_token_test_firebase_uid_student_student"
    # Tokens are automatically verified
```

## Writing Tests

### Unit Test Example

```python
import pytest

class TestMyService:
    """Test MyService functionality."""

    def test_method_success(self):
        """Test successful method execution."""
        result = MyService.my_method("input")
        assert result == "expected_output"

    def test_method_error(self):
        """Test method error handling."""
        with pytest.raises(ValueError):
            MyService.my_method("invalid")
```

### Integration Test Example

```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.integration
@pytest.mark.auth
class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_login_success(self, client: TestClient, test_student):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/student-login",
            json={
                "student_id": "HieuNDGCD220033",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        assert "custom_token" in response.json()
```

## Async Tests

For async tests, use `@pytest.mark.asyncio`:

```python
import pytest

@pytest.mark.asyncio
async def test_async_function(db_session):
    """Test async function."""
    result = await some_async_function()
    assert result is not None
```

## Parametrized Tests

Test multiple scenarios with one test:

```python
@pytest.mark.parametrize("input,expected", [
    ("A", 4.0),
    ("B+", 3.5),
    ("B", 3.0),
    ("C", 2.0),
])
def test_grade_conversion(input, expected):
    """Test grade to points conversion."""
    assert letter_grade_to_points(input) == expected
```

## Best Practices

### ✅ DO

- **Write tests first** (TDD approach)
- **Test edge cases** (empty lists, null values, boundaries)
- **Use descriptive names** (`test_enrollment_when_section_is_full`)
- **Test one thing per test** (single assertion preferred)
- **Mock external services** (Firebase, GCS, email)
- **Use fixtures** (avoid repetitive setup code)
- **Check both success and failure** cases

### ❌ DON'T

- **Don't test implementation details** (test behavior, not internals)
- **Don't use production database** (use test database)
- **Don't write flaky tests** (avoid time-dependent logic)
- **Don't skip cleanup** (fixtures handle this)
- **Don't commit failing tests** (fix or mark as xfail)

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        run: |
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Failing Locally

```bash
# Clear pytest cache
pytest --cache-clear

# Run with verbose output
pytest -vv --tb=long

# Run single failing test
pytest tests/unit/test_gpa_service.py::TestGPAService::test_calculate_gpa -vv
```

### Database Issues

```bash
# Tests use in-memory SQLite, no cleanup needed
# If issues persist, check:
pytest --setup-show  # Show fixture setup/teardown
```

### Import Errors

```bash
# Ensure you're in the backend directory
cd backend

# Install in development mode
pip install -e .

# Or add backend to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## Next Steps

1. **Run existing tests**: `pytest -v`
2. **Add more integration tests**: Complete coverage for all endpoints
3. **Add document tests**: Test file upload/download workflows
4. **Add support tests**: Test ticket creation and SLA tracking
5. **Measure coverage**: `pytest --cov=app --cov-report=html`
6. **Set up CI/CD**: Automate testing on every commit

## Test Statistics

Current test coverage:

- **Unit Tests**: 3 files, 60+ test cases
- **Integration Tests**: 3 files, 30+ test cases
- **Total Tests**: 90+ test cases
- **Target Coverage**: 80%+

---

**Ready to test! 🧪**

Run `pytest` to start testing your backend!
