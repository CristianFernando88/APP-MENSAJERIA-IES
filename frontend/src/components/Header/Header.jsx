import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Home, Bell, User, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationsPanel from "./NotificationsPanel";
import { useAuth } from "../../context/AuthContext";
import { marcarVisto } from "../../api/comunicadosVistos";
import { useComunicadosNoLeidos } from "../../hooks/useComunicadosNoLeidos";
import "./Header.css";

export default function Header({ onMenuToggle, menuOpen }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const {
    comunicadosNoLeidos: comunicadosFiltrados,
    loading: loadingComunicados,
    refrescar: cargarComunicadosNoLeidos,
  } = useComunicadosNoLeidos();

  const comunicadosNoLeidos = comunicadosFiltrados.map((c) => ({
    id_notificacion: Number(c.id_comunicado),
    mensaje: c.titulo,
    fecha_creacion: c.fecha_publicacion,
    enlace: `/comunicados?comunicado=${c.id_comunicado}`,
    leida: false,
  }));

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const marcarComoLeido = async (comunicadoId) => {
    if (!user?.id_usuario) return;

    try {
      await marcarVisto(comunicadoId, user.id_usuario);
      await cargarComunicadosNoLeidos();
    } catch (error) {
      console.error("Error al marcar comunicado como leído:", error);
    }
  };

  const abrirComunicado = async (comunicadoId) => {
    setNotifOpen(false);
    await marcarComoLeido(comunicadoId);
    navigate(`/comunicados?comunicado=${comunicadoId}`);
  };

  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__menu-btn"
          onClick={onMenuToggle}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="header__logo">IES Connect</span>
      </div>

      <div className="header__actions">
        <Link to="/" className="header__icon-btn" aria-label="Inicio">
          <Home size={22} />
        </Link>

        <div className="header__user" ref={notifRef}>
          <button
            type="button"
            className="header__icon-btn header__bell"
            aria-label={
              comunicadosNoLeidos.length > 0
                ? `Comunicados sin leer: ${comunicadosNoLeidos.length}`
                : "Notificaciones"
            }
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell size={22} />
            {comunicadosNoLeidos.length > 0 && (
              <span className="header__badge">
                {comunicadosNoLeidos.length > 9 ? "9+" : comunicadosNoLeidos.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationsPanel
              notificaciones={comunicadosNoLeidos}
              loading={loadingComunicados}
              onMarcarLeida={abrirComunicado}
              onRefrescar={cargarComunicadosNoLeidos}
            />
          )}
        </div>

        <div className="header__user" ref={userMenuRef}>
          <button
            type="button"
            className="header__icon-btn"
            aria-label="Perfil"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            <User size={22} />
          </button>
          {userMenuOpen && <UserMenu onClose={() => setUserMenuOpen(false)} />}
        </div>
      </div>
    </header>
  );
}