from datetime import datetime
from pydantic import BaseModel, Field


class RelacionUsuarioBase(BaseModel):
    usuario_id: int = Field(ge=1)
    relacionado_id: int = Field(ge=1)
    tipo: str = Field(min_length=1, max_length=50)


class RelacionUsuarioCreate(RelacionUsuarioBase):
    pass


class RelacionUsuarioUpdate(BaseModel):
    relacionado_id: int | None = Field(default=None, ge=1)
    tipo: str | None = Field(default=None, min_length=1, max_length=50)


class RelacionUsuarioResponse(RelacionUsuarioBase):
    id_relacion: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True