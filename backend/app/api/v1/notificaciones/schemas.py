from datetime import datetime
from pydantic import BaseModel, Field


class NotificacionBase(BaseModel):
    mensaje: str = Field(min_length=1)
    tipo: str = Field(min_length=1, max_length=50)
    enlace: str | None = Field(default=None, max_length=255)


class NotificacionCreate(NotificacionBase):
    usuario_id: int = Field(ge=1)


class NotificacionUpdate(BaseModel):
    mensaje: str | None = Field(default=None, min_length=1)
    leida: bool | None = None
    tipo: str | None = Field(default=None, min_length=1, max_length=50)
    enlace: str | None = Field(default=None, max_length=255)


class NotificacionResponse(NotificacionBase):
    id_notificacion: int
    usuario_id: int
    leida: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True