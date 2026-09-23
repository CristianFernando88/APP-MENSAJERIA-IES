"""Punto de entrada FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import Base, engine
from app import models  # noqa: F401 — registra los modelos en Base.metadata

# aca importamos las rutas
from app.api.v1.usuarios.router import router as usuarios_router
# from app.api.v1.servidores.router import router as servidores_router
# from app.api.v1.categorias.router import router as categorias_router
# from app.api.v1.canales.router import router as canales_router
# from app.api.v1.mensajes.router import router as mensajes_router


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
Base.metadata.create_all(bind=engine)

# Aca van los routers
app.include_router(usuarios_router, prefix="/api/v1")
# app.include_router(servidores_router, prefix="/api/v1/servidores", tags=["Servidores"])
# app.include_router(categorias_router, prefix="/api/v1/categorias", tags=["Categorías"])
# app.include_router(canales_router, prefix="/api/v1/canales", tags=["Canales"])
# app.include_router(mensajes_router, prefix="/api/v1/mensajes", tags=["Mensajes"])


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