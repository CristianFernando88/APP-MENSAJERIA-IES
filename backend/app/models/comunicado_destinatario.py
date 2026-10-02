from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base


class ComunicadoDestinatario(Base):
    __tablename__ = "comunicado_destinatario"

    id_comunicado_destinatario = Column(Integer, primary_key=True, autoincrement=True)
    comunicado_id = Column(Integer, ForeignKey("comunicado.id_comunicado"), nullable=False)
    servidor_id = Column(Integer, ForeignKey("servidor.id_servidor"), nullable=True)
    canal_id = Column(Integer, ForeignKey("canal.id_canal"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    comunicado = relationship("Comunicado", back_populates="destinatarios")
    servidor = relationship("Servidor")
    canal = relationship("Canal")
    usuario = relationship("Usuario")