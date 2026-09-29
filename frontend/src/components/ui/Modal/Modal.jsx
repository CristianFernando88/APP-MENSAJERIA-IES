import { X } from "lucide-react";
import Overlay from "../Overlay/Overlay";
import "./Modal.css";

export default function Modal({ title, onClose, children }) {
  return (
    <>
      <Overlay onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </>
  );
}