from sqlalchemy.orm import Session

from app.models.comunicado import Comunicado
from app.models.comunicado_adjunto import ComunicadoAdjunto


def obtener_comunicado(db: Session, comunicado_id: int) -> Comunicado | None:
    return db.query(Comunicado).filter(
        Comunicado.id_comunicado == comunicado_id,
        Comunicado.eliminado == False
    ).first()


def listar_adjuntos(db: Session, comunicado_id: int) -> list[ComunicadoAdjunto]:
    return db.query(ComunicadoAdjunto).filter(
        ComunicadoAdjunto.comunicado_id == comunicado_id
    ).all()


def crear_adjunto(
    db: Session,
    comunicado_id: int,
    nombre_original: str,
    url: str,
    public_id: str,
    tipo_mime: str,
    tamano_bytes: int
) -> ComunicadoAdjunto:
    adjunto = ComunicadoAdjunto(
        comunicado_id=comunicado_id,
        nombre_original=nombre_original,
        url=url,
        public_id=public_id,
        tipo_mime=tipo_mime,
        tamano_bytes=tamano_bytes
    )
    db.add(adjunto)
    db.commit()
    db.refresh(adjunto)
    return adjunto

def crear_adjuntos(db: Session, adjuntos: list[dict]) -> list[ComunicadoAdjunto]:
    registros = [
        ComunicadoAdjunto(
            comunicado_id=adjunto["comunicado_id"],
            nombre_original=adjunto["nombre_original"],
            url=adjunto["url"],
            public_id=adjunto["public_id"],
            tipo_mime=adjunto["tipo_mime"],
            tamano_bytes=adjunto["tamano_bytes"]
        )
        for adjunto in adjuntos
    ]

    try:
        db.add_all(registros)
        db.commit()

        for registro in registros:
            db.refresh(registro)

        return registros
    except Exception:
        db.rollback()
        raise


def obtener_adjunto(db: Session, adjunto_id: int) -> ComunicadoAdjunto | None:
    return db.query(ComunicadoAdjunto).filter(
        ComunicadoAdjunto.id == adjunto_id
    ).first()

def eliminar_adjunto(db: Session, adjunto: ComunicadoAdjunto) -> None:
    db.delete(adjunto)
    db.commit()