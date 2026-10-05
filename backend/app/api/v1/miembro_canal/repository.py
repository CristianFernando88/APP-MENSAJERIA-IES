from sqlalchemy.orm import Session

from app.models.miembro_canal import MiembroCanal
from app.models.usuario import Usuario
from app.models.canal import Canal
from .schemas import MiembroCanalCreate, MiembroCanalUpdate


def list_miembros_canal(db: Session) -> list[MiembroCanal]:
    return db.query(MiembroCanal).all()


def get_by_id(
    db: Session,
    miembro_canal_id: int
) -> MiembroCanal | None:
    return db.query(MiembroCanal).filter(
        MiembroCanal.id_miembro_canal == miembro_canal_id
    ).first()


def ensure_usuario(db: Session, usuario_id: int) -> tuple[bool, str]:
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == usuario_id
    ).first()

    if usuario is None:
        return False, f"El usuario {usuario_id} no existe"

    return True, ""


def ensure_canal(db: Session, canal_id: int) -> tuple[bool, str]:
    canal = db.query(Canal).filter(
        Canal.id_canal == canal_id
    ).first()

    if canal is None:
        return False, f"El canal {canal_id} no existe"

    return True, ""


def create(
    db: Session,
    data: MiembroCanalCreate
) -> MiembroCanal:
    nuevo = MiembroCanal(
        usuario_id=data.usuario_id,
        canal_id=data.canal_id,
        rol_en_canal=data.rol_en_canal,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


def update(
    db: Session,
    miembro_canal_id: int,
    data: MiembroCanalUpdate
) -> MiembroCanal | None:
    miembro = get_by_id(db, miembro_canal_id)

    if miembro is None:
        return None

    cambios = data.model_dump(exclude_unset=True)

    for k, v in cambios.items():
        setattr(miembro, k, v)

    db.commit()
    db.refresh(miembro)

    return miembro


def delete(db: Session, miembro_canal_id: int) -> bool:
    miembro = get_by_id(db, miembro_canal_id)

    if miembro is None:
        return False

    db.delete(miembro)
    db.commit()

    return True