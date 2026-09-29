from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import NotificacionCreate, NotificacionUpdate, NotificacionResponse

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/", response_model=list[NotificacionResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_notificaciones(db)


@router.get("/{notificacion_id}", response_model=NotificacionResponse)
def obtener(notificacion_id: int, db: Session = Depends(get_db)):
    notificacion = repo.get_by_id(db, notificacion_id)
    if notificacion is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return notificacion


@router.post("/", response_model=NotificacionResponse, status_code=status.HTTP_201_CREATED)
def crear(data: NotificacionCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_usuario(db, data.usuario_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{notificacion_id}", response_model=NotificacionResponse)
def actualizar(
    notificacion_id: int,
    data: NotificacionUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, notificacion_id, data)

    if updated is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    return updated


@router.delete("/{notificacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(notificacion_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, notificacion_id):
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    return None