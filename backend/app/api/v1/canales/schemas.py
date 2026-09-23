from pydantic import BaseModel, Field


class CanalBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = None
    orden: int = Field(default=0, ge=0)


class CanalCreate(CanalBase):
    servidor_id: int = Field(ge=1)
    creador_id: int = Field(ge=1)
    categoria_id: int | None = Field(default=None, ge=1)


class CanalUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = None
    categoria_id: int | None = Field(default=None, ge=1)
    orden: int | None = Field(default=None, ge=0)


class CanalResponse(CanalBase):
    id_canal: int
    servidor_id: int
    creador_id: int
    categoria_id: int | None = None

    class Config:
        from_attributes = True