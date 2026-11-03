import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Hash, Megaphone, Plus, Pencil, Trash2, Users, ChevronRight, AlertCircle, Loader2, X,
  ChevronDown, ArrowLeft, Server, Folder
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
// Solo lectura, para poder mostrar el nombre de servidores y categorías en el filtro visual
import { listarServidores } from "../../api/servidores";
import { listarCategoriasPorServidor } from "../../api/categorias";
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

  const [busqueda, setBusqueda] = useState("");
  const [canalSeleccionadoId, setCanalSeleccionadoId] = useState(null);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalMiembro, setModalMiembro] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [rolEnCanal, setRolEnCanal] = useState("miembro");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

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
        const [resCanales, resUsuarios, resAsignaciones, resRoles, resMiembrosCanal, resMiembrosServidor] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarUsuarioRol(),
          listarRoles(),
          listarMiembrosCanal(),
          listarMiembrosServidor()
        ]);
        if (cancelado) return;
        setCanales(resCanales || []);
        setTodosLosUsuarios(resUsuarios || []);
        setTodosLosRoles(resAsignaciones || []);
        setRolesDefinidos(resRoles || []);
        setMiembrosCanal(resMiembrosCanal || []);
        setMiembrosServidor(resMiembrosServidor || []);
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
        // si falla, se muestran como "Servidor N"
      }
    })();
    return () => { cancelado = true; };
  }, []);


  useEffect(() => {
    const ids = [...new Set(canales.map((c) => Number(c.servidor_id)))].filter(Boolean);
    if (ids.length === 0) return undefined;
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
    setVistaMovil("miembros");
  };


  const nombreDeUsuario = (id) => {
    const u = todosLosUsuarios.find(x => x.id_usuario === id);
    return u ? u.nombre_usuario : `Usuario ${id}`;
  };

  const rolEnCanalDe = (usuarioId) => {
    return miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo?.id_canal)?.rol_en_canal || "miembro";
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
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRolMiembro = async (usuarioId, nuevoRol) => {
    if (!canalActivo) return;
    try {
      // Como el backend pide el id del miembro_canal, lo buscamos en el array
      const registro = miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo.id_canal);
      if (!registro) return;
      
      await actualizarMiembroCanal(registro.id_miembro_canal, { rol_en_canal: nuevoRol });
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
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
    } catch (err) {
      alert(err.message);
    }
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

  return (
    <section className="canales">
      <div className="canales__header">
        <h1 className="canales__title">Mis Canales</h1>

        {/* Botón deslizable: en celular alterna Canales / Miembros */}
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

        {/* Botón deslizable: en escritorio muestra u oculta el panel de canales */}
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

      <div className="canales__layout">
        <div className="canales__viewport">
          <div className="canales__explorer" data-vista={vistaMovil} data-canales={String(mostrarCanales)}>

            {/* BARRA LATERAL: filtro + canales por servidor y categoría */}
            <aside className="canales__sidebar">
              <div className="canales__search canales__search--compacto">
                <Search size={18} />
                <input type="text" placeholder="Buscar canal..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>

              <label className="canales__filtro">
                <span className="canales__filtro-label"><Server size={14} /> Servidor</span>
                <select
                  className="canales__select"
                  value={filtroServidor}
                  onChange={(e) => setFiltroServidor(e.target.value)}
                >
                  <option value="todos">Todos los servidores</option>
                  {servidoresDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </label>

              {loading && <p className="canales__empty">Cargando...</p>}
              {!loading && canalesVisibles.length === 0 && <p className="canales__empty">No estás en ningún canal.</p>}

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

            {/* PANEL PRINCIPAL: miembros del canal activo */}
            <main className="canales__main">
              <div className="canales__main-barra">
                <button type="button" className="canales__volver" onClick={() => setVistaMovil("canales")}>
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              {!canalActivo ? (
                <div className="canales__vacio">
                  <Hash size={32} />
                  <p>Seleccioná un canal para ver sus miembros.</p>
                </div>
              ) : (
                <>
                  <header className="canales__main-header">
                    <div className="canales__main-info">
                      <h2 className="canales__main-titulo">
                        {canalActivo.tipo === "informativo" ? <Megaphone size={20} /> : <Hash size={20} />} {canalActivo.nombre}
                      </h2>
                      <p className="canales__main-sub">
                        Canal de {canalActivo.tipo} · {nombreServidor(canalActivo.servidor_id)} · {nombreCategoria(canalActivo.categoria_id)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate("/mensajes", { state: { canal: canalActivo } })}>
                      Entrar al chat <ChevronRight size={16} />
                    </Button>
                  </header>

                  <div>
                    <div className="canales__miembros-head">
                      <h3 className="canales__miembros-titulo">Miembros del canal ({miembrosDelCanal.length})</h3>
                      {puedeGestionar && (
                        <Button size="sm" onClick={() => { setUsuarioSeleccionado(""); setRolEnCanal("miembro"); setModalMiembro(true); }}>
                          <Plus size={16} /> Agregar miembro
                        </Button>
                      )}
                    </div>

                    {miembrosDelCanal.length === 0 ? (
                      <p className="canales__empty">No hay miembros en este canal.</p>
                    ) : (
                      <ul className="canales__miembros">
                        {miembrosDelCanal.map((u) => (
                          <li
                            key={u.id_usuario}
                            className={`canales__miembro${miembroSeleccionado?.id_usuario === u.id_usuario ? " canales__miembro--activo" : ""}`}
                            onClick={() => setMiembroSeleccionado(u)}
                          >
                            <div className="canales__miembro-datos">
                              <div className="canales__miembro-avatar">
                                {u.nombre_usuario.charAt(0).toUpperCase()}
                              </div>
                              <div className="canales__miembro-texto">
                                <strong className="canales__miembro-nombre">{u.nombre_usuario}</strong>
                                <span className="canales__miembro-email">{u.email}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="canales__miembro-ver"
                              aria-label="Ver detalle del miembro"
                              onClick={(e) => { e.stopPropagation(); setMiembroSeleccionado(u); }}
                            >
                              <ChevronRight size={20} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {miembroSeleccionado && canalActivo && (
          <>
            <div className="canales__backdrop" onClick={() => setMiembroSeleccionado(null)} />
            <aside className="canales__panel-detalle">
              <div className="canales__panel-detalle-header">
                <button type="button" className="canales__volver canales__volver--detalle" onClick={() => setMiembroSeleccionado(null)}>
                  <ArrowLeft size={16} /> Volver
                </button>
                <h3 className="canales__panel-detalle-titulo" style={{ color: "#024566" }}>Detalle del miembro</h3>
                <button
                  className="canales__panel-detalle-cerrar"
                  onClick={() => setMiembroSeleccionado(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                {miembroSeleccionado.perfil?.foto_perfil ? (
                  <img className="canales__perfil-avatar" src={miembroSeleccionado.perfil.foto_perfil} alt="Foto de perfil" />
                ) : (
                  <div className="canales__perfil-avatar" style={{ background: "var(--color-menta-palido)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold", color: "var(--color-azul-petroleo)" }}>{(miembroSeleccionado.perfil?.nombres || miembroSeleccionado.nombre_usuario || "?").charAt(0).toUpperCase()}</div>
                )}
                <strong className="canales__perfil-nombre">
                  {[miembroSeleccionado.perfil?.nombres, miembroSeleccionado.perfil?.apellidos].filter(Boolean).join(" ") || miembroSeleccionado.nombre_usuario}
                </strong>
                <span style={{ fontSize: "13px", color: "var(--texto-secundario)" }}>@{miembroSeleccionado.nombre_usuario}</span>
                <span style={{ fontSize: "13px", color: "var(--texto-secundario)" }}>{miembroSeleccionado.email}</span>
                {miembroSeleccionado.perfil?.biografia && (
                  <p style={{ textAlign: "center", fontSize: "14px", margin: "8px 0 0" }}>{miembroSeleccionado.perfil.biografia}</p>
                )}
              </div>

              <div className="canales__perfil-info">
                <h4 className="canales__perfil-info-titulo">Información de la cuenta</h4>
                <p className="canales__perfil-dato">
                  <strong>DNI:</strong> {miembroSeleccionado.perfil?.dni || "No informado"}
                </p>
                <p className="canales__perfil-dato">
                  <strong>Estado:</strong> {miembroSeleccionado.activo ? "Activo" : "Inactivo"}
                </p>
                <p className="canales__perfil-dato">
                  <strong>Fecha de registro:</strong> {miembroSeleccionado.fecha_registro ? new Date(miembroSeleccionado.fecha_registro).toLocaleDateString("es-AR") : "No disponible"}
                </p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="canales__perfil-info-titulo">Rol en el canal</label>
                {puedeGestionar ? (
                  <select className="canales__perfil-dato" value={rolEnCanalDe(miembroSeleccionado.id_usuario)} onChange={(e) => cambiarRolMiembro(miembroSeleccionado.id_usuario, e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", background: "white" }}>
                    <option value="admin">Admin</option>
                    <option value="tutor">Tutor</option>
                    <option value="miembro">Miembro</option>
                  </select>
                ) : (
                  <span>{rolEnCanalDe(miembroSeleccionado.id_usuario)}</span>
                )}
              </div>
              {puedeGestionar && (
                <button className="canales__perfil-acciones" onClick={() => quitarMiembro(miembroSeleccionado.id_usuario)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", border: "none", borderRadius: "6px", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>
                  <Trash2 size={16} /> Quitar del canal
                </button>
              )}
            </aside>
          </>
        )}
      </div>

      {/* MODAL AGREGAR MIEMBRO */}
      {modalMiembro && canalActivo && (
        <Modal title="Agregar miembro al canal" onClose={() => setModalMiembro(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Select
              label="Usuario (solo miembros del servidor)"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              options={todosLosUsuarios
                .filter(u => 
                  // Solo usuarios que estén en el servidor de este canal
                  miembrosServidor.some(ms => Number(ms.servidor_id) === Number(canalActivo.servidor_id) && Number(ms.usuario_id) === Number(u.id_usuario)) &&
                  // Y que no estén ya en el canal
                  !miembrosDelCanal.some(m => m.id_usuario === u.id_usuario)
                )
                .map(u => ({ value: u.id_usuario, label: `${u.nombre_usuario} (${u.email})` }))
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
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
