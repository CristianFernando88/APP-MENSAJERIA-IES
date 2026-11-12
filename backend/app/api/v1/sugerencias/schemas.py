from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SugerenciaCreate(BaseModel):
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    mensaje: str = Field(min_length=10, max_length=1000)

    @field_validator("nombres", "apellidos", "mensaje")
    @classmethod
    def limpiar(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El campo no puede estar vacío")
        return valor


class SugerenciaResponse(BaseModel):
    id_sugerencia: int
    usuario_id: int
    nombres: str
    apellidos: str
    email: str
    mensaje: str
    fecha_creacion: datetime
    leida: bool

    class Config:
        from_attributes = True
