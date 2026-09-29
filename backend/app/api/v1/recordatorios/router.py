from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import RecordatorioCreate, RecordatorioUpdate, RecordatorioResponse

router = APIRouter(prefix="/recordatorios", tags=["Recordatorios"])


@router.get("/", response_model=list[RecordatorioResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_recordatorios(db)


@router.get("/{recordatorio_id}", response_model=RecordatorioResponse)
def obtener(recordatorio_id: int, db: Session = Depends(get_db)):
    recordatorio = repo.get_by_id(db, recordatorio_id)

    if recordatorio is None:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")

    return recordatorio


@router.post("/", response_model=RecordatorioResponse, status_code=status.HTTP_201_CREATED)
def crear(data: RecordatorioCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_usuario(db, data.usuario_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{recordatorio_id}", response_model=RecordatorioResponse)
def actualizar(
    recordatorio_id: int,
    data: RecordatorioUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, recordatorio_id, data)

    if updated is None:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")

    return updated


@router.delete("/{recordatorio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(recordatorio_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, recordatorio_id):
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")

    return None