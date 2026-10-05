from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class MiembroCanalBase(BaseModel):
    usuario_id: int = Field(ge=1)
    canal_id: int = Field(ge=1)
    rol_en_canal: Literal["admin", "miembro", "tutor"] = "miembro"


class MiembroCanalCreate(MiembroCanalBase):
    pass


class MiembroCanalUpdate(BaseModel):
    rol_en_canal: Literal["admin", "miembro", "tutor"] | None = None


class MiembroCanalResponse(MiembroCanalBase):
    id_miembro_canal: int
    fecha_union: datetime

    class Config:
        from_attributes = True