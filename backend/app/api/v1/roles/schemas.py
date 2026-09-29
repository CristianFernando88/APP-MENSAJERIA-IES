# app/api/v1/roles/schemas.py
# Schemas Pydantic (DTOs) del recurso Rol.

from pydantic import BaseModel, Field


class RolBase(BaseModel):
    """Campos comunes: nombre, descripción y tipo."""
    nombre: str = Field(
        min_length=2,
        max_length=50,
        examples=["profesor"],
        description="Nombre único del rol",
    )
    descripcion: str | None = Field(
        default=None,
        examples=["Profesor del colegio"],
        description="Descripción del rol",
    )
    tipo: str = Field(
        examples=["global", "servidor"],
        description="Tipo de rol: 'global' o 'servidor'",
    )


class RolCreate(RolBase):
    """Body para CREAR un rol."""
    pass


class RolUpdate(BaseModel):
    """Body para ACTUALIZAR (todos los campos opcionales)."""
    nombre: str | None = Field(default=None, min_length=2, max_length=50)
    descripcion: str | None = None
    tipo: str | None = None


class RolResponse(RolBase):
    """Respuesta: incluye ID."""
    id_rol: int

    class Config:
        from_attributes = True