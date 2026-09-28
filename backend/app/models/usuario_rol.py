from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class UsuarioRol(Base):
    __tablename__ = "usuario_rol"

    id_usuario_rol = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    rol_id = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    servidor_id = Column(Integer, ForeignKey("servidor.id_servidor"), nullable=True)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    asignado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    # Relaciones
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="roles")
    rol = relationship("Rol", back_populates="usuarios")
    servidor = relationship("Servidor")
    asignador = relationship("Usuario", foreign_keys=[asignado_por])