"""fix student fee student foreign key

Revision ID: ba4bd0d8453e
Revises: 3b7f6d958c6b
Create Date: 2026-09-27 23:23:39.316378

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = 'ba4bd0d8453e'
down_revision: Union[str, Sequence[str], None] = '3b7f6d958c6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        op.f('student_fees_student_id_fkey'),
        'student_fees',
        type_='foreignkey',
    )

    op.create_foreign_key(
        'student_fees_student_id_fkey_students',
        'student_fees',
        'students',
        ['student_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    op.drop_constraint(
        'student_fees_student_id_fkey_students',
        'student_fees',
        type_='foreignkey',
    )

    op.create_foreign_key(
        op.f('student_fees_student_id_fkey'),
        'student_fees',
        'users',
        ['student_id'],
        ['id'],
        ondelete='CASCADE',
    )
