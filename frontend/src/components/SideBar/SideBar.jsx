import { NavLink } from 'react-router-dom';
import './SideBar.css';

const SideBar = () => {
  const paginas = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/servidores', name: 'Servidores' },
    { path: '/usuarios', name: 'Usuarios' },
    { path: '/mensajes', name: 'Mensajes' },
  ];

  return (
    <nav className="sidebar">
      {paginas.map((p) => (
        <NavLink
          key={p.path}
          to={p.path}
          className={({ isActive }) =>
            isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
          }
        >
          {p.name}
        </NavLink>
      ))}
    </nav>
  );
};

export default SideBar;