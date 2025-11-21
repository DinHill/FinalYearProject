"""add_coordinator_to_majors

Revision ID: f93a4bb1bc5f
Revises: add_business_key_codes
Create Date: 2025-11-15 17:18:30.193748+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f93a4bb1bc5f'
down_revision: Union[str, Sequence[str], None] = 'add_business_key_codes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add coordinator_id column to majors table
    op.add_column('majors', sa.Column('coordinator_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_majors_coordinator', 'majors', 'users', ['coordinator_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove coordinator_id column from majors table
    op.drop_constraint('fk_majors_coordinator', 'majors', type_='foreignkey')
    op.drop_column('majors', 'coordinator_id')
