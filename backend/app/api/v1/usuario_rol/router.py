# app/api/v1/usuario_rol/router.py
# Router HTTP del recurso UsuarioRol. Solo request/response; la lógica vive en el repository.

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from . import repository as repo
from .schemas import UsuarioRolCreate, UsuarioRolUpdate, UsuarioRolResponse

router = APIRouter(prefix="/usuario-rol", tags=["Usuario-Rol"])


@router.get("/", response_model=list[UsuarioRolResponse])
def listar(
    usuario_id: int | None = Query(default=None, ge=1, description="Filtrar por usuario"),
    servidor_id: int | None = Query(default=None, ge=1, description="Filtrar por servidor"),
    db: Session = Depends(get_db),
):
    """Lista asignaciones. Filtros opcionales: ?usuario_id=&servidor_id=."""
    if usuario_id is not None:
        return repo.get_by_usuario(db, usuario_id, servidor_id)
    if servidor_id is not None:
        return repo.get_by_servidor(db, servidor_id)
    return repo.list_usuario_roles(db)


@router.get("/{usuario_rol_id}", response_model=UsuarioRolResponse)
def obtener(usuario_rol_id: int, db: Session = Depends(get_db)):
    """Devuelve una asignación por su ID."""
    asignacion = repo.get_by_id(db, usuario_rol_id)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.post("/", response_model=UsuarioRolResponse, status_code=status.HTTP_201_CREATED)
def crear(data: UsuarioRolCreate, db: Session = Depends(get_db)):
    """Asigna un rol a un usuario."""
    ok, error = repo.ensure_referencias(
        db,
        usuario_id=data.usuario_id,
        rol_id=data.rol_id,
        servidor_id=data.servidor_id,
        asignado_por=data.asignado_por,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return repo.create(db, data)


@router.put("/{usuario_rol_id}", response_model=UsuarioRolResponse)
def actualizar(usuario_rol_id: int, data: UsuarioRolUpdate, db: Session = Depends(get_db)):
    """Actualiza una asignación existente."""
    actual = repo.get_by_id(db, usuario_rol_id)
    if actual is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    # Si cambia rol o servidor, revalidar
    if data.rol_id is not None or data.servidor_id is not None:
        nuevo_rol_id = data.rol_id if data.rol_id is not None else actual.rol_id
        nuevo_servidor_id = data.servidor_id if data.servidor_id is not None else actual.servidor_id

        ok, error = repo.ensure_referencias(
            db,
            usuario_id=actual.usuario_id,
            rol_id=nuevo_rol_id,
            servidor_id=nuevo_servidor_id,
            asignado_por=actual.asignado_por,
        )
        # Ignorar el error de duplicado si es la misma asignación
        if not ok and "ya tiene ese rol" not in error:
            raise HTTPException(status_code=400, detail=error)

    updated = repo.update(db, usuario_rol_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return updated


@router.delete("/{usuario_rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(usuario_rol_id: int, db: Session = Depends(get_db)):
    """Elimina una asignación por su ID."""
    if not repo.delete(db, usuario_rol_id):
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return None


@router.delete("/usuario/{usuario_id}/rol/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_por_usuario_rol(
    usuario_id: int,
    rol_id: int,
    servidor_id: int | None = Query(default=None, description="ID del servidor (opcional)"),
    db: Session = Depends(get_db),
):
    """Elimina una asignación específica (usuario + rol + servidor)."""
    if not repo.delete_by_usuario_rol_servidor(db, usuario_id, rol_id, servidor_id):
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return None