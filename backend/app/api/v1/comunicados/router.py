from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import ComunicadoCreate, ComunicadoUpdate, ComunicadoResponse

router = APIRouter(prefix="/comunicados", tags=["Comunicados"])


@router.get("/", response_model=list[ComunicadoResponse])
def listar(db: Session = Depends(get_db)):
    return repo.list_comunicados(db)


@router.get("/{comunicado_id}", response_model=ComunicadoResponse)
def obtener(comunicado_id: int, db: Session = Depends(get_db)):
    comunicado = repo.get_by_id(db, comunicado_id)
    if comunicado is None:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    return comunicado


@router.post(
    "/",
    response_model=ComunicadoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(data: ComunicadoCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_usuario(db, data.publicado_por)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    if data.servidor_id is not None:
        ok, error = repo.ensure_servidor(db, data.servidor_id)
        if not ok:
            raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{comunicado_id}", response_model=ComunicadoResponse)
def actualizar(
    comunicado_id: int,
    data: ComunicadoUpdate,
    db: Session = Depends(get_db)
):
    updated = repo.update(db, comunicado_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    return updated


@router.delete("/{comunicado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(comunicado_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, comunicado_id):
        raise HTTPException(status_code=404, detail="Comunicado no encontrado")
    return None