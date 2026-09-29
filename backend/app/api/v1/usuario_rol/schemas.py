# app/api/v1/usuario_rol/schemas.py
# Schemas Pydantic (DTOs) del recurso UsuarioRol.

from pydantic import BaseModel, Field
from datetime import datetime


class UsuarioRolBase(BaseModel):
    """Campos comunes: usuario, rol y servidor (opcional)."""
    usuario_id: int = Field(ge=1, examples=[1], description="ID del usuario")
    rol_id: int = Field(ge=1, examples=[5], description="ID del rol")
    servidor_id: int | None = Field(
        default=None,
        ge=1,
        examples=[1],
        description="ID del servidor (NULL si es rol global)",
    )


class UsuarioRolCreate(UsuarioRolBase):
    """Body para CREAR una asignación de rol."""
    asignado_por: int | None = Field(
        default=None,
        ge=1,
        description="ID del usuario que asigna el rol (opcional)",
    )


class UsuarioRolUpdate(BaseModel):
    """Body para ACTUALIZAR (todos los campos opcionales)."""
    rol_id: int | None = Field(default=None, ge=1)
    servidor_id: int | None = None
    asignado_por: int | None = None


class UsuarioRolResponse(UsuarioRolBase):
    """Respuesta: incluye ID y fecha de asignación."""
    id_usuario_rol: int
    fecha_asignacion: datetime
    asignado_por: int | None = None

    class Config:
        from_attributes = True