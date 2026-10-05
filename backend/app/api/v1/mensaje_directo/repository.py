from sqlalchemy.orm import Session

from app.models.mensaje_directo import MensajeDirecto
from app.models.usuario import Usuario
from .schemas import MensajeDirectoCreate, MensajeDirectoUpdate


def list_mensajes_directos(db: Session) -> list[MensajeDirecto]:
    return db.query(MensajeDirecto).all()


def get_by_id(
    db: Session,
    mensaje_directo_id: int
) -> MensajeDirecto | None:
    return db.query(MensajeDirecto).filter(
        MensajeDirecto.id_mensaje_directo == mensaje_directo_id
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
    data: MensajeDirectoCreate
) -> MensajeDirecto:
    nuevo = MensajeDirecto(
        contenido=data.contenido,
        emisor_id=data.emisor_id,
        receptor_id=data.receptor_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    mensaje_directo_id: int,
    data: MensajeDirectoUpdate
) -> MensajeDirecto | None:
    mensaje = get_by_id(db, mensaje_directo_id)

    if mensaje is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(mensaje, k, v)

    db.commit()
    db.refresh(mensaje)

    return mensaje


def delete(db: Session, mensaje_directo_id: int) -> bool:
    mensaje = get_by_id(db, mensaje_directo_id)

    if mensaje is None:
        return False

    db.delete(mensaje)
    db.commit()

    return True