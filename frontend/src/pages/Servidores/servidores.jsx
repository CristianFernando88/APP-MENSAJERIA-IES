import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Server,
  FolderTree,
  Hash,
  Megaphone,
  ChevronRight,
  AlertCircle,
  Loader2,
  Tags,
  Pencil,
  Trash2,
} from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import Card from "../../components/ui/Card/Card";
import "./servidores.css";
import {
  obtenerServidores,
  obtenerJerarquiaServidor,
  obtenerCategoriasPorServidor,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../../services/servidoresService";
import { useAuth } from "../../context/AuthContext";
import { listarMiembrosServidor, unirseAServidor } from "../../api/miembrosServidor";

export default function Servidores() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [servidores, setServidores] = useState([]);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  const [loadingServidores, setLoadingServidores] = useState(true);
  const [errorServidores, setErrorServidores] = useState("");

  const [jerarquia, setJerarquia] = useState(null);
  const [loadingJerarquia, setLoadingJerarquia] = useState(false);
  const [errorJerarquia, setErrorJerarquia] = useState("");

  const [canalActivoId, setCanalActivoId] = useState(null);

  const [uniendo, setUniendo] = useState(false);
  const [esMiembro, setEsMiembro] = useState(null);
  const [mensajeUnion, setMensajeUnion] = useState("");

  const [categoriasGestion, setCategoriasGestion] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState("");
  const [busquedaCategoria, setBusquedaCategoria] = useState("");
  const [modalCategoria, setModalCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [eliminandoCategoriaId, setEliminandoCategoriaId] = useState(null);
  const [formCategoria, setFormCategoria] = useState({
    nombre: "",
    descripcion: "",
    padre_id: "",
    orden: "",
  });

  useEffect(() => {
    let cancelado = false;

    async function cargarServidores() {
      setLoadingServidores(true);
      setErrorServidores("");
      try {
        const data = await obtenerServidores();
        if (cancelado) return;
        setServidores(data);
        if (data.length > 0) {
          setServidorSeleccionado(data[0].id_servidor);
        }
      } catch (err) {
        if (cancelado) return;
        setErrorServidores(err?.message || "No se pudieron cargar los servidores");
      } finally {
        if (!cancelado) setLoadingServidores(false);
      }
    }

    cargarServidores();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!user || servidorSeleccionado == null) {
      setEsMiembro(null);
      return;
    }

    let cancelado = false;
    setMensajeUnion("");

    async function verificarMembresia() {
      try {
        const data = await listarMiembrosServidor();
        if (cancelado) return;
        const miembro =
          Array.isArray(data) &&
          data.some((m) =>
            Number(m.usuario_id) === Number(user.id_usuario) &&
            Number(m.servidor_id) === Number(servidorSeleccionado) &&
            m.activo !== false
          );
        setEsMiembro(Boolean(miembro));
      } catch {
        if (!cancelado) setEsMiembro(null);
      }
    }

    verificarMembresia();
    return () => {
      cancelado = true;
    };
  }, [user, servidorSeleccionado]);

  useEffect(() => {
    if (servidorSeleccionado === null || servidorSeleccionado === undefined) {
      return;
    }

    let cancelado = false;

    async function cargarJerarquia() {
      setLoadingJerarquia(true);
      setErrorJerarquia("");
      setCanalActivoId(null);
      try {
        const data = await obtenerJerarquiaServidor(servidorSeleccionado);
        if (cancelado) return;
        setJerarquia(data);
      } catch (err) {
        if (cancelado) return;
        setErrorJerarquia(err?.message || "No se pudo cargar la jerarquía del servidor");
        setJerarquia(null);
      } finally {
        if (!cancelado) setLoadingJerarquia(false);
      }
    }

    cargarJerarquia();
    return () => {
      cancelado = true;
    };
  }, [servidorSeleccionado]);

  useEffect(() => {
    if (servidorSeleccionado == null) {
      setCategoriasGestion([]);
      return;
    }

    let cancelado = false;

    async function cargarCategorias() {
      setLoadingCategorias(true);
      setErrorCategorias("");
      try {
        const data = await obtenerCategoriasPorServidor(servidorSeleccionado);
        if (!cancelado) setCategoriasGestion(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelado) setErrorCategorias(err?.message || "No se pudieron cargar las categorías");
      } finally {
        if (!cancelado) setLoadingCategorias(false);
      }
    }

    cargarCategorias();
    return () => {
      cancelado = true;
    };
  }, [servidorSeleccionado]);

  const servidoresFiltrados = servidores.filter((s) =>
    (s.nombre || "").toLowerCase().includes(busquedaServidor.toLowerCase())
  );

  const servidorActivo = servidores.find(
    (s) => s.id_servidor === servidorSeleccionado
  );

  const canalActivo =
    jerarquia?.categorias
      ?.flatMap((c) => c.canales || [])
      .concat(jerarquia?.sinCategoria || [])
      .find((c) => c.id_canal === canalActivoId) || null;

  const seleccionarCanal = useCallback((canal) => {
    setCanalActivoId(canal.id_canal);
  }, []);

  const abrirCanal = useCallback(() => {
    if (canalActivo) {
      navigate("/mensajes", { state: { canal: canalActivo } });
    }
  }, [canalActivo, navigate]);

  const handleUnirseServidor = async () => {
    if (!user || servidorSeleccionado == null) return;
    setUniendo(true);
    setMensajeUnion("");

    try {
      await unirseAServidor(user.id_usuario, servidorSeleccionado);
      setEsMiembro(true);
      setMensajeUnion("Te uniste al servidor correctamente.");
    } catch (err) {
      const msg = err?.message || "No se pudo unir al servidor";
      if (msg.toLowerCase().includes("ya es miembro")) {
        setEsMiembro(true);
      }
      setMensajeUnion(msg);
    } finally {
      setUniendo(false);
    }
  };

  const nombreCategoriaPorId = (id) =>
    categoriasGestion.find((c) => Number(c.id_categoria) === Number(id))?.nombre ||
    `#${id}`;

  const categoriasFiltradas = useMemo(() => {
    const term = busquedaCategoria.trim().toLowerCase();
    if (!term) return categoriasGestion;
    return categoriasGestion.filter((c) =>
      (c.nombre || "").toLowerCase().includes(term) ||
      (c.descripcion || "").toLowerCase().includes(term)
    );
  }, [categoriasGestion, busquedaCategoria]);

  const opcionesPadreCategoria = useMemo(() => {
    const idsExcluidos = categoriaEditando ? [categoriaEditando.id_categoria] : [];
    return categoriasGestion
      .filter(
        (c) =>
          (c.padre_id === null || c.padre_id === undefined) &&
          !idsExcluidos.includes(c.id_categoria)
      )
      .map((c) => ({ value: c.id_categoria, label: c.nombre }));
  }, [categoriasGestion, categoriaEditando]);

  const abrirNuevaCategoria = () => {
    setCategoriaEditando(null);
    setFormCategoria({ nombre: "", descripcion: "", padre_id: "", orden: "" });
    setModalCategoria(true);
  };

  const abrirEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setFormCategoria({
      nombre: categoria.nombre || "",
      descripcion: categoria.descripcion || "",
      padre_id:
        categoria.padre_id === null || categoria.padre_id === undefined
          ? ""
          : String(categoria.padre_id),
      orden:
        categoria.orden === null || categoria.orden === undefined
          ? ""
          : String(categoria.orden),
    });
    setModalCategoria(true);
  };

  const cerrarModalCategoria = () => {
    if (guardandoCategoria) return;
    setModalCategoria(false);
    setCategoriaEditando(null);
    setFormCategoria({ nombre: "", descripcion: "", padre_id: "", orden: "" });
  };

  const handleChangeCategoria = (e) => {
    setFormCategoria((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!servidorSeleccionado) return;

    setGuardandoCategoria(true);
    setErrorCategorias("");

    try {
      const payload = {
        nombre: formCategoria.nombre.trim(),
        descripcion: formCategoria.descripcion.trim() || null,
        padre_id: formCategoria.padre_id ? Number(formCategoria.padre_id) : null,
        orden: formCategoria.orden === "" ? 0 : Number(formCategoria.orden),
      };

      if (categoriaEditando) {
        const actualizada = await actualizarCategoria(categoriaEditando.id_categoria, payload);
        setCategoriasGestion((prev) =>
          prev.map((c) =>
            c.id_categoria === actualizada.id_categoria ? actualizada : c
          )
        );
      } else {
        const nueva = await crearCategoria({
          ...payload,
          servidor_id: Number(servidorSeleccionado),
        });
        setCategoriasGestion((prev) => [...prev, nueva]);
      }

      const jerarquiaActualizada = await obtenerJerarquiaServidor(servidorSeleccionado);
      setJerarquia(jerarquiaActualizada);

      cerrarModalCategoria();
    } catch (err) {
      setErrorCategorias(err?.message || "No se pudo guardar la categoría");
    } finally {
      setGuardandoCategoria(false);
    }
  };

  const handleEliminarCategoria = async (categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    setEliminandoCategoriaId(categoria.id_categoria);
    setErrorCategorias("");

    try {
      await eliminarCategoria(categoria.id_categoria);
      setCategoriasGestion((prev) =>
        prev.filter((c) => c.id_categoria !== categoria.id_categoria)
      );

      const jerarquiaActualizada = await obtenerJerarquiaServidor(servidorSeleccionado);
      setJerarquia(jerarquiaActualizada);
    } catch (err) {
      setErrorCategorias(err?.message || "No se pudo eliminar la categoría");
    } finally {
      setEliminandoCategoriaId(null);
    }
  };

  return (
    <section className="servidores">
      <div className="servidores__header">
        <h1 className="servidores__title">Servidores</h1>
      </div>

      <div className="servidores__explorer">
        <aside className="servidores__panel servidores__panel--servers">
          <div className="servidores__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar servidor..."
              value={busquedaServidor}
              onChange={(e) => setBusquedaServidor(e.target.value)}
            />
          </div>

          {loadingServidores && (
            <div className="servidores__state servidores__state--loading">
              <Loader2 className="servidores__spinner" size={18} />
              <span>Cargando servidores…</span>
            </div>
          )}

          {errorServidores && (
            <div className="servidores__state servidores__state--error">
              <AlertCircle size={18} />
              <span>{errorServidores}</span>
            </div>
          )}

          {!loadingServidores && !errorServidores && servidoresFiltrados.length === 0 && (
            <p className="servidores__empty">No se encontraron servidores.</p>
          )}

          <ul className="servidores__server-list">
            {servidoresFiltrados.map((s) => (
              <li key={s.id_servidor}>
                <button
                  type="button"
                  className={`servidores__server-item${
                    s.id_servidor === servidorSeleccionado ? " servidores__server-item--active" : ""
                  }`}
                  onClick={() => setServidorSeleccionado(s.id_servidor)}
                >
                  <Server size={18} />
                  <div className="servidores__server-text">
                    <span className="servidores__server-name">{s.nombre}</span>
                    {s.descripcion && (
                      <span className="servidores__server-desc">{s.descripcion}</span>
                    )}
                  </div>
                  <ChevronRight size={16} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="servidores__panel servidores__panel--detail">
          {servidorSeleccionado === null ? (
            <div className="servidores__empty-state">
              <Server size={32} />
              <p>Seleccioná un servidor para ver sus categorías y canales.</p>
            </div>
          ) : (
            <>
              <header className="servidores__detail-header">
                <div>
                  <h2 className="servidores__detail-title">
                    {servidorActivo?.nombre || "Servidor"}
                  </h2>
                  {servidorActivo?.descripcion && (
                    <p className="servidores__detail-desc">{servidorActivo.descripcion}</p>
                  )}
                </div>

                {user && servidorSeleccionado !== null && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      alignItems: "flex-end",
                    }}
                  >
                    {esMiembro === true ? (
                      <span style={{ fontSize: "12px", opacity: 0.8 }}>Ya sos miembro</span>
                    ) : (
                      <Button size="sm" onClick={handleUnirseServidor} disabled={uniendo}>
                        {uniendo ? "Uniéndome..." : "Unirme al servidor"}
                      </Button>
                    )}

                    {mensajeUnion && (
                      <p style={{ fontSize: "12px", margin: 0, opacity: 0.85 }}>
                        {mensajeUnion}
                      </p>
                    )}
                  </div>
                )}
              </header>

              <section style={{ margin: "1rem 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Tags size={18} /> Categorías del servidor
                  </h3>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Buscar categoría..."
                      value={busquedaCategoria}
                      onChange={(e) => setBusquedaCategoria(e.target.value)}
                      style={{ padding: "6px 8px" }}
                    />
                    <Button size="sm" onClick={abrirNuevaCategoria}>
                      + Nueva categoría
                    </Button>
                  </div>
                </div>

                {errorCategorias && (
                  <div className="servidores__state servidores__state--error" style={{ marginBottom: "8px" }}>
                    <AlertCircle size={18} />
                    <span>{errorCategorias}</span>
                  </div>
                )}

                {loadingCategorias ? (
                  <div className="servidores__state servidores__state--loading">
                    <Loader2 className="servidores__spinner" size={18} />
                    <span>Cargando categorías…</span>
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {categoriasFiltradas.map((categoria) => (
                      <li
                        key={categoria.id_categoria}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong>{categoria.nombre}</strong>
                          {categoria.descripcion && (
                            <div style={{ fontSize: "12px", opacity: 0.75 }}>
                              {categoria.descripcion}
                            </div>
                          )}
                          <div style={{ fontSize: "11px", opacity: 0.6 }}>
                            Orden: {categoria.orden ?? 0}
                            {categoria.padre_id
                              ? ` · Hija de ${nombreCategoriaPorId(categoria.padre_id)}`
                              : ""}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEditarCategoria(categoria)}
                          >
                            <Pencil size={14} /> Editar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEliminarCategoria(categoria)}
                            disabled={eliminandoCategoriaId === categoria.id_categoria}
                          >
                            <Trash2 size={14} />
                            {eliminandoCategoriaId === categoria.id_categoria
                              ? "Eliminando..."
                              : "Eliminar"}
                          </Button>
                        </div>
                      </li>
                    ))}

                    {categoriasFiltradas.length === 0 && (
                      <li style={{ padding: "8px", opacity: 0.7 }}>
                        No hay categorías para este servidor.
                      </li>
                    )}
                  </ul>
                )}
              </section>

              {loadingJerarquia && (
                <div className="servidores__state servidores__state--loading">
                  <Loader2 className="servidores__spinner" size={18} />
                  <span>Cargando categorías y canales…</span>
                </div>
              )}

              {errorJerarquia && (
                <div className="servidores__state servidores__state--error">
                  <AlertCircle size={18} />
                  <span>{errorJerarquia}</span>
                </div>
              )}

              {!loadingJerarquia && !errorJerarquia && jerarquia && (
                <div className="servidores__tree">
                  {(jerarquia.categorias || []).length === 0 &&
                    (jerarquia.sinCategoria || []).length === 0 && (
                      <p className="servidores__empty">
                        Este servidor todavía no tiene categorías ni canales.
                      </p>
                    )}

                  {(jerarquia.categorias || []).map((categoria) => (
                    <section key={categoria.id_categoria} className="servidores__categoria">
                      <div className="servidores__categoria-header">
                        <FolderTree size={18} />
                        <div>
                          <p className="servidores__categoria-nombre">{categoria.nombre}</p>
                          {categoria.descripcion && (
                            <p className="servidores__categoria-desc">{categoria.descripcion}</p>
                          )}
                        </div>
                      </div>

                      {(categoria.canales || []).length === 0 && (
                        <p className="servidores__categoria-empty">Sin canales en esta categoría.</p>
                      )}

                      <ul className="servidores__canal-list">
                        {(categoria.canales || []).map((canal) => (
                          <li key={canal.id_canal}>
                            <button
                              type="button"
                              className={`servidores__canal${
                                canal.id_canal === canalActivoId ? " servidores__canal--active" : ""
                              }`}
                              onClick={() => seleccionarCanal(canal)}
                            >
                              {canal.tipo === "informativo" ? (
                                <Megaphone size={16} />
                              ) : (
                                <Hash size={16} />
                              )}
                              <span className="servidores__canal-nombre">{canal.nombre}</span>
                              <span className="servidores__canal-tipo">
                                {canal.tipo === "informativo" ? "Informativo" : "Chat"}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}

                  {(jerarquia.sinCategoria || []).length > 0 && (
                    <section className="servidores__categoria servidores__categoria--uncategorized">
                      <div className="servidores__categoria-header">
                        <FolderTree size={18} />
                        <div>
                          <p className="servidores__categoria-nombre">Sin categoría</p>
                          <p className="servidores__categoria-desc">
                            Canales que todavía no fueron agrupados.
                          </p>
                        </div>
                      </div>
                      <ul className="servidores__canal-list">
                        {jerarquia.sinCategoria.map((canal) => (
                          <li key={canal.id_canal}>
                            <button
                              type="button"
                              className={`servidores__canal${
                                canal.id_canal === canalActivoId ? " servidores__canal--active" : ""
                              }`}
                              onClick={() => seleccionarCanal(canal)}
                            >
                              {canal.tipo === "informativo" ? (
                                <Megaphone size={16} />
                              ) : (
                                <Hash size={16} />
                              )}
                              <span className="servidores__canal-nombre">{canal.nombre}</span>
                              <span className="servidores__canal-tipo">
                                {canal.tipo === "informativo" ? "Informativo" : "Chat"}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {canalActivo && (
                <div className="servidores__active-channel">
                  <div className="servidores__active-channel-info">
                    <p className="servidores__active-channel-label">Canal seleccionado</p>
                    <p className="servidores__active-channel-name">{canalActivo.nombre}</p>
                    <p className="servidores__active-channel-meta">
                      {canalActivo.tipo === "informativo" ? "Informativo" : "Chat"} — ID {canalActivo.id_canal}
                    </p>
                  </div>
                  <Button size="sm" onClick={abrirCanal}>
                    Abrir canal <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {modalCategoria && (
        <Modal
          title={categoriaEditando ? "Editar categoría" : "Nueva categoría"}
          onClose={cerrarModalCategoria}
        >
          <form className="categorias__form" onSubmit={guardarCategoria}>
            <Input
              label="Nombre"
              name="nombre"
              value={formCategoria.nombre}
              onChange={handleChangeCategoria}
              placeholder="Ej: Soporte"
            />
            <Input
              label="Descripción"
              name="descripcion"
              value={formCategoria.descripcion}
              onChange={handleChangeCategoria}
              placeholder="Ej: Consultas y ayuda técnica"
            />
            <Select
              label="Categoría padre (opcional)"
              name="padre_id"
              value={formCategoria.padre_id}
              onChange={handleChangeCategoria}
              options={opcionesPadreCategoria}
              placeholder="Ninguna (categoría principal)"
            />
            <Input
              label="Orden"
              name="orden"
              type="number"
              value={formCategoria.orden}
              onChange={handleChangeCategoria}
              placeholder="0"
            />

            <div className="categorias__form-actions">
              <Button type="button" variant="outline" onClick={cerrarModalCategoria}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardandoCategoria}>
                {guardandoCategoria
                  ? "Guardando..."
                  : categoriaEditando
                  ? "Guardar cambios"
                  : "Crear categoría"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}