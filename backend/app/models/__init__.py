# Registrar TODOS los modelos aquí para que Base.metadata los conozca.
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.models.rol import Rol
from app.models.servidor import Servidor
from app.models.usuario_rol import UsuarioRol
from app.models.miembro_servidor import MiembroServidor
from app.models.categoria import Categoria
from app.models.canal import Canal
from app.models.mensaje import Mensaje
from app.models.comunicado import Comunicado
from app.models.notificacion import Notificacion
from app.models.recordatorio import Recordatorio
from app.models.miembro_canal import MiembroCanal
from app.models.mensaje_directo import MensajeDirecto
from app.models.comunicado_destinatario import ComunicadoDestinatario
from app.models.comunicado_visto import ComunicadoVisto
from app.models.mensaje_visto import MensajeVisto
from app.models.relacion_usuario import RelacionUsuario

__all__ = [
    "Usuario",
    "Perfil",
    "Rol",
    "Servidor",
    "UsuarioRol",
    "MiembroServidor",
    "Categoria",
    "Canal",
    "Mensaje",
    "Comunicado",
    "Notificacion",
    "Recordatorio",
]