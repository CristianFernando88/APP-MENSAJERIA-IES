from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import (
    RelacionUsuarioCreate,
    RelacionUsuarioUpdate,
    RelacionUsuarioResponse,
)

router = APIRouter(
    prefix="/relaciones-usuario",
    tags=["Relaciones de Usuario"]
)


@router.get("/", response_model=list[RelacionUsuarioResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_relaciones(db)


@router.get(
    "/{relacion_id}",
    response_model=RelacionUsuarioResponse
)
def obtener(
    relacion_id: int,
    db: Session = Depends(get_db)
):
    relacion = repo.get_by_id(db, relacion_id)

    if relacion is None:
        raise HTTPException(
            status_code=404,
            detail="Relación de usuario no encontrada"
        )

    return relacion


@router.post(
    "/",
    response_model=RelacionUsuarioResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: RelacionUsuarioCreate,
    db: Session = Depends(get_db)
):
    ok, error = repo.ensure_usuario(db, data.usuario_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_usuario(db, data.relacionado_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put(
    "/{relacion_id}",
    response_model=RelacionUsuarioResponse
)
def actualizar(
    relacion_id: int,
    data: RelacionUsuarioUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, relacion_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Relación de usuario no encontrada"
        )

    return updated


@router.delete(
    "/{relacion_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    relacion_id: int,
    db: Session = Depends(get_db)
):
    if not repo.delete(db, relacion_id):
        raise HTTPException(
            status_code=404,
            detail="Relación de usuario no encontrada"
        )

    return None