from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import ServidorCreate, ServidorUpdate, ServidorResponse

router = APIRouter(prefix="/servidores", tags=["Servidores"])


@router.get("/", response_model=list[ServidorResponse])
def listar(
    query: str | None = Query(default=None, description="Buscar por nombre del servidor"),
    db: Session = Depends(get_db),
):
    resultado = repo.list_servidores(db)

    if query:
        resultado = repo.search_by_nombre(db, query)

    return resultado


@router.get("/{servidor_id}", response_model=ServidorResponse)
def obtener(servidor_id: int, db: Session = Depends(get_db)):
    servidor = repo.get_by_id(db, servidor_id)

    if servidor is None:
        raise HTTPException(status_code=404, detail="Servidor no encontrado")

    return servidor


@router.post("/", response_model=ServidorResponse, status_code=status.HTTP_201_CREATED)
def crear(data: ServidorCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_creador(db, data.creador_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{servidor_id}", response_model=ServidorResponse)
def actualizar(
    servidor_id: int,
    data: ServidorUpdate,
    db: Session = Depends(get_db),
):
    updated = repo.update(db, servidor_id, data)

    if updated is None:
        raise HTTPException(status_code=404, detail="Servidor no encontrado")

    return updated


@router.delete("/{servidor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(servidor_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, servidor_id):
        raise HTTPException(status_code=404, detail="Servidor no encontrado")

    return None