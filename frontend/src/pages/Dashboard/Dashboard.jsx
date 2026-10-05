import { useNavigate } from "react-router-dom";
import { Calendar, Megaphone, MessageCircle, Bell, CreditCard, CheckCircle2 } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import "./Dashboard.css";

const accesos = [
  { key: "calendario", label: "Calendario", icon: Calendar, to: "/calendario" },
  { key: "comunicados", label: "Comunicados", icon: Megaphone, to: "/comunicados" },
  { key: "mensajes", label: "Mensajes", icon: MessageCircle, to: "/mensajes" },
];

const recordatorios = [
  { id: 1, icon: Bell, texto: "Reunión de Padres y Profesores. Mañana a las 18:00 hs — Salón de Actos." },
  { id: 2, icon: CreditCard, texto: "Vence el pago de la matrícula en 3 días." },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <section className="on-gradient dashboard">
      <div className="dashboard__greeting">
        <h1>HOLA <span className="dashboard__name">Carlos!</span></h1>
        <p className="text-secondary">Hijo: Mateo Castro</p>
        <p className="text-secondary">Curso: 4to Grado A</p>
      </div>

      <div className="dashboard__actions">
        {accesos.map(({ key, label, icon: Icon, to }) => (
          <button key={key} className="dashboard__action" onClick={() => navigate(to)}>
            <Icon size={32} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard__section-title">
        <CheckCircle2 size={20} />
        <span>Recordatorios</span>
      </div>

      <div className="dashboard__reminders">
        {recordatorios.map(({ id, icon, texto }) => (
          <Card key={id} icon={icon}>{texto}</Card>
        ))}
      </div>
    </section>
  );
}