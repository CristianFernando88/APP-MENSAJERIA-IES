import { useState } from "react";
import { Plus, Search, Megaphone } from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import "./Comunicados.css";

const tiposDisponibles = [
  { value: "global", label: "Global (toda la app)" },
  { value: "servidor", label: "Servidor" },
  { value: "canal", label: "Canal" },
  { value: "usuario", label: "Usuario específico" },
];

const TIPO_VARIANT = { global: "danger", servidor: "warning", canal: "default", usuario: "success" };

const comunicadosIniciales = [
  { id_comunicado: 1, titulo: "Reserva matrícula 2027", contenido: "Ya está abierta la reserva de matrícula para el ciclo 2027. Pueden hacerla desde Secretaría hasta el 30 de noviembre.", fecha_publicacion: "07/08/2026", publicado_por: "Florencia Zuñiga", tipo: "global", visto: false },
  { id_comunicado: 2, titulo: "Valor de cuotas", contenido: "Se actualizó el valor de las cuotas a partir de septiembre. Consultá el detalle en el área administrativa.", fecha_publicacion: "07/08/2026", publicado_por: "Florencia Zuñiga", tipo: "global", visto: false },
  { id_comunicado: 3, titulo: "Secundaria: códigos de Classroom", contenido: "Compartimos los códigos de Classroom actualizados para cada curso de secundaria.", fecha_publicacion: "22/04/2026", publicado_por: "Aurora Abdo", tipo: "canal", visto: true },
];

const formVacio = { titulo: "", contenido: "", tipo: "global" };

export default function Comunicados() {
  const [comunicados, setComunicados] = useState(comunicadosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [form, setForm] = useState(formVacio);

  const filtrados = comunicados.filter((c) => c.titulo.toLowerCase().includes(busqueda.toLowerCase()));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAbrir = (comunicado) => {
    setSeleccionado(comunicado);
    if (!comunicado.visto) {
      setComunicados(comunicados.map((c) => (c.id_comunicado === comunicado.id_comunicado ? { ...c, visto: true } : c)));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevo = {
      id_comunicado: Date.now(),
      titulo: form.titulo,
      contenido: form.contenido,
      tipo: form.tipo,
      fecha_publicacion: new Date().toLocaleDateString("es-AR"),
      publicado_por: "Vos", 
      visto: true,
    };
    setComunicados([nuevo, ...comunicados]);
    setForm(formVacio);
    setCrearOpen(false);
  };

  return (
    <section className="comunicados">
      <div className={`comunicados__list-panel${seleccionado ? " comunicados__list-panel--hidden-mobile" : ""}`}>
        <div className="comunicados__header">
          <h1 className="comunicados__title">Comunicados</h1>
          <button className="comunicados__new-btn" onClick={() => setCrearOpen(true)} aria-label="Nuevo comunicado">
            <Plus size={20} />
          </button>
        </div>

        <div className="comunicados__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar comunicado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="comunicados__list">
          {filtrados.length === 0 && <p className="comunicados__empty">No se encontraron comunicados.</p>}

          {filtrados.map((c) => (
            <button
              key={c.id_comunicado}
              className={`comunicados__item${seleccionado?.id_comunicado === c.id_comunicado ? " comunicados__item--active" : ""}${!c.visto ? " comunicados__item--unread" : ""}`}
              onClick={() => handleAbrir(c)}
            >
              <div className="comunicados__item-icon"><Megaphone size={18} /></div>
              <div className="comunicados__item-content">
                <div className="comunicados__item-top">
                  <span className="comunicados__item-title">{c.titulo}</span>
                  <Badge variant={TIPO_VARIANT[c.tipo]}>{c.tipo}</Badge>
                </div>
                <p className="comunicados__item-snippet">{c.contenido}</p>
                <span className="comunicados__item-meta">{c.publicado_por} · {c.fecha_publicacion}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`comunicados__detail-panel${seleccionado ? " comunicados__detail-panel--visible-mobile" : ""}`}>
        {seleccionado ? (
          <div className="comunicados__detail">
            <button className="comunicados__back" onClick={() => setSeleccionado(null)}>← Volver</button>
            <div className="comunicados__detail-header">
              <h2>{seleccionado.titulo}</h2>
              <Badge variant={TIPO_VARIANT[seleccionado.tipo]}>{seleccionado.tipo}</Badge>
            </div>
            <p className="comunicados__detail-meta">
              Publicado por {seleccionado.publicado_por} · {seleccionado.fecha_publicacion}
            </p>
            <p className="comunicados__detail-body">{seleccionado.contenido}</p>
          </div>
        ) : (
          <div className="comunicados__empty-state">
            <Megaphone size={48} />
            <p>Seleccioná un comunicado para leerlo</p>
          </div>
        )}
      </div>

      {crearOpen && (
        <Modal title="Nuevo comunicado" onClose={() => setCrearOpen(false)}>
          <form className="comunicados__form" onSubmit={handleSubmit}>
            <Input label="Título" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej: Reserva matrícula 2027" />
            <label className="comunicados__label" htmlFor="contenido">Contenido</label>
            <textarea
              id="contenido"
              name="contenido"
              className="comunicados__textarea"
              rows={5}
              value={form.contenido}
              onChange={handleChange}
              placeholder="Escribí el cuerpo del comunicado..."
            />
            <Select label="Alcance" name="tipo" value={form.tipo} onChange={handleChange} options={tiposDisponibles} />
            <div className="comunicados__form-actions">
              <Button type="button" variant="outline" onClick={() => setCrearOpen(false)}>Cancelar</Button>
              <Button type="submit">Publicar</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}