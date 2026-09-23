from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import MensajeCreate, MensajeUpdate, MensajeResponse

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])


@router.get("/", response_model=list[MensajeResponse])
def listar(
    canal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    resultado = repo.list_mensajes(db)

    if canal_id is not None:
        resultado = [m for m in resultado if m.canal_id == canal_id]

    return resultado


@router.get("/{mensaje_id}", response_model=MensajeResponse)
def obtener(mensaje_id: int, db: Session = Depends(get_db)):
    mensaje = repo.get_by_id(db, mensaje_id)

    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    return mensaje


@router.post("/", response_model=MensajeResponse, status_code=status.HTTP_201_CREATED)
def crear(data: MensajeCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_usuario(db, data.usuario_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_canal(db, data.canal_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{mensaje_id}", response_model=MensajeResponse)
def actualizar(
    mensaje_id: int,
    data: MensajeUpdate,
    usuario_id: int = Query(..., description="ID del usuario que modifica el mensaje"),
    db: Session = Depends(get_db),
):
    mensaje = repo.get_by_id(db, mensaje_id)

    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    if mensaje.usuario_id != usuario_id:
        raise HTTPException(
            status_code=403,
            detail="Solo el autor puede editar el mensaje",
        )

    return repo.update(db, mensaje_id, data)


@router.delete("/{mensaje_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    mensaje_id: int,
    usuario_id: int = Query(..., description="ID del usuario que elimina el mensaje"),
    db: Session = Depends(get_db),
):
    mensaje = repo.get_by_id(db, mensaje_id)

    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    if mensaje.usuario_id != usuario_id:
        raise HTTPException(
            status_code=403,
            detail="Solo el autor puede eliminar el mensaje",
        )

    repo.delete(db, mensaje_id)
    return None