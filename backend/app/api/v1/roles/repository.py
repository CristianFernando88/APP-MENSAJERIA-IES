# app/api/v1/roles/repository.py
# Repository del recurso Rol.
# La capa de router NO sabe si los datos vienen de una lista, SQLAlchemy o PostgreSQL.

from sqlalchemy.orm import Session
from app.models.rol import Rol
from .schemas import RolCreate, RolUpdate


# ---------- operaciones que consume el router ----------
def list_roles(db: Session) -> list[Rol]:
    """Devuelve todos los roles."""
    return db.query(Rol).all()


def get_by_id(db: Session, rol_id: int) -> Rol | None:
    """Devuelve un rol por su ID."""
    return db.query(Rol).filter(Rol.id_rol == rol_id).first()


def get_by_nombre(db: Session, nombre: str) -> Rol | None:
    """Devuelve un rol por su nombre."""
    return db.query(Rol).filter(Rol.nombre == nombre).first()


def search_by_nombre(db: Session, query: str) -> list[Rol]:
    """Busca roles por nombre (coincidencia parcial)."""
    q = f"%{query.lower()}%"
    return db.query(Rol).filter(Rol.nombre.ilike(q)).all()


def filter_by_tipo(db: Session, tipo: str) -> list[Rol]:
    """Filtra roles por tipo ('global' o 'servidor')."""
    return db.query(Rol).filter(Rol.tipo == tipo).all()


def ensure_unique(db: Session, nombre: str, exclude_id: int | None = None) -> tuple[bool, str]:
    """Validación de negocio: nombre único."""
    existing = get_by_nombre(db, nombre)
    if existing and existing.id_rol != exclude_id:
        return False, f"El rol '{nombre}' ya existe"
    return True, ""


def create(db: Session, data: RolCreate) -> Rol:
    """Crea un nuevo rol."""
    nuevo = Rol(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(db: Session, rol_id: int, data: RolUpdate) -> Rol | None:
    """Actualiza un rol existente."""
    rol = get_by_id(db, rol_id)
    if rol is None:
        return None

    cambios = data.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(rol, k, v)

    db.commit()
    db.refresh(rol)
    return rol


def delete(db: Session, rol_id: int) -> bool:
    """Elimina un rol por su ID."""
    rol = get_by_id(db, rol_id)
    if rol is None:
        return False

    db.delete(rol)
    db.commit()
    return True