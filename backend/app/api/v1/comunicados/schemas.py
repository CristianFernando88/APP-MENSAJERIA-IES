from datetime import datetime
from pydantic import BaseModel, Field


class ComunicadoBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    servidor_id: int | None = Field(default=None, ge=1)


class ComunicadoCreate(ComunicadoBase):
    publicado_por: int = Field(ge=1)


class ComunicadoUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    contenido: str | None = Field(default=None, min_length=1)
    servidor_id: int | None = Field(default=None, ge=1)


class ComunicadoResponse(ComunicadoBase):
    id_comunicado: int
    fecha_publicacion: datetime
    publicado_por: int

    class Config:
        from_attributes = True