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
    contrasena_hash = Column(String(255), nullable=False)
    
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    activo = Column(Boolean, default=True)

    # Relaciones
    perfil = relationship("Perfil", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    roles = relationship("UsuarioRol", foreign_keys="UsuarioRol.usuario_id", back_populates="usuario", cascade="all, delete-orphan")
    servidores = relationship("MiembroServidor", back_populates="usuario", cascade="all, delete-orphan")
    mensajes = relationship("Mensaje", back_populates="usuario", passive_deletes=True)

    # Relaciones nuevas (modelos añadidos)
    miembros_canales = relationship("MiembroCanal", back_populates="usuario", cascade="all, delete-orphan")
    mensajes_directos_enviados = relationship("MensajeDirecto", foreign_keys="MensajeDirecto.emisor_id", back_populates="emisor", cascade="all, delete-orphan")
    mensajes_directos_recibidos = relationship("MensajeDirecto", foreign_keys="MensajeDirecto.receptor_id", back_populates="receptor", cascade="all, delete-orphan")
    comunicados = relationship("Comunicado", foreign_keys="Comunicado.publicado_por", back_populates="autor", passive_deletes=True)
    comunicados_vistos = relationship("ComunicadoVisto", back_populates="usuario", cascade="all, delete-orphan")
    mensajes_vistos = relationship("MensajeVisto", back_populates="usuario", cascade="all, delete-orphan")
    relaciones = relationship("RelacionUsuario", foreign_keys="RelacionUsuario.usuario_id", back_populates="usuario", cascade="all, delete-orphan")
    relacionados = relationship("RelacionUsuario", foreign_keys="RelacionUsuario.relacionado_id", back_populates="relacionado", cascade="all, delete-orphan")
    notificaciones = relationship("Notificacion", back_populates="usuario", cascade="all, delete-orphan")
    recordatorios = relationship("Recordatorio", back_populates="usuario", cascade="all, delete-orphan")