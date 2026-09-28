from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Recordatorio(Base):
    __tablename__ = "recordatorio"

    id_recordatorio = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_limite = Column(DateTime, nullable=True)
    completado = Column(Boolean, default=False)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    # Relaciones
    usuario = relationship("Usuario")