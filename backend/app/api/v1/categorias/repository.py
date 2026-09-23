from sqlalchemy.orm import Session
from app.models.categoria import Categoria
from app.models.servidor import Servidor
from .schemas import CategoriaCreate, CategoriaUpdate


def list_categorias(db: Session) -> list[Categoria]:
    return db.query(Categoria).all()


def get_by_id(db: Session, categoria_id: int) -> Categoria | None:
    return db.query(Categoria).filter(Categoria.id_categoria == categoria_id).first()


def search_by_nombre(db: Session, query: str) -> list[Categoria]:
    q = f"%{query.lower()}%"
    return db.query(Categoria).filter(Categoria.nombre.ilike(q)).all()


def ensure_servidor(db: Session, servidor_id: int) -> tuple[bool, str]:
    servidor = (
        db.query(Servidor)
        .filter(Servidor.id_servidor == servidor_id)
        .first()
    )

    if servidor is None:
        return False, f"El servidor {servidor_id} no existe"

    return True, ""


def ensure_padre(
    db: Session,
    servidor_id: int,
    padre_id: int | None,
    categoria_id: int | None = None,
) -> tuple[bool, str]:
    if padre_id is None:
        return True, ""

    padre = get_by_id(db, padre_id)

    if padre is None:
        return False, f"La categoría padre {padre_id} no existe"

    if padre.servidor_id != servidor_id:
        return False, "La categoría padre no pertenece al mismo servidor"

    if categoria_id is not None and padre_id == categoria_id:
        return False, "Una categoría no puede ser padre de sí misma"

    return True, ""


def create(db: Session, data: CategoriaCreate) -> Categoria:
    nueva = Categoria(
        nombre=data.nombre,
        descripcion=data.descripcion,
        padre_id=data.padre_id,
        servidor_id=data.servidor_id,
        orden=data.orden,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def update(
    db: Session,
    categoria_id: int,
    data: CategoriaUpdate,
) -> Categoria | None:
    categoria = get_by_id(db, categoria_id)

    if categoria is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(categoria, k, v)

    db.commit()
    db.refresh(categoria)
    return categoria


def delete(db: Session, categoria_id: int) -> bool:
    categoria = get_by_id(db, categoria_id)

    if categoria is None:
        return False

    db.delete(categoria)
    db.commit()
    return True