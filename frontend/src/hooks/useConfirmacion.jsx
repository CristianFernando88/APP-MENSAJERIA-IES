import { useState } from "react";
import ConfirmDialog from "../components/ui/ConfirmDialog/ConfirmDialog";

export default function useConfirmacion() {
  const [config, setConfig] = useState(null);

  
  const pedir = (opciones) =>
    new Promise((resolve) => setConfig({ ...opciones, resolve }));

  const aceptar = () => {
    config.resolve(true);
    setConfig(null);
  };

  const cancelar = () => {
    config.resolve(false);
    setConfig(null);
  };

  const dialogo = config ? (
    <ConfirmDialog
      titulo={config.titulo}
      mensaje={config.mensaje}
      textoConfirmar={config.textoConfirmar}
      textoCancelar={config.textoCancelar}
      peligro={config.peligro}
      cargando={config.cargando}
      onConfirm={aceptar}
      onCancel={cancelar}
    />
  ) : null;

  return { pedir, dialogo };
}