# Registrar TODOS los modelos aquí para que Base.metadata los conozca.
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.models.servidor import Servidor
from app.models.miembro_servidor import MiembroServidor
from app.models.categoria import Categoria
from app.models.canal import Canal
from app.models.mensaje import Mensaje

__all__ = [
    "Usuario",
    "Perfil",
    "Servidor",
    "MiembroServidor",
    "Categoria",
    "Canal",
    "Mensaje",
]