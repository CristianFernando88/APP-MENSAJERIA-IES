from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.db import Base


class Canal(Base):
    __tablename__ = "canal"

    id_canal = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    servidor_id = Column(Integer, ForeignKey("servidor.id_servidor"), nullable=False)
    creador_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categoria.id_categoria"), nullable=True)
    orden = Column(Integer, default=0)

    # Relaciones
    servidor = relationship("Servidor", back_populates="canales")
    creador = relationship("Usuario")
    categoria = relationship("Categoria", back_populates="canales")
    mensajes = relationship("Mensaje", back_populates="canal", cascade="all, delete-orphan")