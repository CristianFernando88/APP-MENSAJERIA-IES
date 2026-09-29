from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import MiembroServidorCreate, MiembroServidorUpdate, MiembroServidorResponse

router = APIRouter(prefix="/miembros-servidor", tags=["Miembros del servidor"])


@router.get("/", response_model=list[MiembroServidorResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_miembros(db)


@router.get("/{usuario_id}/{servidor_id}", response_model=MiembroServidorResponse)
def obtener(usuario_id: int, servidor_id: int, db: Session = Depends(get_db)):
    miembro = repo.get_by_id(db, usuario_id, servidor_id)
    if miembro is None:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return miembro


@router.post("/", response_model=MiembroServidorResponse, status_code=status.HTTP_201_CREATED)
def crear(data: MiembroServidorCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_usuario(db, data.usuario_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_servidor(db, data.servidor_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    if repo.get_by_id(db, data.usuario_id, data.servidor_id):
        raise HTTPException(status_code=400, detail="El usuario ya es miembro del servidor")

    return repo.create(db, data)


@router.put("/{usuario_id}/{servidor_id}", response_model=MiembroServidorResponse)
def actualizar(
    usuario_id: int,
    servidor_id: int,
    data: MiembroServidorUpdate,
    db: Session = Depends(get_db),
):
    updated = repo.update(db, usuario_id, servidor_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return updated


@router.delete("/{usuario_id}/{servidor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(usuario_id: int, servidor_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, usuario_id, servidor_id):
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return None