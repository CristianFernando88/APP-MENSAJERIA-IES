# backend/seed.py
"""
Seed de datos de demostración para APP MENSAJERÍA IES.

Ejecutar DESPUÉS de reset_db.py:
    python reset_db.py
    python seed.py

Características:
- Idempotente: se puede ejecutar varias veces sin duplicar datos.
- Crea 35 usuarios (19 originales + 16 ficticios para poblar Primaria/Inicial).
- 4 servidores: Secundaria, Primaria, Inicial, General.
- Canales informativos por curso + Salas de Profesores + #general.
- Relaciones tutor↔alumno (usuario_id=tutor, relacionado_id=alumno, tipo='tutor').
- Mensajes, MDs, comunicados, notificaciones y recordatorios de ejemplo.

⚠️  Contraseñas en texto plano SOLO aquí; se hashean con hashear_password().
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.core.security import hashear_password
from app import models as m


# ============================================================================
# HELPERS
# ============================================================================

def _get_usuario(db: Session, nombre_usuario: str):
    return db.query(m.Usuario).filter(m.Usuario.nombre_usuario == nombre_usuario).first()


def _get_rol(db: Session, nombre: str):
    return db.query(m.Rol).filter(m.Rol.nombre == nombre).first()


def _get_servidor(db: Session, nombre: str):
    return db.query(m.Servidor).filter(m.Servidor.nombre == nombre).first()


def _get_canal(db: Session, servidor_id: int, nombre: str):
    return (
        db.query(m.Canal)
        .filter(m.Canal.servidor_id == servidor_id, m.Canal.nombre == nombre)
        .first()
    )


def _get_categoria(db: Session, servidor_id: int, nombre: str):
    return (
        db.query(m.Categoria)
        .filter(m.Categoria.servidor_id == servidor_id, m.Categoria.nombre == nombre)
        .first()
    )


def _crear_usuario_si_no_existe(db: Session, nombre_usuario: str, email: str, password: str) -> m.Usuario:
    u = _get_usuario(db, nombre_usuario)
    if u:
        return u
    u = m.Usuario(
        nombre_usuario=nombre_usuario,
        email=email,
        contrasena_hash=hashear_password(password),
        activo=True,
    )
    db.add(u)
    db.flush()
    return u


def _asignar_rol(db: Session, usuario: m.Usuario, rol_nombre: str, servidor_id: int | None = None):
    rol = _get_rol(db, rol_nombre)
    if not rol:
        print(f"   ⚠️  Rol '{rol_nombre}' no existe, se omite asignación a {usuario.nombre_usuario}")
        return
    q = db.query(m.UsuarioRol).filter(
        m.UsuarioRol.usuario_id == usuario.id_usuario,
        m.UsuarioRol.rol_id == rol.id_rol,
    )
    if servidor_id is None:
        q = q.filter(m.UsuarioRol.servidor_id.is_(None))
    else:
        q = q.filter(m.UsuarioRol.servidor_id == servidor_id)
    if q.first():
        return
    db.add(m.UsuarioRol(usuario_id=usuario.id_usuario, rol_id=rol.id_rol, servidor_id=servidor_id))


def _agregar_miembro_servidor(db: Session, usuario: m.Usuario, servidor: m.Servidor):
    existe = (
        db.query(m.MiembroServidor)
        .filter(
            m.MiembroServidor.usuario_id == usuario.id_usuario,
            m.MiembroServidor.servidor_id == servidor.id_servidor,
        )
        .first()
    )
    if existe:
        return
    db.add(m.MiembroServidor(usuario_id=usuario.id_usuario, servidor_id=servidor.id_servidor, activo=True))


def _agregar_miembro_canal(db: Session, usuario: m.Usuario, canal: m.Canal, rol_en_canal: str = "miembro"):
    existe = (
        db.query(m.MiembroCanal)
        .filter(
            m.MiembroCanal.usuario_id == usuario.id_usuario,
            m.MiembroCanal.canal_id == canal.id_canal,
        )
        .first()
    )
    if existe:
        return
    db.add(
        m.MiembroCanal(
            usuario_id=usuario.id_usuario,
            canal_id=canal.id_canal,
            rol_en_canal=rol_en_canal,
        )
    )


# ============================================================================
# 1. USUARIOS
# ============================================================================

def seed_usuarios(db: Session) -> dict:
    print("→ Sembrando usuarios...")
    datos = [
        # (nombre_usuario, email, password)
        ("superadmin",       "superadmin@ies.edu.ar",       "admin123"),
        ("admin",            "admin@ies.edu.ar",            "admin123"),
        ("director",         "director@ies.edu.ar",         "director123"),
        ("vicedirector",     "vicedirector@ies.edu.ar",     "director123"),
        ("juanperez",        "juanperez@ies.edu.ar",        "profesor123"),
        ("mariagarcia",      "mariagarcia@ies.edu.ar",      "profesor123"),
        ("carlosruiz",       "carlosruiz@ies.edu.ar",       "profesor123"),
        ("pedrolopez",       "pedrolopez@ies.edu.ar",       "alumno123"),
        ("sofiagonzalez",    "sofiagonzalez@ies.edu.ar",    "alumno123"),
        ("martinrodriguez",  "martinrodriguez@ies.edu.ar",  "alumno123"),
        ("lauraperez",       "lauraperez@ies.edu.ar",       "tutor123"),
        ("carloslopez",      "carloslopez@ies.edu.ar",      "tutor123"),
        ("luciafernandez",   "luciafernandez@ies.edu.ar",   "tutor123"),
        ("maestrojose",      "maestrojose@ies.edu.ar",      "profesor123"),
        ("nenejuancito",     "nenejuancito@ies.edu.ar",     "alumno123"),
        ("mama_juancito",    "mama_juancito@ies.edu.ar",    "tutor123"),
        ("señoinicial",      "senoinicial@ies.edu.ar",      "profesor123"),
        ("nene_tomas",       "nene_tomas@ies.edu.ar",       "alumno123"),
        ("papa_tomas",       "papa_tomas@ies.edu.ar",       "tutor123"),
        # --- Ficticios Primaria 2°–7° ---
        ("alumno2primaria", "alumno2primaria@ies.edu.ar", "alumno123"),
        ("alumno3primaria", "alumno3primaria@ies.edu.ar", "alumno123"),
        ("alumno4primaria", "alumno4primaria@ies.edu.ar", "alumno123"),
        ("alumno5primaria", "alumno5primaria@ies.edu.ar", "alumno123"),
        ("alumno6primaria", "alumno6primaria@ies.edu.ar", "alumno123"),
        ("alumno7primaria", "alumno7primaria@ies.edu.ar", "alumno123"),
        ("tutor2primaria",  "tutor2primaria@ies.edu.ar",  "tutor123"),
        ("tutor3primaria",  "tutor3primaria@ies.edu.ar",  "tutor123"),
        ("tutor4primaria",  "tutor4primaria@ies.edu.ar",  "tutor123"),
        ("tutor5primaria",  "tutor5primaria@ies.edu.ar",  "tutor123"),
        ("tutor6primaria",  "tutor6primaria@ies.edu.ar",  "tutor123"),
        ("tutor7primaria",  "tutor7primaria@ies.edu.ar",  "tutor123"),
        # --- Ficticios Inicial Sala 3 y Sala 4 ---
        ("nene_sala3",  "nene_sala3@ies.edu.ar",  "alumno123"),
        ("nene_sala4",  "nene_sala4@ies.edu.ar",  "alumno123"),
        ("mama_sala3",  "mama_sala3@ies.edu.ar",  "tutor123"),
        ("mama_sala4",  "mama_sala4@ies.edu.ar",  "tutor123"),
    ]
    for nombre, email, pw in datos:
        _crear_usuario_si_no_existe(db, nombre, email, pw)
    db.flush()
    print(f"   ✔ {len(datos)} usuarios verificados/creados.")
    return {n: _get_usuario(db, n) for n, _, _ in datos}

# ============================================================================
# 1.b PERFILES
# ============================================================================

def seed_perfiles(db: Session, usuarios: dict):
    print("→ Sembrando perfiles...")
    # (nombre_usuario, nombres, apellidos, dni, biografia)
    datos = [
        ("superadmin",       "Super",     "Administrador",  "10000001", "Cuenta de superadministración del sistema."),
        ("admin",            "Admin",     "Institucional",  "10000002", "Administración general del IES."),
        ("director",         "Roberto",   "Fernández",      "10000003", "Director del Instituto de Educación Secundaria."),
        ("vicedirector",     "Silvina",   "Martínez",       "10000004", "Vicedirectora del IES."),
        ("juanperez",        "Juan",      "Pérez",          "20000001", "Profesor de Matemática — Secundaria."),
        ("mariagarcia",      "María",     "García",         "20000002", "Profesora de Lengua — Secundaria."),
        ("carlosruiz",       "Carlos",    "Ruiz",           "20000003", "Profesor de Historia — Secundaria. Tutor de Tomás en Inicial."),
        ("pedrolopez",       "Pedro",     "López",          "30000001", "Alumno de 1° Año A — Secundaria."),
        ("sofiagonzalez",    "Sofía",     "González",       "30000002", "Alumna de 2° Año A — Secundaria."),
        ("martinrodriguez",  "Martín",    "Rodríguez",      "30000003", "Alumno de 3° Año A — Secundaria."),
        ("lauraperez",       "Laura",     "Pérez",          "40000001", "Tutora de Pedro López."),
        ("carloslopez",      "Carlos",    "López",          "40000002", "Tutor de Sofía González."),
        ("luciafernandez",   "Lucía",     "Fernández",      "40000003", "Tutora de Martín Rodríguez."),
        ("maestrojose",      "José",      "Ramírez",        "20000004", "Maestro de 1° a 7° Grado — Primaria."),
        ("nenejuancito",     "Juan",      "Pérez",          "30000004", "Alumno de 1° Grado A — Primaria."),
        ("mama_juancito",    "Ana",       "Pérez",          "40000004", "Mamá de Juanito — Primaria."),
        ("señoinicial",      "Marta",     "Sosa",           "20000005", "Señorita de Sala 3, 4 y 5 — Inicial."),
        ("nene_tomas",       "Tomás",     "Ruiz",           "30000005", "Alumno de Sala 5 — Inicial."),
        ("papa_tomas",       "Diego",     "Ruiz",           "40000005", "Papá de Tomás — Inicial."),
        # Ficticios Primaria 2°–7°
        ("alumno2primaria", "Lucas",   "Gómez",     "30000102", "Alumno de 2° Grado A — Primaria."),
        ("alumno3primaria", "Valentina","Díaz",     "30000103", "Alumna de 3° Grado A — Primaria."),
        ("alumno4primaria", "Mateo",    "Acosta",   "30000104", "Alumno de 4° Grado A — Primaria."),
        ("alumno5primaria", "Camila",   "Romero",   "30000105", "Alumna de 5° Grado A — Primaria."),
        ("alumno6primaria", "Benjamín", "Torres",   "30000106", "Alumno de 6° Grado A — Primaria."),
        ("alumno7primaria", "Martina",  "Silva",    "30000107", "Alumna de 7° Grado A — Primaria."),
        ("tutor2primaria",  "Verónica", "Gómez",    "40000102", "Tutora de Lucas Gómez."),
        ("tutor3primaria",  "Federico", "Díaz",     "40000103", "Tutor de Valentina Díaz."),
        ("tutor4primaria",  "Mariana",  "Acosta",   "40000104", "Tutora de Mateo Acosta."),
        ("tutor5primaria",  "Andrés",   "Romero",   "40000105", "Tutor de Camila Romero."),
        ("tutor6primaria",  "Paula",    "Torres",   "40000106", "Tutora de Benjamín Torres."),
        ("tutor7primaria",  "Gustavo",  "Silva",    "40000107", "Tutor de Martina Silva."),
        # Ficticios Inicial
        ("nene_sala3",      "Emma",     "Suárez",   "30000203", "Alumna de Sala 3 — Inicial."),
        ("nene_sala4",      "Santiago", "Molina",   "30000204", "Alumno de Sala 4 — Inicial."),
        ("mama_sala3",      "Carolina", "Suárez",   "40000203", "Mamá de Emma Suárez."),
        ("mama_sala4",      "Pablo",    "Molina",   "40000204", "Papá de Santiago Molina."),
    ]

    creados = 0
    for nombre_usuario, nombres, apellidos, dni, bio in datos:
        u = usuarios.get(nombre_usuario)
        if not u:
            print(f"   ⚠️  Usuario '{nombre_usuario}' no existe, se omite perfil.")
            continue
        existe = db.query(m.Perfil).filter(m.Perfil.usuario_id == u.id_usuario).first()
        if existe:
            continue
        db.add(m.Perfil(
            usuario_id=u.id_usuario,
            nombres=nombres,
            apellidos=apellidos,
            dni=dni,
            biografia=bio,
            foto_perfil=None,  # sin foto; el frontend muestra iniciales
        ))
        creados += 1

    db.flush()
    print(f"   ✔ {creados} perfiles nuevos (total esperado: {len(datos)}).")

# ============================================================================
# 2. ROLES
# ============================================================================

def seed_roles(db: Session) -> dict:
    print("→ Sembrando roles...")
    datos = [
        ("super_admin", "Super administrador global",   "global"),
        ("admin",       "Administrador global",         "global"),
        ("director",    "Director institucional",       "global"),
        ("profesor",    "Profesor",                     "servidor"),
        ("alumno",      "Alumno",                       "servidor"),
        ("tutor",       "Tutor / familia",              "servidor"),
    ]
    for nombre, desc, tipo in datos:
        if _get_rol(db, nombre):
            continue
        db.add(m.Rol(nombre=nombre, descripcion=desc, tipo=tipo))
    db.flush()
    print(f"   ✔ {len(datos)} roles verificados/creados.")
    return {n: _get_rol(db, n) for n, _, _ in datos}


# ============================================================================
# 3. SERVIDORES
# ============================================================================

def seed_servidores(db: Session, usuarios: dict) -> dict:
    print("→ Sembrando servidores...")
    creador = usuarios["superadmin"]
    datos = [
        ("Secundaria", "Nivel Secundario — Ciclo Básico y Orientado"),
        ("Primaria",   "Nivel Primario — 1° a 7° Grado"),
        ("Inicial",    "Nivel Inicial — Salas 3, 4 y 5"),
        ("General",    "Servidor institucional común"),
    ]
    for nombre, desc in datos:
        if _get_servidor(db, nombre):
            continue
        db.add(m.Servidor(nombre=nombre, descripcion=desc, creador_id=creador.id_usuario))
    db.flush()
    print(f"   ✔ {len(datos)} servidores verificados/creados.")
    return {n: _get_servidor(db, n) for n, _ in datos}


# ============================================================================
# 4. CATEGORÍAS
# ============================================================================

def seed_categorias(db: Session, servidores: dict) -> dict:
    print("→ Sembrando categorías...")
    # Secundaria
    cat_sec_basico = _get_categoria(db, servidores["Secundaria"].id_servidor, "Ciclo Básico")
    if not cat_sec_basico:
        cat_sec_basico = m.Categoria(
            nombre="Ciclo Básico",
            descripcion="1° a 3° Año",
            servidor_id=servidores["Secundaria"].id_servidor,
            orden=1,
        )
        db.add(cat_sec_basico)
        db.flush()

    cat_sec_orientado = _get_categoria(db, servidores["Secundaria"].id_servidor, "Ciclo Orientado")
    if not cat_sec_orientado:
        cat_sec_orientado = m.Categoria(
            nombre="Ciclo Orientado",
            descripcion="4° a 5° Año",
            servidor_id=servidores["Secundaria"].id_servidor,
            orden=2,
        )
        db.add(cat_sec_orientado)
        db.flush()

    # Primaria
    cat_prim = _get_categoria(db, servidores["Primaria"].id_servidor, "Primaria")
    if not cat_prim:
        cat_prim = m.Categoria(
            nombre="Primaria",
            descripcion="1° a 7° Grado",
            servidor_id=servidores["Primaria"].id_servidor,
            orden=1,
        )
        db.add(cat_prim)
        db.flush()

    # Inicial
    cat_ini = _get_categoria(db, servidores["Inicial"].id_servidor, "Inicial")
    if not cat_ini:
        cat_ini = m.Categoria(
            nombre="Inicial",
            descripcion="Salas 3, 4 y 5",
            servidor_id=servidores["Inicial"].id_servidor,
            orden=1,
        )
        db.add(cat_ini)
        db.flush()

    print("   ✔ 4 categorías verificadas/creadas.")
    return {
        "sec_basico": cat_sec_basico,
        "sec_orientado": cat_sec_orientado,
        "primaria": cat_prim,
        "inicial": cat_ini,
    }


# ============================================================================
# 5. CANALES
# ============================================================================

def seed_canales(db: Session, servidores: dict, categorias: dict, usuarios: dict) -> dict:
    print("→ Sembrando canales...")
    creador = usuarios["superadmin"]
    canales = {}

    # ---- Secundaria ----
    sec = servidores["Secundaria"]
    cursos_sec = [
        ("1° Año A", categorias["sec_basico"].id_categoria),
        ("2° Año A", categorias["sec_basico"].id_categoria),
        ("3° Año A", categorias["sec_basico"].id_categoria),
        ("4° Año A", categorias["sec_orientado"].id_categoria),
        ("5° Año A", categorias["sec_orientado"].id_categoria),
    ]
    for orden, (nombre, cat_id) in enumerate(cursos_sec, start=1):
        c = _get_canal(db, sec.id_servidor, nombre)
        if not c:
            c = m.Canal(
                nombre=nombre, servidor_id=sec.id_servidor, creador_id=creador.id_usuario,
                categoria_id=cat_id, tipo="informativo", orden=orden,
            )
            db.add(c)
            db.flush()
        canales[nombre] = c

    c = _get_canal(db, sec.id_servidor, "Sala de Profesores")
    if not c:
        c = m.Canal(
            nombre="Sala de Profesores", servidor_id=sec.id_servidor,
            creador_id=creador.id_usuario, tipo="chat", orden=99,
            descripcion="Canal de coordinación docente de Secundaria",
        )
        db.add(c)
        db.flush()
    canales["Sala de Profesores Secundaria"] = c

    # ---- Primaria ----
    prim = servidores["Primaria"]
    grados_prim = [f"{g}° Grado A" for g in range(1, 8)]
    for orden, nombre in enumerate(grados_prim, start=1):
        c = _get_canal(db, prim.id_servidor, nombre)
        if not c:
            c = m.Canal(
                nombre=nombre, servidor_id=prim.id_servidor, creador_id=creador.id_usuario,
                categoria_id=categorias["primaria"].id_categoria, tipo="informativo", orden=orden,
            )
            db.add(c)
            db.flush()
        canales[nombre] = c

    c = _get_canal(db, prim.id_servidor, "Sala de Profesores")
    if not c:
        c = m.Canal(
            nombre="Sala de Profesores", servidor_id=prim.id_servidor,
            creador_id=creador.id_usuario, tipo="chat", orden=99,
            descripcion="Canal de coordinación docente de Primaria",
        )
        db.add(c)
        db.flush()
    canales["Sala de Profesores Primaria"] = c

    # ---- Inicial ----
    ini = servidores["Inicial"]
    salas_ini = ["Sala 3", "Sala 4", "Sala 5"]
    for orden, nombre in enumerate(salas_ini, start=1):
        c = _get_canal(db, ini.id_servidor, nombre)
        if not c:
            c = m.Canal(
                nombre=nombre, servidor_id=ini.id_servidor, creador_id=creador.id_usuario,
                categoria_id=categorias["inicial"].id_categoria, tipo="informativo", orden=orden,
            )
            db.add(c)
            db.flush()
        canales[nombre] = c

    c = _get_canal(db, ini.id_servidor, "Sala de Profesores")
    if not c:
        c = m.Canal(
            nombre="Sala de Profesores", servidor_id=ini.id_servidor,
            creador_id=creador.id_usuario, tipo="chat", orden=99,
            descripcion="Canal de coordinación docente de Inicial",
        )
        db.add(c)
        db.flush()
    canales["Sala de Profesores Inicial"] = c

    # ---- General ----
    gen = servidores["General"]
    c = _get_canal(db, gen.id_servidor, "general")
    if not c:
        c = m.Canal(
            nombre="general", servidor_id=gen.id_servidor, creador_id=creador.id_usuario,
            tipo="chat", orden=1, descripcion="Canal general del instituto",
        )
        db.add(c)
        db.flush()
    canales["general"] = c

    print(f"   ✔ {len(canales)} canales verificados/creados.")
    return canales


# ============================================================================
# 6. USUARIO_ROL
# ============================================================================

def seed_usuario_rol(db: Session, usuarios: dict, servidores: dict):
    print("→ Sembrando asignaciones de roles...")
    sec_id = servidores["Secundaria"].id_servidor
    prim_id = servidores["Primaria"].id_servidor
    ini_id = servidores["Inicial"].id_servidor

    # Globales
    _asignar_rol(db, usuarios["superadmin"], "super_admin")
    _asignar_rol(db, usuarios["admin"], "admin")
    _asignar_rol(db, usuarios["director"], "director")
    _asignar_rol(db, usuarios["vicedirector"], "director")

    # Secundaria
    _asignar_rol(db, usuarios["director"], "director", sec_id)
    _asignar_rol(db, usuarios["vicedirector"], "director", sec_id)
    for n in ("juanperez", "mariagarcia", "carlosruiz"):
        _asignar_rol(db, usuarios[n], "profesor", sec_id)
    for n in ("pedrolopez", "sofiagonzalez", "martinrodriguez"):
        _asignar_rol(db, usuarios[n], "alumno", sec_id)
    for n in ("lauraperez", "carloslopez", "luciafernandez"):
        _asignar_rol(db, usuarios[n], "tutor", sec_id)

    # Primaria
    _asignar_rol(db, usuarios["director"], "director", prim_id)
    _asignar_rol(db, usuarios["maestrojose"], "profesor", prim_id)
    _asignar_rol(db, usuarios["nenejuancito"], "alumno", prim_id)
    _asignar_rol(db, usuarios["mama_juancito"], "tutor", prim_id)
    for i in range(2, 8):
        _asignar_rol(db, usuarios[f"alumno{i}primaria"], "alumno", prim_id)
        _asignar_rol(db, usuarios[f"tutor{i}primaria"], "tutor", prim_id)

    # Inicial
    _asignar_rol(db, usuarios["director"], "director", ini_id)
    _asignar_rol(db, usuarios["señoinicial"], "profesor", ini_id)
    _asignar_rol(db, usuarios["nene_tomas"], "alumno", ini_id)
    _asignar_rol(db, usuarios["papa_tomas"], "tutor", ini_id)
    _asignar_rol(db, usuarios["nene_sala3"], "alumno", ini_id)
    _asignar_rol(db, usuarios["nene_sala4"], "alumno", ini_id)
    _asignar_rol(db, usuarios["mama_sala3"], "tutor", ini_id)
    _asignar_rol(db, usuarios["mama_sala4"], "tutor", ini_id)
    # carlosruiz es profesor-tutor: profesor en Secundaria (ya asignado)
    # y tutor de nene_tomas en Inicial (rol tutor en Inicial)
    _asignar_rol(db, usuarios["carlosruiz"], "tutor", ini_id)

    db.flush()
    print("   ✔ Roles asignados.")


# ============================================================================
# 7. MIEMBRO_SERVIDOR
# ============================================================================

def seed_miembros_servidor(db: Session, usuarios: dict, servidores: dict):
    print("→ Sembrando miembros de servidor...")
    # Staff institucional en los 3 servidores educativos
    staff = ["superadmin", "admin", "director", "vicedirector"]
    for srv in ("Secundaria", "Primaria", "Inicial"):
        for n in staff:
            _agregar_miembro_servidor(db, usuarios[n], servidores[srv])

    # Secundaria: profesores y alumnos
    for n in ("juanperez", "mariagarcia", "carlosruiz",
              "pedrolopez", "sofiagonzalez", "martinrodriguez"):
        _agregar_miembro_servidor(db, usuarios[n], servidores["Secundaria"])

    # Primaria: maestro y alumnos
    _agregar_miembro_servidor(db, usuarios["maestrojose"], servidores["Primaria"])
    _agregar_miembro_servidor(db, usuarios["nenejuancito"], servidores["Primaria"])
    for i in range(2, 8):
        _agregar_miembro_servidor(db, usuarios[f"alumno{i}primaria"], servidores["Primaria"])

    # Inicial: señoinicial y alumnos
    _agregar_miembro_servidor(db, usuarios["señoinicial"], servidores["Inicial"])
    for n in ("nene_tomas", "nene_sala3", "nene_sala4"):
        _agregar_miembro_servidor(db, usuarios[n], servidores["Inicial"])

    # General: todos los institucionales (no tutores puros)
    institucionales = [
        "superadmin", "admin", "director", "vicedirector",
        "juanperez", "mariagarcia", "carlosruiz",
        "pedrolopez", "sofiagonzalez", "martinrodriguez",
        "maestrojose", "nenejuancito",
        "señoinicial", "nene_tomas", "nene_sala3", "nene_sala4",
    ] + [f"alumno{i}primaria" for i in range(2, 8)]
    for n in institucionales:
        _agregar_miembro_servidor(db, usuarios[n], servidores["General"])

    db.flush()
    print("   ✔ Miembros de servidor asignados.")


# ============================================================================
# 8. MIEMBRO_CANAL
# ============================================================================

def seed_miembros_canal(db: Session, usuarios: dict, servidores: dict, canales: dict):
    print("→ Sembrando miembros de canal...")
    director = usuarios["director"]
    vicedirector = usuarios["vicedirector"]

    # ---------- SECUNDARIA ----------
    # Cursos informativos
    mapa_sec = {
        "1° Año A": (["pedrolopez"], ["juanperez"]),
        "2° Año A": (["sofiagonzalez"], ["mariagarcia"]),
        "3° Año A": (["martinrodriguez"], ["juanperez"]),
        "4° Año A": ([], ["mariagarcia"]),
        "5° Año A": ([], ["carlosruiz"]),
    }
    for curso, (alumnos, profes) in mapa_sec.items():
        canal = canales[curso]
        for a in alumnos:
            _agregar_miembro_canal(db, usuarios[a], canal, "miembro")
        for p in profes:
            _agregar_miembro_canal(db, usuarios[p], canal, "admin")
        _agregar_miembro_canal(db, director, canal, "admin")

    # Sala de Profesores Secundaria
    sala_sec = canales["Sala de Profesores Secundaria"]
    for p in ("juanperez", "mariagarcia", "carlosruiz"):
        _agregar_miembro_canal(db, usuarios[p], sala_sec, "miembro")
    _agregar_miembro_canal(db, director, sala_sec, "admin")
    _agregar_miembro_canal(db, vicedirector, sala_sec, "admin")

    # ---------- PRIMARIA ----------
    maestro = usuarios["maestrojose"]
    # 1° Grado: nenejuancito
    c1 = canales["1° Grado A"]
    _agregar_miembro_canal(db, usuarios["nenejuancito"], c1, "miembro")
    _agregar_miembro_canal(db, maestro, c1, "admin")
    _agregar_miembro_canal(db, director, c1, "admin")
    # 2°–7° Grado: alumno ficticio
    for i in range(2, 8):
        c = canales[f"{i}° Grado A"]
        _agregar_miembro_canal(db, usuarios[f"alumno{i}primaria"], c, "miembro")
        _agregar_miembro_canal(db, maestro, c, "admin")
        _agregar_miembro_canal(db, director, c, "admin")

    sala_prim = canales["Sala de Profesores Primaria"]
    _agregar_miembro_canal(db, maestro, sala_prim, "miembro")
    _agregar_miembro_canal(db, director, sala_prim, "admin")
    _agregar_miembro_canal(db, vicedirector, sala_prim, "admin")

    # ---------- INICIAL ----------
    seño = usuarios["señoinicial"]
    mapa_ini = {
        "Sala 3": "nene_sala3",
        "Sala 4": "nene_sala4",
        "Sala 5": "nene_tomas",
    }
    for sala, alumno in mapa_ini.items():
        c = canales[sala]
        _agregar_miembro_canal(db, usuarios[alumno], c, "miembro")
        _agregar_miembro_canal(db, seño, c, "admin")
        _agregar_miembro_canal(db, director, c, "admin")

    sala_ini = canales["Sala de Profesores Inicial"]
    _agregar_miembro_canal(db, seño, sala_ini, "miembro")
    _agregar_miembro_canal(db, director, sala_ini, "admin")
    _agregar_miembro_canal(db, vicedirector, sala_ini, "admin")

    # ---------- GENERAL ----------
    gen = canales["general"]
    institucionales = [
        "juanperez", "mariagarcia", "carlosruiz",
        "pedrolopez", "sofiagonzalez", "martinrodriguez",
        "maestrojose", "nenejuancito",
        "señoinicial", "nene_tomas", "nene_sala3", "nene_sala4",
    ] + [f"alumno{i}primaria" for i in range(2, 8)]
    for n in institucionales:
        _agregar_miembro_canal(db, usuarios[n], gen, "miembro")
    for n in ("director", "admin", "superadmin"):
        _agregar_miembro_canal(db, usuarios[n], gen, "admin")

    db.flush()
    print("   ✔ Miembros de canal asignados.")


# ============================================================================
# 9. RELACIONES
# ============================================================================

def seed_relaciones(db: Session, usuarios: dict):
    print("→ Sembrando relaciones tutor↔alumno...")
    # Opción A: usuario_id = tutor, relacionado_id = alumno
    pares = [
        ("lauraperez",     "pedrolopez"),
        ("carloslopez",    "sofiagonzalez"),
        ("luciafernandez", "martinrodriguez"),
        ("mama_juancito",  "nenejuancito"),
        ("papa_tomas",     "nene_tomas"),
        ("carlosruiz",     "nene_tomas"),      # profesor-tutor
        ("tutor2primaria", "alumno2primaria"),
        ("tutor3primaria", "alumno3primaria"),
        ("tutor4primaria", "alumno4primaria"),
        ("tutor5primaria", "alumno5primaria"),
        ("tutor6primaria", "alumno6primaria"),
        ("tutor7primaria", "alumno7primaria"),
        ("mama_sala3",     "nene_sala3"),
        ("mama_sala4",     "nene_sala4"),
    ]
    creadas = 0
    for tutor_n, alumno_n in pares:
        tutor = usuarios[tutor_n]
        alumno = usuarios[alumno_n]
        existe = (
            db.query(m.RelacionUsuario)
            .filter(
                m.RelacionUsuario.usuario_id == tutor.id_usuario,
                m.RelacionUsuario.relacionado_id == alumno.id_usuario,
                m.RelacionUsuario.tipo == "tutor",
            )
            .first()
        )
        if existe:
            continue
        db.add(
            m.RelacionUsuario(
                usuario_id=tutor.id_usuario,
                relacionado_id=alumno.id_usuario,
                tipo="tutor",
            )
        )
        creadas += 1
    db.flush()
    print(f"   ✔ {creadas} relaciones nuevas (total esperado: {len(pares)}).")


# ============================================================================
# 10. MENSAJES EN CANALES
# ============================================================================

def seed_mensajes(db: Session, usuarios: dict, canales: dict):
    print("→ Sembrando mensajes de canal...")
    ahora = datetime.utcnow()

    def _agregar(canal: m.Canal, autor_n: str, contenido: str, hace_min: int):
        autor = usuarios[autor_n]
        existe = (
            db.query(m.Mensaje)
            .filter(
                m.Mensaje.canal_id == canal.id_canal,
                m.Mensaje.usuario_id == autor.id_usuario,
                m.Mensaje.contenido == contenido,
            )
            .first()
        )
        if existe:
            return
        db.add(
            m.Mensaje(
                contenido=contenido,
                usuario_id=autor.id_usuario,
                canal_id=canal.id_canal,
                fecha_envio=ahora - timedelta(minutes=hace_min),
            )
        )

    sala_sec = canales["Sala de Profesores Secundaria"]
    _agregar(sala_sec, "director",   "Bienvenidos al ciclo lectivo. Recordatorio de reunión el lunes.", 300)
    _agregar(sala_sec, "juanperez",  "Confirmado, llevo las planillas de 1° y 3° año.",              240)
    _agregar(sala_sec, "mariagarcia","¿Alguien tiene el material de 2° año para compartir?",          180)
    _agregar(sala_sec, "carlosruiz", "Lo subo al aula virtual esta tarde.",                            120)

    sala_prim = canales["Sala de Profesores Primaria"]
    _agregar(sala_prim, "director",   "Gracias por el trabajo de la semana pasada.",                   200)
    _agregar(sala_prim, "maestrojose","Los chicos de 1° grado avanzaron mucho con la lectura.",        140)

    sala_ini = canales["Sala de Profesores Inicial"]
    _agregar(sala_ini, "director",     "Recordar enviar las autorizaciones de la salida didáctica.",   160)
    _agregar(sala_ini, "señoinicial",  "Ya las tengo firmadas por todas las familias.",                100)

    gen = canales["general"]
    _agregar(gen, "director",   "Bienvenidos al canal general del IES.",                               500)
    _agregar(gen, "admin",      "Cualquier consulta administrativa por este medio.",                   460)
    _agregar(gen, "juanperez",  "Buen comienzo de año para todos.",                                    420)
    _agregar(gen, "mama_juancito", "Gracias por la información.",                                      380)  # ⚠️ ver nota

    db.flush()
    print("   ✔ Mensajes de canal verificados/creados.")


# ============================================================================
# 11. MENSAJES DIRECTOS
# ============================================================================

def seed_mensajes_directos(db: Session, usuarios: dict):
    print("→ Sembrando mensajes directos...")
    ahora = datetime.utcnow()

    def _md(emisor_n: str, receptor_n: str, contenido: str, hace_min: int, leido: bool = False):
        e = usuarios[emisor_n]
        r = usuarios[receptor_n]
        existe = (
            db.query(m.MensajeDirecto)
            .filter(
                m.MensajeDirecto.emisor_id == e.id_usuario,
                m.MensajeDirecto.receptor_id == r.id_usuario,
                m.MensajeDirecto.contenido == contenido,
            )
            .first()
        )
        if existe:
            return
        db.add(
            m.MensajeDirecto(
                emisor_id=e.id_usuario,
                receptor_id=r.id_usuario,
                contenido=contenido,
                fecha_envio=ahora - timedelta(minutes=hace_min),
                leido=leido,
                fecha_leido=(ahora - timedelta(minutes=hace_min - 5)) if leido else None,
            )
        )

    # Tutor puro → profesor de su hijo (permitido)
    _md("lauraperez", "juanperez", "Hola, quería consultar por el desempeño de Pedro en 1° año.", 240, leido=True)
    _md("juanperez", "lauraperez", "Hola Laura, Pedro viene muy bien. Cualquier cosa hablamos.", 200, leido=True)
    _md("carloslopez", "mariagarcia", "Buenas, ¿cómo viene Sofía en 2° año?", 180, leido=True)
    _md("mariagarcia", "carloslopez", "Muy bien, participa mucho en clase.", 160, leido=True)
    _md("papa_tomas", "señoinicial", "Hola, Tomás va a faltar el viernes por un turno médico.", 120, leido=True)
    _md("señoinicial", "papa_tomas", "Gracias por avisar, lo tenemos en cuenta.", 100, leido=False)

    # Profesor-tutor (carlosruiz) → señoinicial de su hijo
    _md("carlosruiz", "señoinicial", "Hola, soy Carlos Ruiz, papá de Tomás. ¿Cómo se adaptó esta semana?", 90, leido=True)
    _md("señoinicial", "carlosruiz", "Hola Carlos, se adaptó bárbaro. Es un sol.", 80, leido=True)

    # Profesor → profesor (permitido)
    _md("juanperez", "mariagarcia", "María, ¿tenés el plan de 2° año para compartir?", 60, leido=True)
    _md("mariagarcia", "juanperez", "Sí, te lo mando por mail.", 50, leido=True)

    # Admin → cualquiera (permitido)
    _md("admin", "director", "Director, ¿revisó el pedido de materiales?", 40, leido=True)
    _md("director", "admin", "Sí, ya lo aprobé. Mañana llega.", 30, leido=False)

    # Tutor puro → admin (permitido)
    _md("mama_juancito", "admin", "Buenas, quería consultar por el comedor.", 25, leido=False)

    db.flush()
    print("   ✔ Mensajes directos verificados/creados.")


# ============================================================================
# 12. COMUNICADOS
# ============================================================================

def seed_comunicados(db: Session, usuarios: dict, servidores: dict, canales: dict) -> list:
    print("→ Sembrando comunicados...")
    ahora = datetime.utcnow()

    def _com(titulo: str, contenido: str, autor_n: str, tipo: str,
             hace_min: int, fecha_evento=None) -> m.Comunicado:
        autor = usuarios[autor_n]
        existe = (
            db.query(m.Comunicado)
            .filter(m.Comunicado.titulo == titulo, m.Comunicado.publicado_por == autor.id_usuario)
            .first()
        )
        if existe:
            return existe
        c = m.Comunicado(
            titulo=titulo,
            contenido=contenido,
            publicado_por=autor.id_usuario,
            tipo=tipo,
            fecha_publicacion=ahora - timedelta(minutes=hace_min),
            fecha_evento=fecha_evento,
            eliminado=False,
        )
        db.add(c)
        db.flush()
        return c

    # 1) Global — inicio de clases
    com1 = _com(
        "Inicio del ciclo lectivo 2026",
        "Damos la bienvenida a todos los estudiantes y familias al nuevo ciclo lectivo. "
        "Las clases comienzan el 3 de marzo en todos los niveles.",
        "director", "global", 1440,
    )
    # Destinatarios: los 3 servidores educativos
    for srv in ("Secundaria", "Primaria", "Inicial"):
        existe = (
            db.query(m.ComunicadoDestinatario)
            .filter(
                m.ComunicadoDestinatario.comunicado_id == com1.id_comunicado,
                m.ComunicadoDestinatario.servidor_id == servidores[srv].id_servidor,
            )
            .first()
        )
        if not existe:
            db.add(m.ComunicadoDestinatario(
                comunicado_id=com1.id_comunicado,
                servidor_id=servidores[srv].id_servidor,
            ))

    # 2) Secundaria — salida didáctica
    com2 = _com(
        "Salida didáctica 3° Año A",
        "El próximo jueves 15 de mayo los alumnos de 3° año realizarán una visita al Museo de Ciencias. "
        "Autorización en la secretaría hasta el lunes.",
        "director", "servidor", 600,
        fecha_evento=ahora + timedelta(days=10),
    )
    existe = (
        db.query(m.ComunicadoDestinatario)
        .filter(
            m.ComunicadoDestinatario.comunicado_id == com2.id_comunicado,
            m.ComunicadoDestinatario.servidor_id == servidores["Secundaria"].id_servidor,
        )
        .first()
    )
    if not existe:
        db.add(m.ComunicadoDestinatario(
            comunicado_id=com2.id_comunicado,
            servidor_id=servidores["Secundaria"].id_servidor,
        ))

    # 3) Inicial — reunión de padres Sala 5
    com3 = _com(
        "Reunión de padres — Sala 5",
        "Se convoca a las familias de la Sala 5 a una reunión el viernes 9 de mayo a las 17 hs en el aula de inicial.",
        "señoinicial", "canal", 300,
        fecha_evento=ahora + timedelta(days=5),
    )
    existe = (
        db.query(m.ComunicadoDestinatario)
        .filter(
            m.ComunicadoDestinatario.comunicado_id == com3.id_comunicado,
            m.ComunicadoDestinatario.canal_id == canales["Sala 5"].id_canal,
        )
        .first()
    )
    if not existe:
        db.add(m.ComunicadoDestinatario(
            comunicado_id=com3.id_comunicado,
            canal_id=canales["Sala 5"].id_canal,
        ))

    db.flush()
    print("   ✔ 3 comunicados verificados/creados (con destinatarios).")
    return [com1, com2, com3]


# ============================================================================
# 13. COMUNICADO_VISTO
# ============================================================================

def seed_comunicados_vistos(db: Session, usuarios: dict, comunicados: list):
    print("→ Sembrando marcas de visto de comunicados...")
    ahora = datetime.utcnow()
    com1, com2, com3 = comunicados

    registros = [
        (com1, "director", 1400),
        (com1, "admin", 1380),
        (com1, "juanperez", 1300),
        (com1, "mariagarcia", 1280),
        (com1, "carlosruiz", 1250),
        (com2, "pedrolopez", 500),
        (com2, "juanperez", 480),
        (com3, "papa_tomas", 250),
        (com3, "carlosruiz", 240),
    ]
    creados = 0
    for com, usuario_n, hace_min in registros:
        u = usuarios[usuario_n]
        existe = (
            db.query(m.ComunicadoVisto)
            .filter(
                m.ComunicadoVisto.comunicado_id == com.id_comunicado,
                m.ComunicadoVisto.usuario_id == u.id_usuario,
            )
            .first()
        )
        if existe:
            continue
        db.add(m.ComunicadoVisto(
            comunicado_id=com.id_comunicado,
            usuario_id=u.id_usuario,
            fecha_visto=ahora - timedelta(minutes=hace_min),
        ))
        creados += 1
    db.flush()
    print(f"   ✔ {creados} marcas de visto nuevas.")


# ============================================================================
# 14. NOTIFICACIONES
# ============================================================================

def seed_notificaciones(db: Session, usuarios: dict):
    print("→ Sembrando notificaciones...")
    ahora = datetime.utcnow()

    def _notif(usuario_n: str, mensaje: str, tipo: str, enlace: str | None,
               hace_min: int, leida: bool = False):
        u = usuarios[usuario_n]
        existe = (
            db.query(m.Notificacion)
            .filter(
                m.Notificacion.usuario_id == u.id_usuario,
                m.Notificacion.mensaje == mensaje,
            )
            .first()
        )
        if existe:
            return
        db.add(m.Notificacion(
            usuario_id=u.id_usuario,
            mensaje=mensaje,
            tipo=tipo,
            enlace=enlace,
            leida=leida,
            fecha_creacion=ahora - timedelta(minutes=hace_min),
        ))

    _notif("pedrolopez",  "Nuevo comunicado: Salida didáctica 3° Año A",       "comunicado", "/comunicados", 500, leida=True)
    _notif("sofiagonzalez","Nuevo mensaje en 2° Año A",                        "canal",      "/canales/2",   480, leida=False)
    _notif("lauraperez",  "Tenés un mensaje directo de Juan Pérez",            "md",         "/mensajes",    200, leida=True)
    _notif("mama_juancito","Recordatorio: reunión de padres el lunes",         "recordatorio","/recordatorios", 100, leida=False)
    _notif("señoinicial", "Nueva marca de visto en comunicado Sala 5",         "comunicado", "/comunicados", 250, leida=False)
    _notif("carlosruiz",  "Comunicado de Inicial: Reunión de padres Sala 5",   "comunicado", "/comunicados", 240, leida=False)

    db.flush()
    print("   ✔ Notificaciones verificadas/creadas.")


# ============================================================================
# 15. RECORDATORIOS
# ============================================================================

def seed_recordatorios(db: Session, usuarios: dict):
    print("→ Sembrando recordatorios...")
    ahora = datetime.utcnow()

    def _rec(usuario_n: str, titulo: str, desc: str | None, dias: int, completado: bool = False):
        u = usuarios[usuario_n]
        existe = (
            db.query(m.Recordatorio)
            .filter(
                m.Recordatorio.usuario_id == u.id_usuario,
                m.Recordatorio.titulo == titulo,
            )
            .first()
        )
        if existe:
            return
        db.add(m.Recordatorio(
            usuario_id=u.id_usuario,
            titulo=titulo,
            descripcion=desc,
            fecha_limite=ahora + timedelta(days=dias),
            completado=completado,
        ))

    _rec("director",      "Reunión con equipo de orientación", "Lunes 10 hs en dirección",     5)
    _rec("juanperez",     "Entregar planillas de 1° y 3° año", "En secretaría",               3)
    _rec("mariagarcia",   "Preparar material de 2° año",       "Subir al aula virtual",       2)
    _rec("lauraperez",    "Pagar la cuota del comedor",         None,                         7)
    _rec("mama_juancito", "Reunión de padres",                  "Lunes 17 hs en el aula",     1)
    _rec("papa_tomas",    "Turno pediatra de Tomás",            "Viernes 10 hs",              4)
    _rec("señoinicial",   "Entregar autorizaciones de salida",  "Antes del miércoles",        2)
    _rec("maestrojose",   "Corregir evaluaciones de lectura",   None,                         6)

    db.flush()
    print("   ✔ Recordatorios verificados/creados.")


# ============================================================================
# 16. MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("  SEED — APP MENSAJERÍA IES")
    print("=" * 60)

    db: Session = SessionLocal()
    try:
        usuarios     = seed_usuarios(db)
        seed_perfiles(db, usuarios)           # ← NUEVO
        seed_roles(db)
        db.flush()  # aseguramos roles en BD para las asignaciones posteriores
        servidores   = seed_servidores(db, usuarios)
        categorias   = seed_categorias(db, servidores)
        canales      = seed_canales(db, servidores, categorias, usuarios)
        seed_usuario_rol(db, usuarios, servidores)
        seed_miembros_servidor(db, usuarios, servidores)
        seed_miembros_canal(db, usuarios, servidores, canales)
        seed_relaciones(db, usuarios)
        seed_mensajes(db, usuarios, canales)
        seed_mensajes_directos(db, usuarios)
        comunicados = seed_comunicados(db, usuarios, servidores, canales)
        seed_comunicados_vistos(db, usuarios, comunicados)
        seed_notificaciones(db, usuarios)
        seed_recordatorios(db, usuarios)

        db.commit()
        print("\n✅ Seed completado con éxito.\n")

        print("=" * 60)
        print("  CREDENCIALES DE DEMOSTRACIÓN")
        print("=" * 60)
        print("  super_admin   → superadmin      / admin123")
        print("  admin         → admin           / admin123")
        print("  director      → director        / director123")
        print("  vice-director → vicedirector    / director123")
        print("  profesor      → juanperez       / profesor123")
        print("  profesor      → mariagarcia     / profesor123")
        print("  profesor-tutor→ carlosruiz      / profesor123   (Secundaria + tutor en Inicial)")
        print("  alumno        → pedrolopez      / alumno123")
        print("  alumno        → sofiagonzalez   / alumno123")
        print("  alumno        → martinrodriguez / alumno123")
        print("  tutor puro    → lauraperez      / tutor123      (tutor de pedrolopez)")
        print("  tutor puro    → carloslopez     / tutor123      (tutor de sofiagonzalez)")
        print("  tutor puro    → luciafernandez  / tutor123      (tutor de martinrodriguez)")
        print("  prof. Primaria→ maestrojose     / profesor123")
        print("  alumno Prim.  → nenejuancito    / alumno123")
        print("  tutor Prim.   → mama_juancito   / tutor123")
        print("  prof. Inicial → señoinicial     / profesor123")
        print("  alumno Inicial→ nene_tomas      / alumno123")
        print("  tutor Inicial → papa_tomas      / tutor123")
        print("=" * 60)
        print("  Caso clave: carlosruiz es profesor en Secundaria")
        print("  y profesor-tutor de nene_tomas en Inicial. Ve ambos")
        print("  servidores por vías independientes.")
        print("=" * 60)

    except Exception as exc:
        db.rollback()
        print(f"\n❌ Error durante el seed: {exc}\n")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()