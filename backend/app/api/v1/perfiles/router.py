
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.usuario import Usuario
from . import repository as repo
from .schemas import PerfilCreate, PerfilUpdate, PerfilResponse

router = APIRouter(prefix="/perfiles", tags=["Perfiles"])


@router.post("/", response_model=PerfilResponse, status_code=status.HTTP_201_CREATED)
def crear(data: PerfilCreate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == data.usuario_id
    ).first()

    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if repo.get_by_usuario(db, data.usuario_id):
        raise HTTPException(
            status_code=400,
            detail="El usuario ya tiene un perfil"
        )

    return repo.create(db, data)


@router.get("/usuario/{usuario_id}", response_model=PerfilResponse)
def obtener_por_usuario(usuario_id: int, db: Session = Depends(get_db)):
    perfil = repo.get_by_usuario(db, usuario_id)

    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return perfil


@router.put("/usuario/{usuario_id}", response_model=PerfilResponse)
def actualizar(
    usuario_id: int,
    data: PerfilUpdate,
    db: Session = Depends(get_db)
):
    perfil = repo.update(db, usuario_id, data)

    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return perfil
