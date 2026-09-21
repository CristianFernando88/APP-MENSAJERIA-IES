from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Servidor(Base):
    __tablename__ = "servidor"

    id_servidor = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    creador_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    # Relaciones
    creador = relationship("Usuario")
    categorias = relationship("Categoria", back_populates="servidor", cascade="all, delete-orphan")
    canales = relationship("Canal", back_populates="servidor", cascade="all, delete-orphan")
    miembros = relationship("MiembroServidor", back_populates="servidor", cascade="all, delete-orphan")