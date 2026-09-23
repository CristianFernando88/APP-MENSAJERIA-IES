from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get("/", response_model=list[CategoriaResponse])
def listar(
    query: str | None = Query(default=None, description="Buscar por nombre de categoría"),
    db: Session = Depends(get_db),
):
    resultado = repo.list_categorias(db)

    if query:
        resultado = repo.search_by_nombre(db, query)

    return resultado


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obtener(categoria_id: int, db: Session = Depends(get_db)):
    categoria = repo.get_by_id(db, categoria_id)

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return categoria


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def crear(data: CategoriaCreate, db: Session = Depends(get_db)):
    ok, error = repo.ensure_servidor(db, data.servidor_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_padre(db, data.servidor_id, data.padre_id)

    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)


@router.put("/{categoria_id}", response_model=CategoriaResponse)
def actualizar(
    categoria_id: int,
    data: CategoriaUpdate,
    db: Session = Depends(get_db),
):
    categoria = repo.get_by_id(db, categoria_id)

    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if data.padre_id is not None:
        ok, error = repo.ensure_padre(
            db,
            categoria.servidor_id,
            data.padre_id,
            categoria_id,
        )

        if not ok:
            raise HTTPException(status_code=400, detail=error)

    updated = repo.update(db, categoria_id, data)

    if updated is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return updated


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(categoria_id: int, db: Session = Depends(get_db)):
    if not repo.delete(db, categoria_id):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return None