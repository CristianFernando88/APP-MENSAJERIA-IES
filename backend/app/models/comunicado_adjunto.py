from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class ComunicadoAdjunto(Base):
    __tablename__ = "comunicado_adjunto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    comunicado_id = Column(
        Integer,
        ForeignKey("comunicado.id_comunicado", ondelete="CASCADE"),
        nullable=False
    )
    nombre_original = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    public_id = Column(String(255), nullable=False)
    tipo_mime = Column(String(150), nullable=False)
    tipo_mime = Column(String(150), nullable=False)
    tamano_bytes = Column(Integer, nullable=False)
    fecha_subida = Column(DateTime, default=datetime.utcnow, nullable=False)

    comunicado = relationship("Comunicado", back_populates="adjuntos")
