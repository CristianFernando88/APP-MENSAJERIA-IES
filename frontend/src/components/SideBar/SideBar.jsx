import {
  LayoutDashboard,
  Server,
  Hash,
  Users,
  MessageSquare,
  Megaphone,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificacionesContext"; // NUEVO
import "./SideBar.css";

const NAV_LINKS = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, roles: null },
  { to: "/calendario", label: "Calendario", icon: Calendar, roles: null },
  {
    to: "/servidores",
    label: "Servidores",
    icon: Server,
    roles: ["admin", "super_admin", "director"],
  },
  {
    to: "/canales",
    label: "Canales",
    icon: Hash,
    roles: ["admin", "super_admin", "director", "profesor"],
  },
  {
    to: "/admin",
    label: "Panel Administrador",
    icon: ShieldCheck,
    roles: ["admin", "super_admin"],
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["admin", "super_admin"],
  },
  { to: "/mensajes", label: "Mensajes", icon: MessageSquare, roles: null },
  { to: "/comunicados", label: "Comunicados", icon: Megaphone, roles: null },
];

export default function SideBar({ isOpen, onClose }) {
  const { hasRole } = useAuth();
  const { totalNoLeidos } = useNotificaciones(); // NUEVO

  const linksVisibles = NAV_LINKS.filter(
    (link) => !link.roles || hasRole(link.roles)
  );

  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
      <nav className="sidebar__nav">
        {linksVisibles.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `sidebar__item${isActive ? " sidebar__item--active" : ""}`
            }
            onClick={onClose}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon size={20} />
              <span>{label}</span>
              
              {/* BADGE ROJO SOLO PARA MENSAJES */}
              {to === "/mensajes" && totalNoLeidos > 0 && (
                <span style={{
                  backgroundColor: "#ef4444", 
                  color: "white",
                  borderRadius: "50%", 
                  padding: "2px 6px",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  position: "absolute",
                  top: "-8px",
                  left: "12px", 
                  minWidth: "16px",
                  textAlign: "center"
                }}>
                  {totalNoLeidos > 9 ? "+9" : totalNoLeidos}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}