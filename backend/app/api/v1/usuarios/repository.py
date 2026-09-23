# app/api/v1/usuarios/repository.py
# Repository del recurso Usuario.
# La capa de router NO sabe si los datos vienen de una lista, SQLAlchemy o PostgreSQL.

from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from .schemas import UsuarioCreate, UsuarioUpdate


# ---------- operaciones que consume el router ----------
def list_usuarios(db: Session) -> list[Usuario]:
    """Devuelve todos los usuarios."""
    return db.query(Usuario).all()


def get_by_id(db: Session, usuario_id: int) -> Usuario | None:
    """Devuelve un usuario por su ID."""
    return db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()


def get_by_email(db: Session, email: str) -> Usuario | None:
    """Devuelve un usuario por su email."""
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_by_nombre(db: Session, nombre_usuario: str) -> Usuario | None:
    """Devuelve un usuario por su nombre de usuario."""
    return db.query(Usuario).filter(Usuario.nombre_usuario == nombre_usuario).first()


def search_by_nombre(db: Session, query: str) -> list[Usuario]:
    """Busca usuarios por nombre (coincidencia parcial)."""
    q = f"%{query.lower()}%"
    return db.query(Usuario).filter(Usuario.nombre_usuario.ilike(q)).all()


def ensure_unique(db: Session, email: str, nombre_usuario: str, exclude_id: int | None = None) -> tuple[bool, str]:
    """Validación de negocio: email y nombre de usuario únicos."""
    # Validar email
    existing_email = get_by_email(db, email)
    if existing_email and existing_email.id_usuario != exclude_id:
        return False, f"El email {email} ya está registrado"

    # Validar nombre de usuario
    existing_nombre = get_by_nombre(db, nombre_usuario)
    if existing_nombre and existing_nombre.id_usuario != exclude_id:
        return False, f"El nombre de usuario {nombre_usuario} ya está en uso"

    return True, ""


def create(db: Session, data: UsuarioCreate) -> Usuario:
    """Crea un nuevo usuario."""
    nuevo = Usuario(
        nombre_usuario=data.nombre_usuario,
        email=data.email,
        contrasena_hash=data.contrasena_hash,  # Opcional por ahora
        activo=data.activo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(db: Session, usuario_id: int, data: UsuarioUpdate) -> Usuario | None:
    """Actualiza un usuario existente."""
    usuario = get_by_id(db, usuario_id)
    if usuario is None:
        return None

    cambios = data.model_dump(exclude_unset=True)  # solo lo enviado
    for k, v in cambios.items():
        setattr(usuario, k, v)

    db.commit()
    db.refresh(usuario)
    return usuario


def delete(db: Session, usuario_id: int) -> bool:
    """Elimina un usuario por su ID."""
    usuario = get_by_id(db, usuario_id)
    if usuario is None:
        return False

    db.delete(usuario)
    db.commit()
    return True