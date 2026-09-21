from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Mensaje(Base):
    __tablename__ = "mensaje"

    id_mensaje = Column(Integer, primary_key=True, autoincrement=True)
    contenido = Column(Text, nullable=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow)
    editado = Column(Boolean, default=False)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    canal_id = Column(Integer, ForeignKey("canal.id_canal"), nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="mensajes")
    canal = relationship("Canal", back_populates="mensajes")