import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = false,
  cargando = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={titulo} onClose={onCancel}>
      <div className="confirm">
        <div className={`confirm__icon${peligro ? " confirm__icon--peligro" : ""}`}>
          <AlertTriangle size={26} />
        </div>

        <p className="confirm__mensaje">{mensaje}</p>

        <div className="confirm__acciones">
          <Button type="button" variant="outline" onClick={onCancel} disabled={cargando}>
            {textoCancelar}
          </Button>
          <button
            type="button"
            className={`confirm__btn${peligro ? " confirm__btn--peligro" : ""}`}
            onClick={onConfirm}
            disabled={cargando}
          >
            {cargando && <Loader2 size={15} className="confirm__spinner" />}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
}