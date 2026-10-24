import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    listarRecordatorios,
    crearRecordatorio,
    actualizarRecordatorio,
    eliminarRecordatorio,
} from "../../api/calendario";
import { listarComunicados } from "../../api/comunicados";
import { listarDestinatarios } from "../../api/comunicadosDestinatarios";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import {
    esDiaNoLaborable,
    clasificarDia,
    formatearFechaISO,
    obtenerEventoInstitucional,
} from "../../api/calendarioinstitucional";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import BotonVolver from "../../components/ui/BotonVolver/BotonVolver";
import "./Calendario.css";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const REGEX_SIN_CLASES =
    /sin clases|no hay clases|clases suspendidas|no se cursa|suspensi[oó]n|no habra clases/i;

export default function Calendario() {
    const { user, hasRole } = useAuth();

    const hoy = new Date();
    const [mesActual, setMesActual] = useState(hoy.getMonth());
    const [anioActual, setAnioActual] = useState(hoy.getFullYear());
    const [diaSeleccionado, setDiaSeleccionado] = useState(formatearFechaISO(hoy));

    const [recordatorios, setRecordatorios] = useState([]);
    const [comunicados, setComunicados] = useState([]);
    const [destinatarios, setDestinatarios] = useState([]);
    const [miembrosCanal, setMiembrosCanal] = useState([]);
    const [miembrosServidor, setMiembrosServidor] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [form, setForm] = useState({ titulo: "", descripcion: "", fecha_limite: "" });

    useEffect(() => {
    let cancelado = false;

    async function cargar() {
        setLoading(true);
        setError("");
        try {
        const [resRec, resCom, resDest, resMc, resMs] = await Promise.all([
            listarRecordatorios(),
            listarComunicados(),
            listarDestinatarios(),
            listarMiembrosCanal(),
            listarMiembrosServidor(),
        ]);
        if (cancelado) return;

        setRecordatorios(resRec || []);
        setComunicados(resCom || []);
        setDestinatarios(resDest || []);
        setMiembrosCanal(resMc || []);
        setMiembrosServidor(resMs || []);
        } catch (err) {
        if (!cancelado) setError(err?.message || "No se pudieron cargar los datos");
        } finally {
        if (!cancelado) setLoading(false);
        }
    }

    cargar();
    return () => { cancelado = true; };
    }, []);

    const comunicadosRelevantes = useMemo(() => {
    if (!user) return [];
    if (hasRole(["super_admin", "admin"])) return comunicados;

    const misCanales = miembrosCanal
        .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
        .map((m) => Number(m.canal_id));

    const misServidores = miembrosServidor
        .filter((m) => Number(m.usuario_id) === Number(user.id_usuario) && m.activo !== false)
        .map((m) => Number(m.servidor_id));

    return comunicados.filter((c) => {
        const destinos = destinatarios.filter(
        (d) => Number(d.comunicado_id) === Number(c.id_comunicado)
        );
        if (destinos.length === 0) return true;
        return destinos.some(
        (d) =>
            (d.usuario_id && Number(d.usuario_id) === Number(user.id_usuario)) ||
            (d.canal_id && misCanales.includes(Number(d.canal_id))) ||
            (d.servidor_id && misServidores.includes(Number(d.servidor_id)))
        );
    });
    }, [comunicados, destinatarios, miembrosCanal, miembrosServidor, user, hasRole]);

    const eventosPorFecha = useMemo(() => {
    const mapa = {};

    const agregar = (fecha, evento) => {
        if (!fecha) return;
        const key = String(fecha).slice(0, 10);
        if (!mapa[key]) mapa[key] = [];
        mapa[key].push(evento);
    };

    recordatorios
        .filter((r) => Number(r.usuario_id) === Number(user?.id_usuario))
        .forEach((r) =>
        agregar(r.fecha_limite, {
            id: r.id_recordatorio,
            tipo: "recordatorio",
            titulo: r.titulo,
            descripcion: r.descripcion,
            completado: r.completado,
        })
        );

    comunicadosRelevantes.forEach((c) => {
        const texto = `${c.titulo || ""} ${c.contenido || ""}`;
        agregar(c.fecha_evento || c.fecha_publicacion, {
        id: c.id_comunicado,
        tipo: "comunicado",
        titulo: c.titulo,
        descripcion: c.contenido,
        esEvento: !!c.fecha_evento,
        sinClases: REGEX_SIN_CLASES.test(texto),
        });
    });

    return mapa;
    }, [recordatorios, comunicadosRelevantes, user]);

    const diasSinClases = useMemo(() => {
    const set = new Set();
    comunicadosRelevantes.forEach((c) => {
        if (!c.fecha_evento) return;
        const texto = `${c.titulo || ""} ${c.contenido || ""}`;
        if (!REGEX_SIN_CLASES.test(texto)) return;
        set.add(String(c.fecha_evento).slice(0, 10));
    });
    return set;
    }, [comunicadosRelevantes]);

    const diasDelMes = useMemo(() => {
    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const dias = [];

    for (let i = 0; i < primerDia.getDay(); i++) dias.push(null);
    for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(anioActual, mesActual, d));
    return dias;
    }, [mesActual, anioActual]);

    const cambiarMes = (delta) => {
    let m = mesActual + delta;
    let a = anioActual;
    if (m < 0) { m = 11; a -= 1; }
    if (m > 11) { m = 0; a += 1; }
    setMesActual(m);
    setAnioActual(a);
    };

    const guardarRecordatorio = async (e) => {
    e.preventDefault();
    if (!user?.id_usuario) return;
    setGuardando(true);
    setError("");
    try {
        await crearRecordatorio({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha_limite: form.fecha_limite ? `${form.fecha_limite}T09:00:00` : null,
        usuario_id: user.id_usuario,
        });
        setForm({ titulo: "", descripcion: "", fecha_limite: "" });
        setModalOpen(false);
        setRecordatorios(await listarRecordatorios());
    } catch (err) {
        setError(err?.message || "No se pudo crear el recordatorio");
    } finally {
        setGuardando(false);
    }
    };

    const toggleCompletado = async (rec) => {
    try {
        await actualizarRecordatorio(rec.id, { completado: !rec.completado });
        setRecordatorios(await listarRecordatorios());
    } catch (err) {
        setError(err?.message || "No se pudo actualizar el recordatorio");
    }
    };

    const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este recordatorio?")) return;
    try {
        await eliminarRecordatorio(id);
        setRecordatorios(await listarRecordatorios());
    } catch (err) {
        setError(err?.message || "No se pudo eliminar el recordatorio");
    }
    };

    const eventosDelDia = eventosPorFecha[diaSeleccionado] || [];

    return (
    <section className="calendario">
        <div className="calendario__wrap">
        <div className="calendario__header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <BotonVolver to="/" label="Volver" />
            <div>
                <h1 className="calendario__title">Calendario académico</h1>
                <p className="calendario__subtitle">
                Feriados, eventos institucionales, recordatorios y comunicados
                </p>
            </div>
            </div>

            <div className="calendario__controls">
            <Button variant="outline" size="sm" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">◀</Button>
            <span className="calendario__mes">{MESES[mesActual]} {anioActual}</span>
            <Button variant="outline" size="sm" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">▶</Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>+ Recordatorio</Button>
            </div>
        </div>

        {error && <div className="calendario__error"><span>{error}</span></div>}

        <div className="calendario__leyenda">
            <span className="leyenda-item leyenda-laborable">Laborable</span>
            <span className="leyenda-item leyenda-no-laborable">No laborable</span>
            <span className="leyenda-item leyenda-sinclases">Sin clases</span>
            <span className="leyenda-item leyenda-institucional">Evento institucional</span>
            <span className="leyenda-item leyenda-comunicado">Comunicado</span>
            <span className="leyenda-item leyenda-recordatorio">Recordatorio</span>
        </div>

        <div className="calendario__layout">
            <div className="calendario__grid">
            {DIAS_SEMANA.map((d) => (
                <div key={d} className="calendario__dia-nombre">{d}</div>
            ))}

            {diasDelMes.map((fecha, index) => {
                if (!fecha) {
                return <div key={`vacio-${index}`} className="calendario__dia calendario__dia--vacio" />;
                }

                const iso = formatearFechaISO(fecha);
                const institucional = obtenerEventoInstitucional(fecha);
                const sinClases = diasSinClases.has(iso);
                const noLaborable = esDiaNoLaborable(fecha) || sinClases;
                const tipo = sinClases ? "sinclases" : clasificarDia(fecha);
                const eventos = eventosPorFecha[iso] || [];
                const esHoy = iso === formatearFechaISO(hoy);

                return (
                <button
                    key={iso}
                    type="button"
                    onClick={() => setDiaSeleccionado(iso)}
                    className={[
                    "calendario__dia",
                    `calendario__dia--${tipo}`,
                    noLaborable ? "calendario__dia--nolaborable" : "",
                    esHoy ? "calendario__dia--hoy" : "",
                    iso === diaSeleccionado ? "calendario__dia--seleccionado" : "",
                    ].join(" ").trim()}
                >
                    <span className="calendario__dia-numero">{fecha.getDate()}</span>

                    {institucional && (
                    <span className="calendario__tag calendario__tag--institucional">
                        {institucional.titulo}
                    </span>
                    )}

                    {sinClases && (
                    <span className="calendario__tag calendario__tag--sinclases">Sin clases</span>
                    )}

                    {eventos.slice(0, 2).map((ev) => (
                    <span key={`${ev.tipo}-${ev.id}`} className={`calendario__tag calendario__tag--${ev.tipo}`}>
                        {ev.titulo}
                    </span>
                    ))}

                    {eventos.length > 2 && (
                    <span className="calendario__mas">+{eventos.length - 2} más</span>
                    )}
                </button>
                );
            })}
            </div>

            <aside className="calendario__agenda">
            <h3 className="calendario__agenda-title">
                {new Date(`${diaSeleccionado}T00:00:00`).toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                })}
            </h3>

            {loading && <p className="calendario__empty">Cargando…</p>}

            {!loading && eventosDelDia.length === 0 && (
                <p className="calendario__empty">No hay eventos para este día.</p>
            )}

            <ul className="calendario__agenda-list">
                {eventosDelDia.map((ev) => (
                <li key={`${ev.tipo}-${ev.id}`} className="calendario__agenda-item">
                    <span className={`calendario__punto calendario__punto--${ev.tipo}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{ev.titulo}</strong>
                    {ev.descripcion && <p className="calendario__agenda-desc">{ev.descripcion}</p>}
                    <span className="calendario__agenda-tipo">
                        {ev.tipo === "comunicado"
                        ? (ev.esEvento ? "Comunicado con fecha de evento" : "Comunicado")
                        : "Recordatorio personal"}
                    </span>
                    {ev.tipo === "comunicado" && ev.sinClases && (
                        <span className="calendario__tag calendario__tag--sinclases">Sin clases</span>
                    )}
                    </div>

                    {ev.tipo === "recordatorio" && (
                    <div style={{ display: "flex", gap: "4px" }}>
                        <Button size="sm" variant="outline" onClick={() => toggleCompletado(ev)}>
                        {ev.completado ? "✓" : "○"}
                        </Button>
                        <Button size="sm" onClick={() => eliminar(ev.id)}>✕</Button>
                    </div>
                    )}
                </li>
                ))}
            </ul>
            </aside>
        </div>
        </div>

        {modalOpen && (
        <Modal title="Nuevo recordatorio" onClose={() => setModalOpen(false)}>
            <form className="calendario__form" onSubmit={guardarRecordatorio}>
            <Input
                label="Título"
                name="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Entrega de TP"
            />
            <Input
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalle opcional"
            />
            <Input
                label="Fecha"
                name="fecha_limite"
                type="date"
                value={form.fecha_limite}
                onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
            />

            <div className="calendario__form-actions">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Crear"}
                </Button>
            </div>
            </form>
        </Modal>
        )}
    </section>
    );
}