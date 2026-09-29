from datetime import datetime
from pydantic import BaseModel, Field


class RecordatorioBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    fecha_limite: datetime | None = None


class RecordatorioCreate(RecordatorioBase):
    usuario_id: int = Field(ge=1)


class RecordatorioUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    fecha_limite: datetime | None = None
    completado: bool | None = None


class RecordatorioResponse(RecordatorioBase):
    id_recordatorio: int
    fecha_creacion: datetime
    completado: bool
    usuario_id: int

    class Config:
        from_attributes = True