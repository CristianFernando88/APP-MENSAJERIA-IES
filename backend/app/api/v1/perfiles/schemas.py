
from pydantic import BaseModel, Field


class PerfilBase(BaseModel):
    nombres: str | None = Field(default=None, max_length=100)
    apellidos: str | None = Field(default=None, max_length=100)
    foto_perfil: str | None = Field(default=None, max_length=255)
    biografia: str | None = None
    dni: str | None = Field(default=None, max_length=8)


class PerfilCreate(PerfilBase):
    usuario_id: int


class PerfilUpdate(BaseModel):
    nombres: str | None = Field(default=None, max_length=100)
    apellidos: str | None = Field(default=None, max_length=100)
    foto_perfil: str | None = Field(default=None, max_length=255)
    biografia: str | None = None
    dni: str | None = Field(default=None, max_length=8)


class PerfilResponse(PerfilBase):
    id_perfil: int
    usuario_id: int

    class Config:
        from_attributes = True
