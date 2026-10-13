import { useState, useEffect } from "react";
import { Plus, Search, Megaphone, Trash2, Eye } from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import { listarComunicados, crearComunicado, eliminarComunicado } from "../../api/comunicados";
import { listarDestinatarios, crearDestinatario } from "../../api/comunicadosDestinatarios";
import { listarVistos, marcarVisto } from "../../api/comunicadosVistos";
import { listarCanales } from "../../api/canales";
import { listarServidores } from "../../api/servidores";
import { listarUsuarios } from "../../api/usuarios";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import { useAuth } from "../../context/AuthContext";
import "./Comunicados.css";

const ROLES_PUEDEN_PUBLICAR = ["super_admin", "admin", "director", "profesor", "preceptor"];

const TIPO_VARIANT = {
  global: "danger",
  servidor: "warning",
  canal: "default",
  usuario: "success",
};

const formVacio = { titulo: "", contenido: "" };

const formatearFecha = (iso) => new Date(iso).toLocaleDateString("es-AR");

export default function Comunicados() {
  const { user, hasRole } = useAuth();
  const puedePublicar = hasRole(ROLES_PUEDEN_PUBLICAR);

  const [comunicados, setComunicados] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [vistos, setVistos] = useState([]);
  const [canales, setCanales] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [misCanales, setMisCanales] = useState([]);
  const [misServidores, setMisServidores] = useState([]);

  const [pestana, setPestana] = useState("enviados");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [seleccionados, setSeleccionados] = useState({ canales: [], servidores: [] });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarTodo = async () => {
    try {
      setError("");
      const [c, d, v, ca, se, us, mc, ms] = await Promise.all([
        listarComunicados(),
        listarDestinatarios(),
        listarVistos(),
        listarCanales(),
        listarServidores(),
        listarUsuarios(),
        listarMiembrosCanal(),
        listarMiembrosServidor(),
      ]);
      setComunicados(c);
      setDestinatarios(d);
      setVistos(v);
      setCanales(ca);
      setServidores(se);
      setUsuarios(us);

      setMisCanales(mc.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.canal_id));
      setMisServidores(ms.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.servidor_id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarTodo();
  
  }, [user?.id_usuario]);

  useEffect(() => {
    if (!puedePublicar) setPestana("recibidos");
  }, [puedePublicar]);

  const nombreDe = (id) =>
    usuarios.find((u) => u.id_usuario === id)?.nombre_usuario ?? "Sistema";

  // Traduce un destinatario (canal / servidor / usuario) a su nombre
  const nombreDestino = (d) => {
    if (d.canal_id) return canales.find((c) => c.id_canal === d.canal_id)?.nombre ?? `Canal ${d.canal_id}`;
    if (d.servidor_id) return servidores.find((s) => s.id_servidor === d.servidor_id)?.nombre ?? `Servidor ${d.servidor_id}`;
    if (d.usuario_id) return usuarios.find((u) => u.id_usuario === d.usuario_id)?.nombre_usuario ?? `Usuario ${d.usuario_id}`;
    return "Todos";
  };

  const meCorresponde = (comunicadoId) => {
    const destinos = destinatarios.filter((d) => d.comunicado_id === comunicadoId);

    if (destinos.length === 0) return true;

    return destinos.some(
      (d) =>
        d.usuario_id === user?.id_usuario ||
        (d.canal_id && misCanales.includes(d.canal_id)) ||
        (d.servidor_id && misServidores.includes(d.servidor_id))
    );
  };

  const vistosIds = new Set(
    vistos.filter((v) => v.usuario_id === user?.id_usuario).map((v) => v.comunicado_id)
  );

  const enviados = comunicados.filter((c) => c.publicado_por === user?.id_usuario);
  const recibidos = comunicados.filter((c) => meCorresponde(c.id_comunicado));

  const listaBase =
    pestana === "enviados" ? enviados : pestana === "todos" ? comunicados : recibidos;

  const filtrados = listaBase.filter((c) =>
    c.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Destinos y lectores del comunicado que está abierto
  const destinosSel = seleccionado
    ? destinatarios.filter((d) => d.comunicado_id === seleccionado.id_comunicado)
    : [];

  const lectoresSel = seleccionado
    ? vistos
        .filter((v) => v.comunicado_id === seleccionado.id_comunicado)
        .map((v) => nombreDe(v.usuario_id))
    : [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleDestino = (tipo, id) => {
    setSeleccionados((prev) => ({
      ...prev,
      [tipo]: prev[tipo].includes(id) ? prev[tipo].filter((x) => x !== id) : [...prev[tipo], id],
    }));
  };

  const handleAbrir = (comunicado) => {
    setSeleccionado(comunicado);

    if (pestana === "recibidos" && !vistosIds.has(comunicado.id_comunicado)) {
      marcarVisto(comunicado.id_comunicado, user?.id_usuario)
        .then(() => listarVistos())
        .then(setVistos)
        .catch((err) => console.error(err));
    }
  };

  const handleEliminar = async (comunicado) => {
    if (!window.confirm(`¿Eliminar el comunicado "${comunicado.titulo}"?`)) return;

    try {
      setError("");
      await eliminarComunicado(comunicado.id_comunicado);
      setSeleccionado(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!puedePublicar) return;

    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("El título y el contenido son obligatorios");
      return;
    }

    setGuardando(true);

    const { canales: selCanales, servidores: selServidores } = seleccionados;
    let tipo = "global";
    if (selCanales.length && !selServidores.length) tipo = "canal";
    else if (selServidores.length && !selCanales.length) tipo = "servidor";

    try {
      const nuevo = await crearComunicado({
        titulo: form.titulo,
        contenido: form.contenido,
        tipo,
        publicado_por: user?.id_usuario,
      });

      for (const canalId of selCanales) {
        await crearDestinatario({ comunicado_id: nuevo.id_comunicado, canal_id: canalId });
      }
      for (const servidorId of selServidores) {
        await crearDestinatario({ comunicado_id: nuevo.id_comunicado, servidor_id: servidorId });
      }

      await cargarTodo();
      setForm(formVacio);
      setSeleccionados({ canales: [], servidores: [] });
      setCrearOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPestana = (p) => {
    setPestana(p);
    setSeleccionado(null);
  };

  return (
    <section className="comunicados">
      <div className={`comunicados__list-panel${seleccionado ? " comunicados__list-panel--hidden-mobile" : ""}`}>
        <div className="comunicados__header">
          <h1 className="comunicados__title">Comunicados</h1>
          {puedePublicar && (
            <button className="comunicados__new-btn" onClick={() => setCrearOpen(true)} aria-label="Nuevo comunicado">
              <Plus size={20} />
            </button>
          )}
        </div>

        <div className="comunicados__tabs">
          {puedePublicar && (
            <button
              className={`comunicados__tab${pestana === "enviados" ? " comunicados__tab--active" : ""}`}
              onClick={() => cambiarPestana("enviados")}
            >
              Enviados <span>({enviados.length})</span>
            </button>
          )}
          <button
            className={`comunicados__tab${pestana === "recibidos" ? " comunicados__tab--active" : ""}`}
            onClick={() => cambiarPestana("recibidos")}
          >
            Recibidos <span>({recibidos.length})</span>
          </button>
          {puedePublicar && (
            <button
              className={`comunicados__tab${pestana === "todos" ? " comunicados__tab--active" : ""}`}
              onClick={() => cambiarPestana("todos")}
            >
              Todos <span>({comunicados.length})</span>
            </button>
          )}
        </div>

        <div className="comunicados__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar comunicado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {error && <p className="comunicados__empty">{error}</p>}

        <div className="comunicados__list">
          {filtrados.length === 0 && <p className="comunicados__empty">No hay comunicados.</p>}

          {filtrados.map((c) => {
            const sinLeer = pestana === "recibidos" && !vistosIds.has(c.id_comunicado);

            return (
              <button
                key={c.id_comunicado}
                className={`comunicados__item${seleccionado?.id_comunicado === c.id_comunicado ? " comunicados__item--active" : ""}${sinLeer ? " comunicados__item--unread" : ""}`}
                onClick={() => handleAbrir(c)}
              >
                <div className="comunicados__item-icon"><Megaphone size={18} /></div>
                <div className="comunicados__item-content">
                  <div className="comunicados__item-top">
                    <span className="comunicados__item-title">{c.titulo}</span>
                    <Badge variant={TIPO_VARIANT[c.tipo]}>{c.tipo}</Badge>
                  </div>
                  <p className="comunicados__item-snippet">{c.contenido}</p>
                  <span className="comunicados__item-meta">
                    {nombreDe(c.publicado_por)} · {formatearFecha(c.fecha_publicacion)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`comunicados__detail-panel${seleccionado ? " comunicados__detail-panel--visible-mobile" : ""}`}>
        {seleccionado ? (
          <div className="comunicados__detail">
            <button className="comunicados__back" onClick={() => setSeleccionado(null)}>← Volver</button>

            <div className="comunicados__detail-header">
              <h2>{seleccionado.titulo}</h2>
              <Badge variant={TIPO_VARIANT[seleccionado.tipo]}>{seleccionado.tipo}</Badge>
            </div>

            <p className="comunicados__detail-meta">
              Publicado por {nombreDe(seleccionado.publicado_por)} ·{" "}
              {formatearFecha(seleccionado.fecha_publicacion)}
            </p>

            <p className="comunicados__detail-body">{seleccionado.contenido}</p>

            <div className="comunicados__info">
              <span className="comunicados__info-titulo">Enviado a</span>
              {destinosSel.length === 0 ? (
                <p className="comunicados__info-texto">Toda la institución</p>
              ) : (
                <div className="comunicados__chips">
                  {destinosSel.map((d) => (
                    <span key={d.id_comunicado_destinatario} className="comunicados__chip">
                      {nombreDestino(d)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {puedePublicar && (
              <div className="comunicados__info">
                <span className="comunicados__info-titulo">
                  <Eye size={13} /> Visto por {lectoresSel.length}{" "}
                  {lectoresSel.length === 1 ? "persona" : "personas"}
                </span>

                {lectoresSel.length === 0 ? (
                  <p className="comunicados__info-texto">Todavía nadie lo abrió</p>
                ) : (
                  <div className="comunicados__chips">
                    {lectoresSel.map((nombre, i) => (
                      <span key={i} className="comunicados__chip comunicados__chip--visto">
                        {nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {puedePublicar && (
              <button className="comunicados__eliminar" onClick={() => handleEliminar(seleccionado)}>
                <Trash2 size={16} /> Eliminar comunicado
              </button>
            )}
          </div>
        ) : (
          <div className="comunicados__empty-state">
            <Megaphone size={48} />
            <p>Seleccioná un comunicado para leerlo</p>
          </div>
        )}
      </div>

      {crearOpen && puedePublicar && (
        <Modal title="Nuevo comunicado" onClose={() => setCrearOpen(false)}>
          <form className="comunicados__form" onSubmit={handleSubmit}>
            <Input
              label="Título"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Reserva matrícula 2027"
            />

            <label className="comunicados__label" htmlFor="contenido">Contenido</label>
            <textarea
              id="contenido"
              name="contenido"
              className="comunicados__textarea"
              rows={5}
              value={form.contenido}
              onChange={handleChange}
              placeholder="Escribí el cuerpo del comunicado..."
            />

            <div className="comunicados__grupo">
              <span className="comunicados__label">A quién enviar</span>

              <span className="comunicados__grupo-sub">Canales</span>
              <div className="comunicados__destinos">
                {canales.map((c) => (
                  <label key={c.id_canal} className="comunicados__destino">
                    <input
                      type="checkbox"
                      checked={seleccionados.canales.includes(c.id_canal)}
                      onChange={() => toggleDestino("canales", c.id_canal)}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>

              <span className="comunicados__grupo-sub">Servidores</span>
              <div className="comunicados__destinos">
                {servidores.map((s) => (
                  <label key={s.id_servidor} className="comunicados__destino">
                    <input
                      type="checkbox"
                      checked={seleccionados.servidores.includes(s.id_servidor)}
                      onChange={() => toggleDestino("servidores", s.id_servidor)}
                    />
                    {s.nombre}
                  </label>
                ))}
              </div>

              <p className="comunicados__hint">
                Si no seleccionás ninguno, el comunicado es global.
              </p>
            </div>

            {error && <p className="comunicados__empty">{error}</p>}

            <div className="comunicados__form-actions">
              <Button type="button" variant="outline" onClick={() => setCrearOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}