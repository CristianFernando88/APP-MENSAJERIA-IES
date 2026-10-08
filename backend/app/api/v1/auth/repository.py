# app/api/v1/auth/repository.py
# Repository del recurso Auth.
# La capa de router NO sabe si los datos vienen de SQLAlchemy o PostgreSQL.

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.usuario import Usuario


def get_by_email(db: Session, email: str) -> Usuario | None:
    """Devuelve un usuario por su email."""
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_by_email_or_nombre(db: Session, identificador: str) -> Usuario | None:
    """Devuelve un usuario por email O nombre de usuario."""
    return db.query(Usuario).filter(
        or_(
            Usuario.email == identificador,
            Usuario.nombre_usuario == identificador,
        )
    ).first()