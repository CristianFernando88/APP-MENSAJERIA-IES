from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.db import Base


class Perfil(Base):
    __tablename__ = "perfil"

    id_perfil = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), unique=True, nullable=False)
    nombres = Column(String(100))
    apellidos = Column(String(100))
    foto_perfil = Column(String(255))
    biografia = Column(Text)

    # Relaciones
    usuario = relationship("Usuario", back_populates="perfil")