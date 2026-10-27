from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from cloudinary.uploader import upload, destroy

from app.core.db import get_db
from app.models.comunicado_adjunto import ComunicadoAdjunto
from . import repository as repo
from .schemas import ComunicadoAdjuntoResponse
from typing import Annotated
from pydantic import WithJsonSchema

ArchivoSubida = Annotated[
    UploadFile,
    WithJsonSchema({"type": "string", "format": "binary"})
]


router = APIRouter(tags=["Adjuntos de comunicados"])

MAX_TAMANO = 10 * 1024 * 1024
MAX_ARCHIVOS = 5

FORMATOS = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
}


def obtener_extension(nombre: str) -> str:
    return "." + nombre.rsplit(".", 1)[-1].lower() if "." in nombre else ""


@router.post(
    "/comunicados/{comunicado_id}/adjuntos",
    response_model=list[ComunicadoAdjuntoResponse],
    status_code=status.HTTP_201_CREATED
)
def subir_adjuntos(
    comunicado_id: int,
    archivos: Annotated[list[ArchivoSubida], File()],
    db: Session = Depends(get_db)
):
    comunicado = repo.obtener_comunicado(db, comunicado_id)

    if comunicado is None:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")

    if not archivos or len(archivos) > MAX_ARCHIVOS:
        raise HTTPException(
            status_code=400,
            detail="Debés enviar entre 1 y 5 archivos por solicitud"
        )

    preparados = []
    subidos = []

    try:
        for archivo in archivos:
            extension = obtener_extension(archivo.filename or "")
            tipo_mime = FORMATOS.get(extension)

            if tipo_mime is None or archivo.content_type != tipo_mime:
                raise HTTPException(
                    status_code=400,
                    detail=f"Formato no permitido: {archivo.filename}"
                )

            contenido = archivo.file.read(MAX_TAMANO + 1)

            if len(contenido) > MAX_TAMANO:
                raise HTTPException(
                    status_code=413,
                    detail=f"El archivo {archivo.filename} supera los 10 MB"
                )

            archivo.file.seek(0)

            preparados.append({
                "archivo": archivo,
                "tipo_mime": tipo_mime,
                "tamano_bytes": len(contenido),
                "resource_type": (
                    "image" if tipo_mime.startswith("image/") else "raw"
                )
            })

        for item in preparados:
            resultado = upload(
                item["archivo"].file,
                folder="comunicados",
                resource_type=item["resource_type"],
                use_filename=True,
                unique_filename=True
            )

            subidos.append({
                "comunicado_id": comunicado_id,
                "nombre_original": item["archivo"].filename or "archivo",
                "url": resultado["secure_url"],
                "public_id": resultado["public_id"],
                "tipo_mime": item["tipo_mime"],
                "tamano_bytes": item["tamano_bytes"],
                "resource_type": item["resource_type"]
            })

        datos_adjuntos = [
            {clave: valor for clave, valor in adjunto.items()
             if clave != "resource_type"}
            for adjunto in subidos
        ]

        return repo.crear_adjuntos(db, datos_adjuntos)

    except Exception as error:
        db.rollback()

        for adjunto in subidos:
            try:
                destroy(
                    adjunto["public_id"],
                    resource_type=adjunto["resource_type"]
                )
            except Exception:
                pass

        if isinstance(error, HTTPException):
            raise

        raise HTTPException(
            status_code=502,
            detail="No se pudieron subir los archivos"
        ) from error
    finally:
        for archivo in archivos:
            archivo.file.close()



@router.get(
    "/comunicados/{comunicado_id}/adjuntos",
    response_model=list[ComunicadoAdjuntoResponse]
)
def listar_adjuntos(
    comunicado_id: int,
    db: Session = Depends(get_db)
):
    comunicado = repo.obtener_comunicado(db, comunicado_id)

    if comunicado is None:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")

    return repo.listar_adjuntos(db, comunicado_id)


@router.delete(
    "/comunicados-adjuntos/{adjunto_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_adjunto(
    adjunto_id: int,
    db: Session = Depends(get_db)
):
    adjunto = repo.obtener_adjunto(db, adjunto_id)

    if adjunto is None:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado")

    resource_type = "image" if adjunto.tipo_mime.startswith("image/") else "raw"

    try:
        resultado = destroy(
            adjunto.public_id,
            resource_type=resource_type
        )

        if resultado.get("result") not in ("ok", "not found"):
            raise HTTPException(
                status_code=502,
                detail="No se pudo eliminar el archivo de Cloudinary"
            )

        repo.eliminar_adjunto(db, adjunto)
        return None

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="No se pudo eliminar el archivo"
        ) from error
