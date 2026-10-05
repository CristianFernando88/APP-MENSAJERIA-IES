from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import (
    MiembroCanalCreate,
    MiembroCanalUpdate,
    MiembroCanalResponse,
)

router = APIRouter(
    prefix="/miembros-canal",
    tags=["Miembros de Canal"]
)


@router.get("/", response_model=list[MiembroCanalResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_miembros_canal(db)


@router.get("/{miembro_canal_id}", response_model=MiembroCanalResponse)
def obtener(
    miembro_canal_id: int,
    db: Session = Depends(get_db)
):
    miembro = repo.get_by_id(db, miembro_canal_id)

    if miembro is None:
        raise HTTPException(
            status_code=404,
            detail="Miembro de canal no encontrado"
        )

    return miembro


@router.post(
    "/",
    response_model=MiembroCanalResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: MiembroCanalCreate,
    db: Session = Depends(get_db)
):
    ok, error = repo.ensure_usuario(db, data.usuario_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_canal(db, data.canal_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put(
    "/{miembro_canal_id}",
    response_model=MiembroCanalResponse
)
def actualizar(
    miembro_canal_id: int,
    data: MiembroCanalUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, miembro_canal_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Miembro de canal no encontrado"
        )

    return updated


@router.delete(
    "/{miembro_canal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    miembro_canal_id: int,
    db: Session = Depends(get_db)
):
    if not repo.delete(db, miembro_canal_id):
        raise HTTPException(
            status_code=404,
            detail="Miembro de canal no encontrado"
        )

    return None