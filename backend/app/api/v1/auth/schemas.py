# app/api/v1/auth/schemas.py
# Schemas Pydantic para autenticación.

from pydantic import BaseModel, EmailStr
from app.api.v1.roles.schemas import RolResponse


# ============================================
# DATOS DEL USUARIO LOGUEADO
# ============================================
class UsuarioMeOut(BaseModel):
    """Datos del usuario logueado (incluye sus roles)."""
    id_usuario: int
    nombre_usuario: str
    email: EmailStr
    activo: bool
    roles: list[RolResponse] = []

    class Config:
        from_attributes = True


# ============================================
# RESPUESTA DEL LOGIN
# ============================================
class Token(BaseModel):
    """Respuesta del login: token + datos del usuario."""
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioMeOut


# Resolver la referencia circular (por si acaso)
Token.model_rebuild()