# app/api/v1/usuario_rol/repository.py
# Repository del recurso UsuarioRol.
# La capa de router NO sabe si los datos vienen de una lista, SQLAlchemy o PostgreSQL.

from sqlalchemy.orm import Session
from app.models.usuario_rol import UsuarioRol
from app.models.usuario import Usuario
from app.models.rol import Rol
from app.models.servidor import Servidor
from .schemas import UsuarioRolCreate, UsuarioRolUpdate


# ---------- operaciones que consume el router ----------
def list_usuario_roles(db: Session) -> list[UsuarioRol]:
    """Devuelve todas las asignaciones de roles."""
    return db.query(UsuarioRol).all()


def get_by_id(db: Session, usuario_rol_id: int) -> UsuarioRol | None:
    """Devuelve una asignación por su ID."""
    return db.query(UsuarioRol).filter(UsuarioRol.id_usuario_rol == usuario_rol_id).first()


def get_by_usuario(db: Session, usuario_id: int, servidor_id: int | None = None) -> list[UsuarioRol]:
    """Devuelve los roles de un usuario (opcionalmente filtrado por servidor)."""
    query = db.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario_id)
    if servidor_id is not None:
        query = query.filter(UsuarioRol.servidor_id == servidor_id)
    return query.all()


def get_by_servidor(db: Session, servidor_id: int) -> list[UsuarioRol]:
    """Devuelve todos los roles asignados en un servidor."""
    return db.query(UsuarioRol).filter(UsuarioRol.servidor_id == servidor_id).all()


def exists(db: Session, usuario_id: int, rol_id: int, servidor_id: int | None) -> bool:
    """Verifica si ya existe la asignación (mismo usuario + rol + servidor)."""
    query = db.query(UsuarioRol).filter(
        UsuarioRol.usuario_id == usuario_id,
        UsuarioRol.rol_id == rol_id,
    )
    if servidor_id is None:
        query = query.filter(UsuarioRol.servidor_id.is_(None))
    else:
        query = query.filter(UsuarioRol.servidor_id == servidor_id)
    return query.first() is not None


def ensure_referencias(
    db: Session,
    usuario_id: int,
    rol_id: int,
    servidor_id: int | None,
    asignado_por: int | None = None,
) -> tuple[bool, str]:
    """Validación de negocio: usuario, rol y servidor existen; y no hay duplicados."""
    # Validar usuario
    if db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first() is None:
        return False, f"El usuario {usuario_id} no existe"

    # Validar rol
    rol = db.query(Rol).filter(Rol.id_rol == rol_id).first()
    if rol is None:
        return False, f"El rol {rol_id} no existe"

    # Validar servidor si el rol es de tipo 'servidor'
    if rol.tipo == "servidor":
        if servidor_id is None:
            return False, "Los roles de tipo 'servidor' requieren servidor_id"
        if db.query(Servidor).filter(Servidor.id_servidor == servidor_id).first() is None:
            return False, f"El servidor {servidor_id} no existe"
    else:
        # Rol global: servidor_id debe ser NULL
        if servidor_id is not None:
            return False, "Los roles de tipo 'global' no deben tener servidor_id"

    # Validar asignador si viene
    if asignado_por is not None:
        if db.query(Usuario).filter(Usuario.id_usuario == asignado_por).first() is None:
            return False, f"El usuario asignador {asignado_por} no existe"

    # Validar duplicado
    if exists(db, usuario_id, rol_id, servidor_id):
        return False, "El usuario ya tiene ese rol asignado en ese contexto"

    return True, ""


def create(db: Session, data: UsuarioRolCreate) -> UsuarioRol:
    """Crea una nueva asignación de rol."""
    nueva = UsuarioRol(
        usuario_id=data.usuario_id,
        rol_id=data.rol_id,
        servidor_id=data.servidor_id,
        asignado_por=data.asignado_por,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def update(db: Session, usuario_rol_id: int, data: UsuarioRolUpdate) -> UsuarioRol | None:
    """Actualiza una asignación existente."""
    asignacion = get_by_id(db, usuario_rol_id)
    if asignacion is None:
        return None

    cambios = data.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(asignacion, k, v)

    db.commit()
    db.refresh(asignacion)
    return asignacion


def delete(db: Session, usuario_rol_id: int) -> bool:
    """Elimina una asignación por su ID."""
    asignacion = get_by_id(db, usuario_rol_id)
    if asignacion is None:
        return False

    db.delete(asignacion)
    db.commit()
    return True


def delete_by_usuario_rol_servidor(
    db: Session,
    usuario_id: int,
    rol_id: int,
    servidor_id: int | None,
) -> bool:
    """Elimina una asignación específica (usuario + rol + servidor)."""
    query = db.query(UsuarioRol).filter(
        UsuarioRol.usuario_id == usuario_id,
        UsuarioRol.rol_id == rol_id,
    )
    if servidor_id is None:
        query = query.filter(UsuarioRol.servidor_id.is_(None))
    else:
        query = query.filter(UsuarioRol.servidor_id == servidor_id)

    asignacion = query.first()
    if asignacion is None:
        return False

    db.delete(asignacion)
    db.commit()
    return True