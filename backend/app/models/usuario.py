from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    
    # Campo de contraseña. Por ahora es NULL porque no hay login.
    contrasena_hash = Column(String(255), nullable=True)
    
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    activo = Column(Boolean, default=True)

    # Relaciones
    perfil = relationship("Perfil", back_populates="usuario", uselist=False)
    servidores = relationship("MiembroServidor", back_populates="usuario")
    mensajes = relationship("Mensaje", back_populates="usuario")