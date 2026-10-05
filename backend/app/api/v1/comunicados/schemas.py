from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class ComunicadoBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    contenido: str = Field(min_length=1)
    tipo: Literal["global", "servidor", "canal", "usuario"] = "global"


class ComunicadoCreate(ComunicadoBase):
    publicado_por: int = Field(ge=1)


class ComunicadoUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    contenido: str | None = Field(default=None, min_length=1)
    tipo: Literal["global", "servidor", "canal", "usuario"] | None = None


class ComunicadoResponse(ComunicadoBase):
    id_comunicado: int
    fecha_publicacion: datetime
    publicado_por: int

    class Config:
        from_attributes = True