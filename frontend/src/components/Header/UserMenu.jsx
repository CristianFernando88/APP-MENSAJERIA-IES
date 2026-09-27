import { LogOut, Settings } from "lucide-react";
import "./UserMenu.css";


const usuario = {
  nombre: "Carlos Castro",
  email: "carlos.castro@iesbelgrano.edu.ar",
};

export default function UserMenu({ onClose }) {
  const handleLogout = () => {
   
    console.log("Cerrar sesión");
    onClose?.();
  };

  return (
    <div className="user-menu">
      <div className="user-menu__header">
        <div className="user-menu__avatar">{usuario.nombre.charAt(0)}</div>
        <p className="user-menu__name">{usuario.nombre}</p>
        <p className="user-menu__email">{usuario.email}</p>
      </div>

      <div className="user-menu__divider" />

      <button type="button" className="user-menu__item">
        <Settings size={18} />
        <span>Configuración</span>
      </button>

      <button
        type="button"
        className="user-menu__item user-menu__item--danger"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}