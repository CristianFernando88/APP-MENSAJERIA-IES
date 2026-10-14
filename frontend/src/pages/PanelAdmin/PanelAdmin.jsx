import { useState, useEffect } from "react";
import {
  Users, Server, Hash, Megaphone, Layers, ArrowRight,
  AlertCircle, Loader2, ShieldCheck, UserPlus, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listarUsuarios } from "../../api/usuarios";
import { listarServidores } from "../../api/servidores";
import { listarCanales } from "../../api/canales";
import { listarCategorias } from "../../api/categorias";
import { listarComunicados } from "../../api/comunicados";
import { listarRoles } from "../../api/roles";
import { listarUsuarioRol, crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import { useAuth } from "../../context/AuthContext";
import "./PanelAdmin.css";

const formVacio = { usuario_id: "", rol_id: "", servidor_id: "" };

export default function PanelAdmin() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [comunicados, setComunicados] = useState([]);

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

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
          canales: {
            total: canales.length,
            detalle: `${canales.filter((c) => c.tipo === "chat").length} de tipo chat`,
            icon: Hash,
            color: "canales",
            link: "/canales",
          },
          comunicados: {
            total: comunicados.length,
            detalle: `${comunicados.filter((c) => c.tipo === "global").length} globales`,
            icon: Megaphone,
            color: "comunicados",
            link: "/comunicados",
          },
          categorias: {
            total: categorias.length,
            detalle: "organizadas por servidor",
            icon: Layers,
            color: "categorias",
            link: "/categorias",
          },
        });

        const ordenados = [...comunicados].sort(
          (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
        );
        setComunicados(ordenados.slice(0, 5));
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

  const nombreDe = (id) =>
    usuarios.find((u) => u.id_usuario === id)?.nombre_usuario ?? `Usuario ${id}`;

  const nombreRol = (id) => roles.find((r) => r.id_rol === id)?.nombre ?? `Rol ${id}`;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAsignar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.usuario_id || !form.rol_id) {
      setError("Elegí un usuario y un rol");
      return;
    }

    setGuardando(true);

    try {
      await crearUsuarioRol({
        usuario_id: Number(form.usuario_id),
        rol_id: Number(form.rol_id),
        servidor_id: form.servidor_id ? Number(form.servidor_id) : null,
        asignado_por: user?.id_usuario,
      });

      const datos = await listarUsuarioRol();
      setAsignaciones(datos);
      setForm(formVacio);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (a) => {
    if (!window.confirm(`¿Quitarle el rol "${nombreRol(a.rol_id)}" a ${nombreDe(a.usuario_id)}?`)) return;

    try {
      setError("");
      await eliminarUsuarioRol(a.usuario_id, a.rol_id, a.servidor_id);
      const datos = await listarUsuarioRol();
      setAsignaciones(datos);
    } catch (err) {
      setError(err.message);
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

      {cargando && (
        <div className="panel-admin__loading">
          <Loader2 size={18} className="panel-admin__spinner" /> Cargando datos...
        </div>
      )}

      {!cargando && stats && (
        <>
          <div className="panel-admin__grid">
            {Object.entries(stats).map(([key, s]) => {
              const Icon = s.icon;

              return (
                <Link to={s.link} key={key} className={`stat stat--${s.color}`}>
                  <span className="stat__icon">
                    <Icon size={20} />
                  </span>
                  <span className="stat__numero">{s.total}</span>
                  <span className="stat__label">{key}</span>
                  <span className="stat__detalle">{s.detalle}</span>
                </Link>
              );
            })}
          </div>

          <div className="panel-admin__dos-col">
            <div className="panel-admin__seccion">
              <h2 className="panel-admin__seccion-titulo">
                <ShieldCheck size={18} /> Asignar rol
              </h2>

              <form className="panel-admin__form" onSubmit={handleAsignar}>
                <label className="panel-admin__campo">
                  <span>Usuario</span>
                  <select
                    name="usuario_id"
                    value={form.usuario_id}
                    onChange={handleChange}
                  >
                    <option value="">Elegir usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nombre_usuario}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="panel-admin__campo">
                  <span>Rol</span>
                  <select name="rol_id" value={form.rol_id} onChange={handleChange}>
                    <option value="">Elegir rol</option>
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="panel-admin__campo">
                  <span>Servidor (opcional)</span>
                  <select name="servidor_id" value={form.servidor_id} onChange={handleChange}>
                    <option value="">Sin servidor (global)</option>
                    {servidores.map((s) => (
                      <option key={s.id_servidor} value={s.id_servidor}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="panel-admin__btn"
                  disabled={guardando}
                >
                  <UserPlus size={15} />
                  {guardando ? "Asignando..." : "Asignar rol"}
                </button>
              </form>
            </div>

            <div className="panel-admin__seccion">
              <h2 className="panel-admin__seccion-titulo">
                <Megaphone size={18} /> Últimos comunicados
              </h2>

              {comunicados.length === 0 ? (
                <p className="panel-admin__vacio">Todavía no hay comunicados.</p>
              ) : (
                <ul className="panel-admin__lista">
                  {comunicados.map((c) => (
                    <li key={c.id_comunicado} className="panel-admin__item">
                      <div className="panel-admin__item-main">
                        <span className="panel-admin__item-titulo">{c.titulo}</span>
                        <span className="panel-admin__item-meta">
                          {new Date(c.fecha_publicacion).toLocaleDateString("es-AR")} · {c.tipo}
                        </span>
                      </div>
                      <Link to="/comunicados" className="panel-admin__item-link">
                        Ver <ArrowRight size={15} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="panel-admin__seccion">
            <h2 className="panel-admin__seccion-titulo">
              <ShieldCheck size={18} /> Roles asignados ({asignaciones.length})
            </h2>

            {asignaciones.length === 0 ? (
              <p className="panel-admin__vacio">No hay roles asignados.</p>
            ) : (
              <ul className="panel-admin__lista">
                {asignaciones.map((a) => (
                  <li key={a.id_usuario_rol} className="panel-admin__item">
                    <div className="panel-admin__item-main">
                      <span className="panel-admin__item-titulo">
                        {nombreDe(a.usuario_id)} → {nombreRol(a.rol_id)}
                      </span>
                      <span className="panel-admin__item-meta">
                        {a.servidor_id
                          ? `Servidor: ${servidores.find((s) => s.id_servidor === a.servidor_id)?.nombre ?? a.servidor_id}`
                          : "Global"}
                      </span>
                    </div>
                    <button
                      className="panel-admin__quitar"
                      onClick={() => handleQuitar(a)}
                      aria-label="Quitar rol"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}