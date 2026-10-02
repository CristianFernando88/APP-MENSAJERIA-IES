"""
Script para sembrar datos ficticios en la base de datos.

Uso:
    cd backend
    source venv/bin/activate    # Linux/Mac
    venv\\Scripts\\activate       # Windows
    python seed.py

El script es idempotente: si los datos ya existen, no los duplica.
"""

from app.core.db import SessionLocal, engine, Base
from app import models  # noqa: F401 — registra todos los modelos
from app.models.usuario import Usuario
from app.models.perfil import Perfil
from app.models.rol import Rol
from app.models.servidor import Servidor
from app.models.miembro_servidor import MiembroServidor
from app.models.usuario_rol import UsuarioRol
from app.models.categoria import Categoria
from app.models.canal import Canal
from app.models.miembro_canal import MiembroCanal
from app.models.mensaje import Mensaje
from app.models.mensaje_directo import MensajeDirecto
from app.models.comunicado import Comunicado
from app.models.comunicado_destinatario import ComunicadoDestinatario
from app.models.notificacion import Notificacion
from app.models.recordatorio import Recordatorio
from app.models.relacion_usuario import RelacionUsuario
from datetime import datetime, timedelta


db = SessionLocal()


# ============================================
# HELPERS
# ============================================
def existe(modelo, **filtros):
    """Verifica si un registro ya existe."""
    return db.query(modelo).filter_by(**filtros).first() is not None


def log(mensaje):
    print(f"  → {mensaje}")


# ============================================
# 1. ROLES
# ============================================
def seed_roles():
    print("📋 Sembrando roles...")
    roles = [
        # Globales
        {"nombre": "super_admin", "descripcion": "Control total de la plataforma", "tipo": "global"},
        {"nombre": "admin", "descripcion": "Administrador del sistema", "tipo": "global"},
        {"nombre": "usuario", "descripcion": "Usuario normal del sistema", "tipo": "global"},
        # De servidor
        {"nombre": "director", "descripcion": "Director del colegio", "tipo": "servidor"},
        {"nombre": "profesor", "descripcion": "Profesor del colegio", "tipo": "servidor"},
        {"nombre": "tutor", "descripcion": "Tutor de un alumno", "tipo": "servidor"},
        {"nombre": "alumno", "descripcion": "Alumno del colegio", "tipo": "servidor"},
        {"nombre": "preceptor", "descripcion": "Preceptor del colegio", "tipo": "servidor"},
    ]
    for r in roles:
        if not existe(Rol, nombre=r["nombre"]):
            db.add(Rol(**r))
            log(f"Rol creado: {r['nombre']}")
    db.commit()


# ============================================
# 2. USUARIOS
# ============================================
def seed_usuarios():
    print("👤 Sembrando usuarios...")
    usuarios = [
        {"nombre_usuario": "admin", "email": "admin@colegio.com"},
        {"nombre_usuario": "director", "email": "director@colegio.com"},
        {"nombre_usuario": "juanperez", "email": "juan@colegio.com"},
        {"nombre_usuario": "mariagarcia", "email": "maria@colegio.com"},
        {"nombre_usuario": "pedrolopez", "email": "pedro@colegio.com"},
        {"nombre_usuario": "anamartinez", "email": "ana@colegio.com"},
        {"nombre_usuario": "carloslopez", "email": "carlos@email.com"},
        {"nombre_usuario": "luciafernandez", "email": "lucia@email.com"},
    ]
    for u in usuarios:
        if not existe(Usuario, nombre_usuario=u["nombre_usuario"]):
            db.add(Usuario(**u, activo=True))
            log(f"Usuario creado: {u['nombre_usuario']}")
    db.commit()


