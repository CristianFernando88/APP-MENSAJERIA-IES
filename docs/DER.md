📄 DOCUMENTO 1: DER ACTUALIZADO
markdown
# Diagrama Entidad-Relación

Documentación del modelo de datos del sistema de mensajería.

---

## Entidades Principales

### Usuario
usuario(id_usuario, nombre_usuario, email, contrasenia, fecha_registro, activo)

text

- **id_usuario**: Identificador único del usuario (PK).
- **nombre_usuario**: Nombre único del usuario.
- **email**: Correo electrónico único.
- **contrasenia**: Contraseña del usuario (para login). Por ahora es opcional.
- **fecha_registro**: Fecha y hora de registro.
- **activo**: Booleano (activo/bloqueado).

---

### Perfil
perfil(id_perfil, usuario_id, nombres, apellidos, foto_perfil, biografia)

text

- **id_perfil**: Identificador único del perfil (PK).
- **usuario_id**: FK al usuario (1:1).
- **nombres**: Nombre(s) real(es).
- **apellidos**: Apellido(s).
- **foto_perfil**: Ruta o URL de la imagen de perfil.
- **biografia**: Breve descripción personal.

---

### Roles
rol(id_rol, nombre, descripcion, tipo)

text

- **id_rol**: Identificador único del rol (PK).
- **nombre**: Nombre del rol (ej: 'director', 'profesor', 'alumno').
- **descripcion**: Descripción del rol.
- **tipo**: 'global' (aplica a toda la app) o 'servidor' (solo en un servidor).

---

### Usuario_Rol
usuario_rol(id_usuario_rol, usuario_id, rol_id, servidor_id, fecha_asignacion, asignado_por)

text

- **id_usuario_rol**: Identificador único de la asignación (PK).
- **usuario_id**: FK al usuario que recibe el rol.
- **rol_id**: FK al rol asignado.
- **servidor_id**: FK al servidor (NULL si es rol global).
- **fecha_asignacion**: Fecha en que se asignó el rol.
- **asignado_por**: FK al usuario que asignó el rol (puede ser NULL).

---

### Servidores
servidor(id_servidor, nombre, descripcion, fecha_creacion, creador_id)

text

- **id_servidor**: Identificador único del servidor (PK).
- **nombre**: Nombre del servidor.
- **descripcion**: Descripción opcional.
- **fecha_creacion**: Fecha y hora de creación.
- **creador_id**: FK al usuario que lo creó.

---

### Miembro_Servidor
miembro_servidor(usuario_id, servidor_id, fecha_union, activo)

text

- **usuario_id**: FK al usuario (PK compuesta).
- **servidor_id**: FK al servidor (PK compuesta).
- **fecha_union**: Fecha en que se unió.
- **activo**: Booleano (activo/expulsado).

---

### Categorías
categoria(id_categoria, nombre, descripcion, padre_id, servidor_id, orden)

text

- **id_categoria**: Identificador único de la categoría (PK).
- **nombre**: Nombre de la categoría.
- **descripcion**: Descripción opcional.
- **padre_id**: FK a otra categoría (auto-referencia). NULL si es raíz.
- **servidor_id**: FK al servidor al que pertenece.
- **orden**: Número para ordenar visualmente.

---

### Canales
canal(id_canal, nombre, descripcion, servidor_id, creador_id, categoria_id, orden, tipo)

text

- **id_canal**: Identificador único del canal (PK).
- **nombre**: Nombre del canal.
- **descripcion**: Descripción opcional.
- **servidor_id**: FK al servidor al que pertenece.
- **creador_id**: FK al usuario que lo creó.
- **categoria_id**: FK a la categoría (NULL si no tiene).
- **orden**: Número para ordenar visualmente.
- **tipo**: 'informativo' (solo admins escriben) o 'chat' (todos escriben).

---

### Miembro_Canal
miembro_canal(id_miembro_canal, usuario_id, canal_id, fecha_union, rol_en_canal)

text

- **id_miembro_canal**: Identificador único (PK).
- **usuario_id**: FK al usuario.
- **canal_id**: FK al canal.
- **fecha_union**: Fecha en que se unió.
- **rol_en_canal**: 'admin', 'miembro' o 'tutor'.

---

### Mensajes
mensaje(id_mensaje, contenido, fecha_envio, editado, usuario_id, canal_id)

text

- **id_mensaje**: Identificador único del mensaje (PK).
- **contenido**: Texto del mensaje.
- **fecha_envio**: Fecha y hora de envío.
- **editado**: Booleano (si fue editado).
- **usuario_id**: FK al usuario que lo envió.
- **canal_id**: FK al canal donde se envió.

