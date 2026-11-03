from datetime import datetime
from pydantic import BaseModel, Field

class ServidorBase(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    descripcion: str | None = None


class ServidorCreate(ServidorBase):
    creador_id: int = Field(ge=1)


class ServidorUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=100)
    descripcion: str | None = None


class ServidorResponse(ServidorBase):
    id_servidor: int
    fecha_creacion: datetime
    creador_id: int | None = None

    class Config:
        from_attributes = True


class CanalAcceso(BaseModel):
    """Canal al que el usuario tiene acceso (directo o vía sus hijos)."""
    id_canal: int
    servidor_id: int
    nombre: str
    descripcion: str | None = None
    tipo: str
    categoria_id: int | None = None
    orden: int | None = None

    class Config:
        from_attributes = True


class MisServidoresResponse(BaseModel):
    """Todo lo que el usuario logueado puede ver: sus servidores y canales.
    Si es tutor, incluye los accesos heredados de sus hijos."""
    es_tutor: bool
    hijos: list[int]
    servidores: list[ServidorResponse]
    canales: list[CanalAcceso]