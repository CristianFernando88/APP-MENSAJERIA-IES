from sqlalchemy.orm import Session
from app.models.canal import Canal
from app.models.servidor import Servidor
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from .schemas import CanalCreate, CanalUpdate


def list_canales(db: Session) -> list[Canal]:
    return db.query(Canal).all()


def get_by_id(db: Session, canal_id: int) -> Canal | None:
    return db.query(Canal).filter(Canal.id_canal == canal_id).first()


def search_by_nombre(db: Session, query: str) -> list[Canal]:
    q = f"%{query.lower()}%"
    return db.query(Canal).filter(Canal.nombre.ilike(q)).all()


def ensure_servidor(db: Session, servidor_id: int) -> tuple[bool, str]:
    servidor = (
        db.query(Servidor)
        .filter(Servidor.id_servidor == servidor_id)
        .first()
    )

    if servidor is None:
        return False, f"El servidor {servidor_id} no existe"

    return True, ""


def ensure_creador(db: Session, creador_id: int) -> tuple[bool, str]:
    creador = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == creador_id)
        .first()
    )

    if creador is None:
        return False, f"El usuario {creador_id} no existe"

    return True, ""


def ensure_categoria(
    db: Session,
    servidor_id: int,
    categoria_id: int | None,
) -> tuple[bool, str]:
    if categoria_id is None:
        return True, ""

    categoria = (
        db.query(Categoria)
        .filter(Categoria.id_categoria == categoria_id)
        .first()
    )

    if categoria is None:
        return False, f"La categoría {categoria_id} no existe"

    if categoria.servidor_id != servidor_id:
        return False, "La categoría no pertenece al mismo servidor"

    return True, ""


def create(db: Session, data: CanalCreate) -> Canal:
    nuevo = Canal(
        nombre=data.nombre,
        descripcion=data.descripcion,
        servidor_id=data.servidor_id,
        creador_id=data.creador_id,
        categoria_id=data.categoria_id,
        orden=data.orden,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(
    db: Session,
    canal_id: int,
    data: CanalUpdate,
) -> Canal | None:
    canal = get_by_id(db, canal_id)

    if canal is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(canal, k, v)

    db.commit()
    db.refresh(canal)
    return canal


def delete(db: Session, canal_id: int) -> bool:
    canal = get_by_id(db, canal_id)

    if canal is None:
        return False

    db.delete(canal)
    db.commit()
    return True