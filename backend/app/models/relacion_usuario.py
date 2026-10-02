from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class RelacionUsuario(Base):
    __tablename__ = "relacion_usuario"

    id_relacion = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    relacionado_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    tipo = Column(String(50), nullable=False)  # 'padre', 'madre', 'tutor', 'hermano', etc.
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="relaciones")
    relacionado = relationship("Usuario", foreign_keys=[relacionado_id], back_populates="relacionados")