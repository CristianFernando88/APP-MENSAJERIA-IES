from sqlalchemy.orm import Session

from app.models.notificacion import Notificacion
from app.models.usuario import Usuario
from .schemas import NotificacionCreate, NotificacionUpdate


def list_notificaciones(db: Session) -> list[Notificacion]:
    return db.query(Notificacion).all()


def get_by_id(db: Session, notificacion_id: int) -> Notificacion | None:
    return db.query(Notificacion).filter(
        Notificacion.id_notificacion == notificacion_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def create(db: Session, data: NotificacionCreate) -> Notificacion:
    nueva = Notificacion(
        usuario_id=data.usuario_id,
        mensaje=data.mensaje,
        tipo=data.tipo,
        enlace=data.enlace,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


def update(
    db: Session,
    notificacion_id: int,
    data: NotificacionUpdate
) -> Notificacion | None:
    notificacion = get_by_id(db, notificacion_id)

    if notificacion is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(notificacion, k, v)

    db.commit()
    db.refresh(notificacion)

    return notificacion


def delete(db: Session, notificacion_id: int) -> bool:
    notificacion = get_by_id(db, notificacion_id)

    if notificacion is None:
        return False

    db.delete(notificacion)
    db.commit()

    return True