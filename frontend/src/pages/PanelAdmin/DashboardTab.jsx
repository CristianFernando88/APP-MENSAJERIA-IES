import { Megaphone, Users, Server, Shield, ArrowRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";

function tiempoRelativo(fecha) {
  if (!fecha) return "";
  const ms = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `hace ${hs} h`;
  const dias = Math.floor(hs / 24);
  if (dias < 7) return `hace ${dias} d`;
  return new Date(fecha).toLocaleDateString("es-AR");
}

function nombreUsuario(usuarios, id) {
  return usuarios.find((u) => u.id_usuario === id)?.nombre_usuario ?? `Usuario ${id}`;
}

function Seccion({ icon: Icon, titulo, items, vacio, link, linkLabel }) {
  return (
    <div className="dash-seccion">
      <div className="dash-seccion__header">
        <h3><Icon size={16} /> {titulo}</h3>
        {link && (
          <Link to={link} className="dash-seccion__link">
            {linkLabel || "Ver todos"} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="dash-seccion__vacio"><Inbox size={14} /> {vacio}</p>
      ) : (
        <ul className="dash-seccion__lista">{items}</ul>
      )}
    </div>
  );
}

export default function DashboardTab({
  comunicados, usuarios, servidores, asignaciones, roles, onIrARoles,
}) {
  const ultComunicados = [...comunicados]
    .sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion))
    .slice(0, 5);

  const ultUsuarios = [...usuarios]
    .sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro))
    .slice(0, 5);

  const ultServidores = [...servidores]
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 5);

  const ultAsignaciones = [...asignaciones]
    .sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))
    .slice(0, 5);

  return (
    <div className="dashboard-tab">
      <Seccion
        icon={Megaphone}
        titulo="Últimos comunicados"
        link="/comunicados"
        vacio="Todavía no hay comunicados."
        items={ultComunicados.map((c) => (
          <li key={c.id_comunicado} className="dash-item">
            <div className="dash-item__main">
              <span className="dash-item__titulo">{c.titulo}</span>
              <span className="dash-item__meta">
                por {nombreUsuario(usuarios, c.publicado_por)} · {tiempoRelativo(c.fecha_publicacion)} · {c.tipo}
              </span>
            </div>
          </li>
        ))}
      />

      <Seccion
        icon={Users}
        titulo="Últimos usuarios registrados"
        link="/usuarios"
        vacio="No hay usuarios registrados."
        items={ultUsuarios.map((u) => (
          <li key={u.id_usuario} className="dash-item">
            <div className="dash-item__main">
              <span className="dash-item__titulo">{u.nombre_usuario}</span>
              <span className="dash-item__meta">
                {u.email} · {tiempoRelativo(u.fecha_registro)} · {u.activo ? "activo" : "inactivo"}
              </span>
            </div>
          </li>
        ))}
      />

      <Seccion
        icon={Server}
        titulo="Últimos servidores"
        link="/servidores"
        vacio="No hay servidores creados."
        items={ultServidores.map((s) => (
          <li key={s.id_servidor} className="dash-item">
            <div className="dash-item__main">
              <span className="dash-item__titulo">{s.nombre}</span>
              <span className="dash-item__meta">
                por {nombreUsuario(usuarios, s.creador_id)} · {tiempoRelativo(s.fecha_creacion)}
              </span>
            </div>
          </li>
        ))}
      />

      <Seccion
        icon={Shield}
        titulo="Asignaciones recientes"
        link={null}
        vacio="No hay roles asignados."
        items={ultAsignaciones.map((a) => (
          <li key={a.id_usuario_rol} className="dash-item">
            <div className="dash-item__main">
              <span className="dash-item__titulo">
                {nombreUsuario(usuarios, a.usuario_id)} →{" "}
                {roles.find((r) => r.id_rol === a.rol_id)?.nombre ?? `Rol ${a.rol_id}`}
              </span>
              <span className="dash-item__meta">
                por {nombreUsuario(usuarios, a.asignado_por)} · {tiempoRelativo(a.fecha_asignacion)}
                {a.servidor_id
                  ? ` · servidor: ${servidores.find((s) => s.id_servidor === a.servidor_id)?.nombre ?? a.servidor_id}`
                  : " · global"}
              </span>
            </div>
          </li>
        ))}
      />

      <div className="dash-acciones">
        <button type="button" className="dash-accion" onClick={onIrARoles}>
          <Shield size={16} /> Gestionar roles
        </button>
      </div>
    </div>
  );
}