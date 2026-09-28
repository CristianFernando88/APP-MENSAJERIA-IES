import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Home, Bell, User, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationsPanel from "./NotificationsPanel";
import "./Header.css";

export default function Header({ onMenuToggle, menuOpen }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

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
            className="header__icon-btn"
            aria-label="Notificaciones"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell size={22} />
          </button>
          {notifOpen && <NotificationsPanel />}
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