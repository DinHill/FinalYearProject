"""add_idempotency_keys_table

Revision ID: e5553b900852
Revises: 1e69983a334e
Create Date: 2025-10-20 17:45:18.583993+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5553b900852'
down_revision: Union[str, Sequence[str], None] = '1e69983a334e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create idempotency_keys table for preventing duplicate operations
    
    This table stores idempotency keys from request headers to ensure
    critical operations like payments and file uploads are only processed once.
    """
    
    op.create_table(
        'idempotency_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('request_data', sa.Text(), nullable=True),
        sa.Column('response_data', sa.Text(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_idempotency_key')
    )
    
    # Index for fast key lookups
    op.create_index('ix_idempotency_keys_key', 'idempotency_keys', ['key'], unique=True)
    
    # Index for cleanup queries by created_at
    op.create_index('ix_idempotency_keys_created_at', 'idempotency_keys', ['created_at'])


def downgrade() -> None:
    """Remove idempotency_keys table"""
    
    op.drop_index('ix_idempotency_keys_created_at', table_name='idempotency_keys')
    op.drop_index('ix_idempotency_keys_key', table_name='idempotency_keys')
    op.drop_table('idempotency_keys')
