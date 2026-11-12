"""crear tabla sugerencia

Revision ID: a3f1c9d2e4b7
Revises: 28d4f9708cfa
Create Date: 2026-11-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3f1c9d2e4b7'
down_revision: Union[str, Sequence[str], None] = '28d4f9708cfa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'sugerencia',
        sa.Column('id_sugerencia', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('nombres', sa.String(length=100), nullable=False),
        sa.Column('apellidos', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=False),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=False),
        sa.Column('leida', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id_usuario']),
        sa.PrimaryKeyConstraint('id_sugerencia'),
    )
    op.create_index('ix_sugerencia_usuario_id', 'sugerencia', ['usuario_id'])


def downgrade() -> None:
    op.drop_index('ix_sugerencia_usuario_id', table_name='sugerencia')
    op.drop_table('sugerencia')
