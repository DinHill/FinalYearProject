"""Test runner script for Greenwich University Backend."""
import subprocess
import sys
from pathlib import Path


def run_tests(args=None):
    """Run pytest with optional arguments."""
    cmd = ["pytest"]
    
    if args:
        cmd.extend(args)
    else:
        # Default: run all tests with coverage
        cmd.extend([
            "-v",
            "--tb=short",
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing"
        ])
    
    # Run tests
    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode


def run_unit_tests():
    """Run only unit tests."""
    return run_tests(["-m", "unit", "-v"])


def run_integration_tests():
    """Run only integration tests."""
    return run_tests(["-m", "integration", "-v"])


def run_quick_tests():
    """Run tests without coverage (faster)."""
    return run_tests(["-v", "--tb=short"])


if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        
        if test_type == "unit":
            sys.exit(run_unit_tests())
        elif test_type == "integration":
            sys.exit(run_integration_tests())
        elif test_type == "quick":
            sys.exit(run_quick_tests())
        else:
            print(f"Unknown test type: {test_type}")
            print("Available options: unit, integration, quick")
            sys.exit(1)
    else:
        # Run all tests
        sys.exit(run_tests())
