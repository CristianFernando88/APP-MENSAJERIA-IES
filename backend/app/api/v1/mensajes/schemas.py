from datetime import datetime
from pydantic import BaseModel, Field


class MensajeBase(BaseModel):
    contenido: str = Field(min_length=1)


class MensajeCreate(MensajeBase):
    usuario_id: int = Field(ge=1)
    canal_id: int = Field(ge=1)


class MensajeUpdate(BaseModel):
    contenido: str = Field(min_length=1)


class MensajeResponse(MensajeBase):
    id_mensaje: int
    fecha_envio: datetime
    editado: bool
    usuario_id: int
    canal_id: int

    class Config:
        from_attributes = True