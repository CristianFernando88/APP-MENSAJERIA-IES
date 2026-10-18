from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from app.api.v1.perfiles.schemas import PerfilResponse


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
    id_usuario: int
    fecha_registro: datetime
    perfil: PerfilResponse | None = None

    class Config:
        from_attributes = True