# ============================================
# 3. PERFILES
# ============================================
def seed_perfiles():
    print("📇 Sembrando perfiles...")
    perfiles = [
        {"nombre_usuario": "admin", "nombres": "Admin", "apellidos": "Sistema", "biografia": "Administrador del sistema"},
        {"nombre_usuario": "director", "nombres": "Roberto", "apellidos": "Gómez", "biografia": "Director del colegio"},
        {"nombre_usuario": "juanperez", "nombres": "Juan", "apellidos": "Pérez", "biografia": "Profesor de Matemática"},
        {"nombre_usuario": "mariagarcia", "nombres": "María", "apellidos": "García", "biografia": "Profesora de Historia"},
        {"nombre_usuario": "pedrolopez", "nombres": "Pedro", "apellidos": "López", "biografia": "Alumno de 4° Año"},
        {"nombre_usuario": "anamartinez", "nombres": "Ana", "apellidos": "Martínez", "biografia": "Tutora de 4° Año"},
        {"nombre_usuario": "carloslopez", "nombres": "Carlos", "apellidos": "López", "biografia": "Padre de Pedro"},
        {"nombre_usuario": "luciafernandez", "nombres": "Lucía", "apellidos": "Fernández", "biografia": "Madre de Pedro"},
    ]
    for p in perfiles:
        usuario = db.query(Usuario).filter_by(nombre_usuario=p["nombre_usuario"]).first()
        if usuario and not existe(Perfil, usuario_id=usuario.id_usuario):
            db.add(Perfil(
                usuario_id=usuario.id_usuario,
                nombres=p["nombres"],
                apellidos=p["apellidos"],
                biografia=p["biografia"],
            ))
            log(f"Perfil creado para: {p['nombre_usuario']}")
    db.commit()


# ============================================
# 4. SERVIDORES
# ============================================
def seed_servidores():
    print("🏫 Sembrando servidores...")
    admin = db.query(Usuario).filter_by(nombre_usuario="admin").first()
    if not admin:
        return

    servidores = [
        {"nombre": "Secundaria", "descripcion": "Nivel secundario"},
        {"nombre": "Primaria", "descripcion": "Nivel primario"},
    ]
    for s in servidores:
        if not existe(Servidor, nombre=s["nombre"]):
            db.add(Servidor(
                nombre=s["nombre"],
                descripcion=s["descripcion"],
                creador_id=admin.id_usuario,
            ))
            log(f"Servidor creado: {s['nombre']}")
    db.commit()


# ============================================
# 5. MIEMBROS DE SERVIDOR
# ============================================
def seed_miembros_servidor():
    print("👥 Sembrando miembros de servidor...")
    secundaria = db.query(Servidor).filter_by(nombre="Secundaria").first()
    if not secundaria:
        return

    usuarios = ["admin", "director", "juanperez", "mariagarcia", "pedrolopez", "anamartinez", "carloslopez", "luciafernandez"]
    for nombre in usuarios:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and not existe(MiembroServidor, usuario_id=usuario.id_usuario, servidor_id=secundaria.id_servidor):
            db.add(MiembroServidor(
                usuario_id=usuario.id_usuario,
                servidor_id=secundaria.id_servidor,
                activo=True,
            ))
            log(f"Miembro agregado: {nombre}")
    db.commit()


