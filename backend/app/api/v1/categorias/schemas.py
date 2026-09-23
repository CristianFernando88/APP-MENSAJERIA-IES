from pydantic import BaseModel, Field


class CategoriaBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = None
    orden: int = Field(default=0, ge=0)


class CategoriaCreate(CategoriaBase):
    servidor_id: int = Field(ge=1)
    padre_id: int | None = Field(default=None, ge=1)


class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = None
    padre_id: int | None = Field(default=None, ge=1)
    orden: int | None = Field(default=None, ge=0)


class CategoriaResponse(CategoriaBase):
    id_categoria: int
    servidor_id: int
    padre_id: int | None = None

    class Config:
        from_attributes = True