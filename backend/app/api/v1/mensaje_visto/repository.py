from sqlalchemy.orm import Session

from app.models.mensaje_visto import MensajeVisto
from app.models.mensaje import Mensaje
from app.models.usuario import Usuario
from .schemas import (
    MensajeVistoCreate,
    MensajeVistoUpdate,
)


def list_vistos(db: Session) -> list[MensajeVisto]:
    return db.query(MensajeVisto).all()


def get_by_id(
    db: Session,
    visto_id: int
) -> MensajeVisto | None:
    return db.query(MensajeVisto).filter(
        MensajeVisto.id_mensaje_visto == visto_id
    ).first()


def ensure_mensaje(db: Session, mensaje_id: int) -> tuple[bool, str]:
    mensaje = db.query(Mensaje).filter(
        Mensaje.id_mensaje == mensaje_id
    ).first()

    if mensaje is None:
        return False, f"El mensaje {mensaje_id} no existe"

    return True, ""


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def create(
    db: Session,
    data: MensajeVistoCreate
) -> MensajeVisto:
    nuevo = MensajeVisto(
        mensaje_id=data.mensaje_id,
        usuario_id=data.usuario_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    visto_id: int,
    data: MensajeVistoUpdate
) -> MensajeVisto | None:
    visto = get_by_id(db, visto_id)

    if visto is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(visto, k, v)

    db.commit()
    db.refresh(visto)

    return visto


def delete(db: Session, visto_id: int) -> bool:
    visto = get_by_id(db, visto_id)

    if visto is None:
        return False

    db.delete(visto)
    db.commit()

    return True