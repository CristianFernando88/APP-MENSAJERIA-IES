import { MessageCircle } from "lucide-react";
import "./NotificationsPanel.css";

const horaDe = (iso) => {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};

export default function NotificationsPanel({
  notificaciones = [],
  mensajes = [],
  loading = false,
  onMarcarLeida,
  onAbrirMensajes,
}) {
  const todoVacio = !loading && notificaciones.length === 0 && mensajes.length === 0;

  return (
    <div className="notif-panel">
      <div className="notif-panel__header">Notificaciones</div>

      <div className="notif-panel__seccion">
        <span className="notif-panel__seccion-titulo">
          <MessageCircle size={13} /> Mensajes
        </span>
        <div className="notif-panel__list">
          {mensajes.length === 0 ? (
            <p className="notif-panel__vacio-chico">Sin mensajes nuevos.</p>
          ) : (
            mensajes.map((aviso) => (
              <button
                key={aviso.id}
                type="button"
                className="notif-panel__item notif-panel__item--clickable"
                onClick={onAbrirMensajes}
              >
                <span className="notif-panel__icon">
                  <MessageCircle size={16} />
                </span>
                <span className="notif-panel__col">
                  <span className="notif-panel__text">{aviso.titulo}</span>
                  <span className="notif-panel__detalle">
                    {[aviso.detalle, horaDe(aviso.fecha)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="notif-panel__seccion">
        <span className="notif-panel__seccion-titulo">Comunicados sin leer</span>
        <div className="notif-panel__list">
          {loading && notificaciones.length === 0 ? (
            <p className="notif-panel__vacio-chico">Cargando…</p>
          ) : notificaciones.length === 0 ? (
            <p className="notif-panel__vacio-chico">Sin comunicados sin leer.</p>
          ) : (
            notificaciones.map((notif) => (
              <button
                key={notif.id_notificacion}
                type="button"
                className="notif-panel__item notif-panel__item--clickable"
                onClick={() => onMarcarLeida?.(notif.id_notificacion)}
              >
                <span className="notif-panel__col">
                  <span className="notif-panel__text">{notif.mensaje}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {todoVacio && <p className="notif-panel__empty">Todo al día 🎉</p>}
    </div>
  );
}
``