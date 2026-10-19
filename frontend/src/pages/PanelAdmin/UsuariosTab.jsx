import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  Power, KeyRound, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import UsuarioForm from "../../components/forms/UsuarioForm";
import {
  listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
} from "../../api/usuarios";
import { crearPerfil, actualizarPerfil } from "../../api/perfiles";
import { crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import { 
  listarMiembrosServidor, crearMiembroServidor, eliminarMiembroServidor 
} from "../../api/miembrosServidor";
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
  const [verClave, setVerClave] = useState(false);

  const [modalClave, setModalClave] = useState(false);
  const [formClave, setFormClave] = useState({ nueva: "", repetir: "", usuario: null });

  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [todosLosMiembros, setTodosLosMiembros] = useState([]);

  const recargarMembresias = async () => {
    const data = await listarMiembrosServidor();
    setTodosLosMiembros(data);
  };

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
    recargarMembresias();
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
        (a) => a.usuario_id === u.id_usuario && a.rol_id === Number(filtroRol)
      );
    });

    return [...lista].sort((a, b) => {
      switch (orden) {
        case "nombre-desc": return b.nombre_usuario.localeCompare(a.nombre_usuario);
        case "recientes": return new Date(b.fecha_registro) - new Date(a.fecha_registro);
        case "antiguos": return new Date(a.fecha_registro) - new Date(b.fecha_registro);
        case "activos": return Number(b.activo) - Number(a.activo);
        case "inactivos": return Number(a.activo) - Number(b.activo);
        default: return a.nombre_usuario.localeCompare(b.nombre_usuario);
      }
    });
  }, [usuarios, filtroRol, orden, asignaciones]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  useEffect(() => setPagina(1), [busqueda, filtroRol, orden]);

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroRol(""); setOrden("nombre-asc");
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setError("");
    setVerClave(false);
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditandoId(u.id_usuario);
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
      mensaje: activar ? `¿Activar a "${u.nombre_usuario}"?` : `¿Desactivar a "${u.nombre_usuario}"?`,
      textoConfirmar: activar ? "Activar" : "Desactivar",
      peligro: !activar,
    });
    if (!ok) return;
    try {
      await actualizarUsuario(u.id_usuario, { nombre_usuario: u.nombre_usuario, email: u.email, activo: activar });
      await cargarUsuarios(busqueda);
    } catch (err) { setError(err.message); }
  };

  const handleEliminar = async (u) => {
    const ok = await pedir({
      titulo: "Eliminar usuario",
      mensaje: `¿Eliminar a "${u.nombre_usuario}"?`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await eliminarUsuario(u.id_usuario);
      await cargarUsuarios(busqueda);
      await recargarMembresias();
    } catch (err) { setError(err.message); }
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    if (formClave.nueva.length < 6) return setError("Mínimo 6 caracteres");
    if (formClave.nueva !== formClave.repetir) return setError("No coinciden");
    setGuardando(true);
    try {
      const u = formClave.usuario;
      await actualizarUsuario(u.id_usuario, {
        nombre_usuario: u.nombre_usuario, email: u.email, activo: u.activo, password: formClave.nueva,
      });
      setModalClave(false);
    } catch (err) { setError(err.message); } finally { setGuardando(false); }
  };

  // --- Lógica del Formulario Compartido ---
  const handleFormSubmit = async (datos) => {
    const ok = await pedir({
      titulo: editandoId ? "Guardar cambios" : "Crear usuario",
      mensaje: `¿Guardar a "${datos.nombre_usuario}"?`,
      textoConfirmar: "Guardar",
    });
    if (!ok) return;

    setGuardando(true);
    try {
      let userId = editandoId;

      // 1. Crear o Actualizar Usuario
      if (editandoId) {
        await actualizarUsuario(editandoId, { 
          nombre_usuario: datos.nombre_usuario, 
          email: datos.email, 
          activo: datos.activo === "true",
          ...(datos.password && { password: datos.password }) 
        });
      } else {
        const nuevo = await crearUsuario({ 
          nombre_usuario: datos.nombre_usuario, 
          email: datos.email, 
          activo: datos.activo === "true", 
          password: datos.password 
        });
        userId = nuevo.id_usuario;
      }

      // 2. Crear o Actualizar Perfil
      try {
        if (editandoId) {
          await actualizarPerfil(editandoId, { nombres: datos.nombres, apellidos: datos.apellidos });
        } else {
          await crearPerfil({ usuario_id: userId, nombres: datos.nombres, apellidos: datos.apellidos });
        }
      } catch (perfilErr) {
        // Si el perfil no existe al editar (error 404), lo creamos
        if (perfilErr.message.includes("no encontrado") || perfilErr.message.includes("404")) {
          await crearPerfil({ usuario_id: userId, nombres: datos.nombres, apellidos: datos.apellidos });
        } else {
          throw perfilErr;
        }
      }

      // 3. Sincronizar Roles y Servidores
      // Usamos las funciones existentes pero les pasamos los datos del formulario
      await sincronizarRolesNuevos(userId, datos.roles_ids, datos.servidores_ids);
      await sincronizarServidoresNuevos(userId, datos.servidores_ids);

      // 4. Recargar
      await recargarAsignaciones();
      await recargarMembresias();
      await cargarUsuarios(busqueda);
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const sincronizarRolesNuevos = async (usuarioId, rolesIds, servidoresIds) => {
    const rolesNuevos = rolesIds.map(Number);
    const actuales = asignaciones.filter((a) => a.usuario_id === usuarioId);

    for (const a of actuales) {
      if (!rolesNuevos.includes(a.rol_id)) await eliminarUsuarioRol(usuarioId, a.rol_id, a.servidor_id);
    }
    
    for (const rolId of rolesNuevos) {
      if (!actuales.some((a) => a.rol_id === rolId)) {
        const rolInfo = roles.find(r => r.id_rol === rolId);
        
        let servidorAsignado = null;
        if (rolInfo?.tipo === "servidor") {
          if (servidoresIds.length === 0) {
            throw new Error(`El rol "${rolInfo.nombre}" requiere que selecciones al menos un servidor.`);
          }
          servidorAsignado = Number(servidoresIds[0]);
        }

        await crearUsuarioRol({
          usuario_id: usuarioId,
          rol_id: rolId,
          servidor_id: servidorAsignado,
          asignado_por: user?.id_usuario,
        });
      }
    }
  };

  const sincronizarServidoresNuevos = async (usuarioId, servidoresIds) => {
    const servidoresNuevos = servidoresIds.map(Number);
    const servidoresActuales = todosLosMiembros
      .filter(m => Number(m.usuario_id) === Number(usuarioId))
      .map(m => Number(m.servidor_id));

    for (const sId of servidoresActuales) {
      if (!servidoresNuevos.includes(sId)) {
        await eliminarMiembroServidor(usuarioId, sId);
      }
    }
    for (const sId of servidoresNuevos) {
      if (!servidoresActuales.includes(sId)) {
        await crearMiembroServidor({ usuario_id: usuarioId, servidor_id: sId, activo: true });
      }
    }
  };

  const recargarAsignaciones = async () => {
    const { listarUsuarioRol } = await import("../../api/usuarioRol");
    setAsignaciones(await listarUsuarioRol());
  };

  const hayFiltros = busqueda || filtroRol || orden !== "nombre-asc";

  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <h2>Usuarios ({filtrados.length})</h2>
        <Button size="sm" onClick={abrirCrear}><Plus size={16} /> Nuevo usuario</Button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-buscar">
          <Search size={16} />
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          {busqueda && <button onClick={() => setBusqueda("")}><X size={14} /></button>}
        </div>
        <select className="admin-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
        </select>
        <select className="admin-select" value={orden} onChange={(e) => setOrden(e.target.value)}>
          {OPCIONES_ORDEN.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hayFiltros && <button className="admin-limpiar" onClick={limpiarFiltros}><X size={14} /> Limpiar</button>}
      </div>

      {error && <div className="admin-tab__error">{error}</div>}

      <div className="admin-tabla-wrap">
        <table className="admin-tabla">
          <thead>
            <tr><th>Usuario</th><th>Email</th><th>Roles</th><th>Estado</th><th>Alta</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={6} className="admin-celda-vacia"><Loader2 size={16} className="admin-spinner" /> Cargando...</td></tr>}
            {!cargando && visibles.length === 0 && <tr><td colSpan={6} className="admin-celda-vacia">No hay usuarios.</td></tr>}
            {!cargando && visibles.map((u) => (
              <tr key={u.id_usuario} className={!u.activo ? "admin-fila-inactiva" : ""}>
                <td>
                  <strong>
                    {u.perfil?.apellidos && u.perfil?.nombres 
                      ? `${u.perfil.apellidos}, ${u.perfil.nombres}` 
                      : u.nombre_usuario}
                  </strong>
                  <span className="admin-id">@{u.nombre_usuario}</span>
                </td>
                <td>{u.email}</td>
                <td>
                  <div className="admin-chips">
                    {rolesDeUsuario(u.id_usuario).length === 0 ? <span className="admin-sin-rol">—</span> : rolesDeUsuario(u.id_usuario).map((r) => <span key={r.id} className="admin-chip">{r.nombre}</span>)}
                  </div>
                </td>
                <td><Badge variant={u.activo ? "success" : "danger"}>{u.activo ? "Activo" : "Inactivo"}</Badge></td>
                <td>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString("es-AR") : "—"}</td>
                <td>
                  <div className="admin-acciones">
                    <button className="admin-icon-btn" onClick={() => abrirEditar(u)}><Pencil size={14} /></button>
                    <button className="admin-icon-btn admin-icon-btn--key" onClick={() => abrirCambiarClave(u)}><KeyRound size={14} /></button>
                    <button className={`admin-icon-btn${u.activo ? " admin-icon-btn--warn" : ""}`} onClick={() => handleToggleActivo(u)}><Power size={14} /></button>
                    <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleEliminar(u)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="admin-paginacion">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaSegura === 1}><ChevronLeft size={15} /></button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button key={n} className={n === paginaSegura ? "activo" : ""} onClick={() => setPagina(n)}>{n}</button>
          ))}
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaSegura === totalPaginas}><ChevronRight size={15} /></button>
        </div>
      )}

      {/* MODAL COMPARTIDO DE USUARIO */}
      {modalOpen && (
        <Modal title={editandoId ? "Editar usuario" : "Nuevo usuario"} onClose={() => !guardando && setModalOpen(false)}>
          <UsuarioForm 
            usuarioEditar={editandoId ? {
              ...usuarios.find(u => u.id_usuario === editandoId),
              roles_asignados: asignaciones.filter(a => a.usuario_id === editandoId).map(a => a.rol_id)
            } : null}
            rolesDisponibles={roles}
            servidoresDisponibles={servidores}
            servidoresActuales={todosLosMiembros.filter(m => Number(m.usuario_id) === Number(editandoId)).map(m => m.servidor_id)}
            mostrarServidores={true}
            mostrarRolesGlobales={true}
            guardando={guardando}
            onCancel={() => setModalOpen(false)}
            onSubmit={handleFormSubmit}
          />
        </Modal>
      )}

      {/* MODAL CAMBIAR CLAVE (se mantiene igual) */}
      {modalClave && formClave.usuario && (
        <Modal title={`Contraseña de ${formClave.usuario.nombre_usuario}`} onClose={() => !guardando && setModalClave(false)}>
          <form className="admin-form" onSubmit={handleCambiarClave}>
             <div className="admin-clave">
              <label className="admin-clave-label">Nueva contraseña</label>
              <div className="admin-clave-caja">
                <input type={verClave ? "text" : "password"} value={formClave.nueva} onChange={(e) => setFormClave({ ...formClave, nueva: e.target.value })} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setVerClave((v) => !v)}>{verClave ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <Input label="Repetir contraseña" type={verClave ? "text" : "password"} value={formClave.repetir} onChange={(e) => setFormClave({ ...formClave, repetir: e.target.value })} error={formClave.repetir && formClave.nueva !== formClave.repetir ? "No coinciden" : ""} />
            {error && <div className="admin-tab__error">{error}</div>}
            <div className="admin-form__actions">
              <Button type="button" variant="outline" onClick={() => setModalClave(false)} disabled={guardando}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Cambiar contraseña"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogo}
    </div>
  );
}