from sqlalchemy.orm import Session

from app.models.relacion_usuario import RelacionUsuario
from app.models.usuario import Usuario
from .schemas import (
    RelacionUsuarioCreate,
    RelacionUsuarioUpdate,
)


def list_relaciones(db: Session) -> list[RelacionUsuario]:
    return db.query(RelacionUsuario).all()


def get_by_id(
    db: Session,
    relacion_id: int
) -> RelacionUsuario | None:
    return db.query(RelacionUsuario).filter(
        RelacionUsuario.id_relacion == relacion_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def create(
    db: Session,
    data: RelacionUsuarioCreate
) -> RelacionUsuario:
    nueva = RelacionUsuario(
        usuario_id=data.usuario_id,
        relacionado_id=data.relacionado_id,
        tipo=data.tipo,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


def update(
    db: Session,
    relacion_id: int,
    data: RelacionUsuarioUpdate
) -> RelacionUsuario | None:
    relacion = get_by_id(db, relacion_id)

    if relacion is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(relacion, k, v)

    db.commit()
    db.refresh(relacion)

    return relacion


def delete(db: Session, relacion_id: int) -> bool:
    relacion = get_by_id(db, relacion_id)

    if relacion is None:
        return False

    db.delete(relacion)
    db.commit()

    return True