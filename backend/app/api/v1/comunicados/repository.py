from sqlalchemy.orm import Session

from app.models.comunicado import Comunicado
from app.models.usuario import Usuario
from .schemas import ComunicadoCreate, ComunicadoUpdate


def list_comunicados(db: Session) -> list[Comunicado]:
    return db.query(Comunicado).all()


def get_by_id(db: Session, comunicado_id: int) -> Comunicado | None:
    return db.query(Comunicado).filter(
        Comunicado.id_comunicado == comunicado_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()
    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"
    return True, ""




def create(db: Session, data: ComunicadoCreate) -> Comunicado:
    nuevo = Comunicado(
        titulo=data.titulo,
        contenido=data.contenido,
        publicado_por=data.publicado_por,
        tipo=data.tipo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(
    db: Session,
    comunicado_id: int,
    data: ComunicadoUpdate
) -> Comunicado | None:
    comunicado = get_by_id(db, comunicado_id)
    if comunicado is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(comunicado, k, v)

    db.commit()
    db.refresh(comunicado)
    return comunicado


def delete(db: Session, comunicado_id: int) -> bool:
    comunicado = get_by_id(db, comunicado_id)
    if comunicado is None:
        return False

    db.delete(comunicado)
    db.commit()
    return True