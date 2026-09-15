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
| (Compañero 2) | Frontend |
| (Compañero 3) | Backend |
| (Compañero 4) | Frontend |

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

cd backend
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
pip install -r requirements.txt
fastapi dev main.py
Backend disponible en: http://localhost:8000
Documentación API: http://localhost:8000/docs

### Frontend
bash
cd frontend
npm install
npm run dev
Frontend disponible en: http://localhost:5173

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

