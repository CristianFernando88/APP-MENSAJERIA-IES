from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class MiembroServidor(Base):
    __tablename__ = "miembro_servidor"

    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), primary_key=True)
    servidor_id = Column(Integer, ForeignKey("servidor.id_servidor"), primary_key=True)
    fecha_union = Column(DateTime, default=datetime.utcnow)
    activo = Column(Boolean, default=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="servidores")
    servidor = relationship("Servidor", back_populates="miembros")