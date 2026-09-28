import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Hash,
  Users,
  MessageSquare,
  Megaphone,
  Calendar,
  ClipboardList,
} from "lucide-react";
import "./SideBar.css";

const NAV_LINKS = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/tareas", label: "Tareas", icon: ClipboardList },
  { to: "/servidores", label: "Servidores", icon: Server },
  { to: "/canales", label: "Canales", icon: Hash },
  { to: "/usuarios", label: "Usuarios", icon: Users },
  { to: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { to: "/comunicados", label: "Comunicados", icon: Megaphone },
];

export default function SideBar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
      <nav className="sidebar__nav">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `sidebar__item${isActive ? " sidebar__item--active" : ""}`
            }
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}