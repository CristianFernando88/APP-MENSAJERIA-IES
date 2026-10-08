# app/api/v1/auth/router.py
# Router HTTP de autenticación. Solo request/response; la lógica vive en el repository.

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_usuario_actual
from app.core.security import verificar_password, crear_token
from app.models.usuario import Usuario
from . import repository as repo
from .schemas import Token, UsuarioMeOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])


# ============================================
# HELPER: Convertir Usuario a UsuarioMeOut
# ============================================
def _usuario_a_me_out(usuario: Usuario) -> dict:
    """Convierte un Usuario a un dict con sus roles (Rol, no UsuarioRol)."""
    return {
        "id_usuario": usuario.id_usuario,
        "nombre_usuario": usuario.nombre_usuario,
        "email": usuario.email,
        "activo": usuario.activo,
        "roles": [ur.rol for ur in usuario.roles],  # ← Extraer solo el Rol
    }


# ============================================
# LOGIN
# ============================================
@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Email o nombre de usuario (campo username) + contraseña → token JWT."""
    # 1. Buscar usuario por email O nombre de usuario
    usuario = repo.get_by_email_or_nombre(db, form.username)

    # 2. Mismo mensaje si falla el identificador o la clave
    if usuario is None or not usuario.contrasena_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/nombre o contraseña incorrectos",
        )
    if not verificar_password(form.password, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/nombre o contraseña incorrectos",
        )

    # 3. Usuario desactivado → 403
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    # 4. Crear token con el id del usuario
    token = crear_token(usuario.id_usuario)

    # 5. Devolver token + usuario
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": _usuario_a_me_out(usuario),
    }


# ============================================
# ME (quién soy)
# ============================================
@router.get("/me", response_model=UsuarioMeOut)
def quien_soy(usuario: Usuario = Depends(get_usuario_actual)):
    """Devuelve el dueño del token (para recargar la sesión)."""
    return _usuario_a_me_out(usuario)