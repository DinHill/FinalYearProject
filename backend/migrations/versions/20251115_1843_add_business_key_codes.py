"""add business key codes to reference tables

Revision ID: add_business_key_codes
Revises: 
Create Date: 2025-11-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_business_key_codes'
down_revision: Union[str, None] = 'a477d8cdf5cc'  # Latest migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add code column to roles table
    op.add_column('roles', sa.Column('code', sa.String(length=20), nullable=True))
    
    # Populate existing roles with codes
    op.execute("""
        UPDATE roles 
        SET code = CASE 
            WHEN name = 'student' THEN 'STU'
            WHEN name = 'teacher' THEN 'TCH'
            WHEN name = 'admin' THEN 'ADM'
            WHEN name = 'super_admin' THEN 'SADM'
            WHEN name = 'registrar' THEN 'REG'
            WHEN name = 'academic_admin' THEN 'AADM'
            WHEN name = 'finance_admin' THEN 'FADM'
            ELSE UPPER(LEFT(name, 4))
        END
        WHERE code IS NULL
    """)
    
    # Make code column non-nullable after population
    op.alter_column('roles', 'code', nullable=False)
    
    # Add unique constraint
    op.create_unique_constraint('uq_roles_code', 'roles', ['code'])
    
    # Add index for performance
    op.create_index('ix_roles_code', 'roles', ['code'])


def downgrade() -> None:
    # Remove index and constraint
    op.drop_index('ix_roles_code', table_name='roles')
    op.drop_constraint('uq_roles_code', 'roles', type_='unique')
    
    # Remove code column
    op.drop_column('roles', 'code')
