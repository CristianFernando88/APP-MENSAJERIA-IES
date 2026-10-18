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
import { crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import useConfirmacion from "../../hooks/useConfirmacion";
import { useAuth } from "../../context/AuthContext";

const POR_PAGINA = 10;

const OPCIONES_ORDEN = [
  { value: "nombre-asc", label: "Nombre (A - Z)" },
  { value: "nombre-desc", label: "Nombre (Z - A)" },
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
};

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function UsuariosTab({
  usuarios, setUsuarios, roles, servidores, asignaciones, setAsignaciones,
}) {
  const { user } = useAuth();
  const { pedir, dialogo } = useConfirmacion();

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
  const [cargando, setCargando] = useState(false);

  const cargarUsuarios = async (query = "") => {
    try {
      setError("");
      setCargando(true);
      setUsuarios(await listarUsuarios({ query }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => cargarUsuarios(busqueda), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        (a) => a.usuario_id === u.id_usuario && a.rol_id === Number(filtroRol)
      );
    });

    return [...lista].sort((a, b) => {
      switch (orden) {
        case "nombre-desc":
          return b.nombre_usuario.localeCompare(a.nombre_usuario);
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

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError("");
    setVerClave(false);
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
      servidor_id: "",
    });
    setError("");
    setVerClave(false);
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
        ? `¿Activar la cuenta de "${u.nombre_usuario}"?`
        : `¿Desactivar la cuenta de "${u.nombre_usuario}"? No podrá iniciar sesión.`,
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
      mensaje: `¿Eliminar a "${u.nombre_usuario}"? También se borran sus roles y membresías.`,
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

  const sincronizarRoles = async (usuarioId) => {
    const rolesNuevos = form.roles.map(Number);
    const actuales = asignaciones.filter((a) => a.usuario_id === usuarioId);

    for (const a of actuales) {
      if (!rolesNuevos.includes(a.rol_id)) {
        await eliminarUsuarioRol(usuarioId, a.rol_id, a.servidor_id);
      }
    }
    for (const rolId of rolesNuevos) {
      if (!actuales.some((a) => a.rol_id === rolId)) {
        await crearUsuarioRol({
          usuario_id: usuarioId,
          rol_id: rolId,
          servidor_id: form.servidor_id ? Number(form.servidor_id) : null,
          asignado_por: user?.id_usuario,
        });
      }
    }
  };

  const recargarAsignaciones = async () => {
    const { listarUsuarioRol } = await import("../../api/usuarioRol");
    setAsignaciones(await listarUsuarioRol());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre_usuario.trim()) return setError("El nombre de usuario es obligatorio");
    if (form.nombre_usuario.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres");
    if (!emailValido(form.email)) return setError("El email no es válido");

    if (!editandoId) {
      if (!form.contrasena) return setError("La contraseña es obligatoria");
      if (form.contrasena.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
      if (form.contrasena !== form.contrasena2) return setError("Las contraseñas no coinciden");
    }

    const ok = await pedir({
      titulo: editandoId ? "Guardar cambios" : "Crear usuario",
      mensaje: editandoId
        ? `¿Guardar los cambios de "${form.nombre_usuario.trim()}"?`
        : `¿Crear el usuario "${form.nombre_usuario.trim()}"?`,
      textoConfirmar: editandoId ? "Guardar" : "Crear",
    });
    if (!ok) return;

    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, {
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
        });
        await sincronizarRoles(editandoId);
      } else {
        const nuevo = await crearUsuario({
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
          password: form.contrasena,
        });
        for (const rolId of form.roles.map(Number)) {
          await crearUsuarioRol({
            usuario_id: nuevo.id_usuario,
            rol_id: rolId,
            servidor_id: form.servidor_id ? Number(form.servidor_id) : null,
            asignado_por: user?.id_usuario,
          });
        }
      }
      await recargarAsignaciones();
      await cargarUsuarios(busqueda);
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const hayFiltros = busqueda || filtroRol || orden !== "nombre-asc";

  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <h2>Usuarios ({filtrados.length})</h2>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo usuario
        </Button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-buscar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar usuario o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} aria-label="Limpiar">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="admin-select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
          ))}
        </select>

        <select
          className="admin-select"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        >
          {OPCIONES_ORDEN.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hayFiltros && (
          <button className="admin-limpiar" onClick={limpiarFiltros}>
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {error && <div className="admin-tab__error">{error}</div>}

      <div className="admin-tabla-wrap">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Estado</th>
              <th>Alta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} className="admin-celda-vacia">
                  <Loader2 size={16} className="admin-spinner" /> Cargando...
                </td>
              </tr>
            )}

            {!cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-celda-vacia">No hay usuarios.</td>
              </tr>
            )}

            {!cargando && visibles.map((u) => {
              const rolesU = rolesDeUsuario(u.id_usuario);
              return (
                <tr key={u.id_usuario} className={!u.activo ? "admin-fila-inactiva" : ""}>
                  <td>
                    <strong>{u.nombre_usuario}</strong>
                    <span className="admin-id">#{u.id_usuario}</span>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <div className="admin-chips">
                      {rolesU.length === 0 ? (
                        <span className="admin-sin-rol">—</span>
                      ) : (
                        rolesU.map((r) => (
                          <span key={r.id} className="admin-chip">{r.nombre}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.activo ? "success" : "danger"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString("es-AR") : "—"}</td>
                  <td>
                    <div className="admin-acciones">
                      <button className="admin-icon-btn" onClick={() => abrirEditar(u)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="admin-icon-btn admin-icon-btn--key" onClick={() => abrirCambiarClave(u)} title="Cambiar contraseña">
                        <KeyRound size={14} />
                      </button>
                      <button
                        className={`admin-icon-btn${u.activo ? " admin-icon-btn--warn" : ""}`}
                        onClick={() => handleToggleActivo(u)}
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        <Power size={14} />
                      </button>
                      <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleEliminar(u)} title="Eliminar">
                        <Trash2 size={14} />
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
        <div className="admin-paginacion">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaSegura === 1}>
            <ChevronLeft size={15} />
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
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaSegura === totalPaginas}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {modalOpen && (
        <Modal title={editandoId ? "Editar usuario" : "Nuevo usuario"} onClose={() => !guardando && setModalOpen(false)}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <Input label="Nombre de usuario" name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Ej: juanperez" />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Ej: juan@email.com" />

            {!editandoId && (
              <>
                <div className="admin-clave">
                  <label className="admin-clave-label">Contraseña</label>
                  <div className="admin-clave-caja">
                    <input
                      name="contrasena"
                      type={verClave ? "text" : "password"}
                      value={form.contrasena}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button type="button" onClick={() => setVerClave((v) => !v)}>
                      {verClave ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  error={form.contrasena2 && form.contrasena !== form.contrasena2 ? "No coinciden" : ""}
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
            />

            <div className="admin-grupo">
              <span className="admin-grupo-label">Roles</span>
              <div className="admin-checks">
                {roles.map((r) => (
                  <label key={r.id_rol} className="admin-check">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(r.id_rol)}
                      onChange={() => toggleRol(r.id_rol)}
                    />
                    <span>{r.nombre} <em>({r.tipo})</em></span>
                  </label>
                ))}
              </div>
            </div>

            {!editandoId && form.roles.length > 0 && (
              <Select
                label="Servidor (opcional)"
                name="servidor_id"
                value={form.servidor_id}
                onChange={handleChange}
                options={servidores.map((s) => ({ value: s.id_servidor, label: s.nombre }))}
                placeholder="Sin servidor (global)"
              />
            )}

            {error && <div className="admin-tab__error">{error}</div>}

            <div className="admin-form__actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={guardando}>
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
        <Modal title={`Contraseña de ${formClave.usuario.nombre_usuario}`} onClose={() => !guardando && setModalClave(false)}>
          <form className="admin-form" onSubmit={handleCambiarClave}>
            <div className="admin-clave">
              <label className="admin-clave-label">Nueva contraseña</label>
              <div className="admin-clave-caja">
                <input
                  type={verClave ? "text" : "password"}
                  value={formClave.nueva}
                  onChange={(e) => setFormClave({ ...formClave, nueva: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setVerClave((v) => !v)}>
                  {verClave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Input
              label="Repetir contraseña"
              type={verClave ? "text" : "password"}
              value={formClave.repetir}
              onChange={(e) => setFormClave({ ...formClave, repetir: e.target.value })}
              placeholder="Volvé a escribirla"
              error={formClave.repetir && formClave.nueva !== formClave.repetir ? "No coinciden" : ""}
            />
            {error && <div className="admin-tab__error">{error}</div>}
            <div className="admin-form__actions">
              <Button type="button" variant="outline" onClick={() => setModalClave(false)} disabled={guardando}>
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
    </div>
  );
}