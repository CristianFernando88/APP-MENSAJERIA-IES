from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class MiembroCanal(Base):
    __tablename__ = "miembro_canal"

    id_miembro_canal = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    canal_id = Column(Integer, ForeignKey("canal.id_canal"), nullable=False)
    fecha_union = Column(DateTime, default=datetime.utcnow)
    rol_en_canal = Column(String(20), nullable=False, default="miembro")  # 'admin', 'miembro', 'tutor'

    usuario = relationship("Usuario", back_populates="miembros_canales")
    canal = relationship("Canal", back_populates="miembros")