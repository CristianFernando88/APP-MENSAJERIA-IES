import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { obtenerPerfil } from "../../api/perfiles";
import "./UserMenu.css";

export default function UserMenu({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [fotoPerfil, setFotoPerfil] = useState("");

  useEffect(() => {
    if (!user?.id_usuario) return;

    obtenerPerfil(user.id_usuario)
      .then((perfil) => setFotoPerfil(perfil?.foto_perfil || ""))
      .catch(() => setFotoPerfil(""));
  }, [user?.id_usuario]);

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate("/login");
  };

  return (
    <div className="user-menu">
      <div className="user-menu__header">
        <div className="user-menu__avatar">{fotoPerfil ? <img src={fotoPerfil} alt="Foto de perfil" /> : user?.nombre_usuario?.charAt(0).toUpperCase()}</div>
        <p className="user-menu__name">{user?.nombre_usuario}</p>
        <p className="user-menu__email">{user?.rol}</p>
      </div>

      <div className="user-menu__divider" />

      <Link to="/perfil" className="user-menu__item" onClick={onClose}>
        <User size={18} /> <span>Mi perfil</span>
      </Link>

      <button type="button" className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
        <LogOut size={18} /> <span>Cerrar sesión</span>
      </button>
    </div>
  );
}