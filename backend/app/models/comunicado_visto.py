from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class ComunicadoVisto(Base):
    __tablename__ = "comunicado_visto"

    id_comunicado_visto = Column(Integer, primary_key=True, autoincrement=True)
    comunicado_id = Column(Integer, ForeignKey("comunicado.id_comunicado"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_visto = Column(DateTime, default=datetime.utcnow)

    comunicado = relationship("Comunicado", back_populates="vistas")
    usuario = relationship("Usuario", back_populates="comunicados_vistos")