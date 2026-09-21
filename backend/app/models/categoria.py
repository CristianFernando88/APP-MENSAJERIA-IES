from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.db import Base


class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    padre_id = Column(Integer, ForeignKey("categoria.id_categoria"), nullable=True)
    servidor_id = Column(Integer, ForeignKey("servidor.id_servidor"), nullable=False)
    orden = Column(Integer, default=0)

    # Relaciones
    servidor = relationship("Servidor", back_populates="categorias")
    padre = relationship("Categoria", remote_side=[id_categoria], backref="subcategorias")
    canales = relationship("Canal", back_populates="categoria")