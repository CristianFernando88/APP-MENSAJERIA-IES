from sqlalchemy.orm import Session
from app.models.servidor import Servidor
from app.models.canal import Canal
from app.models.usuario import Usuario
from app.models.miembro_servidor import MiembroServidor
from app.models.miembro_canal import MiembroCanal
from app.models.relacion_usuario import RelacionUsuario
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

def listar_hijos(db: Session, usuario_id: int) -> list[int]:
    """Ids de los alumnos de los que soy tutor.

    Convención de la tabla `relacion_usuario` (según seed.py):
    usuario_id = tutor, relacionado_id = hijo/alumno.
    Busco las filas donde yo soy el usuario y me quedo con los relacionados."""
    filas = (
        db.query(RelacionUsuario.relacionado_id)
        .filter(RelacionUsuario.usuario_id == usuario_id)
        .distinct()
        .all()
    )
    return [fila[0] for fila in filas]


def listar_accesos(db: Session, usuario_id: int) -> dict:
    """Servidores y canales que puede ver el usuario logueado.

    - Directos: soy miembro del servidor/canal.
    - Vía hijos: si soy tutor, heredo las membresías de cada hijo.
    """
    hijos = listar_hijos(db, usuario_id)
    ids_relacionados = [usuario_id, *hijos]

    membresias = (
        db.query(MiembroServidor)
        .filter(MiembroServidor.usuario_id.in_(ids_relacionados))
        .all()
    )
    ids_servidores = sorted({m.servidor_id for m in membresias})

    servidores = (
        db.query(Servidor)
        .filter(Servidor.id_servidor.in_(ids_servidores))
        .order_by(Servidor.nombre)
        .all()
        if ids_servidores
        else []
    )

    membresias_canal = (
        db.query(MiembroCanal)
        .filter(MiembroCanal.usuario_id.in_(ids_relacionados))
        .all()
    )
    ids_canales = sorted({mc.canal_id for mc in membresias_canal})

    canales = (
        db.query(Canal)
        .filter(Canal.id_canal.in_(ids_canales))
        .order_by(Canal.servidor_id, Canal.orden, Canal.nombre)
        .all()
        if ids_canales
        else []
    )

    return {
        "es_tutor": len(hijos) > 0,
        "hijos": hijos,
        "servidores": servidores,
        "canales": canales,
    }