---

### Mensaje_Directo
mensaje_directo(id_mensaje_directo, contenido, fecha_envio, leido, fecha_leido, emisor_id, receptor_id)

text

- **id_mensaje_directo**: Identificador único (PK).
- **contenido**: Texto del mensaje.
- **fecha_envio**: Fecha y hora de envío.
- **leido**: Booleano (si fue leído).
- **fecha_leido**: Fecha y hora en que se leyó.
- **emisor_id**: FK al usuario que envía.
- **receptor_id**: FK al usuario que recibe.

---

### Comunicados
comunicado(id_comunicado, titulo, contenido, fecha_publicacion, publicado_por, tipo)

text

- **id_comunicado**: Identificador único (PK).
- **titulo**: Título del comunicado.
- **contenido**: Cuerpo del comunicado.
- **fecha_publicacion**: Fecha y hora de publicación.
- **publicado_por**: FK al usuario que lo publicó.
- **tipo**: 'global', 'servidor', 'canal' o 'usuario'.

---

### Comunicado_Destinatario
comunicado_destinatario(id_comunicado_destinatario, comunicado_id, servidor_id, canal_id, usuario_id)

text

- **id_comunicado_destinatario**: Identificador único (PK).
- **comunicado_id**: FK al comunicado.
- **servidor_id**: FK al servidor destinatario (NULL si no aplica).
- **canal_id**: FK al canal destinatario (NULL si no aplica).
- **usuario_id**: FK al usuario destinatario (NULL si no aplica).

---

### Comunicado_Visto
comunicado_visto(id_comunicado_visto, comunicado_id, usuario_id, fecha_visto)

text

- **id_comunicado_visto**: Identificador único (PK).
- **comunicado_id**: FK al comunicado.
- **usuario_id**: FK al usuario que lo vio.
- **fecha_visto**: Fecha y hora en que lo vio.

---

### Mensaje_Visto
mensaje_visto(id_mensaje_visto, mensaje_id, usuario_id, fecha_visto)

text

- **id_mensaje_visto**: Identificador único (PK).
- **mensaje_id**: FK al mensaje.
- **usuario_id**: FK al usuario que lo vio.
- **fecha_visto**: Fecha y hora en que lo vio.

---

### Notificaciones
notificacion(id_notificacion, usuario_id, mensaje, leida, fecha_creacion, tipo, enlace)

text

- **id_notificacion**: Identificador único (PK).
- **usuario_id**: FK al usuario que recibe.
- **mensaje**: Texto de la notificación.
- **leida**: Booleano (true/false).
- **fecha_creacion**: Fecha y hora de creación.
- **tipo**: Tipo de notificación (ej: 'mensaje', 'invitacion', 'comunicado').
- **enlace**: URL o ruta interna a la que redirige.

---

### Recordatorios
recordatorio(id_recordatorio, titulo, descripcion, fecha_creacion, fecha_limite, completado, usuario_id)

text

- **id_recordatorio**: Identificador único (PK).
- **titulo**: Título del recordatorio.
- **descripcion**: Detalle o descripción.
- **fecha_creacion**: Fecha y hora de creación.
- **fecha_limite**: Fecha y hora límite.
- **completado**: Booleano (si se completó).
- **usuario_id**: FK al usuario dueño del recordatorio.

---

### Relacion_Usuario
relacion_usuario(id_relacion, usuario_id, relacionado_id, tipo, fecha_creacion)

text

- **id_relacion**: Identificador único (PK).
- **usuario_id**: FK al usuario principal (ej: alumno).
- **relacionado_id**: FK al usuario relacionado (ej: tutor).
- **tipo**: 'padre', 'madre', 'tutor', 'hermano', etc.
- **fecha_creacion**: Fecha en que se creó la relación.

---

## RELACIONES

