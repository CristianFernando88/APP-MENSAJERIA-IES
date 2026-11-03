import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Hash, Megaphone, Plus, Trash2, Users, ChevronRight,
  ChevronDown, ArrowLeft, Server, Folder, X, UserRound, UserPlus, Link2
} from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import { listarCanales } from "../../api/canales";
import { listarMiembrosCanal, crearMiembroCanal, actualizarMiembroCanal, eliminarMiembroCanal } from "../../api/miembrosCanal";
import { listarUsuarios } from "../../api/usuarios";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import { listarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { listarServidores } from "../../api/servidores";
import { listarCategoriasPorServidor } from "../../api/categorias";
import { listarRelacionesUsuario, crearRelacionUsuario, eliminarRelacionUsuario } from "../../api/relacionesUsuario";
import { useAuth } from "../../context/AuthContext";
import "./Canales.css";

export default function Canales() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();


  const [canales, setCanales] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [todosLosRoles, setTodosLosRoles] = useState([]);
  const [rolesDefinidos, setRolesDefinidos] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);
  const [miembrosServidor, setMiembrosServidor] = useState([]);
  const [relaciones, setRelaciones] = useState([]);


  const [busqueda, setBusqueda] = useState("");
  const [canalSeleccionadoId, setCanalSeleccionadoId] = useState(null);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [filtroRol, setFiltroRol] = useState("all");


  const [tabActiva, setTabActiva] = useState("info");


  const [modalMiembro, setModalMiembro] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [rolEnCanal, setRolEnCanal] = useState("miembro");
  const [guardando, setGuardando] = useState(false);


  const [tipoVinculo, setTipoVinculo] = useState("padre");
  const [usuarioVinculo, setUsuarioVinculo] = useState("");


  const [filtroServidor, setFiltroServidor] = useState("todos");
  const [vistaMovil, setVistaMovil] = useState("canales");
  const [mostrarCanales, setMostrarCanales] = useState(true);
  const [seccionesCerradas, setSeccionesCerradas] = useState({});
  const [servidoresLista, setServidoresLista] = useState([]);
  const [categoriasLista, setCategoriasLista] = useState([]);


  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      try {
        const [resCanales, resUsuarios, resAsignaciones, resRoles, resMiembrosCanal, resMiembrosServidor, resRelaciones] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarUsuarioRol(),
          listarRoles(),
          listarMiembrosCanal(),
          listarMiembrosServidor(),
          listarRelacionesUsuario().catch(() => [])
        ]);
        if (cancelado) return;
        setCanales(resCanales || []);
        setTodosLosUsuarios(resUsuarios || []);
        setTodosLosRoles(resAsignaciones || []);
        setRolesDefinidos(resRoles || []);
        setMiembrosCanal(resMiembrosCanal || []);
        setMiembrosServidor(resMiembrosServidor || []);
        setRelaciones(resRelaciones || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, []);


  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const data = await listarServidores();
        if (!cancelado) setServidoresLista(data || []);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    const ids = [...new Set(canales.map((c) => Number(c.servidor_id)))].filter(Boolean);
    if (ids.length === 0) return;
    let cancelado = false;
    Promise.all(ids.map((id) => listarCategoriasPorServidor(id).catch(() => [])))
      .then((res) => { if (!cancelado) setCategoriasLista(res.flat()); });
    return () => { cancelado = true; };
  }, [canales]);

  const misCanales = useMemo(() => {
    if (!user) return [];
    if (hasRole(["super_admin", "admin"])) return canales;

    const misIdsCanal = miembrosCanal
      .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
      .map((m) => Number(m.canal_id));

    return canales.filter((c) => misIdsCanal.includes(Number(c.id_canal)));
  }, [canales, miembrosCanal, user, hasRole]);


  useEffect(() => {
    if (misCanales.length > 0 && !misCanales.some(c => c.id_canal === canalSeleccionadoId)) {
      setCanalSeleccionadoId(misCanales[0].id_canal);
    } else if (misCanales.length === 0) {
      setCanalSeleccionadoId(null);
    }
  }, [misCanales, canalSeleccionadoId]);

  const canalesFiltrados = misCanales.filter(c => (c.nombre || "").toLowerCase().includes(busqueda.toLowerCase()));
  const canalActivo = misCanales.find(c => c.id_canal === canalSeleccionadoId);


  const puedeGestionar = useMemo(() => {
    if (!user || !canalActivo) return false;
    if (hasRole(["super_admin", "admin"])) return true;

    return todosLosRoles.some((ur) => {
      if (Number(ur.usuario_id) !== Number(user.id_usuario)) return false;
      if (Number(ur.servidor_id) !== Number(canalActivo.servidor_id)) return false;
      const rol = rolesDefinidos.find(r => r.id_rol === ur.rol_id);
      return ["director", "preceptor"].includes(rol?.nombre?.toLowerCase());
    });
  }, [user, canalActivo, hasRole, todosLosRoles, rolesDefinidos]);


  const miembrosDelCanal = useMemo(() => {
    if (!canalActivo) return [];
    const ids = miembrosCanal
      .filter((m) => Number(m.canal_id) === Number(canalActivo.id_canal))
      .map((m) => Number(m.usuario_id));
    return todosLosUsuarios.filter((u) => ids.includes(Number(u.id_usuario)));
  }, [miembrosCanal, canalActivo, todosLosUsuarios]);


  const nombreServidor = (id) => {
    const s = servidoresLista.find((x) => Number(x.id_servidor) === Number(id));
    return s?.nombre || `Servidor ${id}`;
  };

  const nombreCategoria = (id) => {
    if (!id) return "Sin categoría";
    const cat = categoriasLista.find((x) => Number(x.id_categoria) === Number(id));
    return cat?.nombre || `Categoría ${id}`;
  };

  const servidoresDisponibles = useMemo(() => {
    const ids = [...new Set(misCanales.map((c) => Number(c.servidor_id)))].filter(Boolean);
    return ids.map((id) => {
      const s = servidoresLista.find((x) => Number(x.id_servidor) === id);
      return { id, nombre: s?.nombre || `Servidor ${id}` };
    });
  }, [misCanales, servidoresLista]);

  const canalesVisibles = useMemo(
    () => canalesFiltrados.filter((c) => filtroServidor === "todos" || String(c.servidor_id) === String(filtroServidor)),
    [canalesFiltrados, filtroServidor]
  );

  const grupos = useMemo(() => {
    const porServidor = new Map();
    canalesVisibles.forEach((c) => {
      const sid = Number(c.servidor_id);
      if (!porServidor.has(sid)) {
        const s = servidoresLista.find((x) => Number(x.id_servidor) === sid);
        porServidor.set(sid, { id: sid, nombre: s?.nombre || `Servidor ${sid}`, categorias: new Map() });
      }
      const g = porServidor.get(sid);
      const cid = c.categoria_id ? Number(c.categoria_id) : 0;
      if (!g.categorias.has(cid)) {
        const cat = categoriasLista.find((x) => Number(x.id_categoria) === cid);
        g.categorias.set(cid, {
          id: cid,
          nombre: cid ? (cat?.nombre || `Categoría ${cid}`) : "Sin categoría",
          orden: cid ? (cat?.orden ?? 0) : 9999,
          canales: [],
        });
      }
      g.categorias.get(cid).canales.push(c);
    });
    return [...porServidor.values()].map((g) => ({
      ...g,
      total: [...g.categorias.values()].reduce((acc, cat) => acc + cat.canales.length, 0),
      categorias: [...g.categorias.values()].sort((a, b) => a.orden - b.orden),
    }));
  }, [canalesVisibles, servidoresLista, categoriasLista]);

  const alternarSeccion = (clave) => {
    setSeccionesCerradas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  const elegirCanal = (c) => {
    setCanalSeleccionadoId(c.id_canal);
    setMiembroSeleccionado(null);
    setTabActiva("info");
    setFiltroRol("all");
    setVistaMovil("miembros");
    setFeedback("");
  };

  const rolEnCanalDe = (usuarioId) => {
    return miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo?.id_canal)?.rol_en_canal || "miembro";
  };

  const nombreCompleto = (usuario) => {
    const perfil = usuario.perfil || {};
    const apellidos = perfil.apellidos || "";
    const nombres = perfil.nombres || "";
    if (apellidos || nombres) {
      return `${apellidos}, ${nombres}`.trim();
    }
    return usuario.nombre_usuario;
  };


  const agregarMiembro = async () => {
    if (!usuarioSeleccionado || !canalActivo) return;
    setGuardando(true);
    try {
      await crearMiembroCanal({
        usuario_id: Number(usuarioSeleccionado),
        canal_id: Number(canalActivo.id_canal),
        rol_en_canal: rolEnCanal
      });
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
      setModalMiembro(false);
      setUsuarioSeleccionado("");
      setFeedback("Miembro agregado correctamente");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRolMiembro = async (usuarioId, nuevoRol) => {
    if (!canalActivo) return;
    try {
      const registro = miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo.id_canal);
      if (!registro) return;

      await actualizarMiembroCanal(registro.id_miembro_canal, { rol_en_canal: nuevoRol });
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
      setFeedback("Rol actualizado correctamente");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const quitarMiembro = async (usuarioId) => {
    if (!canalActivo) return;
    if (!window.confirm("¿Quitar a este usuario del canal?")) return;
    try {
      const registro = miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo.id_canal);
      if (!registro) return;

      await eliminarMiembroCanal(registro.id_miembro_canal);
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
      setMiembroSeleccionado(null);
      setFeedback("Miembro eliminado del canal");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };


  const vinculosDelMiembro = useMemo(() => {
    if (!miembroSeleccionado) return [];
    return relaciones.filter(r => Number(r.usuario_id) === Number(miembroSeleccionado.id_usuario));
  }, [relaciones, miembroSeleccionado]);

  const agregarVinculo = async () => {
    if (!usuarioVinculo || !miembroSeleccionado) return;
    try {
      await crearRelacionUsuario({
        usuario_id: Number(miembroSeleccionado.id_usuario),
        relacionado_id: Number(usuarioVinculo),
        tipo: tipoVinculo
      });
      const data = await listarRelacionesUsuario();
      setRelaciones(data);
      setUsuarioVinculo("");
      setFeedback("Vínculo agregado correctamente");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const eliminarVinculo = async (idRelacion) => {
    if (!window.confirm("¿Eliminar este vínculo?")) return;
    try {
      await eliminarRelacionUsuario(idRelacion);
      const data = await listarRelacionesUsuario();
      setRelaciones(data);
      setFeedback("Vínculo eliminado");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const cerrarDetalle = () => {
    setMiembroSeleccionado(null);
    setTabActiva("info");
    setFeedback("");
  };


  const renderCanales = (lista) => (
    <ul className="canales__sublista">
      {lista.map((c) => (
        <li key={c.id_canal}>
          <button
            type="button"
            className={`canales__canal${c.id_canal === canalSeleccionadoId ? " canales__canal--activo" : ""}`}
            onClick={() => elegirCanal(c)}
          >
            {c.tipo === "informativo" ? <Megaphone size={16} /> : <Hash size={16} />}
            <span className="canales__canal-nombre">{c.nombre}</span>
            <ChevronRight size={14} className="canales__canal-flecha" />
          </button>
        </li>
      ))}
    </ul>
  );

  const renderCategoria = (g, cat) => {
    const clave = `c-${g.id}-${cat.id}`;
    const cerrada = !!seccionesCerradas[clave];
    return (
      <li key={clave} className="canales__categoria">
        <button
          type="button"
          className="canales__categoria-head"
          aria-expanded={!cerrada}
          onClick={() => alternarSeccion(clave)}
        >
          <ChevronDown size={14} className={`canales__chevron${cerrada ? " canales__chevron--cerrado" : ""}`} />
          <Folder size={14} />
          <span className="canales__categoria-nombre">{cat.nombre}</span>
          <span className="canales__contador">{cat.canales.length}</span>
        </button>
        {!cerrada && renderCanales(cat.canales)}
      </li>
    );
  };

  const rolesMap = { admin: "Administrador", tutor: "Tutor", miembro: "Miembro" };
  const tiposVinculo = [
    { value: "padre", label: "Padre" },
    { value: "madre", label: "Madre" },
    { value: "tutor", label: "Tutor" },
    { value: "hermano", label: "Hermano" },
    { value: "abuelo", label: "Abuelo" },
    { value: "tio", label: "Tío" }
  ];

  const miembrosFiltrados = useMemo(() => {
    return miembrosDelCanal.filter(u => {
      if (filtroRol === "all") return true;
      return rolEnCanalDe(u.id_usuario) === filtroRol;
    });
  }, [miembrosDelCanal, filtroRol]);

  return (
    <section className="canales">
      <div className="canales__header">
        <div>
          <h1 className="canales__title">Canales</h1>
          <p className="canales__subtitle">Espacios de comunicación de la comunidad institucional.</p>
        </div>

        <div className="canales__header-actions">
          <div className="canales__switch" role="tablist" data-vista={vistaMovil}>
            <span className="canales__switch-thumb" aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={vistaMovil === "canales"}
              className="canales__switch-opcion"
              onClick={() => setVistaMovil("canales")}
            >
              <Hash size={14} /> Canales
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vistaMovil === "miembros"}
              className="canales__switch-opcion"
              onClick={() => setVistaMovil("miembros")}
            >
              <Users size={14} /> Miembros{canalActivo ? ` · ${miembrosDelCanal.length}` : ""}
            </button>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={mostrarCanales}
            className="canales__toggle"
            onClick={() => setMostrarCanales((v) => !v)}
          >
            <span className="canales__toggle-pista">
              <span className="canales__toggle-perilla" />
            </span>
            Panel de canales
          </button>
        </div>
      </div>

      {feedback && <div className="canales__feedback">{feedback}</div>}

      <div className="canales__layout">
        <div className="canales__viewport">
          <div
            className={`canales__explorer${miembroSeleccionado ? " detail-open" : ""}`}
            data-vista={vistaMovil}
            data-canales={String(mostrarCanales)}
          >
            {/* Sidebar */}
            <aside className="canales__sidebar">
              <h2 className="canales__sidebar-title">Explorar canales</h2>

              <label className="canales__filtro">
                <span className="canales__filtro-label">Filtrar por servidor</span>
                <select
                  className="canales__select"
                  value={filtroServidor}
                  onChange={(e) => {
                    setFiltroServidor(e.target.value);
                    setFeedback("");
                  }}
                >
                  <option value="todos">Todos los servidores</option>
                  {servidoresDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </label>

              <div className="canales__search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar canal..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              {loading && <p className="canales__empty">Cargando...</p>}
              {!loading && canalesVisibles.length === 0 && (
                <p className="canales__empty">No estás en ningún canal.</p>
              )}

              <ul className="canales__grupos">
                {filtroServidor === "todos"
                  ? grupos.map((g) => {
                      const clave = `s-${g.id}`;
                      const cerrado = !!seccionesCerradas[clave];
                      return (
                        <li key={clave} className="canales__grupo">
                          <button
                            type="button"
                            className="canales__grupo-head"
                            aria-expanded={!cerrado}
                            onClick={() => alternarSeccion(clave)}
                          >
                            <ChevronDown size={16} className={`canales__chevron${cerrado ? " canales__chevron--cerrado" : ""}`} />
                            <Server size={16} />
                            <span className="canales__grupo-nombre">{g.nombre}</span>
                            <span className="canales__contador">{g.total}</span>
                          </button>
                          {!cerrado && (
                            <ul className="canales__categorias">
                              {g.categorias.map((cat) => renderCategoria(g, cat))}
                            </ul>
                          )}
                        </li>
                      );
                    })
                  : grupos.map((g) => (
                      <li key={`s-${g.id}`} className="canales__grupo">
                        <ul className="canales__categorias canales__categorias--plano">
                          {g.categorias.map((cat) => renderCategoria(g, cat))}
                        </ul>
                      </li>
                    ))}
              </ul>
            </aside>

            {/* Panel Principal */}
            <main className="canales__main">
              <div className="canales__main-header">
                <div className="canales__main-info">
                  <h2 className="canales__main-titulo">
                    {canalActivo ? (canalActivo.tipo === "informativo" ? <Megaphone size={20} /> : <Hash size={20} />) : <Server size={20} />}
                    {canalActivo ? canalActivo.nombre : "Seleccionar canal"}
                  </h2>
                  <p className="canales__main-sub">
                    {canalActivo ? (canalActivo.descripcion || "Sin descripción") : "Servidor institucional común"}
                  </p>
                  {canalActivo && (
                    <p className="canales__main-context">
                      {nombreServidor(canalActivo.servidor_id)} · {miembrosDelCanal.length} {miembrosDelCanal.length === 1 ? "integrante" : "integrantes"}
                    </p>
                  )}
                </div>
                {canalActivo && (
                  <button
                    type="button"
                    className="canales__btn-volver"
                    onClick={() => {
                      setMiembroSeleccionado(null);
                      setFeedback("");
                    }}
                  >
                    <ArrowLeft size={14} /> Volver
                  </button>
                )}
              </div>

              {!canalActivo ? (
                <div className="canales__vacio">
                  <Hash size={32} />
                  <p>Seleccioná un canal para ver sus miembros.</p>
                </div>
              ) : (
                <>
                  <div className="canales__miembros-section">
                    <div className="canales__miembros-head">
                      <h3 className="canales__miembros-titulo">Integrantes del canal</h3>
                      {puedeGestionar && (
                        <Button
                          size="sm"
                          className="canales__btn-agregar"
                          onClick={() => {
                            setUsuarioSeleccionado("");
                            setRolEnCanal("miembro");
                            setModalMiembro(true);
                          }}
                        >
                          <Plus size={16} /> Agregar miembro
                        </Button>
                      )}
                    </div>

                    <div className="canales__miembros-filtros">
                      <div className="canales__miembros-buscar">
                        <label className="canales__field-label">Buscar integrante</label>
                        <div className="canales__search-input">
                          <Search size={16} />
                          <input
                            type="search"
                            placeholder="Buscar por nombre o correo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="canales__miembros-rol">
                        <label className="canales__field-label">Rol en el canal</label>
                        <select
                          className="canales__select-role"
                          value={filtroRol}
                          onChange={(e) => setFiltroRol(e.target.value)}
                        >
                          <option value="all">Todos los roles</option>
                          <option value="admin">Administradores</option>
                          <option value="tutor">Tutores</option>
                          <option value="miembro">Miembros</option>
                        </select>
                      </div>
                    </div>

                    {miembrosFiltrados.length === 0 ? (
                      <p className="canales__empty">No hay miembros con estos filtros.</p>
                    ) : (
                      <ul className="canales__miembros">
                        {miembrosFiltrados.map((u) => (
                          <li
                            key={u.id_usuario}
                            className={`canales__miembro${miembroSeleccionado?.id_usuario === u.id_usuario ? " canales__miembro--activo" : ""}`}
                            onClick={() => setMiembroSeleccionado(u)}
                          >
                            <div className="canales__miembro-datos">
                              <div className="canales__miembro-avatar">
                                {(u.perfil?.nombres?.charAt(0) || u.nombre_usuario?.charAt(0) || "?").toUpperCase()}
                              </div>
                              <div className="canales__miembro-texto">
                                <strong className="canales__miembro-nombre">{nombreCompleto(u)}</strong>
                                <span className="canales__miembro-email">{u.email}</span>
                              </div>
                            </div>
                            <span className="canales__miembro-rol">{rolesMap[rolEnCanalDe(u.id_usuario)]}</span>
                            <button
                              type="button"
                              className="canales__miembro-ver"
                              aria-label="Ver detalle del miembro"
                              onClick={(e) => { e.stopPropagation(); setMiembroSeleccionado(u); }}
                            >
                              <UserRound size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </main>

            {/* Backdrop */}
            {miembroSeleccionado && (
              <div className="canales__backdrop" onClick={cerrarDetalle} />
            )}

            {/* Panel de Detalle */}
            {miembroSeleccionado && canalActivo && (
              <aside className="canales__panel-detalle">
                <div className="canales__panel-detalle-header">
                  <button
                    type="button"
                    className="canales__btn-volver-detalle"
                    onClick={cerrarDetalle}
                  >
                    <ArrowLeft size={16} /> Volver
                  </button>
                  <h3 className="canales__panel-detalle-titulo">Detalle del miembro</h3>
                  <button
                    className="canales__panel-detalle-cerrar"
                    onClick={cerrarDetalle}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="canales__panel-detalle-content">
                  <div className="canales__perfil-header">
                    <div className="canales__perfil-avatar">
                      {(miembroSeleccionado.perfil?.nombres?.charAt(0) || miembroSeleccionado.nombre_usuario?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="canales__perfil-info-header">
                      <strong className="canales__perfil-nombre">{nombreCompleto(miembroSeleccionado)}</strong>
                      <span className="canales__perfil-estado">Activo</span>
                      <span className="canales__perfil-rol">{rolesMap[rolEnCanalDe(miembroSeleccionado.id_usuario)]}</span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="canales__detalle-tabs">
                    <button
                      type="button"
                      className={`canales__detalle-tab${tabActiva === "info" ? " canales__detalle-tab--activo" : ""}`}
                      onClick={() => setTabActiva("info")}
                    >
                      <UserRound size={14} /> Información
                    </button>
                    <button
                      type="button"
                      className={`canales__detalle-tab${tabActiva === "vinculos" ? " canales__detalle-tab--activo" : ""}`}
                      onClick={() => setTabActiva("vinculos")}
                    >
                      <Link2 size={14} /> Vínculos
                    </button>
                  </div>

                  {tabActiva === "info" && (
                    <div className="canales__perfil-form">
                      <div className="canales__form-row">
                        <div className="canales__form-field">
                          <label className="canales__field-label">Nombre</label>
                          <input
                            type="text"
                            className="canales__input"
                            defaultValue={miembroSeleccionado.perfil?.nombres || ""}
                            readOnly
                          />
                        </div>
                        <div className="canales__form-field">
                          <label className="canales__field-label">Apellido</label>
                          <input
                            type="text"
                            className="canales__input"
                            defaultValue={miembroSeleccionado.perfil?.apellidos || ""}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="canales__form-row">
                        <div className="canales__form-field">
                          <label className="canales__field-label">Usuario</label>
                          <input
                            type="text"
                            className="canales__input"
                            defaultValue={miembroSeleccionado.nombre_usuario || ""}
                            readOnly
                          />
                        </div>
                        <div className="canales__form-field">
                          <label className="canales__field-label">Correo electrónico</label>
                          <input
                            type="email"
                            className="canales__input"
                            defaultValue={miembroSeleccionado.email || ""}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="canales__form-field">
                        <label className="canales__field-label">Biografía</label>
                        <textarea
                          className="canales__textarea"
                          rows="2"
                          defaultValue={miembroSeleccionado.perfil?.biografia || ""}
                          readOnly
                        />
                      </div>

                      <div className="canales__form-row">
                        <div className="canales__form-field">
                          <label className="canales__field-label">Rol en el canal</label>
                          {puedeGestionar ? (
                            <select
                              className="canales__select"
                              value={rolEnCanalDe(miembroSeleccionado.id_usuario)}
                              onChange={(e) => cambiarRolMiembro(miembroSeleccionado.id_usuario, e.target.value)}
                            >
                              <option value="miembro">Miembro</option>
                              <option value="tutor">Tutor</option>
                              <option value="admin">Administrador</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="canales__input"
                              value={rolesMap[rolEnCanalDe(miembroSeleccionado.id_usuario)]}
                              readOnly
                            />
                          )}
                        </div>
                        <div className="canales__form-field">
                          <label className="canales__field-label">Fecha de incorporación</label>
                          <input
                            type="text"
                            className="canales__input"
                            value={miembroSeleccionado.fecha_registro ? new Date(miembroSeleccionado.fecha_registro).toLocaleDateString("es-AR") : "No disponible"}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="canales__form-field">
                        <label className="canales__field-label">Canal</label>
                        <input
                          type="text"
                          className="canales__input"
                          value={`${nombreServidor(canalActivo.servidor_id)} · ${canalActivo.nombre}`}
                          readOnly
                        />
                      </div>

                      <div className="canales__note">
                        Edición de muestra: los cambios no se envían a un servidor ni verifican permisos reales.
                      </div>

                      {puedeGestionar && (
                        <button
                          className="canales__btn-danger"
                          onClick={() => quitarMiembro(miembroSeleccionado.id_usuario)}
                        >
                          <Trash2 size={16} /> Quitar del canal
                        </button>
                      )}
                    </div>
                  )}

                  {tabActiva === "vinculos" && (
                    <div className="canales__vinculos-section">
                      <div className="canales__vinculos-lista">
                        <h4 className="canales__vinculos-titulo">Vínculos familiares</h4>
                        {vinculosDelMiembro.length === 0 ? (
                          <p className="canales__empty">Sin vínculos familiares registrados.</p>
                        ) : (
                          <ul className="canales__vinculos-items">
                            {vinculosDelMiembro.map((v) => {
                              const relacionado = todosLosUsuarios.find(u => Number(u.id_usuario) === Number(v.relacionado_id));
                              return (
                                <li key={v.id_relacion} className="canales__vinculo-item">
                                  <div className="canales__vinculo-info">
                                    <span className="canales__vinculo-tipo">{tiposVinculo.find(t => t.value === v.tipo)?.label || v.tipo}</span>
                                    <span className="canales__vinculo-nombre">
                                      {relacionado ? nombreCompleto(relacionado) : "Usuario desconocido"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="canales__vinculo-eliminar"
                                    onClick={() => eliminarVinculo(v.id_relacion)}
                                    aria-label="Eliminar vínculo"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div className="canales__vinculos-form">
                        <h4 className="canales__vinculos-titulo">Agregar vínculo</h4>
                        <div className="canales__form-row">
                          <div className="canales__form-field">
                            <label className="canales__field-label">Tipo</label>
                            <select
                              className="canales__select"
                              value={tipoVinculo}
                              onChange={(e) => setTipoVinculo(e.target.value)}
                            >
                              {tiposVinculo.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="canales__form-field">
                            <label className="canales__field-label">Usuario relacionado</label>
                            <select
                              className="canales__select"
                              value={usuarioVinculo}
                              onChange={(e) => setUsuarioVinculo(e.target.value)}
                            >
                              <option value="">Elegir usuario...</option>
                              {todosLosUsuarios
                                .filter(u => Number(u.id_usuario) !== Number(miembroSeleccionado.id_usuario))
                                .map(u => (
                                  <option key={u.id_usuario} value={u.id_usuario}>
                                    {nombreCompleto(u)} ({u.email})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="canales__btn-vincular"
                          onClick={agregarVinculo}
                          disabled={!usuarioVinculo}
                        >
                          <UserPlus size={14} /> Vincular
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Modal Agregar Miembro */}
      {modalMiembro && canalActivo && (
        <Modal title="Agregar miembro al canal" onClose={() => setModalMiembro(false)}>
          <div className="canales__modal-content">
            <Select
              label="Usuario (solo miembros del servidor)"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              options={todosLosUsuarios
                .filter(u =>
                  miembrosServidor.some(ms => Number(ms.servidor_id) === Number(canalActivo.servidor_id) && Number(ms.usuario_id) === Number(u.id_usuario)) &&
                  !miembrosDelCanal.some(m => m.id_usuario === u.id_usuario)
                )
                .map(u => ({ value: u.id_usuario, label: `${nombreCompleto(u)} (${u.email})` }))
              }
              placeholder="Elegir usuario..."
            />

            <Select
              label="Rol en el canal"
              value={rolEnCanal}
              onChange={(e) => setRolEnCanal(e.target.value)}
              options={[
                { value: "miembro", label: "Miembro (solo escribe)" },
                { value: "tutor", label: "Tutor" },
                { value: "admin", label: "Admin (modera el canal)" }
              ]}
            />

            <div className="canales__modal-actions">
              <Button type="button" variant="outline" onClick={() => setModalMiembro(false)}>Cancelar</Button>
              <Button disabled={!usuarioSeleccionado || guardando} onClick={agregarMiembro}>
                {guardando ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}