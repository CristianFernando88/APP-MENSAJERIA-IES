from sqlalchemy.orm import Session

from app.models.recordatorio import Recordatorio
from app.models.usuario import Usuario
from .schemas import RecordatorioCreate, RecordatorioUpdate


def list_recordatorios(db: Session) -> list[Recordatorio]:
    return db.query(Recordatorio).all()


def get_by_id(db: Session, recordatorio_id: int) -> Recordatorio | None:
    return db.query(Recordatorio).filter(
        Recordatorio.id_recordatorio == recordatorio_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def create(db: Session, data: RecordatorioCreate) -> Recordatorio:
    nuevo = Recordatorio(
        titulo=data.titulo,
        descripcion=data.descripcion,
        fecha_limite=data.fecha_limite,
        usuario_id=data.usuario_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    recordatorio_id: int,
    data: RecordatorioUpdate
) -> Recordatorio | None:
    recordatorio = get_by_id(db, recordatorio_id)

    if recordatorio is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(recordatorio, k, v)

    db.commit()
    db.refresh(recordatorio)

    return recordatorio


def delete(db: Session, recordatorio_id: int) -> bool:
    recordatorio = get_by_id(db, recordatorio_id)

    if recordatorio is None:
        return False

    db.delete(recordatorio)
    db.commit()

    return True