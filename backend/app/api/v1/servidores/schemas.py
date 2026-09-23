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
    creador_id: int

    class Config:
        from_attributes = True