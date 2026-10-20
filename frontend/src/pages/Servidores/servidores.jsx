import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Server, FolderTree, Hash, Megaphone, ChevronRight,
  AlertCircle, Loader2, Tags, Pencil, Trash2, Users, UserPlus, UserCog
} from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import UsuarioForm from "../../components/forms/UsuarioForm";
import "./servidores.css";
import { listarServidores, obtenerJerarquiaServidor } from "../../api/servidores";
import { listarCategoriasPorServidor, crearCategoria, actualizarCategoria, eliminarCategoria } from "../../api/categorias";
import { crearCanal, actualizarCanal, eliminarCanal } from "../../api/canales";
import { listarUsuarios, crearUsuario } from "../../api/usuarios";
import { crearPerfil } from "../../api/perfiles";
import { crearMiembroServidor, eliminarMiembroServidor, listarMiembrosServidor } from "../../api/miembrosServidor";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarUsuarioRol, crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { useAuth } from "../../context/AuthContext";
import useListaInfinita from "../../hooks/useListaInfinita";

export default function Servidores() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [todosLosServidores, setTodosLosServidores] = useState([]);
  const [todosLosRoles, setTodosLosRoles] = useState([]);
  const [rolesDefinidos, setRolesDefinidos] = useState([]);
  const [misMembresias, setMisMembresias] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);

  const [loadingServidores, setLoadingServidores] = useState(true);
  const [errorServidores, setErrorServidores] = useState("");

  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroRolCanal, setFiltroRolCanal] = useState("");
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  const [activeTab, setActiveTab] = useState("canales");

  const [jerarquia, setJerarquia] = useState(null);
  const [loadingJerarquia, setLoadingJerarquia] = useState(false);
  const [canalActivoId, setCanalActivoId] = useState(null);

  const [categoriasGestion, setCategoriasGestion] = useState([]);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [formCategoria, setFormCategoria] = useState({ nombre: "", descripcion: "" });

  const [modalCanal, setModalCanal] = useState(false);
  const [canalEditando, setCanalEditando] = useState(null);
  const [guardandoCanal, setGuardandoCanal] = useState(false);
  const [formCanal, setFormCanal] = useState({ nombre: "", tipo: "chat", categoria_id: "" });

  const [modalMiembro, setModalMiembro] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [creandoUsuarioNuevo, setCreandoUsuarioNuevo] = useState(false);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const [modalEditarRoles, setModalEditarRoles] = useState(false);
  const [usuarioEditandoRoles, setUsuarioEditandoRoles] = useState(null);
  const [rolesSeleccionadosEdicion, setRolesSeleccionadosEdicion] = useState([]);

  useEffect(() => {
    let cancelado = false;
    async function cargarDatos() {
      setLoadingServidores(true);
      try {
        const [servidores, asignaciones, membresias, roles, usuarios] = await Promise.all([
          listarServidores(), listarUsuarioRol(), listarMiembrosServidor(), listarRoles(), listarUsuarios(),
        ]);
        if (cancelado) return;
        setTodosLosServidores(servidores || []);
        setTodosLosRoles(asignaciones || []);
        setMisMembresias(membresias || []);
        setRolesDefinidos(roles || []);
        setTodosLosUsuarios(usuarios || []);
      } catch (err) {
        if (!cancelado) setErrorServidores(err?.message || "Error al cargar datos");
      } finally {
        if (!cancelado) setLoadingServidores(false);
      }
    }
    cargarDatos();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function cargarMiembrosCanal() {
      try {
        const data = await listarMiembrosCanal();
        if (!cancelado) setMiembrosCanal(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
    }
    cargarMiembrosCanal();
    return () => { cancelado = true; };
  }, []);

  const misServidores = useMemo(() => {
    if (!user) return [];
    if (hasRole(["super_admin", "admin"])) return todosLosServidores;
    const misIds = misMembresias
      .filter((m) => Number(m.usuario_id) === Number(user.id_usuario) && m.activo !== false)
      .map((m) => Number(m.servidor_id));
    return todosLosServidores.filter((s) => misIds.includes(Number(s.id_servidor)));
  }, [todosLosServidores, misMembresias, user, hasRole]);

  useEffect(() => {
    if (misServidores.length > 0 && !misServidores.some(s => s.id_servidor === servidorSeleccionado)) {
      setServidorSeleccionado(misServidores[0].id_servidor);
    } else if (misServidores.length === 0) {
      setServidorSeleccionado(null);
    }
  }, [misServidores, servidorSeleccionado]);

  // ---- Roles por servidor (para el filtro) ----
  const rolesPorServidor = useMemo(() => {
    const nombrePorId = new Map(rolesDefinidos.map((r) => [Number(r.id_rol), r.nombre]));
    const mapa = {};
    (todosLosRoles || []).forEach((ur) => {
      if (ur.servidor_id === null || ur.servidor_id === undefined) return;
      const nombre = nombrePorId.get(Number(ur.rol_id));
      if (!nombre) return;
      const servidor = Number(ur.servidor_id);
      if (!mapa[servidor]) mapa[servidor] = [];
      if (!mapa[servidor].includes(nombre)) mapa[servidor].push(nombre);
    });
    return mapa;
  }, [todosLosRoles, rolesDefinidos]);

  const rolesGlobalesPorUsuario = useMemo(() => {
    const nombrePorId = new Map(rolesDefinidos.map((r) => [Number(r.id_rol), r.nombre]));
    const mapa = {};
    (todosLosRoles || []).forEach((ur) => {
      if (ur.servidor_id !== null && ur.servidor_id !== undefined) return;
      const nombre = nombrePorId.get(Number(ur.rol_id));
      if (!nombre) return;
      const usuario = Number(ur.usuario_id);
      if (!mapa[usuario]) mapa[usuario] = [];
      if (!mapa[usuario].includes(nombre)) mapa[usuario].push(nombre);
    });
    return mapa;
  }, [todosLosRoles, rolesDefinidos]);

  const nombresRol = useMemo(
    () => rolesDefinidos.map((r) => r.nombre).sort((a, b) => a.localeCompare(b)),
    [rolesDefinidos]
  );

  const rolesDeServidorId = (servidorId) => {
    const porServidor = rolesPorServidor[Number(servidorId)] || [];
    const srv = misServidores.find((s) => Number(s.id_servidor) === Number(servidorId));
    const delCreador = srv ? rolesGlobalesPorUsuario[Number(srv.creador_id)] || [] : [];
    return Array.from(new Set([...porServidor, ...delCreador]));
  };

  const servidoresFiltrados = useMemo(() => {
    const texto = busquedaServidor.trim().toLowerCase();
    const rol = filtroRol.trim().toLowerCase();
    return misServidores.filter((s) => {
      const coincideTexto = !texto || (s.nombre || "").toLowerCase().includes(texto);
      const coincideRol = !rol || rolesDeServidorId(s.id_servidor).some((r) => r.toLowerCase() === rol);
      return coincideTexto && coincideRol;
    });
  }, [misServidores, busquedaServidor, filtroRol, rolesPorServidor, rolesGlobalesPorUsuario]);

  const {
    visibles: servidoresVisibles,
    hayMas: hayMasServidores,
    total: totalServidores,
    contenedorRef: contenedorServidoresRef,
    manejarScroll: manejarScrollServidores,
    cargarMas: cargarMasServidores,
  } = useListaInfinita(servidoresFiltrados, {
    paso: 10,
    resetKey: `${busquedaServidor}|${filtroRol}`,
  });

  const servidorActivo = misServidores.find((s) => s.id_servidor === servidorSeleccionado);

  const puedeGestionar = useMemo(() => {
    if (!user || !servidorActivo) return false;
    if (hasRole(["super_admin", "admin"])) return true;
    if (Number(servidorActivo.creador_id) === Number(user.id_usuario)) return true;
    return todosLosRoles.some((ur) => {
      if (Number(ur.usuario_id) !== Number(user.id_usuario)) return false;
      if (Number(ur.servidor_id) !== Number(servidorActivo.id_servidor)) return false;
      const rol = rolesDefinidos.find(r => r.id_rol === ur.rol_id);
      return rol?.nombre?.toLowerCase() === "director";
    });
  }, [user, servidorActivo, hasRole, todosLosRoles, rolesDefinidos]);

  const miembrosActuales = useMemo(() => {
    if (!servidorSeleccionado) return [];
    const idsMiembros = misMembresias
      .filter(m => Number(m.servidor_id) === Number(servidorSeleccionado) && m.activo !== false)
      .map(m => Number(m.usuario_id));
    return todosLosUsuarios.filter(u => idsMiembros.includes(Number(u.id_usuario)));
  }, [misMembresias, servidorSeleccionado, todosLosUsuarios]);

  useEffect(() => {
    if (!servidorSeleccionado) { setJerarquia(null); return; }
    let cancelado = false;
    async function cargarJerarquia() {
      setLoadingJerarquia(true);
      setCanalActivoId(null);
      try {
        const data = await obtenerJerarquiaServidor(servidorSeleccionado);
        if (!cancelado) setJerarquia(data);
      } catch (err) { console.error(err); }
      finally { if (!cancelado) setLoadingJerarquia(false); }
    }
    cargarJerarquia();
    return () => { cancelado = true; };
  }, [servidorSeleccionado]);

  useEffect(() => {
    if (!servidorSeleccionado || !puedeGestionar) { setCategoriasGestion([]); return; }
    let cancelado = false;
    async function cargarCat() {
      try {
        const data = await listarCategoriasPorServidor(servidorSeleccionado);
        if (!cancelado) setCategoriasGestion(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
    }
    cargarCat();
    return () => { cancelado = true; };
  }, [servidorSeleccionado, puedeGestionar, jerarquia]);

  // ---- Filtro de canales por tipo de usuario (miembros del canal con ese rol en el servidor) ----
  const rolesDeUsuarioEnServidor = (usuarioId) => {
    return (todosLosRoles || [])
      .filter((ur) => Number(ur.usuario_id) === Number(usuarioId) && Number(ur.servidor_id) === Number(servidorSeleccionado))
      .map((ur) => rolesDefinidos.find((r) => r.id_rol === ur.rol_id)?.nombre)
      .filter(Boolean);
  };

  const jerarquiaFiltrada = useMemo(() => {
    if (!jerarquia) return jerarquia;
    if (!filtroRolCanal) return jerarquia;

    const coincide = (canal) => {
      const ids = miembrosCanal
        .filter((m) => Number(m.canal_id) === Number(canal.id_canal))
        .map((m) => Number(m.usuario_id));
      return ids.some((id) =>
        rolesDeUsuarioEnServidor(id).some((r) => r.toLowerCase() === filtroRolCanal.toLowerCase())
      );
    };

    return {
      ...jerarquia,
      categorias: (jerarquia.categorias || []).map((cat) => ({
        ...cat,
        canales: (cat.canales || []).filter(coincide),
      })),
      sinCategoria: (jerarquia.sinCategoria || []).filter(coincide),
    };
  }, [jerarquia, filtroRolCanal, miembrosCanal, todosLosRoles, rolesDefinidos, servidorSeleccionado]);

  const canalActivo = jerarquia?.categorias?.flatMap((c) => c.canales || []).concat(jerarquia?.sinCategoria || []).find((c) => c.id_canal === canalActivoId) || null;
  const abrirCanal = () => { if (canalActivo) navigate("/mensajes", { state: { canal: canalActivo } }); };
  const recargarJerarquia = async () => {
    if (!servidorSeleccionado) return;
    setJerarquia(await obtenerJerarquiaServidor(servidorSeleccionado));
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!servidorSeleccionado) return;
    setGuardandoCategoria(true);
    try {
      const payload = { nombre: formCategoria.nombre.trim(), descripcion: formCategoria.descripcion.trim() || null, padre_id: null, orden: 0 };
      if (categoriaEditando) await actualizarCategoria(categoriaEditando.id_categoria, payload);
      else await crearCategoria({ ...payload, servidor_id: Number(servidorSeleccionado) });
      await recargarJerarquia();
      setCategoriasGestion(await listarCategoriasPorServidor(servidorSeleccionado));
      setModalCategoria(false);
    } catch (err) { alert(err.message); } finally { setGuardandoCategoria(false); }
  };

  const borrarCategoria = async (id) => {
    if (!window.confirm("¿Eliminar categoría?")) return;
    try {
      await eliminarCategoria(id);
      await recargarJerarquia();
      setCategoriasGestion(await listarCategoriasPorServidor(servidorSeleccionado));
    } catch (err) { alert(err.message); }
  };

  const guardarCanal = async (e) => {
    e.preventDefault();
    if (!servidorSeleccionado) return;
    setGuardandoCanal(true);
    try {
      const payload = { nombre: formCanal.nombre.trim(), tipo: formCanal.tipo, categoria_id: formCanal.categoria_id ? Number(formCanal.categoria_id) : null };
      if (canalEditando) await actualizarCanal(canalEditando.id_canal, payload);
      else await crearCanal({ ...payload, servidor_id: Number(servidorSeleccionado), creador_id: user?.id_usuario });
      await recargarJerarquia();
      setModalCanal(false);
    } catch (err) { alert(err.message); } finally { setGuardandoCanal(false); }
  };

  const borrarCanal = async (id) => {
    if (!window.confirm("¿Eliminar canal?")) return;
    try {
      await eliminarCanal(id);
      await recargarJerarquia();
    } catch (err) { alert(err.message); }
  };

  const agregarMiembroExistente = async () => {
    if (!usuarioSeleccionado || !servidorSeleccionado) return;
    setGuardandoUsuario(true);
    try {
      await crearMiembroServidor({ usuario_id: Number(usuarioSeleccionado), servidor_id: Number(servidorSeleccionado), activo: true });
      setMisMembresias(await listarMiembrosServidor());
      setModalMiembro(false);
      setUsuarioSeleccionado("");
      setBusquedaUsuario("");
    } catch (e) { alert(e.message); } finally { setGuardandoUsuario(false); }
  };

  const crearEInscribirUsuario = async (datos) => {
    if (!servidorSeleccionado) return;
    setGuardandoUsuario(true);
    try {
      const nuevo = await crearUsuario({
        nombre_usuario: datos.nombre_usuario, email: datos.email, password: datos.password, activo: datos.activo === "true"
      });

      await crearPerfil({ usuario_id: nuevo.id_usuario, nombres: datos.nombres, apellidos: datos.apellidos });
      await crearMiembroServidor({ usuario_id: nuevo.id_usuario, servidor_id: Number(servidorSeleccionado), activo: true });

      for (const rolId of datos.roles_ids) {
        await crearUsuarioRol({ usuario_id: nuevo.id_usuario, rol_id: Number(rolId), servidor_id: Number(servidorSeleccionado), asignado_por: user?.id_usuario });
      }

      setMisMembresias(await listarMiembrosServidor());
      setTodosLosUsuarios(await listarUsuarios());
      setTodosLosRoles(await listarUsuarioRol());

      setModalMiembro(false);
      setCreandoUsuarioNuevo(false);
    } catch (e) { alert(e.message); } finally { setGuardandoUsuario(false); }
  };

  const quitarMiembro = async (usuarioId) => {
    if (!window.confirm("¿Quitar a este usuario del servidor? Se le quitarán todos sus roles en este servidor.")) return;
    try {
      await eliminarMiembroServidor(usuarioId, servidorSeleccionado);
      const rolesAEliminar = todosLosRoles.filter(ur => Number(ur.usuario_id) === Number(usuarioId) && Number(ur.servidor_id) === Number(servidorSeleccionado));
      for (const ur of rolesAEliminar) await eliminarUsuarioRol(usuarioId, ur.rol_id, servidorSeleccionado);
      setMisMembresias(await listarMiembrosServidor());
      setTodosLosRoles(await listarUsuarioRol());
    } catch (e) { alert(e.message); }
  };

  const abrirEditarRoles = (u) => {
    setUsuarioEditandoRoles(u);
    const rolesActuales = todosLosRoles.filter(ur => Number(ur.usuario_id) === Number(u.id_usuario) && Number(ur.servidor_id) === Number(servidorSeleccionado)).map(ur => Number(ur.rol_id));
    setRolesSeleccionadosEdicion(rolesActuales);
    setModalEditarRoles(true);
  };

  const toggleRolEdicion = (rolId) => {
    setRolesSeleccionadosEdicion(prev => prev.includes(rolId) ? prev.filter(id => id !== rolId) : [...prev, rolId]);
  };

  const guardarEdicionRoles = async () => {
    if (!usuarioEditandoRoles || !servidorSeleccionado) return;
    setGuardandoUsuario(true);
    try {
      const rolesActuales = todosLosRoles.filter(ur => Number(ur.usuario_id) === Number(usuarioEditandoRoles.id_usuario) && Number(ur.servidor_id) === Number(servidorSeleccionado)).map(ur => Number(ur.rol_id));
      for (const rolId of rolesActuales) {
        if (!rolesSeleccionadosEdicion.includes(rolId)) await eliminarUsuarioRol(usuarioEditandoRoles.id_usuario, rolId, servidorSeleccionado);
      }
      for (const rolId of rolesSeleccionadosEdicion) {
        if (!rolesActuales.includes(rolId)) await crearUsuarioRol({ usuario_id: usuarioEditandoRoles.id_usuario, rol_id: rolId, servidor_id: Number(servidorSeleccionado), asignado_por: user?.id_usuario });
      }
      setTodosLosRoles(await listarUsuarioRol());
      setModalEditarRoles(false);
    } catch (e) { alert(e.message); } finally { setGuardandoUsuario(false); }
  };

  const obtenerRolesDeUsuario = (usuarioId) => {
    return todosLosRoles.filter(ur => Number(ur.usuario_id) === Number(usuarioId) && Number(ur.servidor_id) === Number(servidorSeleccionado))
      .map(ur => rolesDefinidos.find(r => r.id_rol === ur.rol_id)?.nombre).filter(Boolean);
  };

  const nombreCompleto = (u) => {
    if (u.perfil?.apellidos && u.perfil?.nombres) return `${u.perfil.apellidos}, ${u.perfil.nombres}`;
    return u.nombre_usuario;
  };

  return (
    <section className="servidores">
      <div className="servidores__header">
        <h1 className="servidores__title">Mis Servidores</h1>
      </div>

      <div className="servidores__explorer">
        <aside className="servidores__panel servidores__panel--servers">
          <div className="servidores__search">
            <Search size={18} />
            <input type="text" placeholder="Buscar servidor..." value={busquedaServidor} onChange={(e) => setBusquedaServidor(e.target.value)} />
          </div>

          <div className="servidores__filter">
            <UserCog size={16} />
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por tipo de usuario">
              <option value="">Todos los tipos de usuario</option>
              {nombresRol.map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>

          {loadingServidores && <p className="servidores__empty">Cargando...</p>}
          {!loadingServidores && servidoresFiltrados.length === 0 && <p className="servidores__empty">No perteneces a ningún servidor.</p>}

          <div className="servidores__scroll" ref={contenedorServidoresRef} onScroll={manejarScrollServidores}>
            <ul className="servidores__server-list">
              {servidoresVisibles.map((s) => (
                <li key={s.id_servidor}>
                  <button className={`servidores__server-item ${s.id_servidor === servidorSeleccionado ? "servidores__server-item--active" : ""}`} onClick={() => setServidorSeleccionado(s.id_servidor)}>
                    <Server size={18} />
                    <div className="servidores__server-text">
                      <span className="servidores__server-name">{s.nombre}</span>
                      {s.descripcion && <span className="servidores__server-desc">{s.descripcion}</span>}
                      {rolesDeServidorId(s.id_servidor).length > 0 && (
                        <span className="servidores__server-roles">
                          {rolesDeServidorId(s.id_servidor).join(" · ")}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} />
                  </button>
                </li>
              ))}
              {hayMasServidores && (
                <li className="servidores__load-more">↓ Bajá la lista o usá “Cargar más”</li>
              )}
            </ul>
          </div>

          <div className="servidores__scroll-footer">
            <span className="servidores__contador">
              Mostrando {servidoresVisibles.length} de {totalServidores} servidores
            </span>
            {hayMasServidores && (
              <Button size="sm" variant="outline" onClick={cargarMasServidores}>
                Cargar más
              </Button>
            )}
          </div>
        </aside>

        <main className="servidores__panel servidores__panel--detail">
          {servidorSeleccionado === null ? (
            <div className="servidores__empty-state">
              <Server size={32} />
              <p>Seleccioná un servidor para ver sus canales.</p>
            </div>
          ) : (
            <>
              <header className="servidores__detail-header" style={{ marginBottom: "1rem", borderBottom: "1px solid #ddd", paddingBottom: "1rem" }}>
                <div>
                  <h2 className="servidores__detail-title">{servidorActivo?.nombre}</h2>
                  {servidorActivo?.descripcion && <p className="servidores__detail-desc">{servidorActivo.descripcion}</p>}
                </div>
              </header>

              <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                {puedeGestionar && (
                  <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button onClick={() => setActiveTab("canales")} style={{ padding: "10px 12px", textAlign: "left", borderRadius: "8px", border: "none", cursor: "pointer", background: activeTab === "canales" ? "var(--color-azul-petroleo)" : "transparent", color: activeTab === "canales" ? "white" : "var(--texto-oscuro)", fontWeight: 600 }}>
                      <Hash size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Canales
                    </button>
                    <button onClick={() => setActiveTab("categorias")} style={{ padding: "10px 12px", textAlign: "left", borderRadius: "8px", border: "none", cursor: "pointer", background: activeTab === "categorias" ? "var(--color-azul-petroleo)" : "transparent", color: activeTab === "categorias" ? "white" : "var(--texto-oscuro)", fontWeight: 600 }}>
                      <Tags size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Categorías
                    </button>
                    <button onClick={() => setActiveTab("miembros")} style={{ padding: "10px 12px", textAlign: "left", borderRadius: "8px", border: "none", cursor: "pointer", background: activeTab === "miembros" ? "var(--color-azul-petroleo)" : "transparent", color: activeTab === "miembros" ? "white" : "var(--texto-oscuro)", fontWeight: 600 }}>
                      <Users size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} /> Miembros
                    </button>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: "300px" }}>
                  {(!puedeGestionar || activeTab === "canales") && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0 }}>Canales del servidor</h3>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <select value={filtroRolCanal} onChange={(e) => setFiltroRolCanal(e.target.value)} aria-label="Filtrar canales por tipo de usuario" style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "12px", background: "white" }}>
                            <option value="">Todos los tipos de usuario</option>
                            {nombresRol.map((rol) => (
                              <option key={rol} value={rol}>{rol}</option>
                            ))}
                          </select>
                          {puedeGestionar && <Button size="sm" onClick={() => { setCanalEditando(null); setFormCanal({ nombre: "", tipo: "chat", categoria_id: "" }); setModalCanal(true); }}>+ Nuevo canal</Button>}
                        </div>
                      </div>

                      {loadingJerarquia ? <p>Cargando canales...</p> : jerarquiaFiltrada && (
                        <div className="servidores__tree">
                          {(jerarquiaFiltrada.categorias || []).map((cat) => (
                            <section key={cat.id_categoria} className="servidores__categoria">
                              <h4 className="servidores__categoria-nombre">{cat.nombre}</h4>
                              <ul className="servidores__canal-list">
                                {(cat.canales || []).map((canal) => (
                                  <li key={canal.id_canal} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <button className={`servidores__canal ${canal.id_canal === canalActivoId ? "servidores__canal--active" : ""}`} onClick={() => setCanalActivoId(canal.id_canal)} style={{ flex: 1 }}>
                                      {canal.tipo === "informativo" ? <Megaphone size={16} /> : <Hash size={16} />}
                                      <span>{canal.nombre}</span>
                                    </button>
                                    {puedeGestionar && (
                                      <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                                        <button onClick={() => { setCanalEditando(canal); setFormCanal({ nombre: canal.nombre, tipo: canal.tipo, categoria_id: canal.categoria_id || "" }); setModalCanal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><Pencil size={14} /></button>
                                        <button onClick={() => borrarCanal(canal.id_canal)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c00" }}><Trash2 size={14} /></button>
                                      </div>
                                    )}
                                  </li>
                                ))}
                                {cat.canales.length === 0 && <p style={{ opacity: 0.6, fontSize: "14px" }}>Sin canales.</p>}
                              </ul>
                            </section>
                          ))}
                          {(jerarquiaFiltrada.sinCategoria || []).length > 0 && (
                            <section className="servidores__categoria servidores__categoria--uncategorized">
                              <h4 className="servidores__categoria-nombre">Sin categoría</h4>
                              <ul className="servidores__canal-list">
                                {jerarquiaFiltrada.sinCategoria.map((canal) => (
                                  <li key={canal.id_canal} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <button className={`servidores__canal ${canal.id_canal === canalActivoId ? "servidores__canal--active" : ""}`} onClick={() => setCanalActivoId(canal.id_canal)} style={{ flex: 1 }}>
                                      {canal.tipo === "informativo" ? <Megaphone size={16} /> : <Hash size={16} />}
                                      <span>{canal.nombre}</span>
                                    </button>
                                    {puedeGestionar && (
                                      <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                                        <button onClick={() => { setCanalEditando(canal); setFormCanal({ nombre: canal.nombre, tipo: canal.tipo, categoria_id: "" }); setModalCanal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><Pencil size={14} /></button>
                                        <button onClick={() => borrarCanal(canal.id_canal)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c00" }}><Trash2 size={14} /></button>
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {puedeGestionar && activeTab === "categorias" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0 }}>Categorías</h3>
                        <Button size="sm" onClick={() => { setCategoriaEditando(null); setFormCategoria({ nombre: "", descripcion: "" }); setModalCategoria(true); }}>+ Nueva categoría</Button>
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {categoriasGestion.map((cat) => (
                          <li key={cat.id_categoria} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--color-gris-azulado)", marginBottom: "8px", borderRadius: "8px" }}>
                            <div>
                              <strong style={{ display: "block" }}>{cat.nombre}</strong>
                              {cat.descripcion && <span style={{ fontSize: "12px", color: "#666" }}>{cat.descripcion}</span>}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <Button size="sm" variant="outline" onClick={() => { setCategoriaEditando(cat); setFormCategoria({ nombre: cat.nombre, descripcion: cat.descripcion || "" }); setModalCategoria(true); }}><Pencil size={14} /></Button>
                              <Button size="sm" onClick={() => borrarCategoria(cat.id_categoria)}><Trash2 size={14} /></Button>
                            </div>
                          </li>
                        ))}
                        {categoriasGestion.length === 0 && <p>No hay categorías creadas.</p>}
                      </ul>
                    </div>
                  )}

                  {puedeGestionar && activeTab === "miembros" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0 }}>Miembros del Servidor</h3>
                        <Button size="sm" onClick={() => { setCreandoUsuarioNuevo(false); setModalMiembro(true); }}>+ Agregar miembro</Button>
                      </div>

                      {miembrosActuales.length === 0 ? (
                        <p>No hay miembros en este servidor.</p>
                      ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {miembrosActuales.map((u) => (
                            <li key={u.id_usuario} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--color-gris-azulado)", marginBottom: "8px", borderRadius: "8px", alignItems: "center" }}>
                              <div>
                                <strong style={{ display: "block" }}>{nombreCompleto(u)} <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--color-teal-medio)", marginLeft: "6px" }}>{obtenerRolesDeUsuario(u.id_usuario).join(", ")}</span></strong>
                                <span style={{ fontSize: "12px", color: "#666" }}>{u.email}</span>
                              </div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <Button size="sm" variant="outline" onClick={() => abrirEditarRoles(u)}><Pencil size={14} /></Button>
                                <Button size="sm" onClick={() => quitarMiembro(u.id_usuario)}><Trash2 size={14} /></Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {canalActivo && activeTab === "canales" && (
                    <div style={{ marginTop: "2rem", padding: "1rem", background: "#EDF2F7", display: "flex", justifyContent: "space-between", borderRadius: "8px" }}>
                      <span>Canal seleccionado: <strong>{canalActivo.nombre}</strong></span>
                      <Button size="sm" onClick={abrirCanal}>Entrar al canal <ChevronRight size={16} /></Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {modalCategoria && (
        <Modal title={categoriaEditando ? "Editar categoría" : "Nueva categoría"} onClose={() => setModalCategoria(false)}>
          <form className="categorias__form" onSubmit={guardarCategoria} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input label="Nombre" value={formCategoria.nombre} onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})} />
            <Input label="Descripción" value={formCategoria.descripcion} onChange={(e) => setFormCategoria({...formCategoria, descripcion: e.target.value})} />
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <Button type="button" variant="outline" onClick={() => setModalCategoria(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardandoCategoria}>{guardandoCategoria ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {modalCanal && (
        <Modal title={canalEditando ? "Editar canal" : "Nuevo canal"} onClose={() => setModalCanal(false)}>
          <form className="categorias__form" onSubmit={guardarCanal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input label="Nombre" value={formCanal.nombre} onChange={(e) => setFormCanal({...formCanal, nombre: e.target.value})} />
            <Select label="Categoría (opcional)" value={formCanal.categoria_id} onChange={(e) => setFormCanal({...formCanal, categoria_id: e.target.value})} options={[{ value: "", label: "Sin categoría" }, ...categoriasGestion.map(c => ({ value: c.id_categoria, label: c.nombre }))]} />
            <Select label="Tipo de canal" value={formCanal.tipo} onChange={(e) => setFormCanal({...formCanal, tipo: e.target.value})} options={[{ value: "chat", label: "Chat" }, { value: "informativo", label: "Informativo" }]} />
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <Button type="button" variant="outline" onClick={() => setModalCanal(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardandoCanal}>{guardandoCanal ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {modalMiembro && (
        <Modal title="Agregar miembro al servidor" onClose={() => setModalMiembro(false)}>
          {/* width: 100% y overflow para evitar que el form se bloquee */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", overflowY: "auto", maxHeight: "70vh", paddingRight: "4px" }}>
            {!creandoUsuarioNuevo ? (
              <>
                <Input label="Buscar usuario por nombre o email" value={busquedaUsuario} onChange={(e) => setBusquedaUsuario(e.target.value)} placeholder="Ej: juan" />
                <Select
                  label="Seleccionar usuario"
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  options={todosLosUsuarios
                    .filter(u =>
                      (u.nombre_usuario.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
                        u.email.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
                        u.perfil?.apellidos?.toLowerCase().includes(busquedaUsuario.toLowerCase())) &&
                      !miembrosActuales.some(m => m.id_usuario === u.id_usuario)
                    )
                    .map(u => ({ value: u.id_usuario, label: `${nombreCompleto(u)} (${u.email})` }))}
                  placeholder="Elegir usuario..."
                />

                {/* BOTONES CORREGIDOS: flex-direction column en mobile, fila en desktop */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", width: "100%" }}>
                  <Button type="button" variant="outline" onClick={() => setCreandoUsuarioNuevo(true)} style={{ width: "100%", padding: "10px" }}>
                    ¿No existe? Crear nuevo
                  </Button>
                  <Button disabled={!usuarioSeleccionado || guardandoUsuario} onClick={agregarMiembroExistente} style={{ width: "100%", padding: "10px" }}>
                    {guardandoUsuario ? "Agregando..." : "Agregar al servidor"}
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ width: "100%" }}>
                <UsuarioForm
                  rolesDisponibles={rolesDefinidos}
                  mostrarServidores={false}
                  mostrarRolesGlobales={false}
                  guardando={guardandoUsuario}
                  onCancel={() => setCreandoUsuarioNuevo(false)}
                  onSubmit={crearEInscribirUsuario}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {modalEditarRoles && usuarioEditandoRoles && (
        <Modal title={`Roles de ${nombreCompleto(usuarioEditandoRoles)}`} onClose={() => setModalEditarRoles(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "14px", color: "#666" }}>Modificá los roles de este usuario <strong>solo en este servidor</strong>.</p>
            <div className="admin-grupo">
              <div className="admin-checks" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {rolesDefinidos.filter(r => r.tipo === "servidor").map(r => (
                  <label key={r.id_rol} className="admin-check" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "var(--color-gris-azulado)", borderRadius: "6px", cursor: "pointer" }}>
                    <input type="checkbox" checked={rolesSeleccionadosEdicion.includes(r.id_rol)} onChange={() => toggleRolEdicion(r.id_rol)} />
                    <span style={{ fontSize: "13px" }}>{r.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <Button type="button" variant="outline" onClick={() => setModalEditarRoles(false)} style={{ marginRight: "8px" }}>Cancelar</Button>
              <Button disabled={guardandoUsuario} onClick={guardarEdicionRoles}>{guardandoUsuario ? "Guardando..." : "Guardar roles"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}