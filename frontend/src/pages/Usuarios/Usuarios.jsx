import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  Power, KeyRound, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import {
  listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
} from "../../api/usuarios";
import { listarRoles } from "../../api/roles";
import { listarUsuarioRol, crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import {
  listarMiembrosServidor, crearMiembroServidor, eliminarMiembroServidor,
} from "../../api/miembrosServidor";
import {
  listarMiembrosCanal, crearMiembroCanal, eliminarMiembroCanal,
} from "../../api/miembrosCanal";
import { listarServidores } from "../../api/servidores";
import { listarCanales } from "../../api/canales";
import { crearPerfil, actualizarPerfil } from "../../api/perfiles";
import useConfirmacion from "../../hooks/useConfirmacion";
import { useAuth } from "../../context/AuthContext";
import "./Usuarios.css";

const ROLES_NECESITAN_CANAL = ["alumno", "tutor"];
const POR_PAGINA = 10;

const OPCIONES_ORDEN = [
  { value: "nombre-asc", label: "Usuario (A - Z)" },
  { value: "nombre-desc", label: "Usuario (Z - A)" },
  { value: "apellido-asc", label: "Nombre y apellido (A - Z)" },
  { value: "apellido-desc", label: "Nombre y apellido (Z - A)" },
  { value: "recientes", label: "Más recientes" },
  { value: "antiguos", label: "Más antiguos" },
  { value: "activos", label: "Activos primero" },
  { value: "inactivos", label: "Inactivos primero" },
];

const formVacio = {
  nombre_usuario: "",
  email: "",
  contrasena: "",
  contrasena2: "",
  activo: "true",
  roles: [],
  servidor_id: "",
  canal_id: "",
  nombres: "",
  apellidos: "",
  dni: "",
  biografia: "",
};

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const dniValido = (v) => !v || /^\d{7,8}$/.test(v.trim());

const nombreCompleto = (u) => {
  if (!u.perfil) return "";
  return [u.perfil.nombres, u.perfil.apellidos].filter(Boolean).join(" ").trim();
};

export default function Usuarios() {
  const { user } = useAuth();
  const { pedir, dialogo } = useConfirmacion();

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [canales, setCanales] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [miembrosServidor, setMiembrosServidor] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [orden, setOrden] = useState("nombre-asc");
  const [pagina, setPagina] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [verClave, setVerClave] = useState(false);

  const [modalClave, setModalClave] = useState(false);
  const [formClave, setFormClave] = useState({ nueva: "", repetir: "", usuario: null });

  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarios = async (query = "") => {
    try {
      setError("");
      setUsuarios(await listarUsuarios({ query }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r, s, c, ur, ms, mc] = await Promise.all([
          listarRoles(), listarServidores(), listarCanales(),
          listarUsuarioRol(), listarMiembrosServidor(), listarMiembrosCanal(),
        ]);
        setRoles(r); setServidores(s); setCanales(c);
        setAsignaciones(ur); setMiembrosServidor(ms); setMiembrosCanal(mc);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarUsuarios(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const nombreDeRol = (rolId) => roles.find((r) => r.id_rol === rolId)?.nombre;

  const rolesDeUsuario = (usuarioId) =>
    asignaciones
      .filter((a) => a.usuario_id === usuarioId)
      .map((a) => ({ id: a.rol_id, nombre: nombreDeRol(a.rol_id) }))
      .filter((r) => r.nombre);


  const filtrados = useMemo(() => {
    let lista = usuarios.filter((u) => {
      if (!filtroRol) return true;
      return asignaciones.some(
        (a) => a.us_usuario_id === u.id_usuario && a.rol_id === Number(filtroRol)
      );
    });

    return [...lista].sort((a, b) => {
      switch (orden) {
        case "nombre-desc":
          return b.nombre_usuario.localeCompare(a.nombre_usuario);
        case "apellido-asc":
          return nombreCompleto(a).localeCompare(nombreCompleto(b));
        case "apellido-desc":
          return nombreCompleto(b).localeCompare(nombreCompleto(a));
        case "recientes":
          return new Date(b.fecha_registro) - new Date(a.fecha_registro);
        case "antiguos":
          return new Date(a.fecha_registro) - new Date(b.fecha_registro);
        case "activos":
          return Number(b.activo) - Number(a.activo);
        case "inactivos":
          return Number(a.activo) - Number(b.activo);
        default:
          return a.nombre_usuario.localeCompare(b.nombre_usuario);
      }
    });
  }, [usuarios, filtroRol, orden, asignaciones]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroRol, orden]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroRol("");
    setOrden("nombre-asc");
  };


  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleRol = (rolId) =>
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(rolId)
        ? prev.roles.filter((x) => x !== rolId)
        : [...prev.roles, rolId],
    }));

  const inicialPreview = (form.nombres || form.nombre_usuario || "?").trim()[0].toUpperCase();
  const nombrePreview = [form.nombres, form.apellidos].filter(Boolean).join(" ").trim();

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError(""); setVerClave(false);
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditandoId(u.id_usuario);
    setForm({
      nombre_usuario: u.nombre_usuario,
      email: u.email,
      contrasena: "",
      contrasena2: "",
      activo: String(u.activo),
      roles: asignaciones.filter((a) => a.usuario_id === u.id_usuario).map((a) => a.rol_id),
      servidor_id: miembrosServidor.find((m) => m.usuario_id === u.id_usuario)?.servidor_id ?? "",
      canal_id: miembrosCanal.find((m) => m.usuario_id === u.id_usuario)?.canal_id ?? "",
      nombres: u.perfil?.nombres ?? "",
      apellidos: u.perfil?.apellidos ?? "",
      dni: u.perfil?.dni ?? "",
      biografia: u.perfil?.biografia ?? "",
    });
    setError(""); setVerClave(false);
    setModalOpen(true);
  };

  const abrirCambiarClave = (u) => {
    setError("");
    setFormClave({ nueva: "", repetir: "", usuario: u });
    setVerClave(false);
    setModalClave(true);
  };

  const handleToggleActivo = async (u) => {
    const activar = !u.activo;

    const ok = await pedir({
      titulo: activar ? "Activar usuario" : "Desactivar usuario",
      mensaje: activar
        ? `¿Activar la cuenta de "${nombreCompleto(u) || u.nombre_usuario}"? Va a poder volver a iniciar sesión.`
        : `¿Desactivar la cuenta de "${nombreCompleto(u) || u.nombre_usuario}"? No va a poder iniciar sesión hasta reactivarla.`,
      textoConfirmar: activar ? "Activar" : "Desactivar",
      peligro: !activar,
    });
    if (!ok) return;

    try {
      setError("");
      await actualizarUsuario(u.id_usuario, {
        nombre_usuario: u.nombre_usuario,
        email: u.email,
        activo: activar,
      });
      await cargarUsuarios(busqueda);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async (u) => {
    const ok = await pedir({
      titulo: "Eliminar usuario",
      mensaje: `¿Eliminar a "${nombreCompleto(u) || u.nombre_usuario}"? También se borran sus roles, membresías y perfil. Esta acción no se puede deshacer.`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!ok) return;

    try {
      setError("");
      await eliminarUsuario(u.id_usuario);
      await cargarUsuarios(busqueda);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    setError("");

    if (formClave.nueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (formClave.nueva !== formClave.repetir) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setGuardando(true);
    try {
      const u = formClave.usuario;
      await actualizarUsuario(u.id_usuario, {
        nombre_usuario: u.nombre_usuario,
        email: u.email,
        activo: u.activo,
        password: formClave.nueva,
      });
      setModalClave(false);
      setFormClave({ nueva: "", repetir: "", usuario: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const nombreRolParaCanal = () => {
    const nombres = form.roles.map((id) => nombreDeRol(Number(id))).filter(Boolean);
    return nombres.find((n) => ROLES_NECESITAN_CANAL.includes(n)) ?? nombres[0] ?? "";
  };

  const sincronizarMembresias = async (usuarioId) => {
    const rolesNuevos = form.roles.map(Number);

    const rolesActuales = asignaciones.filter((a) => a.usuario_id === usuarioId);
    for (const a of rolesActuales) {
      if (!rolesNuevos.includes(a.rol_id)) {
        await eliminarUsuarioRol(usuarioId, a.rol_id, a.servidor_id);
      }
    }
    for (const rolId of rolesNuevos) {
      if (!rolesActuales.some((a) => a.rol_id === rolId)) {
        await crearUsuarioRol({
          usuario_id: usuarioId, rol_id: rolId,
          servidor_id: null, asignado_por: user?.id_usuario,
        });
      }
    }

    const srvActuales = miembrosServidor.filter((m) => m.usuario_id === usuarioId);
    const srvNuevo = form.servidor_id ? Number(form.servidor_id) : null;
    for (const m of srvActuales) {
      if (m.servidor_id !== srvNuevo) await eliminarMiembroServidor(usuarioId, m.servidor_id);
    }
    if (srvNuevo && !srvActuales.some((m) => m.servidor_id === srvNuevo)) {
      await crearMiembroServidor({ usuario_id: usuarioId, servidor_id: srvNuevo, activo: true });
    }

    const tieneRolCurso = rolesNuevos.some((id) =>
      ROLES_NECESITAN_CANAL.includes(nombreDeRol(id))
    );
    const canActuales = miembrosCanal.filter((m) => m.usuario_id === usuarioId);
    const canNuevo = tieneRolCurso && form.canal_id ? Number(form.canal_id) : null;
    for (const m of canActuales) {
      if (m.canal_id !== canNuevo) await eliminarMiembroCanal(m.id_miembro_canal);
    }
    if (canNuevo && !canActuales.some((m) => m.canal_id === canNuevo)) {
      await crearMiembroCanal({
        usuario_id: usuarioId, canal_id: canNuevo, rol_en_canal: nombreRolParaCanal(),
      });
    }
  };

  const recargarTodo = async () => {
    const [ur, ms, mc] = await Promise.all([
      listarUsuarioRol(), listarMiembrosServidor(), listarMiembrosCanal(),
    ]);
    setAsignaciones(ur); setMiembrosServidor(ms); setMiembrosCanal(mc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre_usuario.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }
    if (form.nombre_usuario.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      return;
    }
    if (!emailValido(form.email)) {
      setError("El email no tiene un formato válido");
      return;
    }
    if (!dniValido(form.dni)) {
      setError("El DNI debe tener 7 u 8 dígitos");
      return;
    }
    if (!editandoId) {
      if (!form.contrasena) {
        setError("La contraseña es obligatoria");
        return;
      }
      if (form.contrasena.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (form.contrasena !== form.contrasena2) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }

    const ok = await pedir({
      titulo: editandoId ? "Guardar cambios" : "Crear usuario",
      mensaje: editandoId
        ? `¿Guardar los cambios de "${nombrePreview || form.nombre_usuario}"?`
        : `¿Crear el usuario "${form.nombre_usuario.trim()}" con los roles, membresías y perfil seleccionados?`,
      textoConfirmar: editandoId ? "Guardar" : "Crear",
    });
    if (!ok) return;

    setGuardando(true);

    try {
      let usuarioId = editandoId;

      if (editandoId) {
        await actualizarUsuario(editandoId, {
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
        });
        await sincronizarMembresias(editandoId);
      } else {
        const nuevo = await crearUsuario({
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
          password: form.contrasena,
        });
        usuarioId = nuevo.id_usuario;

        for (const rolId of form.roles.map(Number)) {
          await crearUsuarioRol({
            usuario_id: usuarioId,
            rol_id: rolId,
            servidor_id: form.servidor_id ? Number(form.servidor_id) : null,
            asignado_por: user?.id_usuario,
          });
        }

        const srvId = form.servidor_id ? Number(form.servidor_id) : null;
        if (srvId) {
          await crearMiembroServidor({ usuario_id: usuarioId, servidor_id: srvId, activo: true });
        }
        if (form.canal_id) {
          await crearMiembroCanal({
            usuario_id: usuarioId,
            canal_id: Number(form.canal_id),
            rol_en_canal: nombreRolParaCanal(),
          });
        }
      }

      const datosPerfil = {
        nombres: form.nombres || null,
        apellidos: form.apellidos || null,
        dni: form.dni.trim() || null,
        biografia: form.biografia || null,
      };

      if (editandoId) {
        const tienePerfil = usuarios.find((u) => u.id_usuario === editandoId)?.perfil;
        if (tienePerfil) {
          await actualizarPerfil(usuarioId, datosPerfil);
        } else {
          await crearPerfil({ ...datosPerfil, usuario_id: usuarioId });
        }
      } else {
        await crearPerfil({ ...datosPerfil, usuario_id: usuarioId });
      }

      await recargarTodo();
      await cargarUsuarios(busqueda);
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const necesitaCanal = form.roles.some((id) =>
    ROLES_NECESITAN_CANAL.includes(nombreDeRol(Number(id)))
  );

  const hayFiltros = busqueda || filtroRol || orden !== "nombre-asc";

  return (
    <section className="usuarios">
      <div className="usuarios__header">
        <h1 className="usuarios__title">Usuarios</h1>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo usuario
        </Button>
      </div>

      <div className="usuarios__filtros">
        <div className="usuarios__buscar">
          <Search size={17} />
          <input
            type="text"
            placeholder="Nombre, apellido, DNI, email o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda">
              <X size={15} />
            </button>
          )}
        </div>

        <select
          className="usuarios__select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
          ))}
        </select>

        <select
          className="usuarios__select"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        >
          {OPCIONES_ORDEN.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hayFiltros && (
          <button className="usuarios__limpiar" onClick={limpiarFiltros}>
            <X size={15} /> Limpiar
          </button>
        )}
      </div>

      <div className="usuarios__conteo">
        <span>{filtrados.length} usuario{filtrados.length === 1 ? "" : "s"}</span>
      </div>

      {error && <div className="usuarios__alerta">{error}</div>}

      <div className="usuarios__tabla-wrap">
        <table className="usuarios__tabla">
          <thead>
            <tr>
              <th className="usuarios__th-id">ID</th>
              <th>Usuario</th>
              <th>Nombre y apellido</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Alta</th>
              <th className="usuarios__th-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={9} className="usuarios__celda-vacia">
                  <Loader2 size={18} className="usuarios__spinner" /> Cargando...
                </td>
              </tr>
            )}

            {!cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={9} className="usuarios__celda-vacia">No hay usuarios.</td>
              </tr>
            )}

            {!cargando &&
              visibles.map((u) => {
                const rolesU = rolesDeUsuario(u.id_usuario);
                const completo = nombreCompleto(u);

                return (
                  <tr key={u.id_usuario} className={!u.activo ? "usuarios__fila--inactiva" : ""}>
                    <td className="usuarios__id-col">{u.id_usuario}</td>

                    <td>
                      <span className="usuarios__usuario">@{u.nombre_usuario}</span>
                    </td>

                    <td>
                      <span className="usuarios__nombre">{completo || "—"}</span>
                    </td>

                    <td className="usuarios__dni">{u.perfil?.dni || "—"}</td>
                    <td className="usuarios__email-col">{u.email}</td>

                    <td>
                      <div className="usuarios__roles">
                        {rolesU.length === 0 ? (
                          <span className="usuarios__sin-rol">—</span>
                        ) : (
                          rolesU.map((r) => (
                            <span key={r.id} className="usuarios__rol-chip">{r.nombre}</span>
                          ))
                        )}
                      </div>
                    </td>

                    <td>
                      <Badge variant={u.activo ? "success" : "danger"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>

                    <td className="usuarios__fecha">
                      {new Date(u.fecha_registro).toLocaleDateString("es-AR")}
                    </td>

                    <td>
                      <div className="usuarios__acciones">
                        <button
                          className="usuarios__icon-btn"
                          onClick={() => abrirEditar(u)}
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="usuarios__icon-btn usuarios__icon-btn--key"
                          onClick={() => abrirCambiarClave(u)}
                          title="Cambiar contraseña"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          className={`usuarios__icon-btn${u.activo ? " usuarios__icon-btn--warn" : ""}`}
                          onClick={() => handleToggleActivo(u)}
                          title={u.activo ? "Desactivar" : "Activar"}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          className="usuarios__icon-btn usuarios__icon-btn--danger"
                          onClick={() => handleEliminar(u)}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="usuarios__paginacion">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={n === paginaSegura ? "activo" : ""}
              onClick={() => setPagina(n)}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editandoId ? "Editar usuario" : "Nuevo usuario"}
          onClose={() => setModalOpen(false)}
        >
          <form className="usuarios__form" onSubmit={handleSubmit}>
            {/* Vista previa del avatar */}
            <div className="usuarios__preview">
              <span className="usuarios__preview-avatar">{inicialPreview}</span>
              <div className="usuarios__preview-datos">
                <span className="usuarios__preview-nombre">
                  {nombrePreview || form.nombre_usuario || "Sin nombre"}
                </span>
                <span className="usuarios__preview-nota">
                  Así se va a ver el avatar del usuario
                </span>
              </div>
            </div>

            <div className="usuarios__seccion-form">
              <span className="usuarios__seccion-titulo">Datos de perfil</span>

              <div className="usuarios__fila-campos">
                <Input
                  label="Nombres"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  placeholder="Ej: Pedro"
                />
                <Input
                  label="Apellidos"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ej: López"
                />
              </div>

              <Input
                label="DNI (opcional)"
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="Ej: 45678901"
                error={form.dni && !dniValido(form.dni) ? "Debe tener 7 u 8 dígitos" : ""}
              />

              <Input
                label="Biografía (opcional)"
                name="biografia"
                value={form.biografia}
                onChange={handleChange}
                placeholder="Ej: Alumno de 4º A"
              />
            </div>

            <div className="usuarios__seccion-form">
              <span className="usuarios__seccion-titulo">Cuenta</span>

              <Input
                label="Nombre de usuario"
                name="nombre_usuario"
                value={form.nombre_usuario}
                onChange={handleChange}
                placeholder="Ej: juanperez"
              />
              <Input
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ej: juan@colegio.com"
              />

              {!editandoId && (
                <>
                  <div className="usuarios__clave">
                    <label className="usuarios__clave-label" htmlFor="contrasena">
                      Contraseña
                    </label>
                    <div className="usuarios__clave-caja">
                      <input
                        id="contrasena"
                        name="contrasena"
                        type={verClave ? "text" : "password"}
                        value={form.contrasena}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setVerClave((v) => !v)}
                        aria-label={verClave ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Repetir contraseña"
                    name="contrasena2"
                    type={verClave ? "text" : "password"}
                    value={form.contrasena2}
                    onChange={handleChange}
                    placeholder="Volvé a escribirla"
                    error={
                      form.contrasena2 && form.contrasena !== form.contrasena2
                        ? "No coinciden"
                        : ""
                    }
                  />
                </>
              )}

              <Select
                label="Estado"
                name="activo"
                value={form.activo}
                onChange={handleChange}
                options={[
                  { value: "true", label: "Activo" },
                  { value: "false", label: "Inactivo" },
                ]}
                placeholder="Elegir estado"
              />
            </div>

            <div className="usuarios__seccion-form">
              <span className="usuarios__seccion-titulo">Permisos</span>

              <div className="usuarios__grupo">
                <span className="usuarios__grupo-label">Roles</span>
                <div className="usuarios__checks">
                  {roles.map((r) => (
                    <label key={r.id_rol} className="usuarios__check">
                      <input
                        type="checkbox"
                        checked={form.roles.includes(r.id_rol)}
                        onChange={() => toggleRol(r.id_rol)}
                      />
                      <span>{r.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Select
                label="Servidor"
                name="servidor_id"
                value={form.servidor_id}
                onChange={handleChange}
                options={servidores.map((s) => ({ value: s.id_servidor, label: s.nombre }))}
                placeholder="Sin servidor"
              />

              {necesitaCanal && (
                <Select
                  label="Canal / curso"
                  name="canal_id"
                  value={form.canal_id}
                  onChange={handleChange}
                  options={canales.map((c) => ({ value: c.id_canal, label: c.nombre }))}
                  placeholder="Elegir curso"
                />
              )}
            </div>

            {error && <div className="usuarios__alerta">{error}</div>}

            <div className="usuarios__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modalClave && formClave.usuario && (
        <Modal
          title={`Contraseña de ${formClave.usuario.nombre_usuario}`}
          onClose={() => setModalClave(false)}
        >
          <form className="usuarios__form" onSubmit={handleCambiarClave}>
            <div className="usuarios__clave">
              <label className="usuarios__clave-label" htmlFor="nuevaClave">
                Nueva contraseña
              </label>
              <div className="usuarios__clave-caja">
                <input
                  id="nuevaClave"
                  type={verClave ? "text" : "password"}
                  value={formClave.nueva}
                  onChange={(e) => setFormClave({ ...formClave, nueva: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Input
              label="Repetir contraseña"
              type={verClave ? "text" : "password"}
              value={formClave.repetir}
              onChange={(e) => setFormClave({ ...formClave, repetir: e.target.value })}
              placeholder="Volvé a escribirla"
              error={
                formClave.repetir && formClave.nueva !== formClave.repetir
                  ? "No coinciden"
                  : ""
              }
            />

            {error && <div className="usuarios__alerta">{error}</div>}

            <div className="usuarios__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalClave(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogo}
    </section>
  );
}