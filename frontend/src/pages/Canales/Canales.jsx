import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Hash, Megaphone } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import "./Canales.css";

const categoriasDisponibles = [
  { value: 1, label: "Institucional" },
  { value: 2, label: "Soporte" },
];

const tiposDisponibles = [
  { value: "informativo", label: "Informativo (solo admins escriben)" },
  { value: "chat", label: "Chat (todos escriben)" },
];

const canalesIniciales = [
  { id_canal: 1, nombre: "General", servidor_id: 1, categoria_id: 1, tipo: "informativo" },
  { id_canal: 2, nombre: "Consultas", servidor_id: 1, categoria_id: 2, tipo: "chat" },
];

const formVacio = { nombre: "", categoria_id: "", tipo: "chat" };

export default function Canales() {
  const [canales, setCanales] = useState(canalesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVacio);

  const filtrados = canales.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setModalOpen(true);
  };

  const abrirEditar = (canal) => {
    setEditandoId(canal.id_canal);
    setForm({ nombre: canal.nombre, categoria_id: canal.categoria_id ?? "", tipo: canal.tipo });
    setModalOpen(true);
  };

  const handleEliminar = (canal) => {
    // TODO: reemplazar por confirm modal propio + DELETE real
    if (window.confirm(`¿Eliminar el canal "${canal.nombre}"?`)) {
      setCanales(canales.filter((c) => c.id_canal !== canal.id_canal));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: reemplazar por POST/PUT real a services/api.js
    const categoria_id = form.categoria_id ? Number(form.categoria_id) : null;

    if (editandoId) {
      setCanales(
        canales.map((c) =>
          c.id_canal === editandoId ? { ...c, nombre: form.nombre, categoria_id, tipo: form.tipo } : c
        )
      );
    } else {
      setCanales([
        ...canales,
        { id_canal: Date.now(), nombre: form.nombre, servidor_id: 1, categoria_id, tipo: form.tipo },
      ]);
    }
    setModalOpen(false);
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

      <div className="canales__list">
        {filtrados.length === 0 && <p className="canales__empty">No se encontraron canales.</p>}

        {filtrados.map((c) => (
          <div key={c.id_canal} className="canales__item">
            <div className="canales__item-icon">
              {c.tipo === "informativo" ? <Megaphone size={18} /> : <Hash size={18} />}
            </div>
            <div className="canales__item-main">
              <p className="canales__item-name">{c.nombre}</p>
              <span className={`canales__badge canales__badge--${c.tipo}`}>
                {c.tipo === "informativo" ? "Informativo" : "Chat"}
              </span>
            </div>
            <div className="canales__item-actions">
              <button className="canales__icon-btn" onClick={() => abrirEditar(c)} aria-label="Editar">
                <Pencil size={16} />
              </button>
              <button className="canales__icon-btn canales__icon-btn--danger" onClick={() => handleEliminar(c)} aria-label="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal title={editandoId ? "Editar canal" : "Nuevo canal"} onClose={() => setModalOpen(false)}>
          <form className="canales__form" onSubmit={handleSubmit}>
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: General" />
            <Select
              label="Categoría (opcional)"
              name="categoria_id"
              value={form.categoria_id}
              onChange={handleChange}
              options={categoriasDisponibles}
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
            <div className="canales__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editandoId ? "Guardar cambios" : "Crear canal"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}