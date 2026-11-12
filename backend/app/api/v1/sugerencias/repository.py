from sqlalchemy.orm import Session

from app.models.sugerencia import Sugerencia
from app.models.usuario import Usuario
from .schemas import SugerenciaCreate


def create(db: Session, data: SugerenciaCreate, usuario: Usuario) -> Sugerencia:
    nueva = Sugerencia(
        usuario_id=usuario.id_usuario,
        nombres=data.nombres,
        apellidos=data.apellidos,
        email=usuario.email,
        mensaje=data.mensaje,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def list_all(db: Session) -> list[Sugerencia]:
    return (
        db.query(Sugerencia)
        .order_by(Sugerencia.fecha_creacion.desc())
        .all()
    )


def marcar_leida(db: Session, sugerencia_id: int) -> Sugerencia | None:
    sugerencia = db.get(Sugerencia, sugerencia_id)
    if sugerencia is None:
        return None
    sugerencia.leida = True
    db.commit()
    db.refresh(sugerencia)
    return sugerencia
