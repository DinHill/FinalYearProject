"""add_performance_indexes

Revision ID: 778f4e46a072
Revises: rbac_20251020_232452
Create Date: 2025-10-20 16:53:07.084298+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '778f4e46a072'
down_revision: Union[str, Sequence[str], None] = 'rbac_20251020_232452'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for commonly queried columns"""
    
    # Composite indexes for frequently joined tables
    # Only add indexes that don't already exist as single-column indexes
    
    op.create_index(
        'ix_course_sections_course_semester', 
        'course_sections', 
        ['course_id', 'semester_id']
    )
    
    op.create_index(
        'ix_enrollments_section_student', 
        'enrollments', 
        ['section_id', 'student_id']
    )
    
    # Grades are linked via assignments
    op.create_index(
        'ix_grades_assignment_student', 
        'grades', 
        ['assignment_id', 'student_id']
    )
    
    # Attendance with correct column name
    op.create_index(
        'ix_attendance_section_date', 
        'attendance', 
        ['section_id', 'attendance_date']
    )
    
    # Additional useful indexes for common queries
    op.create_index(
        'ix_assignments_section_due',
        'assignments',
        ['section_id', 'due_date']
    )
    
    op.create_index(
        'ix_invoices_student_status',
        'invoices',
        ['student_id', 'status']
    )


def downgrade() -> None:
    """Remove performance indexes"""
    
    op.drop_index('ix_course_sections_course_semester', table_name='course_sections')
    op.drop_index('ix_enrollments_section_student', table_name='enrollments')
    op.drop_index('ix_grades_assignment_student', table_name='grades')
    op.drop_index('ix_attendance_section_date', table_name='attendance')
    op.drop_index('ix_assignments_section_due', table_name='assignments')
    op.drop_index('ix_invoices_student_status', table_name='invoices')
