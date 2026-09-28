import { Calendar, CreditCard } from "lucide-react";
import "./NotificationsPanel.css";

// TODO: reemplazar por notificaciones reales (services/api.js)
const notificaciones = [
  {
    id: 1,
    icon: Calendar,
    texto: "Reunión de Padres y Profesores mañana a las 18:00 hs — Salón de Actos.",
    tiempo: "hace 2 hs",
  },
  {
    id: 2,
    icon: CreditCard,
    texto: "Vence el pago de la matrícula en 3 días.",
    tiempo: "hace 5 hs",
  },
];

export default function NotificationsPanel() {
  return (
    <div className="notif-panel">
      <div className="notif-panel__header">Notificaciones</div>

      <div className="notif-panel__list">
        {notificaciones.length === 0 ? (
          <p className="notif-panel__empty">No tenés notificaciones nuevas.</p>
        ) : (
          notificaciones.map(({ id, icon: Icon, texto, tiempo }) => (
            <div key={id} className="notif-panel__item">
              <span className="notif-panel__icon">
                <Icon size={18} />
              </span>
              <div>
                <p className="notif-panel__text">{texto}</p>
                <span className="notif-panel__time">{tiempo}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}