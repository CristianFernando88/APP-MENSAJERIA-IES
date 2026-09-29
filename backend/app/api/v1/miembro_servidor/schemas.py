from datetime import datetime
from pydantic import BaseModel, Field


class MiembroServidorBase(BaseModel):
    usuario_id: int = Field(ge=1)
    servidor_id: int = Field(ge=1)
    activo: bool = True


class MiembroServidorCreate(MiembroServidorBase):
    pass


class MiembroServidorUpdate(BaseModel):
    activo: bool | None = None


class MiembroServidorResponse(MiembroServidorBase):
    fecha_union: datetime

    class Config:
        from_attributes = True