import { useState, useEffect } from "react";
import {
  LayoutDashboard, Server, Users, Shield, AlertCircle, Loader2,
} from "lucide-react";
import { listarUsuarios } from "../../api/usuarios";
import { listarServidores } from "../../api/servidores";
import { listarCanales } from "../../api/canales";
import { listarCategorias } from "../../api/categorias";
import { listarComunicados } from "../../api/comunicados";
import { listarRoles } from "../../api/roles";
import { listarUsuarioRol } from "../../api/usuarioRol";
import DashboardTab from "./DashboardTab";
import ServidoresTab from "./ServidoresTab";
import UsuariosTab from "./UsuariosTab";
import RolesTab from "./RolesTab";
import "./PanelAdmin.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "servidores", label: "Servidores", icon: Server },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
];

export default function PanelAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [comunicados, setComunicados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    const cargar = async () => {
      try {
        setError("");
        const [usuarios, servidores, canales, categorias, comunicados, roles, asignaciones] =
          await Promise.all([
            listarUsuarios(),
            listarServidores(),
            listarCanales(),
            listarCategorias(),
            listarComunicados(),
            listarRoles(),
            listarUsuarioRol(),
          ]);

        if (!vivo) return;

        setUsuarios(usuarios);
        setServidores(servidores);
        setRoles(roles);
        setAsignaciones(asignaciones);

        setStats({
          usuarios: {
            total: usuarios.length,
            detalle: `${usuarios.filter((u) => u.activo).length} activos`,
            icon: Users,
            color: "usuarios",
            link: "/usuarios",
          },
          servidores: {
            total: servidores.length,
            detalle: `${servidores.filter((s) => s.descripcion).length} con descripción`,
            icon: Server,
            color: "servidores",
            link: "/servidores",
          },
          comunicados: {
            total: comunicados.length,
            detalle: `${comunicados.filter((c) => c.tipo === "global").length} globales`,
            icon: Shield,
            color: "comunicados",
            link: "/comunicados",
          },
          categorias: {
            total: categorias.length,
            detalle: `${canales.length} canales en total`,
            icon: Shield,
            color: "categorias",
            link: "/categorias",
          },
        });

        const ordenados = [...comunicados].sort(
          (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
        );
        setComunicados(ordenados);
      } catch (err) {
        if (vivo) setError(err.message);
      } finally {
        if (vivo) setCargando(false);
      }
    };

    cargar();
    return () => {
      vivo = false;
    };
  }, []);

  const renderTab = () => {
    if (cargando) {
      return (
        <div className="panel-admin__loading">
          <Loader2 size={18} className="panel-admin__spinner" /> Cargando datos...
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            comunicados={comunicados}
            usuarios={usuarios}
            servidores={servidores}
            asignaciones={asignaciones}
            roles={roles}
            onIrARoles={() => setActiveTab("roles")}
          />
        );

      case "servidores":
        return (
          <ServidoresTab
            servidores={servidores}
            setServidores={setServidores}
            usuarios={usuarios}
          />
        );

      case "usuarios":
        return (
          <UsuariosTab
            usuarios={usuarios}
            setUsuarios={setUsuarios}
            roles={roles}
            servidores={servidores}
            asignaciones={asignaciones}
            setAsignaciones={setAsignaciones}
          />
        );

      case "roles":
        return (
          <RolesTab
            roles={roles}
            setRoles={setRoles}
            asignaciones={asignaciones}
          />
        );

      default:
        return null;
    }
  };

  return (
    <section className="panel-admin">
      <div className="panel-admin__header">
        <div>
          <h1>Panel de Administrador</h1>
          <p>Resumen general de la plataforma</p>
        </div>
      </div>

      {error && (
        <div className="panel-admin__error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {stats && (
        <div className="panel-admin__grid">
          {Object.entries(stats).map(([key, s]) => {
            const Icon = s.icon;
            return (
              <div key={key} className={`stat stat--${s.color}`}>
                <span className="stat__icon"><Icon size={20} /></span>
                <span className="stat__numero">{s.total}</span>
                <span className="stat__label">{key}</span>
                <span className="stat__detalle">{s.detalle}</span>
              </div>
            );
          })}
        </div>
      )}

      <nav className="panel-admin__tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`panel-admin__tab${activeTab === id ? " panel-admin__tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="panel-admin__tab-content">{renderTab()}</div>
    </section>
  );
}