import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FolderTree, Plus, AlertCircle, Loader2, Pencil, Trash2, Search, ChevronRight } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import "./Categorias.css";
import { listarServidores } from "../../api/servidores";
import {
  listarCategoriasPorServidor,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../../api/categorias";

function construirArbol(lista) {
  const principales = lista.filter((c) => c.padre_id === null || c.padre_id === undefined);
  return principales
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((padre) => ({
      ...padre,
      hijas: lista
        .filter((c) => Number(c.padre_id) === Number(padre.id_categoria))
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    }));
}

export default function Categorias() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [servidores, setServidores] = useState([]);
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [loadingServidores, setLoadingServidores] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    padre_id: "",
    orden: "",
  });

  // 1. Cargar servidores
  useEffect(() => {
    let cancelado = false;

    async function cargarServidores() {
      setLoadingServidores(true);
      setError("");
      try {
        const data = await listarServidores();
        if (cancelado) return;
        setServidores(data);

        const delQuery = searchParams.get("servidor");
        const inicial =
          delQuery && data.some((s) => String(s.id_servidor) === String(delQuery))
            ? Number(delQuery)
            : (data[0]?.id_servidor ?? null);

        setServidorSeleccionado(inicial);
      } catch (err) {
        if (!cancelado) setError(err?.message || "No se pudieron cargar los servidores");
      } finally {
        if (!cancelado) setLoadingServidores(false);
      }
    }

    cargarServidores();
    return () => {
      cancelado = true;
    };
  }, [searchParams]);

  // 2. Cargar categorías del servidor seleccionado
  useEffect(() => {
    if (servidorSeleccionado == null) {
      setCategorias([]);
      return;
    }

    let cancelado = false;

    async function cargarCategorias() {
      setLoadingCategorias(true);
      setError("");
      try {
        const data = await listarCategoriasPorServidor(servidorSeleccionado);
        if (!cancelado) setCategorias(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelado) setError(err?.message || "No se pudieron cargar las categorías");
      } finally {
        if (!cancelado) setLoadingCategorias(false);
      }
    }

    cargarCategorias();
    return () => {
      cancelado = true;
    };
  }, [servidorSeleccionado]);

  const arbol = useMemo(() => construirArbol(categorias), [categorias]);

  const categoriasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return categorias;
    return categorias.filter((c) =>
      (c.nombre || "").toLowerCase().includes(term) ||
      (c.descripcion || "").toLowerCase().includes(term)
    );
  }, [categorias, busqueda]);

  const opcionesPadre = useMemo(() => {
    const idsExcluidos = categoriaEditando ? [categoriaEditando.id_categoria] : [];
    return categorias
      .filter(
        (c) =>
          (c.padre_id === null || c.padre_id === undefined) &&
          !idsExcluidos.includes(c.id_categoria)
      )
      .map((c) => ({ value: c.id_categoria, label: c.nombre }));
  }, [categorias, categoriaEditando]);

  const nombrePadre = (id) =>
    categorias.find((c) => Number(c.id_categoria) === Number(id))?.nombre || `#${id}`;

  const onServidorChange = (e) => {
    const id = Number(e.target.value);
    setServidorSeleccionado(id);
    navigate(`/categorias?servidor=${id}`, { replace: true });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirNueva = () => {
    setCategoriaEditando(null);
    setForm({ nombre: "", descripcion: "", padre_id: "", orden: "" });
    setModalOpen(true);
  };

  const abrirEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setForm({
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
    setModalOpen(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalOpen(false);
    setCategoriaEditando(null);
    setForm({ nombre: "", descripcion: "", padre_id: "", orden: "" });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!servidorSeleccionado) return;

    setGuardando(true);
    setError("");

    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        padre_id: form.padre_id ? Number(form.padre_id) : null,
        orden: form.orden === "" ? 0 : Number(form.orden),
      };

      if (categoriaEditando) {
        const actualizada = await actualizarCategoria(categoriaEditando.id_categoria, payload);
        setCategorias((prev) =>
          prev.map((c) => (c.id_categoria === actualizada.id_categoria ? actualizada : c))
        );
      } else {
        const nueva = await crearCategoria({
          ...payload,
          servidor_id: Number(servidorSeleccionado),
        });
        setCategorias((prev) => [...prev, nueva]);
      }

      cerrarModal();
    } catch (err) {
      setError(err?.message || "No se pudo guardar la categoría");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    setEliminandoId(categoria.id_categoria);
    setError("");

    try {
      await eliminarCategoria(categoria.id_categoria);
      setCategorias((prev) => prev.filter((c) => c.id_categoria !== categoria.id_categoria));
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la categoría");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <section className="categorias">
      <div className="categorias__header">
        <h1 className="categorias__title">Categorías</h1>
        <div className="categorias__header-actions">
          <Button variant="outline" size="sm" onClick={() => navigate("/servidores")}>
            Volver a Servidores
          </Button>
          <Button size="sm" onClick={abrirNueva} disabled={!servidorSeleccionado}>
            <Plus size={16} /> Nueva categoría
          </Button>
        </div>
      </div>

      <div className="categorias__toolbar">
        <Select
          label="Servidor"
          name="servidor"
          value={servidorSeleccionado ?? ""}
          onChange={onServidorChange}
          options={servidores.map((s) => ({ value: s.id_servidor, label: s.nombre }))}
          placeholder="Seleccionar servidor"
        />

        <Input
          label="Buscar"
          name="busqueda"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar categoría..."
        />
      </div>

      {loadingServidores && (
        <div className="categorias__state categorias__state--loading">
          <Loader2 className="categorias__spinner" size={18} />
          <span>Cargando servidores…</span>
        </div>
      )}

      {error && (
        <div className="categorias__state categorias__state--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loadingCategorias ? (
        <div className="categorias__state categorias__state--loading">
          <Loader2 className="categorias__spinner" size={18} />
          <span>Cargando categorías…</span>
        </div>
      ) : (
        <>
          <div className="categorias__list">
            {arbol
              .filter((cat) =>
                categoriasFiltradas.some((c) => c.id_categoria === cat.id_categoria) ||
                (cat.hijas || []).some((h) => categoriasFiltradas.some((c) => c.id_categoria === h.id_categoria))
              )
              .map((cat) => (
                <Card key={cat.id_categoria} icon={FolderTree} className="categorias__card">
                  <div className="categorias__main-row">
                    <div>
                      <p className="categorias__nombre">{cat.nombre}</p>
                      <p className="categorias__desc">{cat.descripcion}</p>
                      <small style={{ opacity: 0.6 }}>
                        Orden: {cat.orden ?? 0}
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="categorias__link"
                        onClick={() => navigate(`/canales?servidor=${servidorSeleccionado}&categoria=${cat.id_categoria}`)}
                      >
                        Ver canales <ChevronRight size={16} />
                      </button>

                      <Button size="sm" variant="outline" onClick={() => abrirEditar(cat)}>
                        <Pencil size={14} /> Editar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEliminar(cat)}
                        disabled={eliminandoId === cat.id_categoria}
                      >
                        <Trash2 size={14} />
                        {eliminandoId === cat.id_categoria ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  </div>

                  {cat.hijas.length > 0 && (
                    <ul className="categorias__sublist">
                      {cat.hijas
                        .filter((sub) => categoriasFiltradas.some((c) => c.id_categoria === sub.id_categoria))
                        .map((sub) => (
                          <li key={sub.id_categoria} className="categorias__subitem">
                            <div>
                              <span className="categorias__sub-nombre">{sub.nombre}</span>
                              <span className="categorias__sub-desc">{sub.descripcion}</span>
                              <div style={{ fontSize: "11px", opacity: 0.6 }}>
                                Orden: {sub.orden ?? 0} · Hija de {cat.nombre}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                type="button"
                                className="categorias__link"
                                onClick={() => navigate(`/canales?servidor=${servidorSeleccionado}&categoria=${sub.id_categoria}`)}
                              >
                                Ver canales <ChevronRight size={14} />
                              </button>

                              <Button size="sm" variant="outline" onClick={() => abrirEditar(sub)}>
                                <Pencil size={14} /> Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEliminar(sub)}
                                disabled={eliminandoId === sub.id_categoria}
                              >
                                <Trash2 size={14} />
                                {eliminandoId === sub.id_categoria ? "Eliminando..." : "Eliminar"}
                              </Button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>
              ))}
          </div>

          {categoriasFiltradas.length === 0 && (
            <p className="categorias__empty">No hay categorías para este servidor.</p>
          )}
        </>
      )}

      {modalOpen && (
        <Modal title={categoriaEditando ? "Editar categoría" : "Nueva categoría"} onClose={cerrarModal}>
          <form className="categorias__form" onSubmit={guardar}>
            <Input
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Soporte"
            />
            <Input
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Consultas y ayuda técnica"
            />
            <Select
              label="Categoría padre (opcional)"
              name="padre_id"
              value={form.padre_id}
              onChange={handleChange}
              options={opcionesPadre}
              placeholder="Ninguna (categoría principal)"
            />
            <Input
              label="Orden"
              name="orden"
              type="number"
              value={form.orden}
              onChange={handleChange}
              placeholder="0"
            />

            <div className="categorias__form-actions">
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : categoriaEditando ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}