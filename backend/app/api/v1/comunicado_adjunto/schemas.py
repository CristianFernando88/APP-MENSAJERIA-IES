from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ComunicadoAdjuntoResponse(BaseModel):
    id: int
    comunicado_id: int
    nombre_original: str
    url: str
    tipo_mime: str
    tamano_bytes: int
    fecha_subida: datetime

    model_config = ConfigDict(from_attributes=True)
