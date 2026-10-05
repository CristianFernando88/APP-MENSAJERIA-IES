from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import (
    MensajeDirectoCreate,
    MensajeDirectoUpdate,
    MensajeDirectoResponse,
)

router = APIRouter(
    prefix="/mensajes-directos",
    tags=["Mensajes Directos"]
)


@router.get("/", response_model=list[MensajeDirectoResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_mensajes_directos(db)


@router.get("/{mensaje_directo_id}", response_model=MensajeDirectoResponse)
def obtener(
    mensaje_directo_id: int,
    db: Session = Depends(get_db)
):
    mensaje = repo.get_by_id(db, mensaje_directo_id)

    if mensaje is None:
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return mensaje


@router.post(
    "/",
    response_model=MensajeDirectoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: MensajeDirectoCreate,
    db: Session = Depends(get_db)
):
    ok, error = repo.ensure_usuario(db, data.emisor_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_usuario(db, data.receptor_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put(
    "/{mensaje_directo_id}",
    response_model=MensajeDirectoResponse
)
def actualizar(
    mensaje_directo_id: int,
    data: MensajeDirectoUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, mensaje_directo_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return updated


@router.delete(
    "/{mensaje_directo_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    mensaje_directo_id: int,
    db: Session = Depends(get_db)
):
    if not repo.delete(db, mensaje_directo_id):
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return None