# ============================================
# 6. USUARIO_ROL
# ============================================
def seed_usuario_rol():
    print("🎭 Sembrando roles de usuario...")
    secundaria = db.query(Servidor).filter_by(nombre="Secundaria").first()
    if not secundaria:
        return

    # Roles globales
    rol_usuario = db.query(Rol).filter_by(nombre="usuario").first()
    for nombre in ["director", "juanperez", "mariagarcia", "pedrolopez", "anamartinez", "carloslopez", "luciafernandez"]:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and rol_usuario and not existe(UsuarioRol, usuario_id=usuario.id_usuario, rol_id=rol_usuario.id_rol, servidor_id=None):
            db.add(UsuarioRol(
                usuario_id=usuario.id_usuario,
                rol_id=rol_usuario.id_rol,
                servidor_id=None,
            ))
            log(f"Rol global 'usuario' asignado a: {nombre}")

    # Roles de servidor
    asignaciones = [
        ("director", "director"),
        ("juanperez", "profesor"),
        ("mariagarcia", "profesor"),
        ("pedrolopez", "alumno"),
        ("anamartinez", "tutor"),
        ("carloslopez", "tutor"),
        ("luciafernandez", "tutor"),
    ]
    for nombre_usuario, nombre_rol in asignaciones:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre_usuario).first()
        rol = db.query(Rol).filter_by(nombre=nombre_rol).first()
        if usuario and rol and not existe(UsuarioRol, usuario_id=usuario.id_usuario, rol_id=rol.id_rol, servidor_id=secundaria.id_servidor):
            db.add(UsuarioRol(
                usuario_id=usuario.id_usuario,
                rol_id=rol.id_rol,
                servidor_id=secundaria.id_servidor,
            ))
            log(f"Rol '{nombre_rol}' asignado a: {nombre_usuario}")
    db.commit()


# ============================================
# 7. CATEGORÍAS
# ============================================
def seed_categorias():
    print("📂 Sembrando categorías...")
    secundaria = db.query(Servidor).filter_by(nombre="Secundaria").first()
    if not secundaria:
        return

    categorias = [
        {"nombre": "4° Año", "orden": 1},
        {"nombre": "5° Año", "orden": 2},
        {"nombre": "6° Año", "orden": 3},
    ]
    for c in categorias:
        if not existe(Categoria, nombre=c["nombre"], servidor_id=secundaria.id_servidor):
            db.add(Categoria(
                nombre=c["nombre"],
                servidor_id=secundaria.id_servidor,
                orden=c["orden"],
            ))
            log(f"Categoría creada: {c['nombre']}")
    db.commit()


# ============================================
# 8. CANALES
# ============================================
def seed_canales():
    print("💬 Sembrando canales...")
    secundaria = db.query(Servidor).filter_by(nombre="Secundaria").first()
    admin = db.query(Usuario).filter_by(nombre_usuario="admin").first()
    if not secundaria or not admin:
        return

    canales = [
        {"nombre": "General", "tipo": "chat", "orden": 1},
        {"nombre": "Avisos", "tipo": "informativo", "orden": 2},
        {"nombre": "4° Año - Chat", "tipo": "chat", "orden": 3},
        {"nombre": "4° Año - Avisos", "tipo": "informativo", "orden": 4},
    ]
    for c in canales:
        if not existe(Canal, nombre=c["nombre"], servidor_id=secundaria.id_servidor):
            db.add(Canal(
                nombre=c["nombre"],
                servidor_id=secundaria.id_servidor,
                creador_id=admin.id_usuario,
                tipo=c["tipo"],
                orden=c["orden"],
            ))
            log(f"Canal creado: {c['nombre']} ({c['tipo']})")
    db.commit()


