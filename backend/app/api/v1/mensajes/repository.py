from sqlalchemy.orm import Session
from app.models.mensaje import Mensaje
from app.models.usuario import Usuario
from app.models.canal import Canal
from .schemas import MensajeCreate, MensajeUpdate


def list_mensajes(db: Session) -> list[Mensaje]:
    return db.query(Mensaje).all()


def get_by_id(db: Session, mensaje_id: int) -> Mensaje | None:
    return db.query(Mensaje).filter(Mensaje.id_mensaje == mensaje_id).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == usuario_id)
        .first()
    )

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def ensure_canal(db: Session, canal_id: int) -> tuple[bool, str]:
    canal = (
        db.query(Canal)
        .filter(Canal.id_canal == canal_id)
        .first()
    )

    if canal is None:
        return False, f"El canal {canal_id} no existe"

    return True, ""


def create(db: Session, data: MensajeCreate) -> Mensaje:
    nuevo = Mensaje(
        contenido=data.contenido,
        usuario_id=data.usuario_id,
        canal_id=data.canal_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(
    db: Session,
    mensaje_id: int,
    data: MensajeUpdate,
) -> Mensaje | None:
    mensaje = get_by_id(db, mensaje_id)

    if mensaje is None:
        return None

    mensaje.contenido = data.contenido
    mensaje.editado = True

    db.commit()
    db.refresh(mensaje)
    return mensaje


def delete(db: Session, mensaje_id: int) -> bool:
    mensaje = get_by_id(db, mensaje_id)

    if mensaje is None:
        return False

    db.delete(mensaje)
    db.commit()
    return True