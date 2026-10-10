import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import "./Miembros.css";

const miembrosIniciales = [
  { usuario_id: 1, nombre: "Roberto Pérez", rol: "Padre/Tutor", fecha_union: "01/03/2026" },
  { usuario_id: 2, nombre: "María Gómez", rol: "Docente", fecha_union: "05/03/2026" },
];

export default function Miembros() {
  const [miembros, setMiembros] = useState(miembrosIniciales);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Ingresá un email válido"); return; }
    setMiembros([...miembros, { usuario_id: Date.now(), nombre: email.split("@")[0], rol: "Padre/Tutor", fecha_union: new Date().toLocaleDateString("es-AR") }]);
    setEmail("");
    setError("");
    setModalOpen(false);
  };

  return (
    <section className="miembros">
      <div className="miembros__header">
        <h1 className="miembros__title">Miembros</h1>
        <div className="miembros__header-actions">
          <Link to="/servidores" className="miembros__back">← Volver a Servidores</Link>
          <Button size="sm" onClick={() => setModalOpen(true)}><UserPlus size={16} /> Agregar miembro</Button>
        </div>
      </div>

      <Card padding="sm">
        <ul className="miembros__list">
          {miembros.map((m) => (
            <li key={m.usuario_id} className="miembros__item">
              <div className="miembros__avatar">{m.nombre.charAt(0)}</div>
              <div className="miembros__info">
                <span className="miembros__name">{m.nombre}</span>
                <span className="miembros__meta">Se unió el {m.fecha_union}</span>
              </div>
              <Badge variant="default">{m.rol}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      {modalOpen && (
        <Modal title="Agregar miembro" onClose={() => setModalOpen(false)}>
          <form className="miembros__form" onSubmit={handleSubmit}>
            <Input label="Email del usuario" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" error={error} />
            <p className="miembros__form-hint">Se agrega a un usuario ya registrado.</p>
            <div className="miembros__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Agregar</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}