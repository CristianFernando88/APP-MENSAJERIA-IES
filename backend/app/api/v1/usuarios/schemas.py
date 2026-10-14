# app/api/v1/usuarios/schemas.py
# Schemas Pydantic (DTOs) del recurso Usuario.

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class UsuarioBase(BaseModel):
    """Campos comunes: nombre de usuario y email."""
    nombre_usuario: str = Field(
        min_length=3,
        max_length=100,
        examples=["juanperez"],
        description="Nombre único de usuario",
    )
    email: EmailStr = Field(
        examples=["juan@email.com"],
        description="Email único del usuario",
    )
    activo: bool = Field(default=True, description="Si la cuenta está activa")


class UsuarioCreate(UsuarioBase):
    """Body para CREAR un usuario."""
    password: str = Field(
        min_length=8,
        max_length=50,
        description="Contraseña del usuario en texto plano",
    )


class UsuarioUpdate(BaseModel):
    """Body para ACTUALIZAR (todos los campos opcionales)."""
    nombre_usuario: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None
    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=50,
        description="Nueva contraseña del usuario en texto plano",
    )
    activo: bool | None = None
class UsuarioResponse(UsuarioBase):
    """Respuesta: incluye ID y fecha de registro."""
    id_usuario: int
    fecha_registro: datetime

    class Config:
        from_attributes = True  # Para leer desde SQLAlchemy