from datetime import datetime
from pydantic import BaseModel, Field


class ComunicadoVistoBase(BaseModel):
    comunicado_id: int = Field(ge=1)
    usuario_id: int = Field(ge=1)


class ComunicadoVistoCreate(ComunicadoVistoBase):
    pass


class ComunicadoVistoUpdate(BaseModel):
    fecha_visto: datetime | None = None


class ComunicadoVistoResponse(ComunicadoVistoBase):
    id_comunicado_visto: int
    fecha_visto: datetime

    class Config:
        from_attributes = True