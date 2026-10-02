from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base


class Comunicado(Base):
    __tablename__ = "comunicado"

    id_comunicado = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(200), nullable=False)
    contenido = Column(Text, nullable=False)
    fecha_publicacion = Column(DateTime, default=datetime.utcnow)
    publicado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
        tipo = Column(String(20), nullable=False, default="global")

    # Relaciones
    autor = relationship("Usuario", foreign_keys=[publicado_por])
    servidor = relationship("Servidor")
    destinatarios = relationship("ComunicadoDestinatario", back_populates="comunicado")
    vistas = relationship("ComunicadoVisto", back_populates="comunicado")