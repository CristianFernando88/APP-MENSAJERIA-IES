# backend/reset_db.py
"""
Script para limpiar la base de datos y recrear las tablas vacías.

Uso:
    python reset_db.py

- Pide confirmación escribiendo "SI" (mayúsculas).
- Borra TODAS las tablas definidas en los modelos.
- Las vuelve a crear vacías.
- NO ejecuta el seed. Después de esto, correr: python seed.py

⚠️  ADVERTENCIA: elimina todos los datos. No usar en producción.

Notas:
- Funciona tanto con SQLite (dev) como con PostgreSQL (si DATABASE_URL está configurada).
- Para PostgreSQL usa DROP TABLE ... CASCADE vía metadata.drop_all.
- Las migraciones de Alembic NO se tocan: solo se recrean tablas a partir de los modelos.
  Si necesitas resetear también el historial de Alembic, hazlo manualmente.
"""

import sys
from app.core.db import engine, Base
# Importar todos los modelos para que estén registrados en Base.metadata
from app import models  # noqa: F401


def confirmar() -> bool:
    print("=" * 60)
    print("  RESET DE BASE DE DATOS — APP MENSAJERÍA IES")
    print("=" * 60)
    print(f"  Motor: {engine.url.get_backend_name()}")
    print(f"  Base : {engine.url.database}")
    print("-" * 60)
    print("  ⚠️  Esto ELIMINARÁ TODAS LAS TABLAS y sus datos.")
    print("  ⚠️  Después deberás ejecutar: python seed.py")
    print("=" * 60)
    respuesta = input('  Escribe "SI" para continuar: ').strip()
    return respuesta == "SI"


def reset_db() -> None:
    print("\n[1/2] Eliminando tablas...")
    Base.metadata.drop_all(bind=engine)
    print("      ✔ Tablas eliminadas.")

    print("[2/2] Creando tablas vacías...")
    Base.metadata.create_all(bind=engine)
    print("      ✔ Tablas creadas.")

    print("\n✅ Base de datos reseteada.")
    print("   Siguiente paso: python seed.py\n")


def main() -> int:
    if not confirmar():
        print("\n❌ Operación cancelada. No se modificó la base de datos.\n")
        return 1

    try:
        reset_db()
    except Exception as exc:
        print(f"\n❌ Error durante el reset: {exc}\n")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())