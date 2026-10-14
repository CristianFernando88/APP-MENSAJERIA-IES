import "./NotificationsPanel.css";

export default function NotificationsPanel({
  notificaciones = [],
  loading = false,
  onMarcarLeida,
}) {
  return (
    <div className="notif-panel">
      <div className="notif-panel__header">
        <span>Comunicados sin leer</span>
      </div>

      <div className="notif-panel__list">
        {loading && notificaciones.length === 0 ? (
          <p className="notif-panel__empty">Cargando…</p>
        ) : notificaciones.length === 0 ? (
          <p className="notif-panel__empty">No hay comunicados sin leer.</p>
        ) : (
          notificaciones.map((notif) => (
            <button
              key={notif.id_notificacion}
              type="button"
              className="notif-panel__item notif-panel__item--clickable"
              onClick={() => onMarcarLeida?.(notif.id_notificacion)}
            >
              <span className="notif-panel__text">{notif.mensaje}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}