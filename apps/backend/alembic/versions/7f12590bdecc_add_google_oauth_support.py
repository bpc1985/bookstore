"""add_google_oauth_support

Revision ID: 7f12590bdecc
Revises: a1b2c3d4e5f6
Create Date: 2026-02-05 02:27:11.536795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f12590bdecc'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', recreate='auto') as batch_op:
        batch_op.add_column(sa.Column('google_id', sa.String(255), nullable=True))
        batch_op.create_index('ix_users_google_id', ['google_id'], unique=True)
        batch_op.alter_column('hashed_password', nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('users', recreate='auto') as batch_op:
        batch_op.drop_index('ix_users_google_id')
        batch_op.drop_column('google_id')
        batch_op.alter_column('hashed_password', nullable=False)
