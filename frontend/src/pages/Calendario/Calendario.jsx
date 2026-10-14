import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { listarRecordatorios, crearRecordatorio, actualizarRecordatorio, eliminarRecordatorio } from "../../api/calendario";
import { esDiaNoLaborable, clasificarDia, formatearFechaISO, obtenerEventoInstitucional } from "../../api/calendarioinstitucional";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import "./Calendario.css";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function Calendario() {
    const { user } = useAuth();

    const hoy = new Date();
    const [mesActual, setMesActual] = useState(hoy.getMonth());
    const [anioActual, setAnioActual] = useState(hoy.getFullYear());

    const [recordatorios, setRecordatorios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha_limite: "",
    });

    const cargarRecordatorios = async () => {
    if (!user?.id_usuario) return;
    setLoading(true);
    setError("");
    try {
        const data = await listarRecordatorios();
        if (Array.isArray(data)) {
        setRecordatorios(data.filter((r) => Number(r.usuario_id) === Number(user.id_usuario)));
        }
    } catch (err) {
        setError(err?.message || "No se pudieron cargar los recordatorios");
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    cargarRecordatorios();
    }, [user]);

    const cambiarMes = (delta) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;

    if (nuevoMes < 0) {
        nuevoMes = 11;
        nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
        nuevoMes = 0;
        nuevoAnio += 1;
    }

    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    };

    const diasDelMes = useMemo(() => {
    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const dias = [];

    for (let i = 0; i < primerDia.getDay(); i++) {
        dias.push(null);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        dias.push(new Date(anioActual, mesActual, dia));
    }

    return dias;
    }, [mesActual, anioActual]);

    const recordatoriosPorFecha = useMemo(() => {
    const mapa = {};
    recordatorios.forEach((r) => {
        if (!r.fecha_limite) return;
        const fecha = r.fecha_limite.slice(0, 10);
        if (!mapa[fecha]) mapa[fecha] = [];
        mapa[fecha].push(r);
    });
    return mapa;
    }, [recordatorios]);

    const guardarRecordatorio = async (e) => {
    e.preventDefault();
    if (!user?.id_usuario) return;

    setGuardando(true);
    setError("");

    try {
        await crearRecordatorio({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha_limite: form.fecha_limite ? `${form.fecha_limite}T00:00:00` : null,
        usuario_id: user.id_usuario,
        });

        setForm({ titulo: "", descripcion: "", fecha_limite: "" });
        setModalOpen(false);
        await cargarRecordatorios();
    } catch (err) {
        setError(err?.message || "No se pudo crear el recordatorio");
    } finally {
        setGuardando(false);
    }
    };

    const toggleCompletado = async (recordatorio) => {
    try {
        await actualizarRecordatorio(recordatorio.id_recordatorio, {
        completado: !recordatorio.completado,
        });
        await cargarRecordatorios();
    } catch (err) {
        setError(err?.message || "No se pudo actualizar el recordatorio");
    }
    };

    const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este recordatorio?")) return;

    try {
        await eliminarRecordatorio(id);
        await cargarRecordatorios();
    } catch (err) {
        setError(err?.message || "No se pudo eliminar el recordatorio");
    }
    };

    return (
    <section className="calendario">
        <div className="calendario__header">
        <h1 className="calendario__title">Calendario académico</h1>

        <div className="calendario__controls">
            <Button variant="outline" size="sm" onClick={() => cambiarMes(-1)}>
            ◀
            </Button>
            <span className="calendario__mes">
            {MESES[mesActual]} {anioActual}
            </span>
            <Button variant="outline" size="sm" onClick={() => cambiarMes(1)}>
            ▶
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
            + Recordatorio
            </Button>
        </div>
        </div>

        {error && (
        <div className="calendario__error">
            <span>{error}</span>
        </div>
        )}

        <div className="calendario__leyenda">
        <span className="leyenda-item leyenda-laborable">Laborable</span>
        <span className="leyenda-item leyenda-no-laborable">No laborable</span>
        <span className="leyenda-item leyenda-academico">Evento académico</span>
        <span className="leyenda-item leyenda-feriado">Feriado</span>
        </div>

        <div className="calendario__grid">
        {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="calendario__dia-nombre">
            {dia}
            </div>
        ))}

        {diasDelMes.map((fecha, index) => {
            if (!fecha) {
            return <div key={`empty-${index}`} className="calendario__dia calendario__dia--vacio" />;
            }

            const iso = formatearFechaISO(fecha);
            const tipo = clasificarDia(fecha);
            const eventoInstitucional = obtenerEventoInstitucional(fecha);
            const recordatoriosDia = recordatoriosPorFecha[iso] || [];

            return (
            <div
                key={iso}
                className={`calendario__dia calendario__dia--${tipo} ${
                esDiaNoLaborable(fecha) ? "calendario__dia--no-laborable" : ""
                }`}
            >
                <div className="calendario__dia-numero">
                {fecha.getDate()}
                </div>

                {eventoInstitucional && (
                <div className="calendario__evento-institucional">
                    {eventoInstitucional.titulo}
                </div>
                )}

                {recordatoriosDia.map((r) => (
                <div
                    key={r.id_recordatorio}
                    className={`calendario__recordatorio ${
                    r.completado ? "calendario__recordatorio--completado" : ""
                    }`}
                    title={r.descripcion || r.titulo}
                >
                    <button
                    type="button"
                    className="calendario__recordatorio-toggle"
                    onClick={() => toggleCompletado(r)}
                    >
                    {r.completado ? "✓" : "○"}
                    </button>
                    <span>{r.titulo}</span>
                    <button
                    type="button"
                    className="calendario__recordatorio-delete"
                    onClick={() => handleEliminar(r.id_recordatorio)}
                    >
                    ✕
                    </button>
                </div>
                ))}
            </div>
            );
        })}
        </div>

        {loading && <p>Cargando recordatorios…</p>}

        {!loading && recordatorios.length === 0 && (
        <p className="calendario__empty">
            No tenés recordatorios. Creá uno con “+ Recordatorio”.
        </p>
        )}

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
                label="Fecha límite"
                name="fecha_limite"
                type="date"
                value={form.fecha_limite}
                onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
            />

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
                </Button>
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