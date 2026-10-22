from fastapi import UploadFile, File
from cloudinary.uploader import upload

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


@router.post("/usuario/{usuario_id}/foto", response_model=PerfilResponse)
def subir_foto_perfil(
    usuario_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    perfil = repo.get_by_usuario(db, usuario_id)

    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado"
        )

    if archivo.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Usá JPG, PNG o WEBP"
        )

    try:
        resultado = upload(
            archivo.file,
            folder="fotos_perfil",
            resource_type="image"
        )

        perfil.foto_perfil = resultado["secure_url"]
        db.commit()
        db.refresh(perfil)

        return perfil

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="No se pudo subir la foto de perfil"
        ) from error

    finally:
        archivo.file.close()

