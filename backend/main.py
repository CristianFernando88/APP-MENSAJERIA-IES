"""Punto de entrada FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import Base, engine
from app import models  # noqa: F401 — registra los modelos en Base.metadata

# aca importamos las rutas
from app.api.v1.usuarios.router import router as usuarios_router
from app.api.v1.servidores.router import router as servidores_router
from app.api.v1.categorias.router import router as categorias_router
from app.api.v1.canales.router import router as canales_router
from app.api.v1.mensajes.router import router as mensajes_router
from app.api.v1.miembro_servidor.router import router as miembro_servidor_router
from app.api.v1.miembro_canal.router import router as miembro_canal_router
from app.api.v1.roles.router import router as roles_router
from app.api.v1.usuario_rol.router import router as usuario_rol_router
from app.api.v1.comunicados.router import router as comunicados_router
from app.api.v1.recordatorios.router import router as recordatorios_router
from app.api.v1.notificaciones.router import router as notificaciones_router
from app.api.v1.mensaje_directo.router import router as mensaje_directo_router
from app.api.v1.comunicado_destinatario.router import router as comunicado_destinatario_router
from app.api.v1.comunicado_visto.router import router as comunicado_visto_router
from app.api.v1.mensaje_visto.router import router as mensaje_visto_router
from app.api.v1.relacion_usuario.router import router as relacion_usuario_router


app = FastAPI(
    title="APP MENSAJERÍA API",
    description="Sistema de mensajería con servidores, categorías y canales. FastAPI + SQLAlchemy + PostgreSQL.",
    version="1.0.0",
)

# CORS (para que el frontend pueda consumir la API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite por defecto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crea las tablas si no existen (para dev / demo). En producción usar Alembic.
#Base.metadata.create_all(bind=engine)

# Aca van los routers
app.include_router(usuarios_router, prefix="/api/v1")
app.include_router(servidores_router, prefix="/api/v1")
app.include_router(categorias_router, prefix="/api/v1")
app.include_router(canales_router, prefix="/api/v1")
app.include_router(mensajes_router, prefix="/api/v1")
app.include_router(miembro_servidor_router, prefix="/api/v1")
app.include_router(mensaje_directo_router, prefix="/api/v1")
app.include_router(miembro_canal_router, prefix="/api/v1")
app.include_router(roles_router, prefix="/api/v1")
app.include_router(usuario_rol_router, prefix="/api/v1")
app.include_router(comunicados_router, prefix="/api/v1")
app.include_router(comunicado_destinatario_router, prefix="/api/v1")
app.include_router(recordatorios_router, prefix="/api/v1")
app.include_router(notificaciones_router, prefix="/api/v1")
app.include_router(comunicado_visto_router, prefix="/api/v1")
app.include_router(mensaje_visto_router, prefix="/api/v1")
app.include_router(relacion_usuario_router, prefix="/api/v1")



# ============================================
# ENDPOINTS BÁSICOS
# ============================================

@app.get("/", tags=["Root"])
def root():
    """Endpoint raíz para verificar que la API funciona."""
    return {
        "app": "APP MENSAJERÍA API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """Endpoint de salud para verificar que la API y la DB funcionan."""
    try:
        # Probar conexión a la base de datos
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e),
        }