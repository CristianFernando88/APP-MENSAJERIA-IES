from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.db import Base


class Rol(Base):
    __tablename__ = "rol"

    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(String(20), nullable=False)  # 'global' o 'servidor'

    # Relaciones
    usuarios = relationship("UsuarioRol", back_populates="rol", cascade="all, delete-orphan")