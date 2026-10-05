from sqlalchemy.orm import Session

from app.models.comunicado_visto import ComunicadoVisto
from app.models.comunicado import Comunicado
from app.models.usuario import Usuario
from .schemas import (
    ComunicadoVistoCreate,
    ComunicadoVistoUpdate,
)


def list_vistos(db: Session) -> list[ComunicadoVisto]:
    return db.query(ComunicadoVisto).all()


def get_by_id(
    db: Session,
    visto_id: int
) -> ComunicadoVisto | None:
    return db.query(ComunicadoVisto).filter(
        ComunicadoVisto.id_comunicado_visto == visto_id
    ).first()


def ensure_comunicado(db: Session, comunicado_id: int) -> tuple[bool, str]:
    comunicado = db.query(Comunicado).filter(
        Comunicado.id_comunicado == comunicado_id
    ).first()

    if comunicado is None:
        return False, f"El comunicado {comunicado_id} no existe"

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
    data: ComunicadoVistoCreate
) -> ComunicadoVisto:
    nuevo = ComunicadoVisto(
        comunicado_id=data.comunicado_id,
        usuario_id=data.usuario_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    visto_id: int,
    data: ComunicadoVistoUpdate
) -> ComunicadoVisto | None:
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