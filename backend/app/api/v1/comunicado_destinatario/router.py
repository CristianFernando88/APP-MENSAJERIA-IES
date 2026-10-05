from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import (
    ComunicadoDestinatarioCreate,
    ComunicadoDestinatarioUpdate,
    ComunicadoDestinatarioResponse,
)

router = APIRouter(
    prefix="/comunicados-destinatarios",
    tags=["Destinatarios de Comunicados"]
)


@router.get("/", response_model=list[ComunicadoDestinatarioResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_destinatarios(db)


@router.get(
    "/{destinatario_id}",
    response_model=ComunicadoDestinatarioResponse
)
def obtener(
    destinatario_id: int,
    db: Session = Depends(get_db)
):
    destinatario = repo.get_by_id(db, destinatario_id)

    if destinatario is None:
        raise HTTPException(
            status_code=404,
            detail="Destinatario de comunicado no encontrado"
        )

    return destinatario


@router.post(
    "/",
    response_model=ComunicadoDestinatarioResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: ComunicadoDestinatarioCreate,
    db: Session = Depends(get_db)
):
    ok, error = repo.ensure_comunicado(db, data.comunicado_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    if data.servidor_id is not None:
        ok, error = repo.ensure_servidor(db, data.servidor_id)

        if not ok:
            raise HTTPException(status_code=400, detail=error)

    if data.canal_id is not None:
        ok, error = repo.ensure_canal(db, data.canal_id)

        if not ok:
            raise HTTPException(status_code=400, detail=error)

    if data.usuario_id is not None:
        ok, error = repo.ensure_usuario(db, data.usuario_id)

        if not ok:
            raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put(
    "/{destinatario_id}",
    response_model=ComunicadoDestinatarioResponse
)
def actualizar(
    destinatario_id: int,
    data: ComunicadoDestinatarioUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, destinatario_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Destinatario de comunicado no encontrado"
        )

    return updated


@router.delete(
    "/{destinatario_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    destinatario_id: int,
    db: Session = Depends(get_db)
):
    if not repo.delete(db, destinatario_id):
        raise HTTPException(
            status_code=404,
            detail="Destinatario de comunicado no encontrado"
        )

    return None