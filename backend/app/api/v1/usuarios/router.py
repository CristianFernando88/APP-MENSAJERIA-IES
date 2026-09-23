# app/api/v1/usuarios/router.py
# Router HTTP del recurso Usuario. Solo request/response; la lógica vive en el repository.

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import UsuarioCreate, UsuarioUpdate, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=list[UsuarioResponse])
def listar(
    query: str | None = Query(default=None, description="Buscar por nombre de usuario"),
    activo: bool | None = Query(default=None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
):
    """Lista usuarios. Filtros opcionales combinables: ?query=&activo=."""
    resultado = repo.list_usuarios(db)
    if query:
        resultado = repo.search_by_nombre(db, query)
    if activo is not None:
        resultado = [u for u in resultado if u.activo == activo]
    return resultado


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener(usuario_id: int, db: Session = Depends(get_db)):
    """Devuelve un usuario por su ID."""
    usuario = repo.get_by_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear(data: UsuarioCreate, db: Session = Depends(get_db)):
    """Crea un nuevo usuario."""
    ok, error = repo.ensure_unique(db, data.email, data.nombre_usuario)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return repo.create(db, data)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db)):
    """Actualiza un usuario existente."""
    # Si cambia email o nombre, validamos que sean únicos
    if data.email is not None or data.nombre_usuario is not None:
        actual = repo.get_by_id(db, usuario_id)
        if actual is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        email = data.email if data.email is not None else actual.email
        nombre = data.nombre_usuario if data.nombre_usuario is not None else actual.nombre_usuario

        ok, error = repo.ensure_unique(db, email, nombre, exclude_id=usuario_id)
        if not ok:
            raise HTTPException(status_code=400, detail=error)

    updated = repo.update(db, usuario_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(usuario_id: int, db: Session = Depends(get_db)):
    """Elimina un usuario por su ID."""
    if not repo.delete(db, usuario_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return None