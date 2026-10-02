from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class MensajeVisto(Base):
    __tablename__ = "mensaje_visto"

    id_mensaje_visto = Column(Integer, primary_key=True, autoincrement=True)
    mensaje_id = Column(Integer, ForeignKey("mensaje.id_mensaje"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_visto = Column(DateTime, default=datetime.utcnow)

    mensaje = relationship("Mensaje", back_populates="vistas")
    usuario = relationship("Usuario", back_populates="mensajes_vistos")