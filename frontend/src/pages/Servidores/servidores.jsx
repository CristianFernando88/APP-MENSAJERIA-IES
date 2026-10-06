import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import "./Servidores.css";

const servidoresIniciales = [
  { id_servidor: 1, nombre: "IES Belgrano", descripcion: "Espacio institucional del instituto", fecha_creacion: "2026-03-01", creador_id: 1 },
];

const formVacio = { nombre: "", descripcion: "" };

export default function Servidores() {
  const navigate = useNavigate();
  const [servidores, setServidores] = useState(servidoresIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVacio);

  const filtrados = servidores.filter((s) =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setModalOpen(true);
  };

  const abrirEditar = (servidor) => {
    setEditandoId(servidor.id_servidor);
    setForm({ nombre: servidor.nombre, descripcion: servidor.descripcion });
    setModalOpen(true);
  };

  const handleEliminar = (servidor) => {
    // TODO: reemplazar por confirm modal propio + DELETE real en services/api.js
    if (window.confirm(`¿Eliminar el servidor "${servidor.nombre}"?`)) {
      setServidores(servidores.filter((s) => s.id_servidor !== servidor.id_servidor));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: reemplazar por POST/PUT real a services/api.js
    if (editandoId) {
      setServidores(
        servidores.map((s) =>
          s.id_servidor === editandoId ? { ...s, nombre: form.nombre, descripcion: form.descripcion } : s
        )
      );
    } else {
      setServidores([
        ...servidores,
        {
          id_servidor: Date.now(),
          nombre: form.nombre,
          descripcion: form.descripcion,
          fecha_creacion: new Date().toISOString().slice(0, 10),
          creador_id: 1, // TODO: usuario logueado (AuthContext)
        },
      ]);
    }
    setModalOpen(false);
  };

  return (
    <section className="servidores">
      <div className="servidores__header">
        <h1 className="servidores__title">Servidores</h1>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo servidor
        </Button>
      </div>

      <div className="servidores__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar servidor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="servidores__list">
        {filtrados.length === 0 && <p className="servidores__empty">No se encontraron servidores.</p>}

        {filtrados.map((s) => (
          <div key={s.id_servidor} className="servidores__item">
            <div className="servidores__item-main">
              <p className="servidores__item-name">{s.nombre}</p>
              <p className="servidores__item-desc">{s.descripcion}</p>
              <p className="servidores__item-meta">Creado el {s.fecha_creacion}</p>
            </div>

            <div className="servidores__item-actions">
              <Button size="sm" onClick={() => navigate("/canales")}>Ver canales</Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/miembros")}>Miembros</Button>
              <button className="servidores__icon-btn" onClick={() => abrirEditar(s)} aria-label="Editar">
                <Pencil size={16} />
              </button>
              <button className="servidores__icon-btn servidores__icon-btn--danger" onClick={() => handleEliminar(s)} aria-label="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal title={editandoId ? "Editar servidor" : "Nuevo servidor"} onClose={() => setModalOpen(false)}>
          <form className="servidores__form" onSubmit={handleSubmit}>
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: IES Belgrano" />
            <Input label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Ej: Espacio institucional" />
            <div className="servidores__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">{editandoId ? "Guardar cambios" : "Crear servidor"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}