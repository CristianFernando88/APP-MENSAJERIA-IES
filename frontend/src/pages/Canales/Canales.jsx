import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Hash, Megaphone } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import { listarCanales, crearCanal, actualizarCanal, eliminarCanal } from "../../api/canales";
import { listarServidores } from "../../api/servidores";
import { listarCategorias } from "../../api/categorias";
import { useAuth } from "../../context/AuthContext";
import "./Canales.css";

const tiposDisponibles = [
  { value: "informativo", label: "Informativo (solo admins escriben)" },
  { value: "chat", label: "Chat (todos escriben)" },
];

const formVacio = { nombre: "", servidor_id: "", categoria_id: "", tipo: "chat" };

export default function Canales() {
  const { user } = useAuth();

  const [canales, setCanales] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    listarServidores()
      .then(setServidores)
      .catch((error) => console.error("Error al cargar servidores:", error));

    listarCategorias()
      .then(setCategorias)
      .catch((error) => console.error("Error al cargar categorías:", error));
  }, []);

  // Cada vez que cambia el texto del buscador, se lo pasamos al backend.
  // El setTimeout evita pedir datos en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      listarCanales(busqueda)
        .then(setCanales)
        .catch((error) => console.error("Error al cargar canales:", error));
    }, 400);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (canal) => {
    setEditandoId(canal.id_canal);
    setForm({
      nombre: canal.nombre,
      servidor_id: canal.servidor_id,
      categoria_id: canal.categoria_id ?? "",
      tipo: canal.tipo,
    });
    setError("");
    setModalOpen(true);
  };

  const handleEliminar = async (canal) => {
    if (!window.confirm(`¿Eliminar el canal "${canal.nombre}"?`)) return;

    try {
      setError("");
      await eliminarCanal(canal.id_canal);
      const datos = await listarCanales(busqueda);
      setCanales(datos);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setGuardando(true);

    try {
      if (editandoId) {
        await actualizarCanal(editandoId, {
          nombre: form.nombre,
          tipo: form.tipo,
          categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        });
      } else {
        await crearCanal({
          nombre: form.nombre,
          tipo: form.tipo,
          servidor_id: Number(form.servidor_id),
          creador_id: user?.id_usuario,
          categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        });
      }

      const datos = await listarCanales(busqueda);
      setCanales(datos);

      setModalOpen(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="canales">
      <div className="canales__header">
        <h1 className="canales__title">Canales</h1>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo canal
        </Button>
      </div>

      <div className="canales__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar canal..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && !modalOpen && <p className="canales__empty">{error}</p>}

      <div className="canales__list">
        {canales.length === 0 && <p className="canales__empty">No se encontraron canales.</p>}

        {canales.map((c) => (
          <div key={c.id_canal} className="canales__item">
            <div className="canales__item-icon">
              {c.tipo === "informativo" ? <Megaphone size={18} /> : <Hash size={18} />}
            </div>
            <div className="canales__item-main">
              <p className="canales__item-name">{c.nombre}</p>
              <span className={`canales__badge canaux__badge--${c.tipo}`}>
                {c.tipo === "informativo" ? "Informativo" : "Chat"}
              </span>
            </div>
            <div className="canales__item-actions">
              <button
                className="canales__icon-btn"
                onClick={() => abrirEditar(c)}
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                className="canales__icon-btn canales__icon-btn--danger"
                onClick={() => handleEliminar(c)}
                aria-label="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal
          title={editandoId ? "Editar canal" : "Nuevo canal"}
          onClose={() => setModalOpen(false)}
        >
          <form className="canales__form" onSubmit={handleSubmit}>
            <Input
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: General"
            />

            {!editandoId && (
              <Select
                label="Servidor"
                name="servidor_id"
                value={form.servidor_id}
                onChange={handleChange}
                options={servidores.map((s) => ({ value: s.id_servidor, label: s.nombre }))}
                placeholder="Elegir servidor"
              />
            )}

            <Select
              label="Categoría (opcional)"
              name="categoria_id"
              value={form.categoria_id}
              onChange={handleChange}
              options={categorias.map((c) => ({ value: c.id_categoria, label: c.nombre }))}
              placeholder="Sin categoría"
            />
            <Select
              label="Tipo de canal"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              options={tiposDisponibles}
              placeholder="Elegir tipo"
            />

            {error && <p className="canales__empty">{error}</p>}

            <div className="canales__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear canal"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}