"""deps.py — Dependencias: ¿quién está logueado? ¿tiene el rol correcto?"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.usuario import Usuario
from app.core.security import decodificar_token

# El token viene en el header: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ============================================
# AUTENTICACIÓN: ¿QUIÉN ES?
# ============================================
def get_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Lee el token, lo valida y devuelve el usuario de la base."""
    error_401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o vencido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decodificar_token(token)
        usuario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error_401

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.activo:
        raise error_401
    return usuario


# ============================================
# AUTORIZACIÓN: ¿TIENE EL ROL?
# ============================================
def requiere_rol(*roles_permitidos: str):
    """Fábrica de dependencias: Depends(requiere_rol('admin', 'docente'))"""

    def verificador(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        # Obtener los roles del usuario (a través de usuario_rol)
        roles_usuario = [ur.rol.nombre for ur in usuario.roles]

        # Verificar si ALGUNO de sus roles está en la lista permitida
        if not any(rol in roles_permitidos for rol in roles_usuario):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: se requiere rol {' o '.join(roles_permitidos)}",
            )
        return usuario

    return verificador