from datetime import datetime
from pydantic import BaseModel, Field


class MensajeVistoBase(BaseModel):
    mensaje_id: int = Field(ge=1)
    usuario_id: int = Field(ge=1)


class MensajeVistoCreate(MensajeVistoBase):
    pass


class MensajeVistoUpdate(BaseModel):
    fecha_visto: datetime | None = None


class MensajeVistoResponse(MensajeVistoBase):
    id_mensaje_visto: int
    fecha_visto: datetime

    class Config:
        from_attributes = True