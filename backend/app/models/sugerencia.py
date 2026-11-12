from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.db import Base


class Sugerencia(Base):
    __tablename__ = "sugerencia"

    id_sugerencia = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)

    email = Column(String(150), nullable=False)

    mensaje = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    leida = Column(Boolean, default=False, nullable=False)

    usuario = relationship("Usuario", back_populates="sugerencias")
