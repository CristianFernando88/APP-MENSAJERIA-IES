from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.email import enviar_sugerencia
from . import repository as repo
from .schemas import SugerenciaCreate, SugerenciaResponse

router = APIRouter(prefix="/sugerencias", tags=["Sugerencias"])


@router.post(
    "/",
    response_model=SugerenciaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear(
    data: SugerenciaCreate,
    background_tasks: BackgroundTasks,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    sugerencia = repo.create(db, data, usuario)

    background_tasks.add_task(
        enviar_sugerencia,
        nombres=sugerencia.nombres,
        apellidos=sugerencia.apellidos,
        email_usuario=sugerencia.email,
        mensaje=sugerencia.mensaje,
    )

    return sugerencia


@router.get(
    "/",
    response_model=list[SugerenciaResponse],
    dependencies=[Depends(requiere_rol("admin", "super_admin"))],
)
def listar(db: Session = Depends(get_db)):
    return repo.list_all(db)


@router.patch(
    "/{sugerencia_id}/leida",
    response_model=SugerenciaResponse,
    dependencies=[Depends(requiere_rol("admin", "super_admin"))],
)
def marcar_leida(sugerencia_id: int, db: Session = Depends(get_db)):
    sugerencia = repo.marcar_leida(db, sugerencia_id)
    if sugerencia is None:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada")
    return sugerencia
