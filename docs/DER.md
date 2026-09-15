## Diagrama Entidad-Relación

Documentación del modelo de datos del sistema.

## Entidades Principales

Usuarios
usuario(id_usuario, nombre_usuario, email, fecha_registro, activo)
id_usuario: Identificador único del usuario (PK).

nombre_usuario: Nombre único del usuario.

email: Correo electrónico único.

fecha_registro: Fecha y hora de registro.

activo: Booleano (activo/bloqueado).

Perfil(otros datos de usuario)
perfil(id_perfil, usuario_id, nombres, apellidos, foto_perfil, biografia)
id_perfil: Identificador único del perfil (PK).

usuario_id: FK al usuario (1:1).

nombres: Nombre(s) real(es).

apellidos: Apellido(s).

foto_perfil: Ruta o URL de la imagen de perfil.

biografia: Breve descripción personal.

Nota: Por ahora sin contrasena_hash ni rol_global_id. Se agregan cuando vean login y roles.

Servidores
servidor(id_servidor, nombre, descripcion, fecha_creacion, creador_id)
id_servidor: Identificador único del servidor (PK).
nombre: Nombre del servidor.
descripcion: Descripción opcional.
fecha_creacion: Fecha y hora de creación.
creador_id: FK al usuario que lo creó.

miembro_servidor(usuario_id, servidor_id, fecha_union)
usuario_id: FK al usuario (PK compuesta).
servidor_id: FK al servidor (PK compuesta).
fecha_union: Fecha en que se unió.
Nota: Por ahora sin rol_servidor_id ni activo. Se agregan cuando vean roles.

Categorías
categoria(id_categoria, nombre, descripcion, padre_id, servidor_id, orden)
id_categoria: Identificador único de la categoría (PK).
nombre: Nombre de la categoría.
descripcion: Descripción opcional.
padre_id: FK a otra categoría (auto-referencia). NULL si es raíz.
servidor_id: FK al servidor al que pertenece.
orden: Número para ordenar visualmente.

Canales
canal(id_canal, nombre, descripcion, servidor_id, creador_id, categoria_id, orden)
id_canal: Identificador único del canal (PK).
nombre: Nombre del canal.
descripcion: Descripción opcional.
servidor_id: FK al servidor al que pertenece.
creador_id: FK al usuario que lo creó.
categoria_id: FK a la categoría (NULL si no tiene).
orden: Número para ordenar visualmente.

Mensajes
mensaje(id_mensaje, contenido, fecha_envio, editado, usuario_id, canal_id)
id_mensaje: Identificador único del mensaje (PK).
contenido: Texto del mensaje.
fecha_envio: Fecha y hora de envío.
editado: Booleano (si fue editado).
usuario_id: FK al usuario que lo envió.
canal_id: FK al canal donde se envió.

RELACIONES MÍNIMAS
Entidad	Campo FK	Referencia
perfil	usuario_id	→ usuario.id_usuario
servidor	creador_id	→ usuario.id_usuario
miembro_servidor	usuario_id	→ usuario.id_usuario
miembro_servidor	servidor_id	→ servidor.id_servidor
categoria	padre_id	→ categoria.id_categoria (auto-referencia)
categoria	servidor_id	→ servidor.id_servidor
canal	servidor_id	→ servidor.id_servidor
canal	creador_id	→ usuario.id_usuario
canal	categoria_id	→ categoria.id_categoria
mensaje	usuario_id	→ usuario.id_usuario
mensaje	canal_id	→ canal.id_canal

RESUMEN DE ENTIDADES MÍNIMAS 
#	Entidad	Propósito
1	usuario	Registro básico de usuarios
2	perfil	Datos personales y foto
3	servidor	Espacios que contienen canales
4	miembro_servidor	Usuarios que pertenecen a servidores
5	categoria	Agrupación de canales (jerárquica)
6	canal	Chats dentro de un servidor
7	mensaje	Mensajes dentro de un canal
Total: 7 entidades mínimas para empezar.

QUÉ CUBRE ESTE DER MÍNIMO

Crear usuarios	usuario, perfil (sin contraseña por ahora)
Iniciar sesión	Se ve después
Listar servidores del usuario	miembro_servidor, servidor
Listar canales del servidor canal, categoria
Listar mensajes del canal	mensaje
Editar/eliminar mensajes propios	mensaje (usuario_id)
Perfil actualizable	perfil

# DER gráfico
pendiente...