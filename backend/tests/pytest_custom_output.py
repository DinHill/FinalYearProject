"""
Custom pytest output formatting for cleaner, more beautiful test results
"""
import pytest
from datetime import datetime


def pytest_configure(config):
    """Add custom configuration"""
    config.option.verbose = 1


def pytest_report_header(config):
    """Custom header for test output"""
    header = [
        "",
        "═" * 80,
        "  🧪 GREENWICH ACADEMIC PORTAL - API TEST SUITE",
        "═" * 80,
        f"  📅 Date: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        f"  🐍 Python: {config.option.pythonpath or 'Default'}",
        f"  📂 Test Path: {config.rootpath}",
        "─" * 80,
        ""
    ]
    return header


def pytest_collection_finish(session):
    """Show summary after collection"""
    if session.config.option.verbose >= 0:
        print(f"\n  ✨ Collected {len(session.items)} test(s)")
        print("  🚀 Starting test execution...\n")


def pytest_runtest_logreport(report):
    """Customize test result output"""
    if report.when == "call":
        # This will be handled by the terminal reporter
        pass


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """Add custom summary at the end"""
    terminalreporter.section("")
    terminalreporter.write_sep("═", "TEST SUMMARY", bold=True, blue=True)
    
    passed = len(terminalreporter.stats.get('passed', []))
    failed = len(terminalreporter.stats.get('failed', []))
    skipped = len(terminalreporter.stats.get('skipped', []))
    errors = len(terminalreporter.stats.get('error', []))
    total = passed + failed + skipped + errors
    
    # Calculate percentage
    if total > 0:
        percentage = (passed / total) * 100
    else:
        percentage = 0
    
    # Status emoji and color
    if failed == 0 and errors == 0:
        status = "✅ ALL TESTS PASSED"
        color = "green"
    elif failed > 0:
        status = "❌ SOME TESTS FAILED"
        color = "red"
    else:
        status = "⚠️  TESTS COMPLETED WITH WARNINGS"
        color = "yellow"
    
    # Print beautiful summary
    terminalreporter.write_line("")
    terminalreporter.write_line(f"  {status}", **{color: True, 'bold': True})
    terminalreporter.write_line("")
    terminalreporter.write_line(f"  📊 Results:")
    terminalreporter.write_line(f"     • Passed:  {passed} ✅")
    if failed > 0:
        terminalreporter.write_line(f"     • Failed:  {failed} ❌")
    if skipped > 0:
        terminalreporter.write_line(f"     • Skipped: {skipped} ⏭️")
    if errors > 0:
        terminalreporter.write_line(f"     • Errors:  {errors} 🚨")
    
    terminalreporter.write_line(f"     • Total:   {total}")
    terminalreporter.write_line(f"     • Success Rate: {percentage:.1f}%")
    terminalreporter.write_line("")
    
    # Duration
    duration = terminalreporter._sessionstarttime
    if hasattr(terminalreporter, '_session'):
        duration = datetime.now().timestamp() - duration
        terminalreporter.write_line(f"  ⏱️  Duration: {duration:.2f}s")
    
    terminalreporter.write_line("")
    terminalreporter.write_sep("═", "", blue=True)
    terminalreporter.write_line("")
