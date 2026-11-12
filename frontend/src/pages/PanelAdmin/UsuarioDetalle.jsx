import { useState } from "react";
import { UserRound, Link2, School, Trash2, UserPlus } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import "./UsuarioDetalle.css";

export const nombreCompleto = (usuario) => {
  if (!usuario) return "Sin nombre";
  const completo = `${usuario.perfil?.nombres || ""} ${usuario.perfil?.apellidos || ""}`.trim();
  return completo || usuario.nombre_usuario || "Sin nombre";
};

const TIPOS_VINCULO = [
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "tutor", label: "Tutor" },
  { value: "hermano", label: "Hermano" },
  { value: "abuelo", label: "Abuelo" },
  { value: "tio", label: "Tío" },
];

export default function UsuarioDetalle({
  usuario,
  asignaciones = [],
  roles = [],
  servidores = [],
  membresias = [],
  relaciones = [],
  usuarios = [],
  onCrearVinculo,
  onEliminarVinculo,
}) {
  const [tabActiva, setTabActiva] = useState("info");
  const [tipoVinculo, setTipoVinculo] = useState("padre");
  const [usuarioVinculo, setUsuarioVinculo] = useState("");
  const [errorVinculo, setErrorVinculo] = useState("");
  const [procesando, setProcesando] = useState(false);

  if (!usuario) return null;

  const idUsuario = Number(usuario.id_usuario);

  const rolesDeUsuario = asignaciones
    .filter((a) => Number(a.usuario_id) === idUsuario)
    .map((a) => {
      const rol = roles.find((r) => Number(r.id_rol) === Number(a.rol_id));
      const servidor = a.servidor_id
        ? servidores.find((s) => Number(s.id_servidor) === Number(a.servidor_id))
        : null;
      return {
        id: `${a.rol_id}-${a.servidor_id || "global"}`,
        nombre: rol?.nombre || `Rol ${a.rol_id}`,
        alcance: servidor ? `Servidor: ${servidor.nombre}` : "Global",
      };
    });

  const membresiasDeUsuario = membresias
    .filter((m) => Number(m.usuario_id) === idUsuario && m.activo !== false)
    .map((m) => servidores.find((s) => Number(s.id_servidor) === Number(m.servidor_id)))
    .filter(Boolean);

  const vinculosDelUsuario = relaciones.filter(
    (v) => Number(v.usuario_id) === idUsuario || Number(v.relacionado_id) === idUsuario
  );

  const nombreDe = (idUsuarioRelacionado) => {
    const u = usuarios.find((x) => Number(x.id_usuario) === Number(idUsuarioRelacionado));
    return u ? nombreCompleto(u) : "Usuario desconocido";
  };

  const handleAgregarVinculo = async () => {
    if (!usuarioVinculo) return;
    setErrorVinculo("");
    setProcesando(true);
    try {
      await onCrearVinculo({
        usuario_id: idUsuario,
        relacionado_id: Number(usuarioVinculo),
        tipo: tipoVinculo,
      });
      setUsuarioVinculo("");
    } catch (err) {
      setErrorVinculo(err?.message || "No se pudo crear el vínculo.");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarVinculo = async (idRelacion) => {
    setErrorVinculo("");
    setProcesando(true);
    try {
      await onEliminarVinculo(idRelacion);
    } catch (err) {
      setErrorVinculo(err?.message || "No se pudo eliminar el vínculo.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="udet">
      <div className="udet__perfil-header">
        <div className="udet__avatar">
          {(usuario.perfil?.nombres?.charAt(0) || usuario.nombre_usuario?.charAt(0) || "?").toUpperCase()}
        </div>
        <div className="udet__perfil-info">
          <strong className="udet__nombre">{nombreCompleto(usuario)}</strong>
          <span className={`udet__estado${usuario.activo ? "" : " udet__estado--inactivo"}`}>
            {usuario.activo ? "Activo" : "Inactivo"}
          </span>
          <span className="udet__usuario">@{usuario.nombre_usuario}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="udet__tabs">
        <button
          type="button"
          className={`udet__tab${tabActiva === "info" ? " udet__tab--activo" : ""}`}
          onClick={() => setTabActiva("info")}
        >
          <UserRound size={14} /> Información
        </button>
        <button
          type="button"
          className={`udet__tab${tabActiva === "membresia" ? " udet__tab--activo" : ""}`}
          onClick={() => setTabActiva("membresia")}
        >
          <School size={14} /> Membresía
        </button>
        <button
          type="button"
          className={`udet__tab${tabActiva === "vinculos" ? " udet__tab--activo" : ""}`}
          onClick={() => setTabActiva("vinculos")}
        >
          <Link2 size={14} /> Vínculos
        </button>
      </div>

      {tabActiva === "info" && (
        <div className="udet__form">
          <div className="udet__row">
            <div className="udet__field">
              <label className="udet__label">Nombres</label>
              <input type="text" className="udet__input" defaultValue={usuario.perfil?.nombres || ""} readOnly />
            </div>
            <div className="udet__field">
              <label className="udet__label">Apellidos</label>
              <input type="text" className="udet__input" defaultValue={usuario.perfil?.apellidos || ""} readOnly />
            </div>
          </div>

          <div className="udet__row">
            <div className="udet__field">
              <label className="udet__label">DNI</label>
              <input type="text" className="udet__input" defaultValue={usuario.perfil?.dni || ""} readOnly />
            </div>
            <div className="udet__field">
              <label className="udet__label">Usuario</label>
              <input type="text" className="udet__input" defaultValue={usuario.nombre_usuario || ""} readOnly />
            </div>
          </div>

          <div className="udet__field">
            <label className="udet__label">Correo electrónico</label>
            <input type="email" className="udet__input" defaultValue={usuario.email || ""} readOnly />
          </div>

          <div className="udet__field">
            <label className="udet__label">Fecha de alta</label>
            <input
              type="text"
              className="udet__input"
              defaultValue={
                usuario.fecha_registro
                  ? new Date(usuario.fecha_registro).toLocaleDateString("es-AR")
                  : "-"
              }
              readOnly
            />
          </div>

          <div className="udet__field">
            <label className="udet__label">Biografía</label>
            <textarea
              className="udet__textarea"
              rows="2"
              defaultValue={usuario.perfil?.biografia || ""}
              readOnly
            />
          </div>
        </div>
      )}

      {tabActiva === "membresia" && (
        <div className="udet__form">
          <div className="udet__seccion">
            <h4 className="udet__titulo-seccion">Servidores a los que pertenece</h4>
            {membresiasDeUsuario.length === 0 ? (
              <p className="udet__vacio">No pertenece a ningún servidor.</p>
            ) : (
              <ul className="udet__lista">
                {membresiasDeUsuario.map((s) => (
                  <li key={s.id_servidor} className="udet__item">
                    <School size={14} />
                    <span>{s.nombre}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="udet__seccion">
            <h4 className="udet__titulo-seccion">Roles asignados</h4>
            {rolesDeUsuario.length === 0 ? (
              <p className="udet__vacio">Sin roles asignados.</p>
            ) : (
              <ul className="udet__lista">
                {rolesDeUsuario.map((r) => (
                  <li key={r.id} className="udet__item">
                    <span className="udet__chip-rol">{r.nombre}</span>
                    <span className="udet__alcance">{r.alcance}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tabActiva === "vinculos" && (
        <div className="udet__form">
          <div className="udet__seccion">
            <h4 className="udet__titulo-seccion">Vínculos familiares</h4>
            {vinculosDelUsuario.length === 0 ? (
              <p className="udet__vacio">Sin vínculos familiares registrados.</p>
            ) : (
              <ul className="udet__lista">
                {vinculosDelUsuario.map((v) => {
                  const propio = Number(v.usuario_id) === idUsuario;
                  return (
                    <li key={v.id_relacion} className="udet__vinculo-item">
                      <div className="udet__vinculo-info">
                        <span className="udet__vinculo-tipo">
                          {TIPOS_VINCULO.find((t) => t.value === v.tipo)?.label || v.tipo}
                          {!propio && " (inverso)"}
                        </span>
                        <span className="udet__vinculo-nombre">
                          {propio ? nombreDe(v.relacionado_id) : nombreDe(v.usuario_id)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="udet__vinculo-eliminar"
                        onClick={() => handleEliminarVinculo(v.id_relacion)}
                        disabled={procesando}
                        aria-label="Eliminar vínculo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="udet__seccion">
            <h4 className="udet__titulo-seccion">Agregar vínculo</h4>
            <div className="udet__row">
              <div className="udet__field">
                <label className="udet__label">Tipo</label>
                <select
                  className="udet__input"
                  value={tipoVinculo}
                  onChange={(e) => setTipoVinculo(e.target.value)}
                >
                  {TIPOS_VINCULO.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="udet__field">
                <label className="udet__label">Usuario relacionado</label>
                <select
                  className="udet__input"
                  value={usuarioVinculo}
                  onChange={(e) => setUsuarioVinculo(e.target.value)}
                >
                  <option value="">Elegir usuario...</option>
                  {usuarios
                    .filter((u) => Number(u.id_usuario) !== idUsuario)
                    .map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {nombreCompleto(u)}
                        {u.perfil?.dni ? ` — DNI ${u.perfil.dni}` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAgregarVinculo}
              disabled={!usuarioVinculo || procesando}
            >
              <UserPlus size={14} /> Vincular
            </Button>
            {errorVinculo && <p className="udet__error">{errorVinculo}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
