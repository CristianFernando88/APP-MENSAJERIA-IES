"""agregar cambio obligatorio de password

Revision ID: 28d4f9708cfa
Revises: 84e94866242a
Create Date: 2026-11-03 15:43:45.068086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28d4f9708cfa'
down_revision: Union[str, Sequence[str], None] = '84e94866242a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuario",
        sa.Column(
            "debe_cambiar_password",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )


def downgrade() -> None:
    op.drop_column("usuario", "debe_cambiar_password")
