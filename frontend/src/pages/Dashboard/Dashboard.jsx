import { Calendar, ClipboardList, MessageCircle, Bell, CreditCard, CheckCircle2 } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import "./Dashboard.css";

const accesos = [
  { key: "calendario", label: "Calendario", icon: Calendar, active: true },
  { key: "tareas", label: "Tareas", icon: ClipboardList },
  { key: "mensajes", label: "Mensajes", icon: MessageCircle },
];

const recordatorios = [
  {
    id: 1,
    icon: Bell,
    texto: "Reunión de Padres y Profesores. Mañana a las 18:00 hs — Salón de Actos.",
  },
  {
    id: 2,
    icon: CreditCard,
    texto: "Vence el pago de la matrícula en 3 días.",
  },
];

export default function Dashboard() {
  return (
    <section className="on-gradient dashboard">
      <div className="dashboard__greeting">
        <h1>
          HOLA <span className="dashboard__name">Carlos!</span>
        </h1>
        <p className="text-secondary">Hijo: Mateo Castro</p>
        <p className="text-secondary">Curso: 4to Grado A</p>
      </div>

      <div className="dashboard__actions">
        {accesos.map(({ key, label, icon: Icon, active }) => (
          <button
            key={key}
            className={`dashboard__action${active ? " dashboard__action--active" : ""}`}
          >
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
          <Card key={id} icon={icon}>
            {texto}
          </Card>
        ))}
      </div>
    </section>
  );
}