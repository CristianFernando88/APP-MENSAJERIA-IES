import { Megaphone, X } from "lucide-react";
import "./Toast.css";

export default function Toast({ titulo, detalle, onAccion, onCerrar }) {
  return (
    <div
      className="toast"
      role="status"
      onClick={onAccion ? onAccion : undefined}
      style={onAccion ? { cursor: "pointer" } : undefined}
    >
      <span className="toast__icon">
        <Megaphone size={18} />
      </span>

      <div className="toast__texto">
        <span className="toast__titulo">{titulo}</span>
        {detalle && <span className="toast__detalle">{detalle}</span>}
      </div>

      {onAccion && (
        <button
          className="toast__accion"
          onClick={(e) => { e.stopPropagation(); onAccion(); }}
        >
          Ver
        </button>
      )}

      <button
        className="toast__cerrar"
        onClick={(e) => { e.stopPropagation(); onCerrar?.(); }}
        aria-label="Cerrar"
      >
        <X size={15} />
      </button>
    </div>
  );
}