# ============================================
# 9. MIEMBROS DE CANAL
# ============================================
def seed_miembros_canal():
    print("👥 Sembrando miembros de canal...")
    canal_general = db.query(Canal).filter_by(nombre="General").first()
    canal_avisos = db.query(Canal).filter_by(nombre="Avisos").first()
    canal_4to_chat = db.query(Canal).filter_by(nombre="4° Año - Chat").first()
    canal_4to_avisos = db.query(Canal).filter_by(nombre="4° Año - Avisos").first()

    if not canal_general:
        return

    # Todos en General
    todos = ["admin", "director", "juanperez", "mariagarcia", "pedrolopez", "anamartinez", "carloslopez", "luciafernandez"]
    for nombre in todos:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and not existe(MiembroCanal, usuario_id=usuario.id_usuario, canal_id=canal_general.id_canal):
            db.add(MiembroCanal(
                usuario_id=usuario.id_usuario,
                canal_id=canal_general.id_canal,
                rol_en_canal="miembro",
            ))

    # Admin y director en Avisos (como admins)
    for nombre in ["admin", "director"]:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and canal_avisos and not existe(MiembroCanal, usuario_id=usuario.id_usuario, canal_id=canal_avisos.id_canal):
            db.add(MiembroCanal(
                usuario_id=usuario.id_usuario,
                canal_id=canal_avisos.id_canal,
                rol_en_canal="admin",
            ))

    # 4° Año - Chat (profesores y alumnos)
    for nombre in ["juanperez", "mariagarcia", "pedrolopez", "anamartinez"]:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and canal_4to_chat and not existe(MiembroCanal, usuario_id=usuario.id_usuario, canal_id=canal_4to_chat.id_canal):
            rol = "admin" if nombre in ["juanperez", "mariagarcia"] else "miembro"
            db.add(MiembroCanal(
                usuario_id=usuario.id_usuario,
                canal_id=canal_4to_chat.id_canal,
                rol_en_canal=rol,
            ))

    # 4° Año - Avisos (solo profesores como admins)
    for nombre in ["juanperez", "mariagarcia"]:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and canal_4to_avisos and not existe(MiembroCanal, usuario_id=usuario.id_usuario, canal_id=canal_4to_avisos.id_canal):
            db.add(MiembroCanal(
                usuario_id=usuario.id_usuario,
                canal_id=canal_4to_avisos.id_canal,
                rol_en_canal="admin",
            ))

    # Tutores en 4° Año - Avisos (como tutores)
    for nombre in ["carloslopez", "luciafernandez"]:
        usuario = db.query(Usuario).filter_by(nombre_usuario=nombre).first()
        if usuario and canal_4to_avisos and not existe(MiembroCanal, usuario_id=usuario.id_usuario, canal_id=canal_4to_avisos.id_canal):
            db.add(MiembroCanal(
                usuario_id=usuario.id_usuario,
                canal_id=canal_4to_avisos.id_canal,
                rol_en_canal="tutor",
            ))

    db.commit()
    log("Miembros de canal asignados")


# ============================================
# 10. MENSAJES
# ============================================
def seed_mensajes():
    print("💬 Sembrando mensajes...")
    canal_general = db.query(Canal).filter_by(nombre="General").first()
    canal_4to_chat = db.query(Canal).filter_by(nombre="4° Año - Chat").first()
    canal_4to_avisos = db.query(Canal).filter_by(nombre="4° Año - Avisos").first()

    if not canal_general:
        return

    juan = db.query(Usuario).filter_by(nombre_usuario="juanperez").first()
    pedro = db.query(Usuario).filter_by(nombre_usuario="pedrolopez").first()
    maria = db.query(Usuario).filter_by(nombre_usuario="mariagarcia").first()

    mensajes = []

    if canal_general and juan:
        mensajes.append({"contenido": "¡Bienvenidos al servidor Secundaria!", "usuario_id": juan.id_usuario, "canal_id": canal_general.id_canal})

    if canal_4to_chat and pedro:
        mensajes.append({"contenido": "¿Alguien tiene el TP de Matemática?", "usuario_id": pedro.id_usuario, "canal_id": canal_4to_chat.id_canal})

    if canal_4to_chat and maria:
        mensajes.append({"contenido": "Sí, te lo paso por privado", "usuario_id": maria.id_usuario, "canal_id": canal_4to_chat.id_canal})

    if canal_4to_avisos and juan:
        mensajes.append({"contenido": "El TP es para el viernes", "usuario_id": juan.id_usuario, "canal_id": canal_4to_avisos.id_canal})

    for m in mensajes:
        if not existe(Mensaje, contenido=m["contenido"], usuario_id=m["usuario_id"], canal_id=m["canal_id"]):
            db.add(Mensaje(**m))
            log(f"Mensaje creado: {m['contenido'][:30]}...")
    db.commit()


