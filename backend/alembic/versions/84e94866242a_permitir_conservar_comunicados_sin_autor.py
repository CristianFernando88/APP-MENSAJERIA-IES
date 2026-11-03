"""permitir conservar comunicados sin autor

Revision ID: 84e94866242a
Revises: eebbdccfa5da
Create Date: 2026-11-03 09:52:01.842383

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '84e94866242a'
down_revision: Union[str, Sequence[str], None] = 'eebbdccfa5da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("comunicado_publicado_por_fkey", "comunicado", type_="foreignkey")
    op.alter_column("comunicado", "publicado_por", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key("comunicado_publicado_por_fkey", "comunicado", "usuario", ["publicado_por"], ["id_usuario"], ondelete="SET NULL")

    op.drop_constraint("canal_creador_id_fkey", "canal", type_="foreignkey")
    op.alter_column("canal", "creador_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key("canal_creador_id_fkey", "canal", "usuario", ["creador_id"], ["id_usuario"], ondelete="SET NULL")

    op.drop_constraint("servidor_creador_id_fkey", "servidor", type_="foreignkey")
    op.alter_column("servidor", "creador_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key("servidor_creador_id_fkey", "servidor", "usuario", ["creador_id"], ["id_usuario"], ondelete="SET NULL")

    op.drop_constraint("mensaje_usuario_id_fkey", "mensaje", type_="foreignkey")
    op.alter_column("mensaje", "usuario_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key("mensaje_usuario_id_fkey", "mensaje", "usuario", ["usuario_id"], ["id_usuario"], ondelete="SET NULL")

    op.drop_constraint("usuario_rol_asignado_por_fkey", "usuario_rol", type_="foreignkey")
    op.create_foreign_key("usuario_rol_asignado_por_fkey", "usuario_rol", "usuario", ["asignado_por"], ["id_usuario"], ondelete="SET NULL")

    op.drop_constraint("comunicado_destinatario_usuario_id_fkey", "comunicado_destinatario", type_="foreignkey")
    op.create_foreign_key("comunicado_destinatario_usuario_id_fkey", "comunicado_destinatario", "usuario", ["usuario_id"], ["id_usuario"], ondelete="CASCADE")


def downgrade() -> None:
    raise NotImplementedError(
        "Esta migración no puede revertirse automáticamente si ya se eliminaron usuarios."
    )