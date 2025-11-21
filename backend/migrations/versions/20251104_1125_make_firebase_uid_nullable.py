"""make_firebase_uid_nullable

Revision ID: a477d8cdf5cc
Revises: e5553b900852
Create Date: 2025-11-04 11:25:39.048090+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a477d8cdf5cc'
down_revision: Union[str, Sequence[str], None] = 'e5553b900852'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - make firebase_uid nullable for pending users."""
    # Make firebase_uid column nullable
    op.alter_column('users', 'firebase_uid',
                    existing_type=sa.String(length=128),
                    nullable=True)


def downgrade() -> None:
    """Downgrade schema - make firebase_uid NOT NULL again."""
    # This will fail if there are pending users with NULL firebase_uid
    # Need to clean them up before downgrade
    op.alter_column('users', 'firebase_uid',
                    existing_type=sa.String(length=128),
                    nullable=False)
