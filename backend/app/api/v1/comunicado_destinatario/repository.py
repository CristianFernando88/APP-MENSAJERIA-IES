from sqlalchemy.orm import Session

from app.models.comunicado_destinatario import ComunicadoDestinatario
from app.models.comunicado import Comunicado
from app.models.servidor import Servidor
from app.models.canal import Canal
from app.models.usuario import Usuario
from .schemas import (
    ComunicadoDestinatarioCreate,
    ComunicadoDestinatarioUpdate,
)


def list_destinatarios(db: Session) -> list[ComunicadoDestinatario]:
    return db.query(ComunicadoDestinatario).all()


def get_by_id(
    db: Session,
    destinatario_id: int
) -> ComunicadoDestinatario | None:
    return db.query(ComunicadoDestinatario).filter(
        ComunicadoDestinatario.id_comunicado_destinatario == destinatario_id
    ).first()


def ensure_comunicado(db: Session, comunicado_id: int) -> tuple[bool, str]:
    comunicado = db.query(Comunicado).filter(
        Comunicado.id_comunicado == comunicado_id
    ).first()

    if comunicado is None:
        return False, f"El comunicado {comunicado_id} no existe"

    return True, ""


def ensure_servidor(db: Session, servidor_id: int) -> tuple[bool, str]:
    servidor = db.query(Servidor).filter(
        Servidor.id_servidor == servidor_id
    ).first()

    if servidor is None:
        return False, f"El servidor {servidor_id} no existe"

    return True, ""


def ensure_canal(db: Session, canal_id: int) -> tuple[bool, str]:
    canal = db.query(Canal).filter(
        Canal.id_canal == canal_id
    ).first()

    if canal is None:
        return False, f"El canal {canal_id} no existe"

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
    data: ComunicadoDestinatarioCreate
) -> ComunicadoDestinatario:
    nuevo = ComunicadoDestinatario(
        comunicado_id=data.comunicado_id,
        servidor_id=data.servidor_id,
        canal_id=data.canal_id,
        usuario_id=data.usuario_id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    destinatario_id: int,
    data: ComunicadoDestinatarioUpdate
) -> ComunicadoDestinatario | None:
    destinatario = get_by_id(db, destinatario_id)

    if destinatario is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(destinatario, k, v)

    db.commit()
    db.refresh(destinatario)

    return destinatario


def delete(db: Session, destinatario_id: int) -> bool:
    destinatario = get_by_id(db, destinatario_id)

    if destinatario is None:
        return False

    db.delete(destinatario)
    db.commit()

    return True