# ============================================
# 11. MENSAJES DIRECTOS
# ============================================
def seed_mensajes_directos():
    print("📨 Sembrando mensajes directos...")
    pedro = db.query(Usuario).filter_by(nombre_usuario="pedrolopez").first()
    juan = db.query(Usuario).filter_by(nombre_usuario="juanperez").first()
    carlos = db.query(Usuario).filter_by(nombre_usuario="carloslopez").first()

    if not pedro or not juan or not carlos:
        return

    mensajes = [
        {"contenido": "Profe, ¿puedo entregar el TP el lunes?", "emisor_id": pedro.id_usuario, "receptor_id": juan.id_usuario},
        {"contenido": "Sí, sin problema", "emisor_id": juan.id_usuario, "receptor_id": pedro.id_usuario},
        {"contenido": "Hola Carlos, Pedro faltó hoy", "emisor_id": juan.id_usuario, "receptor_id": carlos.id_usuario},
    ]
    for m in mensajes:
        if not existe(MensajeDirecto, contenido=m["contenido"], emisor_id=m["emisor_id"], receptor_id=m["receptor_id"]):
            db.add(MensajeDirecto(**m, leido=False))
            log(f"Mensaje directo: {m['contenido'][:30]}...")
    db.commit()


# ============================================
# 12. COMUNICADOS
# ============================================
def seed_comunicados():
    print("📢 Sembrando comunicados...")
    director = db.query(Usuario).filter_by(nombre_usuario="director").first()
    secundaria = db.query(Servidor).filter_by(nombre="Secundaria").first()
    canal_avisos = db.query(Canal).filter_by(nombre="Avisos").first()

    if not director:
        return

    # Comunicado global
    if not existe(Comunicado, titulo="Mantenimiento del sistema"):
        c1 = Comunicado(
            titulo="Mantenimiento del sistema",
            contenido="El sábado el sistema estará offline por mantenimiento.",
            publicado_por=director.id_usuario,
            tipo="global",
        )
        db.add(c1)
        log("Comunicado global creado")

    # Comunicado de servidor
    if secundaria and not existe(Comunicado, titulo="El lunes no hay clases"):
        c2 = Comunicado(
            titulo="El lunes no hay clases",
            contenido="Feriado nacional. No hay clases el lunes.",
            publicado_por=director.id_usuario,
            tipo="servidor",
        )
        db.add(c2)
        db.flush()
        db.add(ComunicadoDestinatario(comunicado_id=c2.id_comunicado, servidor_id=secundaria.id_servidor))
        log("Comunicado de servidor creado")

    # Comunicado a canal
    if canal_avisos and not existe(Comunicado, titulo="Reunión de padres"):
        c3 = Comunicado(
            titulo="Reunión de padres",
            contenido="Reunión de padres el viernes a las 10.",
            publicado_por=director.id_usuario,
            tipo="canal",
        )
        db.add(c3)
        db.flush()
        db.add(ComunicadoDestinatario(comunicado_id=c3.id_comunicado, canal_id=canal_avisos.id_canal))
        log("Comunicado de canal creado")

    db.commit()


# ============================================
# 13. RELACIONES USUARIO
# ============================================
def seed_relaciones():
    print("👨‍👩‍👧 Sembrando relaciones...")
    pedro = db.query(Usuario).filter_by(nombre_usuario="pedrolopez").first()
    carlos = db.query(Usuario).filter_by(nombre_usuario="carloslopez").first()
    lucia = db.query(Usuario).filter_by(nombre_usuario="luciafernandez").first()

    if not pedro:
        return

    if carlos and not existe(RelacionUsuario, usuario_id=pedro.id_usuario, relacionado_id=carlos.id_usuario, tipo="padre"):
        db.add(RelacionUsuario(usuario_id=pedro.id_usuario, relacionado_id=carlos.id_usuario, tipo="padre"))
        log("Relación creada: Pedro ↔ Carlos (padre)")

    if lucia and not existe(RelacionUsuario, usuario_id=pedro.id_usuario, relacionado_id=lucia.id_usuario, tipo="madre"):
        db.add(RelacionUsuario(usuario_id=pedro.id_usuario, relacionado_id=lucia.id_usuario, tipo="madre"))
        log("Relación creada: Pedro ↔ Lucía (madre)")

    db.commit()


