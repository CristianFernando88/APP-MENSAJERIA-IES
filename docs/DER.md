markdown
## Diagrama Entidad-Relación

Documentación del modelo de datos del sistema.

## Entidades Principales

### Usuarios
usuario(id_usuario, nombre_usuario, email, contrasenia, fecha_registro, activo)

text

- **id_usuario**: Identificador único del usuario (PK).
- **nombre_usuario**: Nombre único del usuario.
- **email**: Correo electrónico único.
- **contrasenia**: Contraseña del usuario (para login). Por ahora es **opcional**.
- **fecha_registro**: Fecha y hora de registro.
- **activo**: Booleano (activo/bloqueado).

---

### Perfil (otros datos de usuario)
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

### Usuario_Rol (asignación de roles)
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
canal(id_canal, nombre, descripcion, servidor_id, creador_id, categoria_id, orden)

text

- **id_canal**: Identificador único del canal (PK).
- **nombre**: Nombre del canal.
- **descripcion**: Descripción opcional.
- **servidor_id**: FK al servidor al que pertenece.
- **creador_id**: FK al usuario que lo creó.
- **categoria_id**: FK a la categoría (NULL si no tiene).
- **orden**: Número para ordenar visualmente.

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

### Comunicados
comunicado(id_comunicado, titulo, contenido, fecha_publicacion, publicado_por, servidor_id)

text

- **id_comunicado**: Identificador único del comunicado (PK).
- **titulo**: Título del comunicado.
- **contenido**: Cuerpo del comunicado.
- **fecha_publicacion**: Fecha y hora de publicación.
- **publicado_por**: FK al usuario que lo publicó.
- **servidor_id**: FK al servidor (NULL si es global).

---

### Notificaciones
notificacion(id_notificacion, usuario_id, mensaje, leida, fecha_creacion, tipo, enlace)

text

- **id_notificacion**: Identificador único de la notificación (PK).
- **usuario_id**: FK al usuario que recibe la notificación.
- **mensaje**: Texto de la notificación.
- **leida**: Booleano (true/false).
- **fecha_creacion**: Fecha y hora de creación.
- **tipo**: Tipo de notificación (ej: 'mensaje', 'invitacion', 'comunicado').
- **enlace**: URL o ruta interna a la que redirige.

---

### Recordatorios
recordatorio(id_recordatorio, titulo, descripcion, fecha_creacion, fecha_limite, completado, usuario_id)

text

- **id_recordatorio**: Identificador único del recordatorio (PK).
- **titulo**: Título del recordatorio.
- **descripcion**: Detalle o descripción.
- **fecha_creacion**: Fecha y hora de creación.
- **fecha_limite**: Fecha y hora límite.
- **completado**: Booleano (si se completó).
- **usuario_id**: FK al usuario dueño del recordatorio.

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
| mensaje | usuario_id | → usuario.id_usuario |
| mensaje | canal_id | → canal.id_canal |
| comunicado | publicado_por | → usuario.id_usuario |
| comunicado | servidor_id | → servidor.id_servidor (NULL = global) |
| notificacion | usuario_id | → usuario.id_usuario |
| recordatorio | usuario_id | → usuario.id_usuario |

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
| 8 | canal | Chats dentro de un servidor |
| 9 | mensaje | Mensajes dentro de un canal |
| 10 | comunicado | Anuncios oficiales |
| 11 | notificacion | Avisos automáticos |
| 12 | recordatorio | Tareas personales |

**Total: 12 entidades.**

---

## QUÉ CUBRE ESTE DER

| Funcionalidad | Entidades |
|---------------|-----------|
| Crear usuarios | usuario, perfil |
| Iniciar sesión | usuario (se ve después) |
| Listar servidores del usuario | miembro_servidor, servidor |
| Listar canales del servidor | canal, categoria |
| Listar mensajes del canal | mensaje |
| Editar/eliminar mensajes propios | mensaje (usuario_id) |
| Perfil actualizable | perfil |
| Roles y permisos | rol, usuario_rol |
| Comunicados | comunicado |
| Notificaciones | notificacion |
| Recordatorios | recordatorio |

---

## NOTAS

- **`contrasenia`** en `usuario` es **opcional por ahora**. Se hará `NOT NULL` cuando se implemente login.
- **`usuario_rol`** permite que un usuario tenga **múltiples roles** (globales y por servidor).
- **`comunicado.servidor_id`** puede ser NULL si es un comunicado global.
- **`notificacion`** se genera automáticamente por el sistema.
- **`recordatorio`** es personal (creado por el usuario para sí mismo).

---

# DER gráfico

pendiente...