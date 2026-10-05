from datetime import datetime
from pydantic import BaseModel, Field


class MensajeDirectoBase(BaseModel):
    contenido: str = Field(min_length=1)
    emisor_id: int = Field(ge=1)
    receptor_id: int = Field(ge=1)


class MensajeDirectoCreate(MensajeDirectoBase):
    pass


class MensajeDirectoUpdate(BaseModel):
    contenido: str | None = Field(default=None, min_length=1)
    leido: bool | None = None


class MensajeDirectoResponse(MensajeDirectoBase):
    id_mensaje_directo: int
    fecha_envio: datetime
    leido: bool
    fecha_leido: datetime | None = None

    class Config:
        from_attributes = True