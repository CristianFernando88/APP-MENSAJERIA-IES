# app/api/v1/roles/router.py
# Router HTTP del recurso Rol. Solo request/response; la lógica vive en el repository.

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import RolCreate, RolUpdate, RolResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=list[RolResponse])
def listar(
    query: str | None = Query(default=None, description="Buscar por nombre"),
    tipo: str | None = Query(default=None, description="Filtrar por tipo ('global' o 'servidor')"),
    db: Session = Depends(get_db),
):
    """Lista roles. Filtros opcionales combinables: ?query=&tipo=."""
    resultado = repo.list_roles(db)
    if query:
        resultado = repo.search_by_nombre(db, query)
    if tipo:
        resultado = [r for r in resultado if r.tipo == tipo]
    return resultado


@router.get("/{rol_id}", response_model=RolResponse)
def obtener(rol_id: int, db: Session = Depends(get_db)):
    """Devuelve un rol por su ID."""
    rol = repo.get_by_id(db, rol_id)
    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return rol


@router.post("/", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def crear(data: RolCreate, db: Session = Depends(get_db)):
    """Crea un nuevo rol."""
    ok, error = repo.ensure_unique(db, data.nombre)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return repo.create(db, data)


@router.put("/{rol_id}", response_model=RolResponse)
def actualizar(rol_id: int, data: RolUpdate, db: Session = Depends(get_db)):
    """Actualiza un rol existente."""
    if data.nombre is not None:
        actual = repo.get_by_id(db, rol_id)
        if actual is None:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        ok, error = repo.ensure_unique(db, data.nombre, exclude_id=rol_id)
        if not ok:
            raise HTTPException(status_code=400, detail=error)

    updated = repo.update(db, rol_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return updated


@router.delete("/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(rol_id: int, db: Session = Depends(get_db)):
    """Elimina un rol por su ID."""
    if not repo.delete(db, rol_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return None