# ============================================
# 14. NOTIFICACIONES
# ============================================
def seed_notificaciones():
    print("🔔 Sembrando notificaciones...")
    pedro = db.query(Usuario).filter_by(nombre_usuario="pedrolopez").first()
    carlos = db.query(Usuario).filter_by(nombre_usuario="carloslopez").first()

    if not pedro:
        return

    notifs = [
        {"usuario_id": pedro.id_usuario, "mensaje": "Tenés un nuevo comunicado", "tipo": "comunicado", "enlace": "/comunicados/1"},
    ]
    if carlos:
        notifs.append({"usuario_id": carlos.id_usuario, "mensaje": "Nuevo aviso en 4° Año", "tipo": "canal", "enlace": "/canales/4"})

    for n in notifs:
        if not existe(Notificacion, usuario_id=n["usuario_id"], mensaje=n["mensaje"]):
            db.add(Notificacion(**n, leida=False))
            log(f"Notificación: {n['mensaje']}")
    db.commit()


# ============================================
# 15. RECORDATORIOS
# ============================================
def seed_recordatorios():
    print("📅 Sembrando recordatorios...")
    juan = db.query(Usuario).filter_by(nombre_usuario="juanperez").first()
    pedro = db.query(Usuario).filter_by(nombre_usuario="pedrolopez").first()

    recordatorios = []
    if juan:
        recordatorios.append({"usuario_id": juan.id_usuario, "titulo": "Corregir exámenes", "descripcion": "Corregir los exámenes de 4° año", "fecha_limite": datetime.utcnow() + timedelta(days=3)})
    if pedro:
        recordatorios.append({"usuario_id": pedro.id_usuario, "titulo": "Estudiar para el examen", "descripcion": "Estudiar Matemática", "fecha_limite": datetime.utcnow() + timedelta(days=5)})

    for r in recordatorios:
        if not existe(Recordatorio, usuario_id=r["usuario_id"], titulo=r["titulo"]):
            db.add(Recordatorio(**r, completado=False))
            log(f"Recordatorio: {r['titulo']}")
    db.commit()


# ============================================
# MAIN
# ============================================
def main():
    print("🌱 Iniciando seed de la base de datos...\n")

    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)

    # Sembrar datos en orden
    seed_roles()
    seed_usuarios()
    seed_perfiles()
    seed_servidores()
    seed_miembros_servidor()
    seed_usuario_rol()
    seed_categorias()
    seed_canales()
    seed_miembros_canal()
    seed_mensajes()
    seed_mensajes_directos()
    seed_comunicados()
    seed_relaciones()
    seed_notificaciones()
    seed_recordatorios()

    print("\n🎉 Seed completado exitosamente")
    print("\n📊 Datos sembrados:")
    print(f"  - Roles: {db.query(Rol).count()}")
    print(f"  - Usuarios: {db.query(Usuario).count()}")
    print(f"  - Perfiles: {db.query(Perfil).count()}")
    print(f"  - Servidores: {db.query(Servidor).count()}")
    print(f"  - Categorías: {db.query(Categoria).count()}")
    print(f"  - Canales: {db.query(Canal).count()}")
    print(f"  - Mensajes: {db.query(Mensaje).count()}")
    print(f"  - Mensajes directos: {db.query(MensajeDirecto).count()}")
    print(f"  - Comunicados: {db.query(Comunicado).count()}")
    print(f"  - Notificaciones: {db.query(Notificacion).count()}")
    print(f"  - Recordatorios: {db.query(Recordatorio).count()}")

    db.close()


if __name__ == "__main__":
    main()