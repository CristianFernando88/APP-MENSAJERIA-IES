
from sqlalchemy.orm import Session
from app.models.perfil import Perfil
from .schemas import PerfilCreate, PerfilUpdate


def get_by_usuario(db: Session, usuario_id: int) -> Perfil | None:
    return db.query(Perfil).filter(Perfil.usuario_id == usuario_id).first()


def create(db: Session, data: PerfilCreate) -> Perfil:
    nuevo = Perfil(
        usuario_id=data.usuario_id,
        nombres=data.nombres,
        apellidos=data.apellidos,
        foto_perfil=data.foto_perfil,
        biografia=data.biografia,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update(db: Session, usuario_id: int, data: PerfilUpdate) -> Perfil | None:
    perfil = get_by_usuario(db, usuario_id)
    if perfil is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for campo, valor in cambios.items():
        setattr(perfil, campo, valor)

    db.commit()
    db.refresh(perfil)
    return perfil
