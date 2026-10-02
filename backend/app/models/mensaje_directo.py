from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class MensajeDirecto(Base):
    __tablename__ = "mensaje_directo"

    id_mensaje_directo = Column(Integer, primary_key=True, autoincrement=True)
    contenido = Column(Text, nullable=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow)
    leido = Column(Boolean, default=False)
    fecha_leido = Column(DateTime, nullable=True)
    emisor_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    receptor_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    emisor = relationship("Usuario", foreign_keys=[emisor_id], back_populates="mensajes_directos_enviados")
    receptor = relationship("Usuario", foreign_keys=[receptor_id], back_populates="mensajes_directos_recibidos")