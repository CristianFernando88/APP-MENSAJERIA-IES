import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, Hash, Server } from "lucide-react";
import "./SideBar.css";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/servidores", label: "Servidores", icon: Server },
  { to: "/canales", label: "Canales", icon: Hash },
  { to: "/usuarios", label: "Usuarios", icon: Users },
  { to: "/mensajes", label: "Mensajes", icon: MessageSquare },
];

export default function SideBar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}