| Entidad | Campo FK | Referencia |
|---------|----------|------------|
| perfil | usuario_id | → usuario.id_usuario |
| usuario_rol | usuario_id | → usuario.id_usuario |
| usuario_rol | rol_id | → rol.id_rol |
| usuario_rol | servidor_id | → servidor.id_servidor (NULL = global) |
| usuario_rol | asignado_por | → usuario.id_usuario |
| servidor | creador_id | → usuario.id_usuario |
| miembro_servidor | usuario_id | → usuario.id_usuario |
| miembro_servidor | servidor_id | → servidor.id_servidor |
| categoria | padre_id | → categoria.id_categoria (auto-referencia) |
| categoria | servidor_id | → servidor.id_servidor |
| canal | servidor_id | → servidor.id_servidor |
| canal | creador_id | → usuario.id_usuario |
| canal | categoria_id | → categoria.id_categoria |
| miembro_canal | usuario_id | → usuario.id_usuario |
| miembro_canal | canal_id | → canal.id_canal |
| mensaje | usuario_id | → usuario.id_usuario |
| mensaje | canal_id | → canal.id_canal |
| mensaje_directo | emisor_id | → usuario.id_usuario |
| mensaje_directo | receptor_id | → usuario.id_usuario |
| comunicado | publicado_por | → usuario.id_usuario |
| comunicado_destinatario | comunicado_id | → comunicado.id_comunicado |
| comunicado_destinatario | servidor_id | → servidor.id_servidor |
| comunicado_destinatario | canal_id | → canal.id_canal |
| comunicado_destinatario | usuario_id | → usuario.id_usuario |
| comunicado_visto | comunicado_id | → comunicado.id_comunicado |
| comunicado_visto | usuario_id | → usuario.id_usuario |
| mensaje_visto | mensaje_id | → mensaje.id_mensaje |
| mensaje_visto | usuario_id | → usuario.id_usuario |
| notificacion | usuario_id | → usuario.id_usuario |
| recordatorio | usuario_id | → usuario.id_usuario |
| relacion_usuario | usuario_id | → usuario.id_usuario |
| relacion_usuario | relacionado_id | → usuario.id_usuario |

---

## RESUMEN DE ENTIDADES

| # | Entidad | Propósito |
|---|---------|-----------|
| 1 | usuario | Registro básico de usuarios |
| 2 | perfil | Datos personales y foto |
| 3 | rol | Roles disponibles (globales y de servidor) |
| 4 | usuario_rol | Asignación de roles a usuarios |
| 5 | servidor | Espacios que contienen canales |
| 6 | miembro_servidor | Usuarios que pertenecen a servidores |
| 7 | categoria | Agrupación de canales (jerárquica) |
| 8 | canal | Chats dentro de un servidor (+ tipo) |
| 9 | miembro_canal | Usuarios que pertenecen a canales |
| 10 | mensaje | Mensajes dentro de un canal |
| 11 | mensaje_directo | Chats privados 1 a 1 |
| 12 | comunicado | Anuncios oficiales |
| 13 | comunicado_destinatario | Destinatarios de un comunicado |
| 14 | comunicado_visto | Seguimiento de comunicados vistos |
| 15 | mensaje_visto | Seguimiento de mensajes vistos |
| 16 | notificacion | Avisos automáticos |
| 17 | recordatorio | Tareas personales |
| 18 | relacion_usuario | Relaciones entre usuarios (alumno ↔ tutor) |

**Total: 18 entidades.**

---

## QUÉ CUBRE ESTE DER

| Funcionalidad | Entidades |
|---------------|-----------|
| Crear usuarios | usuario, perfil |
| Iniciar sesión | usuario (se ve después) |
| Listar servidores del usuario | miembro_servidor, servidor |
| Listar canales del servidor | canal, categoria |
| Listar canales del usuario | miembro_canal, canal |
| Listar mensajes del canal | mensaje |
| Editar/eliminar mensajes propios | mensaje (usuario_id) |
| Chats privados | mensaje_directo |
| Perfil actualizable | perfil |
| Roles y permisos | rol, usuario_rol |
| Comunicados | comunicado |
| Enviar comunicado a varios | comunicado_destinatario |
| Seguimiento de comunicados | comunicado_visto |
| Seguimiento de mensajes | mensaje_visto |
| Notificaciones | notificacion |
| Recordatorios | recordatorio |
| Relaciones (alumno ↔ tutor) | relacion_usuario |

---

## NOTAS

- **`contrasenia`** en `usuario` es **opcional por ahora**. Se hará `NOT NULL` cuando se implemente login.
- **`usuario_rol`** permite que un usuario tenga **múltiples roles**.
- **`canal.tipo`** diferencia 'informativo' (solo admins escriben) de 'chat' (todos escriben).
- **`miembro_canal.rol_en_canal`** puede ser 'admin', 'miembro' o 'tutor'.
- **`mensaje_directo`** permite chats privados 1 a 1.
- **`comunicado.tipo`** define el alcance: 'global', 'servidor', 'canal' o 'usuario'.
- **`comunicado_destinatario`** permite enviar un comunicado a **varios destinatarios**.
- **`comunicado_visto`** y **`mensaje_visto`** permiten saber quién vio qué.
- **`relacion_usuario`** permite relacionar usuarios (alumno ↔ tutor).
- **`notificacion`** se genera automáticamente por el sistema.
- **`recordatorio`** es personal (creado por el usuario para sí mismo).

---

## DER gráfico

pendiente...