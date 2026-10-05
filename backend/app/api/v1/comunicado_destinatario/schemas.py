from pydantic import BaseModel, Field


class ComunicadoDestinatarioBase(BaseModel):
    comunicado_id: int = Field(ge=1)
    servidor_id: int | None = Field(default=None, ge=1)
    canal_id: int | None = Field(default=None, ge=1)
    usuario_id: int | None = Field(default=None, ge=1)


class ComunicadoDestinatarioCreate(ComunicadoDestinatarioBase):
    pass


class ComunicadoDestinatarioUpdate(BaseModel):
    servidor_id: int | None = Field(default=None, ge=1)
    canal_id: int | None = Field(default=None, ge=1)
    usuario_id: int | None = Field(default=None, ge=1)


class ComunicadoDestinatarioResponse(ComunicadoDestinatarioBase):
    id_comunicado_destinatario: int

    class Config:
        from_attributes = True