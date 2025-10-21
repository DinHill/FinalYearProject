"""
Add RBAC tables - roles and user_roles

Revision ID: rbac_20251020_232452
Revises: 
Create Date: 2025-10-20 23:24:52

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'rbac_20251020_232452'
down_revision = '7c821a97d0bb'  # Latest migration: Create all missing tables
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add roles and user_roles tables"""
    
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=False)
    
    # Create user_roles junction table
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_id', name='uq_user_role')
    )
    op.create_index(op.f('ix_user_roles_user_id'), 'user_roles', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_roles_role_id'), 'user_roles', ['role_id'], unique=False)
    
    # Seed initial roles
    op.execute("""
        INSERT INTO roles (name, description, created_at, updated_at) VALUES
        ('student', 'Regular student access to view their own academic information', now(), now()),
        ('teacher', 'Teacher/instructor access to manage their sections, grades, and attendance', now(), now()),
        ('admin:users', 'Administrator access to manage users only', now(), now()),
        ('admin:academic', 'Administrator access to manage academic data (courses, sections, grades)', now(), now()),
        ('admin:finance', 'Administrator access to manage financial data (invoices, payments)', now(), now()),
        ('admin:all', 'Full administrative access to all system functions', now(), now())
    """)
    
    # Migrate existing users to new role system
    # Get all users and assign them roles based on their current role column
    op.execute("""
        INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
        SELECT 
            u.id,
            r.id,
            now(),
            now()
        FROM users u
        CROSS JOIN roles r
        WHERE 
            (u.role = 'student' AND r.name = 'student') OR
            (u.role = 'teacher' AND r.name = 'teacher') OR
            (u.role = 'admin' AND r.name = 'admin:all')
    """)


def downgrade() -> None:
    """Remove roles and user_roles tables"""
    
    op.drop_index(op.f('ix_user_roles_role_id'), table_name='user_roles')
    op.drop_index(op.f('ix_user_roles_user_id'), table_name='user_roles')
    op.drop_table('user_roles')
    
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_table('roles')
