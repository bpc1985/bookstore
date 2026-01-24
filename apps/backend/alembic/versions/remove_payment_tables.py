"""Remove payment tables

Revision ID: remove_payment_tables
Revises: cff051ce11fe_initial_user_auth
Create Date: 2026-01-24 19:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'remove_payment_tables'
down_revision = 'cff051ce11fe_initial_user_auth'


def upgrade():
    op.drop_table('payment_logs')
    op.drop_table('payments')


def downgrade():
    # Recreate payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('idempotency_key', sa.String(length=255), nullable=False),
        sa.Column('provider_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )
    op.create_index('ix_payments_id', 'payments', ['id'])
    op.create_index('ix_payments_idempotency_key', 'payments', ['idempotency_key'])
    op.create_unique_constraint('uq_payments_order_id', 'payments', ['order_id'])

    # Recreate payment_logs table
    op.create_table(
        'payment_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('payment_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('request_data', sa.JSON(), nullable=True),
        sa.Column('response_data', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )
    op.create_index('ix_payment_logs_id', 'payment_logs', ['id'])
    op.create_index('ix_payment_logs_payment_id', 'payment_logs', ['payment_id'])