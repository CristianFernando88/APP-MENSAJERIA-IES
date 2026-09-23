from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import CanalCreate, CanalUpdate, CanalResponse

router = APIRouter(prefix="/canales", tags=["Canales"])


@router.get("/", response_model=list[CanalResponse])
def listar(
    query: str | None = Query(default=None, description="Buscar por nombre de canal"),
    db: Session = Depends(get_db),
):
    resultado = repo.list_canales(db)

    if query:
        resultado = repo.search_by_nombre(db, query)

    return resultado


@router.get("/{canal_id}", response_model=CanalResponse)
def obtener(canal_id: int, db: Session = Depends(get_db)):
    canal = repo.get_by_id(db, canal_id)

    if canal is None:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    return canal


@router.post("/", response_model=CanalResponse, status_code=status.HTTP_201_CREATED)
def crear(data: CanalCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_servidor(db, data.servidor_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_creador(db, data.creador_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_categoria(
        db,
        data.servidor_id,
        data.categoria_id,
    )

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{canal_id}", response_model=CanalResponse)
def actualizar(
    canal_id: int,
    data: CanalUpdate,
    db: Session = Depends(get_db),
):
    canal = repo.get_by_id(db, canal_id)

    if canal is None:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    if data.categoria_id is not None:
        ok, error = repo.ensure_categoria(
            db,
            canal.servidor_id,
            data.categoria_id,
        )

        if not ok:
            raise HTTPException(status_code=400, detail=error)

    updated = repo.update(db, canal_id, data)

    if updated is None:
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    return updated


@router.delete("/{canal_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(canal_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, canal_id):
        raise HTTPException(status_code=404, detail="Canal no encontrado")

    return None