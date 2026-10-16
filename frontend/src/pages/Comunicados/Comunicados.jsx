import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, Search, Megaphone, Trash2, Eye, RotateCcw, Archive, Ban,
} from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import Toast from "../../components/ui/Toast/Toast";
import {
  listarComunicados, crearComunicado, eliminarComunicado,
  listarPapelera, restaurarComunicado, eliminarDefinitivo,
} from "../../api/comunicados";
import { listarDestinatarios, crearDestinatario } from "../../api/comunicadosDestinatarios";
import { listarVistos, marcarVisto } from "../../api/comunicadosVistos";
import { listarCanales } from "../../api/canales";
import { listarServidores } from "../../api/servidores";
import { listarUsuarios } from "../../api/usuarios";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import useConfirmacion from "../../hooks/useConfirmacion";
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
const MS_TOAST = 8000;

function tiempoRelativo(iso) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;

  return new Date(iso).toLocaleDateString("es-AR");
}

export default function Comunicados() {
  const { user, hasRole } = useAuth();
  const puedePublicar = hasRole(ROLES_PUEDEN_PUBLICAR);

  const { pedir, dialogo } = useConfirmacion();

  const [comunicados, setComunicados] = useState([]);
  const [papelera, setPapelera] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [vistos, setVistos] = useState([]);
  const [canales, setCanales] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [misCanales, setMisCanales] = useState([]);
  const [misServidores, setMisServidores] = useState([]);

  const [pestana, setPestana] = useState("recibidos");
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [seleccionados, setSeleccionados] = useState({ canales: [], servidores: [] });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  const idsConocidos = useRef(new Set());
  const primeraCarga = useRef(true);
  const temporizadorToast = useRef(null);

  const mostrarToast = (com) => {
    setToast(com);
    if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    temporizadorToast.current = setTimeout(() => setToast(null), MS_TOAST);
  };

  const cargarTodo = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setError("");

      const [c, pap, d, v, ca, se, us, mc, ms] = await Promise.all([
        listarComunicados(),
        listarPapelera(),
        listarDestinatarios(),
        listarVistos(),
        listarCanales(),
        listarServidores(),
        listarUsuarios(),
        listarMiembrosCanal(),
        listarMiembrosServidor(),
      ]);

      setComunicados(c);
      setPapelera(pap);
      setDestinatarios(d);
      setVistos(v);
      setCanales(ca);
      setServidores(se);
      setUsuarios(us);
      setMisCanales(mc.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.canal_id));
      setMisServidores(ms.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.servidor_id));

      if (!primeraCarga.current) {
        const nuevos = c.filter((x) => !idsConocidos.current.has(x.id_comunicado));
        if (nuevos.length > 0) {
          const recien = [...nuevos].sort(
            (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
          )[0];
          mostrarToast(recien);
        }
      }

      idsConocidos.current = new Set(c.map((x) => x.id_comunicado));
      primeraCarga.current = false;
    } catch (err) {
      if (!silencioso) setError(err.message);
    }
  };

  useEffect(() => {
    cargarTodo();
    
  }, [user?.id_usuario]);

  useEffect(() => {
    const consultar = () => {
      if (document.visibilityState === "visible") cargarTodo({ silencioso: true });
    };

    const intervalo = setInterval(consultar, 10000);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargarTodo({ silencioso: true });
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    };
    
  }, [user?.id_usuario]);

  useEffect(() => {
    if (!puedePublicar) setPestana("recibidos");
  }, [puedePublicar]);

  const nombreDe = (id) =>
    usuarios.find((u) => u.id_usuario === id)?.nombre_usuario ?? "Sistema";

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

  const vistosIds = useMemo(
    () => new Set(vistos.filter((v) => v.usuario_id === user?.id_usuario).map((v) => v.comunicado_id)),
    [vistos, user?.id_usuario]
  );

  const enviados = comunicados.filter((c) => c.publicado_por === user?.id_usuario);
  const recibidos = comunicados.filter((c) => meCorresponde(c.id_comunicado));

  const porFechaDesc = (a, b) =>
    new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);

  const enPapelera = papelera.filter((c) => c.publicado_por === user?.id_usuario);

  const listaBase = useMemo(() => {
    if (pestana === "papelera") return [...enPapelera].sort(porFechaDesc);
    const base = pestana === "enviados" ? enviados : pestana === "todos" ? comunicados : recibidos;
    return [...base].sort(porFechaDesc);
  }, [pestana, enviados, recibidos, comunicados, enPapelera]);

  const noLeidosCount = recibidos.filter((c) => !vistosIds.has(c.id_comunicado)).length;

  const filtrados = listaBase.filter((c) => {
    if (soloNoLeidos && vistosIds.has(c.id_comunicado)) return false;
    return c.titulo.toLowerCase().includes(busqueda.toLowerCase());
  });

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

    if (pestana === "recibidos" && !vistosIds.has(comunicado.id_comunicado) && user?.id_usuario) {
      marcarVisto(comunicado.id_comunicado, user.id_usuario)
        .then(() => listarVistos())
        .then(setVistos)
        .catch((err) => console.error(err));
    }
  };

  const handleEliminar = async (comunicado) => {
    const ok = await pedir({
      titulo: "Mover a la papelera",
      mensaje: `"${comunicado.titulo}" va a dejar de ser visible para todos los destinatarios. Podés restaurarlo después desde la papelera.`,
      textoConfirmar: "Mover a la papelera",
      peligro: true,
    });

    if (!ok) return;

    try {
      setError("");
      await eliminarComunicado(comunicado.id_comunicado);
      setSeleccionado(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- restaurar ----------
  const handleRestaurar = async (comunicado) => {
    const ok = await pedir({
      titulo: "Restaurar comunicado",
      mensaje: `"${comunicado.titulo}" va a volver a estar visible para todos sus destinatarios.`,
      textoConfirmar: "Restaurar",
    });

    if (!ok) return;

    try {
      setError("");
      await restaurarComunicado(comunicado.id_comunicado);
      setSeleccionado(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarDefinitivo = async (comunicado) => {
    const ok = await pedir({
      titulo: "Eliminar definitivamente",
      mensaje: `Se va a borrar "${comunicado.titulo}" para siempre, junto con sus destinatarios y registros de lectura. Esta acción NO se puede deshacer.`,
      textoConfirmar: "Eliminar para siempre",
      peligro: true,
    });

    if (!ok) return;

    try {
      setError("");
      await eliminarDefinitivo(comunicado.id_comunicado);
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

    const { canales: selCanales, servidores: selServidores } = seleccionados;
    const destinos = selServidores.length + selCanales.length;
    const alcance = destinos === 0 ? "toda la institución" : `${destinos} destino(s)`;

    const ok = await pedir({
      titulo: "Publicar comunicado",
      mensaje: `Se va a publicar "${form.titulo.trim()}" para ${alcance}. Los destinatarios lo van a ver al instante y no se puede editar el alcance una vez enviado.`,
      textoConfirmar: "Publicar",
    });

    if (!ok) return;

    setGuardando(true);

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

  const enPapeleraActual = pestana === "papelera";

  return (
    <section className="comunicados">
      <div className={`comunicados__list-panel${seleccionado ? " comunicados__list-panel--hidden-mobile" : ""}`}>
        <div className="comunicados__header">
          <h1 className="comunicados__title">
            {enPapeleraActual ? "Papelera" : "Comunicados"}
          </h1>
          {puedePublicar && !enPapeleraActual && (
            <button className="comunicados__new-btn" onClick={() => setCrearOpen(true)} aria-label="Nuevo comunicado">
              <Plus size={20} />
            </button>
          )}
        </div>

        <div className="comunicados__tabs">
          {puedePublicar && (
            <>
              <button
                className={`comunicados__tab${pestana === "enviados" ? " comunicados__tab--active" : ""}`}
                onClick={() => cambiarPestana("enviados")}
              >
                Enviados <span>({enviados.length})</span>
              </button>

              <button
                className={`comunicados__tab${pestana === "papelera" ? " comunicados__tab--active" : ""}`}
                onClick={() => cambiarPestana("papelera")}
              >
                Papelera <span>({enPapelera.length})</span>
              </button>
            </>
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

        <div className="comunicados__filtros">
          <div className="comunicados__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar comunicado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {!enPapeleraActual && noLeidosCount > 0 && (
            <button
              className={`comunicados__filtro${soloNoLeidos ? " comunicados__filtro--activo" : ""}`}
              onClick={() => setSoloNoLeidos((v) => !v)}
            >
              Solo no leídos ({noLeidosCount})
            </button>
          )}
        </div>

        {error && <p className="comunicados__empty">{error}</p>}

        <div className="comunicados__list">
          {filtrados.length === 0 && (
            <p className="comunicados__empty">
              {enPapeleraActual ? "La papelera está vacía." : "No hay comunicados."}
            </p>
          )}

          {filtrados.map((c) => {
            const sinLeer = !enPapeleraActual && !vistosIds.has(c.id_comunicado);

            return (
              <button
                key={c.id_comunicado}
                className={`comunicados__item${seleccionado?.id_comunicado === c.id_comunicado ? " comunicados__item--active" : ""}${sinLeer ? " comunicados__item--unread" : ""}${enPapeleraActual ? " comunicados__item--archivado" : ""}`}
                onClick={() => handleAbrir(c)}
              >
                <div className="comunicados__item-icon">
                  {enPapeleraActual ? <Archive size={18} /> : <Megaphone size={18} />}
                </div>
                <div className="comunicados__item-content">
                  <div className="comunicados__item-top">
                    <span className="comunicados__item-title">{c.titulo}</span>
                    <Badge variant={TIPO_VARIANT[c.tipo]}>{c.tipo}</Badge>
                  </div>
                  <p className="comunicados__item-snippet">{c.contenido}</p>
                  <span className="comunicados__item-meta">
                    {nombreDe(c.publicado_por)} · {tiempoRelativo(c.fecha_publicacion)}
                  </span>
                </div>
                {sinLeer && pestana === "recibidos" && (
                  <span className="comunicados__punto" aria-label="No leído" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`comunicados__detail-panel${seleccionado ? " comunicados__detail-panel--visible-mobile" : ""}`}>
        {seleccionado ? (
          <div className="comunicados__detail">
            <button className="comunicados__back" onClick={() => setSeleccionado(null)}>← Volver</button>

            {enPapeleraActual && (
              <div className="comunicados__aviso-papelera">
                <Archive size={15} /> Este comunicado está en la papelera. No es visible para los destinatarios.
              </div>
            )}

            <div className="comunicados__detail-header">
              <h2>{seleccionado.titulo}</h2>
              <Badge variant={TIPO_VARIANT[seleccionado.tipo]}>{seleccionado.tipo}</Badge>
            </div>

            <p className="comunicados__detail-meta">
              Publicado por {nombreDe(seleccionado.publicado_por)} ·{" "}
              {new Date(seleccionado.fecha_publicacion).toLocaleString("es-AR")}
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
              <div className="comunicados__acciones-detalle">
                {enPapeleraActual ? (
                  <>
                    <button
                      className="comunicados__btn-restaurar"
                      onClick={() => handleRestaurar(seleccionado)}
                    >
                      <RotateCcw size={16} /> Restaurar
                    </button>
                    <button
                      className="comunicados__eliminar"
                      onClick={() => handleEliminarDefinitivo(seleccionado)}
                    >
                      <Ban size={16} /> Borrar definitivamente
                    </button>
                  </>
                ) : (
                  <button className="comunicados__eliminar" onClick={() => handleEliminar(seleccionado)}>
                    <Trash2 size={16} /> Mover a la papelera
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="comunicados__empty-state">
            {enPapeleraActual ? <Archive size={48} /> : <Megaphone size={48} />}
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

      {toast && (
        <Toast
          titulo="Nuevo comunicado"
          detalle={toast.titulo}
          onAccion={() => {
            handleAbrir(toast);
            setPestana("recibidos");
            setToast(null);
          }}
          onCerrar={() => setToast(null)}
        />
      )}

      {dialogo}
    </section>
  );
}