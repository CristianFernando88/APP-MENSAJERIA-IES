"""Agregar dni a perfil

Revision ID: c7c17f69ab87
Revises: 59e519a98460
Create Date: 2026-10-20 20:21:03.500601

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7c17f69ab87'
down_revision: Union[str, Sequence[str], None] = '59e519a98460'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'perfil',
        sa.Column('dni', sa.String(length=8), nullable=True)
    )
    op.create_unique_constraint(
        'uq_perfil_dni',
        'perfil',
        ['dni']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_perfil_dni',
        'perfil',
        type_='unique'
    )
    op.drop_column('perfil', 'dni')
