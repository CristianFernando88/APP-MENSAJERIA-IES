import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Bell, User, Menu, X } from "lucide-react";
import "./Header.css";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/servidores", label: "Servidores" },
  { to: "/canales", label: "Canales" },
  { to: "/usuarios", label: "Usuarios" },
  { to: "/mensajes", label: "Mensajes" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="header__logo">IES Conect</span>
      </div>

      <nav className="header__nav">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `header__nav-link${isActive ? " header__nav-link--active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="header__actions">
        <button type="button" className="header__icon-btn" aria-label="Inicio">
          <Home size={22} />
        </button>
        <button type="button" className="header__icon-btn" aria-label="Notificaciones">
          <Bell size={22} />
        </button>
        <button type="button" className="header__icon-btn" aria-label="Perfil">
          <User size={22} />
        </button>
      </div>

      {menuOpen && (
        <nav className="header__mobile-menu">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `header__mobile-link${isActive ? " header__mobile-link--active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}