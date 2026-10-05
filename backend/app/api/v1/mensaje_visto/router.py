from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import (
    MensajeVistoCreate,
    MensajeVistoUpdate,
    MensajeVistoResponse,
)

router = APIRouter(
    prefix="/mensajes-vistos",
    tags=["Mensajes Vistos"]
)


@router.get("/", response_model=list[MensajeVistoResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_vistos(db)


@router.get(
    "/{visto_id}",
    response_model=MensajeVistoResponse
)
def obtener(
    visto_id: int,
    db: Session = Depends(get_db)
):
    visto = repo.get_by_id(db, visto_id)

    if visto is None:
        raise HTTPException(
            status_code=404,
            detail="Registro de mensaje visto no encontrado"
        )

    return visto


@router.post(
    "/",
    response_model=MensajeVistoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: MensajeVistoCreate,
    db: Session = Depends(get_db)
):
    ok, error = repo.ensure_mensaje(db, data.mensaje_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_usuario(db, data.usuario_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put(
    "/{visto_id}",
    response_model=MensajeVistoResponse
)
def actualizar(
    visto_id: int,
    data: MensajeVistoUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, visto_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Registro de mensaje visto no encontrado"
        )

    return updated


@router.delete(
    "/{visto_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    visto_id: int,
    db: Session = Depends(get_db)
):
    if not repo.delete(db, visto_id):
        raise HTTPException(
            status_code=404,
            detail="Registro de mensaje visto no encontrado"
        )

    return None