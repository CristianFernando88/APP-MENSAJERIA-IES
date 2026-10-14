import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { Home, Bell, User, Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationsPanel from "./NotificationsPanel";
import { useAuth } from "../../context/AuthContext";
import { listarComunicados } from "../../api/comunicados";
import { listarDestinatarios } from "../../api/comunicadosDestinatarios";
import { listarVistos, marcarVisto } from "../../api/comunicadosVistos";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import "./Header.css";

export default function Header({ onMenuToggle, menuOpen }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingComunicados, setLoadingComunicados] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Solo comunicados SIN LEER para este usuario
  const [comunicadosNoLeidos, setComunicadosNoLeidos] = useState([]);

  const cargarComunicadosNoLeidos = useCallback(async () => {
    if (!user?.id_usuario) {
      setComunicadosNoLeidos([]);
      return;
    }

    try {
      setLoadingComunicados(true);

      const [com, dest, vis, mc, ms] = await Promise.all([
        listarComunicados(),
        listarDestinatarios(),
        listarVistos(),
        listarMiembrosCanal(),
        listarMiembrosServidor(),
      ]);

      const misCanales = (mc || [])
        .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
        .map((m) => m.canal_id);

      const misServidores = (ms || [])
        .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
        .map((m) => m.servidor_id);

      const vistosIds = new Set(
        (vis || [])
          .filter((v) => Number(v.usuario_id) === Number(user.id_usuario))
          .map((v) => v.comunicado_id)
      );

      const meCorresponde = (comunicadoId) => {
        const destinos = (dest || []).filter(
          (d) => Number(d.comunicado_id) === Number(comunicadoId)
        );

        // Sin destinatarios explícitos = global
        if (destinos.length === 0) return true;

        return destinos.some((d) =>
          (d.usuario_id && Number(d.usuario_id) === Number(user.id_usuario)) ||
          (d.canal_id && misCanales.includes(d.canal_id)) ||
          (d.servidor_id && misServidores.includes(d.servidor_id))
        );
      };

      const sinLeer = (com || [])
        .filter((c) => meCorresponde(c.id_comunicado) && !vistosIds.has(c.id_comunicado))
        .map((c) => ({
          id_notificacion: c.id_comunicado,
          mensaje: c.titulo,                 // título/asunto del comunicado
          fecha_creacion: c.fecha_publicacion,
          enlace: `/comunicados?comunicado=${c.id_comunicado}`,
          leida: false,
        }));

      setComunicadosNoLeidos(sinLeer);
    } catch (error) {
      console.error("Error al cargar comunicados no leídos:", error);
      setComunicadosNoLeidos([]);
    } finally {
      setLoadingComunicados(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    cargarComunicadosNoLeidos();
    const timer = setInterval(cargarComunicadosNoLeidos, 30000);
    return () => clearInterval(timer);
  }, [cargarComunicadosNoLeidos]);

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
      setComunicadosNoLeidos((prev) =>
        prev.filter((c) => c.id_notificacion !== comunicadoId)
      );
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