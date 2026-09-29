from sqlalchemy.orm import Session

from app.models.miembro_servidor import MiembroServidor
from app.models.usuario import Usuario
from app.models.servidor import Servidor
from .schemas import MiembroServidorCreate, MiembroServidorUpdate


def list_miembros(db: Session) -> list[MiembroServidor]:
    return db.query(MiembroServidor).all()


def get_by_id(db: Session, usuario_id: int, servidor_id: int) -> MiembroServidor | None:
    return db.query(MiembroServidor).filter(
        MiembroServidor.usuario_id == usuario_id,
        MiembroServidor.servidor_id == servidor_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"
    return True, ""


def ensure_servidor(db: Session, servidor_id: int) -> tuple[bool, str]:
    servidor = db.query(Servidor).filter(Servidor.id_servidor == servidor_id).first()
    if servidor is None:
        return False, f"El servidor {servidor_id} no existe"
    return True, ""


def create(db: Session, data: MiembroServidorCreate) -> MiembroServidor:
    nuevo = MiembroServidor(
        usuario_id=data.usuario_id,
        servidor_id=data.servidor_id,
        activo=data.activo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(
    db: Session,
    usuario_id: int,
    servidor_id: int,
    data: MiembroServidorUpdate
) -> MiembroServidor | None:
    miembro = get_by_id(db, usuario_id, servidor_id)
    if miembro is None:
        return None

    cambios = data.model_dump(exclude_unset=True)
    for k, v in cambios.items():
        setattr(miembro, k, v)

    db.commit()
    db.refresh(miembro)
    return miembro


def delete(db: Session, usuario_id: int, servidor_id: int) -> bool:
    miembro = get_by_id(db, usuario_id, servidor_id)
    if miembro is None:
        return False

    db.delete(miembro)
    db.commit()
    return True