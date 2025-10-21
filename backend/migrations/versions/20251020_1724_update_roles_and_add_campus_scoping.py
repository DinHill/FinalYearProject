"""update_roles_and_add_campus_scoping

Revision ID: 1e69983a334e
Revises: 2432a7582118
Create Date: 2025-10-20 17:24:49.865405+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e69983a334e'
down_revision: Union[str, Sequence[str], None] = '778f4e46a072'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Update roles to new structure and add campus scoping
    
    Changes:
    1. Delete old admin roles (admin:users, admin:academic, admin:finance, admin:all)
    2. Add new admin roles (super_admin, academic_admin, finance_admin, support_admin, content_admin)
    3. Add campus_id to user_roles table for campus-scoped permissions
    4. Migrate existing admin users to super_admin
    """
    
    # Step 1: Add campus_id column to user_roles table
    op.add_column('user_roles', sa.Column('campus_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_user_roles_campus_id',
        'user_roles', 'campuses',
        ['campus_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_user_roles_campus_id', 'user_roles', ['campus_id'])
    
    # Step 2: Delete old admin-specific roles from user_roles (preserve student/teacher)
    op.execute("""
        DELETE FROM user_roles 
        WHERE role_id IN (
            SELECT id FROM roles 
            WHERE name IN ('admin:users', 'admin:academic', 'admin:finance', 'admin:all')
        )
    """)
    
    # Step 3: Delete old role definitions
    op.execute("""
        DELETE FROM roles 
        WHERE name IN ('admin:users', 'admin:academic', 'admin:finance', 'admin:all')
    """)
    
    # Step 4: Add new admin roles
    op.execute("""
        INSERT INTO roles (name, description, created_at, updated_at) VALUES
        ('super_admin', 'Full system access (typically campus_id=NULL for cross-campus access)', now(), now()),
        ('academic_admin', 'Manage courses, schedules, enrollments, grades', now(), now()),
        ('finance_admin', 'Manage invoices, payments, fees', now(), now()),
        ('support_admin', 'Manage support tickets, document requests', now(), now()),
        ('content_admin', 'Manage announcements, notifications', now(), now())
        ON CONFLICT (name) DO NOTHING
    """)
    
    # Step 5: Migrate existing admin users to super_admin role (NULL campus = cross-campus access)
    op.execute("""
        INSERT INTO user_roles (user_id, role_id, campus_id, created_at, updated_at)
        SELECT 
            u.id,
            r.id,
            NULL,  -- NULL campus_id means cross-campus super admin
            now(),
            now()
        FROM users u
        CROSS JOIN roles r
        WHERE u.role = 'admin' AND r.name = 'super_admin'
        ON CONFLICT DO NOTHING
    """)
    
    # Step 6: Set campus_id for existing student/teacher roles based on user's campus
    op.execute("""
        UPDATE user_roles ur
        SET campus_id = u.campus_id
        FROM users u
        WHERE ur.user_id = u.id
        AND u.campus_id IS NOT NULL
    """)


def downgrade() -> None:
    """
    Revert to old role structure
    """
    
    # Remove new admin roles
    op.execute("""
        DELETE FROM user_roles 
        WHERE role_id IN (
            SELECT id FROM roles 
            WHERE name IN ('super_admin', 'academic_admin', 'finance_admin', 'support_admin', 'content_admin')
        )
    """)
    
    op.execute("""
        DELETE FROM roles 
        WHERE name IN ('super_admin', 'academic_admin', 'finance_admin', 'support_admin', 'content_admin')
    """)
    
    # Restore old admin roles
    op.execute("""
        INSERT INTO roles (name, description, created_at, updated_at) VALUES
        ('admin:users', 'Administrator access to manage users only', now(), now()),
        ('admin:academic', 'Administrator access to manage academic data (courses, sections, grades)', now(), now()),
        ('admin:finance', 'Administrator access to manage financial data (invoices, payments)', now(), now()),
        ('admin:all', 'Full administrative access to all system functions', now(), now())
        ON CONFLICT (name) DO NOTHING
    """)
    
    # Restore admin:all for admin users
    op.execute("""
        INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
        SELECT 
            u.id,
            r.id,
            now(),
            now()
        FROM users u
        CROSS JOIN roles r
        WHERE u.role = 'admin' AND r.name = 'admin:all'
        ON CONFLICT DO NOTHING
    """)
    
    # Drop campus_id column from user_roles
    op.drop_index('ix_user_roles_campus_id', table_name='user_roles')
    op.drop_constraint('fk_user_roles_campus_id', 'user_roles', type_='foreignkey')
    op.drop_column('user_roles', 'campus_id')
