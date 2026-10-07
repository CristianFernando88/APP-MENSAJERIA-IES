// pages/Categorias/Categorias.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderTree, ChevronRight, Plus } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import "./Categorias.css";

const categoriasIniciales = [
  { id_categoria: 1, nombre: "Institucional", descripcion: "Comunicados generales del instituto", padre_id: null, servidor_id: 1, orden: 1 },
  { id_categoria: 2, nombre: "Soporte", descripcion: "Consultas y ayuda técnica", padre_id: null, servidor_id: 1, orden: 2 },
  { id_categoria: 3, nombre: "Consultas académicas", descripcion: "Dudas sobre materias", padre_id: 2, servidor_id: 1, orden: 1 },
  { id_categoria: 4, nombre: "Consultas administrativas", descripcion: "Matrícula, pagos, documentación", padre_id: 2, servidor_id: 1, orden: 2 },
];

function construirArbol(lista) {
  const principales = lista.filter((c) => c.padre_id === null);
  return principales
    .sort((a, b) => a.orden - b.orden)
    .map((padre) => ({
      ...padre,
      hijas: lista.filter((c) => c.padre_id === padre.id_categoria).sort((a, b) => a.orden - b.orden),
    }));
}

export default function Categorias() {
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", padre_id: "" });

  const arbol = construirArbol(categorias);

  const opcionesPadre = categorias
    .filter((c) => c.padre_id === null) // por ahora solo 1 nivel de subcategoría, como en el DER (padre_id apunta siempre a una categoría raíz)
    .map((c) => ({ value: c.id_categoria, label: c.nombre }));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: reemplazar por POST real a services/api.js (servidor_id sale del servidor actual seleccionado)
    const nueva = {
      id_categoria: Date.now(),
      nombre: form.nombre,
      descripcion: form.descripcion,
      padre_id: form.padre_id ? Number(form.padre_id) : null,
      servidor_id: 1, // TODO: servidor actual
      orden: categorias.length + 1,
    };
    setCategorias([...categorias, nueva]);
    setForm({ nombre: "", descripcion: "", padre_id: "" });
    setModalOpen(false);
  };

  return (
    <section className="categorias">
      <div className="categorias__header">
        <h1 className="categorias__title">Categorías</h1>
        <div className="categorias__header-actions">
          <Link to="/servidores" className="categorias__back">← Volver a Servidores</Link>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nueva categoría
          </Button>
        </div>
      </div>

      <div className="categorias__list">
        {arbol.map((cat) => (
          <Card key={cat.id_categoria} icon={FolderTree} className="categorias__card">
            <div className="categorias__main-row">
              <div>
                <p className="categorias__nombre">{cat.nombre}</p>
                <p className="categorias__desc">{cat.descripcion}</p>
              </div>
              <Link to={`/canales?categoria=${cat.id_categoria}`} className="categorias__link">
                Ver canales <ChevronRight size={16} />
              </Link>
            </div>

            {cat.hijas.length > 0 && (
              <ul className="categorias__sublist">
                {cat.hijas.map((sub) => (
                  <li key={sub.id_categoria} className="categorias__subitem">
                    <div>
                      <span className="categorias__sub-nombre">{sub.nombre}</span>
                      <span className="categorias__sub-desc">{sub.descripcion}</span>
                    </div>
                    <Link to={`/canales?categoria=${sub.id_categoria}`} className="categorias__link">
                      Ver canales <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {modalOpen && (
        <Modal title="Nueva categoría" onClose={() => setModalOpen(false)}>
          <form className="categorias__form" onSubmit={handleSubmit}>
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
            <div className="categorias__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear categoría</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}