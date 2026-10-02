"""add returned status to out pass

Revision ID: 9be4ff0a68c0
Revises: d903676b84f0
Create Date: 2026-09-26 07:59:59.503940

"""

from typing import Sequence, Union

from alembic import op


revision: str = "9be4ff0a68c0"
down_revision: Union[str, Sequence[str], None] = "d903676b84f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TYPE outpassstatus
        ADD VALUE IF NOT EXISTS 'RETURNED'
        """
    )


def downgrade() -> None:
    # PostgreSQL does not safely support
    # removing an enum value directly.
    pass