import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Megaphone, MessageCircle, Bell, Plus, Check, Trash2, ChevronRight, Loader2,
} from "lucide-react";
import { listarRecordatorios, crearRecordatorio, actualizarRecordatorio, eliminarRecordatorio } from "../../api/recordatorios";
import { listarComunicados } from "../../api/comunicados";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import { listarServidores } from "../../api/servidores";
import useComunicadosNoLeidos from "../../hooks/useComunicadosNoLeidos";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import "./Dashboard.css";

const accesos = [
  { key: "calendario", label: "Calendario", desc: "Eventos y fechas", icon: Calendar },
  { key: "comunicados", label: "Comunicados", desc: "Avisos del colegio", icon: Megaphone },
  { key: "mensajes", label: "Mensajes", desc: "Chats y directos", icon: MessageCircle },
];

const formVacio = { titulo: "", descripcion: "", fecha_limite: "" };

const formatearFecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : null);

const iniciales = (nombre = "") => nombre.slice(0, 2).toUpperCase();

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalNoLeidos, setTotalNoLeidos } = useNotificaciones();

  const noLeidos = useComunicadosNoLeidos();

  const [recordatorios, setRecordatorios] = useState([]);
  const [comunicados, setComunicados] = useState([]);
  const [servidor, setServidor] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    const cargar = async () => {
      try {
        setError("");

        const [todosRec, todosCom, miembros, servidores] = await Promise.all([
          listarRecordatorios(),
          listarComunicados(),
          listarMiembrosServidor(),
          listarServidores(),
        ]);
        if (!vivo) return;

        setRecordatorios(todosRec.filter((r) => r.usuario_id === user?.id_usuario));

        const miServidorId = miembros.find((m) => m.usuario_id === user?.id_usuario)?.servidor_id;
        if (miServidorId) {
          setServidor(servidores.find((s) => s.id_servidor === miServidorId) ?? null);
        }

        setComunicados(
          [...todosCom]
            .sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion))
            .slice(0, 4)
        );
      } catch (err) {
        if (vivo) setError(err.message);
      } finally {
        if (vivo) setCargando(false);
      }
    };

    if (user?.id_usuario) cargar();

    return () => {
      vivo = false;
    };
  }, [user?.id_usuario]);

  const pendientes = recordatorios.filter((r) => !r.completado);
  const completados = recordatorios.filter((r) => r.completado);
  const misRoles = user?.roles?.map((r) => r.nombre) ?? [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCrear = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }

    try {
      const nuevo = await crearRecordatorio({
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        fecha_limite: form.fecha_limite || null,
        usuario_id: user?.id_usuario,
      });
      setRecordatorios((prev) => [nuevo, ...prev]);
      setForm(formVacio);
      setAgregando(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (r) => {
    try {
      setError("");
      const act = await actualizarRecordatorio(r.id_recordatorio, { completado: !r.completado });
      setRecordatorios((prev) => prev.map((x) => (x.id_recordatorio === r.id_recordatorio ? act : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async (r) => {
    if (!window.confirm(`¿Eliminar el recordatorio "${r.titulo}"?`)) return;
    try {
      setError("");
      await eliminarRecordatorio(r.id_recordatorio);
      setRecordatorios((prev) => prev.filter((x) => x.id_recordatorio !== r.id_recordatorio));
    } catch (err) {
      setError(err.message);
    }
  };

  const irAMensajes = () => {
    setTotalNoLeidos(0);
    navigate("/mensajes");
  };

  return (
    <section className="dashboard">
      {/* --- Hero --- */}
      <header className="dash-hero">
        <span className="dash-hero__blob dash-hero__blob--1" aria-hidden="true" />
        <span className="dash-hero__blob dash-hero__blob--2" aria-hidden="true" />
        <span className="dash-hero__blob dash-hero__blob--3" aria-hidden="true" />

        <div className="dash-hero__info">
          <p className="dash-hero__saludo">Panel de inicio</p>
          <h1 className="dash-hero__nombre">Hola, {user?.nombre_usuario ?? "..."}</h1>
          <div className="dash-hero__meta">
            {misRoles.length > 0 && <span className="dash-hero__tag">{misRoles.join(" · ")}</span>}
            {servidor && <span className="dash-hero__tag">{servidor.nombre}</span>}
          </div>
        </div>

        <div className="dash-hero__avatar">{iniciales(user?.nombre_usuario)}</div>
      </header>

      {error && <div className="dash-alert">{error}</div>}

      {cargando ? (
        <div className="dash-loading">
          <Loader2 size={20} className="dash-spinner" /> Cargando...
        </div>
      ) : (
        <div className="dash-grid">
          {/* --- Accesos rápidos --- */}
          <section className="dash-card">
            <h2 className="dash-card__titulo">Accesos rápidos</h2>

            <div className="dash-accesos">
              {accesos.map(({ key, label, desc, icon: Icon }) => {
                const onClickAcceso = key === "mensajes" ? irAMensajes : () => navigate(`/${key}`);
                
                return (
                  <button key={key} className="dash-acceso" onClick={onClickAcceso}>
                    <span className="dash-acceso__icon">
                      <Icon size={22} />
                      
                      {/* Badge para Comunicados */}
                      {key === "comunicados" && noLeidos > 0 && (
                        <span className="dash-acceso__badge">{noLeidos}</span>
                      )}
                      
                      {/* Badge para Mensajes (Ahora usa la misma clase) */}
                      {key === "mensajes" && totalNoLeidos > 0 && (
                        <span className="dash-acceso__badge">
                          {totalNoLeidos > 9 ? "+9" : totalNoLeidos}
                        </span>
                      )}
                    </span>
                    <span className="dash-acceso__texto">
                      <span className="dash-acceso__label">{label}</span>
                      <span className="dash-acceso__desc">{desc}</span>
                    </span>
                    <ChevronRight size={18} className="dash-acceso__chev" />
                  </button>
                );
              })}
            </div>

            <div className="dash-comunicados">
              <h3 className="dash-subtitulo">Últimos comunicados</h3>
              {comunicados.length === 0 ? (
                <p className="dash-vacio">No hay comunicados.</p>
              ) : (
                comunicados.map((c) => (
                  <button
                    key={c.id_comunicado}
                    className="dash-comunicado"
                    onClick={() => navigate("/comunicados")}
                  >
                    <span className="dash-comunicado__titulo">{c.titulo}</span>
                    <span className="dash-comunicado__meta">
                      {formatearFecha(c.fecha_publicacion)} · {c.tipo}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* --- Recordatorios --- */}
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__titulo">Recordatorios</h2>
              <button
                className="dash-add"
                onClick={() => setAgregando((p) => !p)}
                aria-label="Agregar recordatorio"
              >
                <Plus size={17} />
              </button>
            </div>

            {agregando && (
              <form className="dash-form" onSubmit={handleCrear}>
                <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título" />
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción (opcional)"
                />
                <input
                  type="date"
                  name="fecha_limite"
                  value={form.fecha_limite}
                  onChange={handleChange}
                />
                <div className="dash-form__acciones">
                  <button type="button" onClick={() => setAgregando(false)}>Cancelar</button>
                  <button type="submit">Agregar</button>
                </div>
              </form>
            )}

            {pendientes.length === 0 && !agregando && (
              <p className="dash-vacio">Todo al día. No tenés recordatorios pendientes.</p>
            )}

            <div className="dash-recs">
              {pendientes.map((r) => (
                <div key={r.id_recordatorio} className="dash-rec">
                  <div className="dash-rec__main">
                    <span className="dash-rec__titulo">{r.titulo}</span>
                    {r.descripcion && <span className="dash-rec__desc">{r.descripcion}</span>}
                    {r.fecha_limite && (
                      <span className="dash-rec__fecha">Vence {formatearFecha(r.fecha_limite)}</span>
                    )}
                  </div>
                  <div className="dash-rec__acciones">
                    <button className="dash-rec__btn" onClick={() => handleToggle(r)} title="Completar">
                      <Check size={15} />
                    </button>
                    <button
                      className="dash-rec__btn dash-rec__btn--danger"
                      onClick={() => handleEliminar(r)}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {completados.length > 0 && (
              <div className="dash-hechos">
                <h3 className="dash-subtitulo">Completados ({completados.length})</h3>
                {completados.map((r) => (
                  <div key={r.id_recordatorio} className="dash-rec dash-rec--hecho">
                    <span className="dash-rec__titulo">{r.titulo}</span>
                    <button className="dash-rec__btn" onClick={() => handleToggle(r)} title="Desmarcar">
                      <Check size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}