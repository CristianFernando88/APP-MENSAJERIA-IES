# APP MENSAJERÍA - IES

Sistema de mensajería tipo Discord, adaptado para gestión educativa con servidores, categorías, canales, recordatorios, comunicados y panel de administradores.

---

## Contexto Académico

- **Materia:** Programación 2
- **Carrera:** Tecnicatura Universitaria en Desarrollo de Software
- **Institución:** IES
- **Año:** 2024

---

## Integrantes del Grupo

| Nombre | Rol |
|--------|-----|
| Cristian Fernando | Scrum Master / Backend |
| Tintilay Antonella | Backend |
| Valeria Laguna | Frontend |
| Fernanda Duran | Frontend |

---

## Tecnologías

### Backend
- **FastAPI** - Framework web
- **Python** - Lenguaje
- **SQLAlchemy** - ORM
- **PostgreSQL** - Base de datos
- **Alembic** - Migraciones

### Frontend
- **React** - Librería UI
- **Vite** - Build tool
- **CSS puro** - Estilos

---

## Estado Actual del Proyecto

El proyecto se encuentra en desarrollo como un monorepo, conteniendo el backend y el frontend.
### Backend

Desarrollado con **FastAPI** (Python), utilizando **SQLAlchemy** como ORM y **PostgreSQL** como base de datos. Se han implementado los módulos principales para la gestión de:
*   Autenticación
*   Usuarios
*   Servidores y sus miembros
*   Categorías y canales
*   Mensajes (incluyendo directos)
*   Roles y asignación de roles a usuarios
*   Comunicados y sus destinatarios
*   Recordatorios
*   Notificaciones
*   Relaciones de usuario (amistades)

La API cuenta con endpoints para las funcionalidades principales, incluyendo el manejo de sesiones y la gestión de permisos básicos.
### Frontend

Construido con **React** y **Vite** para una experiencia de usuario moderna. Los estilos se manejan con **CSS puro**. Se utilizan:
*   **react-router-dom** para la navegación entre vistas.
*   **lucide-react** para la inclusión de iconos.

Actualmente, el frontend está en proceso de integración con el backend para implementar la interfaz de usuario para las funcionalidades descritas.

### Funcionalidades Implementadas (Backend)

*   Registro y inicio de sesión de usuarios
*   Creación, lectura, actualización y eliminación de servidores, categorías y canales
*   Envío y gestión de mensajes (incluyendo edición y eliminación de mensajes propios)
*   Gestión de perfiles de usuario
*   Manejo de roles y permisos básicos
*   Comunicados, recordatorios y notificaciones
*   Mensajes directos y gestión de relaciones de usuario

Las funcionalidades del frontend se están desarrollando para consumir estos endpoints.

---

## Estructura del Proyecto
APP-MENSAJERIA-IES/

├── backend/ # API REST con FastAPI
│ ├── main.py # Punto de entrada
│ ├── app/
│ │ ├── core/ # Configuración y DB
│ │ ├── models/ # Modelos SQLAlchemy
│ │ └── api/ # Endpoints (v1)
│ └── requirements.txt
│
├── frontend/ # Interfaz con React + Vite
│ └── ...
│
├── docs/ # Documentación
│ └── DER.md # Diagrama Entidad-Relación
│
├── .gitignore
└── README.md



## Cómo levantar el proyecto

### Backend

# 1) python -m venv venv

venv\Scripts\activate # Windows

# 2) Instalar FastAPI (con extras estandar)

pip install "fastapi[standard]"

# 3) Levantar el servidor (desarrollo)

fastapi dev main.py

# -> http://127.0.0.1:8000
# -> Docs: http://127.0.0.1:8000/docs
### Frontend

# 1. Entrar a la carpeta

cd frontend

# 2. Crear el proyecto

npm create vite@latest . -- --template react

# 3. Instalar dependencias

npm install

# 4. Iniciar el servidor de desarrollo

npm run dev

# VITE v5.x ready in 300 ms

# > Local: http://localhost:5173/

#### Funcionalidades
Obligatorias (Requisitos 1-5)
□ Registro de usuarios
□ Inicio de sesión
□ Listado de servidores (columna 1)
□ Listado de canales (columna 2)
□ Listado de mensajes (columna 3)
□ Editar/eliminar mensajes propios
□ Perfil de usuario editable

#### Adicionales (Requisitos 6-9)
□ Manejadores de errores (400, 404, 403, 500)
□ Buscador de servidores
□ Manejo de sesiones
□ Notificaciones e invitaciones
□ Mensajes directos
□ Recordatorios
□ Comunicados
□ Panel de administradores
□ Sistema de roles

### Documentación Adicional
Diagrama Entidad-Relación


