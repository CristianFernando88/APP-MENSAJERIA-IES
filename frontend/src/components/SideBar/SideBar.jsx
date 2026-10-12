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
  Tags,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
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
    to: "/categorias",
    label: "Categorías",
    icon: Tags,
    roles: ["admin", "super_admin", "director"],
  },
  {
    to: "/canales",
    label: "Canales",
    icon: Hash,
    roles: ["admin", "super_admin", "director", "profesor"],
  },
  {
    to: "/miembros",
    label: "Miembros",
    icon: Users,
    roles: ["admin", "super_admin", "director", "profesor"],
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
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}