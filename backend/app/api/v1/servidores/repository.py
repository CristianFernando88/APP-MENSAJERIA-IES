from sqlalchemy.orm import Session
from app.models.servidor import Servidor
from app.models.usuario import Usuario
from app.models.miembro_servidor import MiembroServidor
from .schemas import ServidorCreate, ServidorUpdate


def list_servidores(db: Session) -> list[Servidor]:
    return db.query(Servidor).all()


def get_by_id(db: Session, servidor_id: int) -> Servidor | None:
    return db.query(Servidor).filter(Servidor.id_servidor == servidor_id).first()


def search_by_nombre(db: Session, query: str) -> list[Servidor]:
    q = f"%{query.lower()}%"
    return db.query(Servidor).filter(Servidor.nombre.ilike(q)).all()


def ensure_creador(db: Session, creador_id: int) -> tuple[bool, str]:
    creador = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == creador_id)
        .first()
    )

    if creador is None:
        return False, f"El usuario {creador_id} no existe"

    return True, ""


def create(db: Session, data: ServidorCreate) -> Servidor | tuple[None, str]:
    valido, mensaje = ensure_creador(db, data.creador_id)

    if not valido:
        return None, mensaje

    nuevo = Servidor(
        nombre=data.nombre,
        descripcion=data.descripcion,
        creador_id=data.creador_id,
    )

    db.add(nuevo)
    db.flush()

    miembro = MiembroServidor(
        usuario_id=data.creador_id,
        servidor_id=nuevo.id_servidor,
    )

    db.add(miembro)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    servidor_id: int,
    data: ServidorUpdate
) -> Servidor | None:
    servidor = get_by_id(db, servidor_id)

    if servidor is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(servidor, k, v)

    db.commit()
    db.refresh(servidor)
    return servidor


def delete(db: Session, servidor_id: int) -> bool:
    servidor = get_by_id(db, servidor_id)

    if servidor is None:
        return False

    db.delete(servidor)
    db.commit()
    return True