export const FERIADOS_NACIONALES = [
    "2026-01-01",
    "2026-03-24",
    "2026-04-02",
    "2026-04-03",
    "2026-05-01",
    "2026-05-25",
    "2026-06-15",
    "2026-06-20",
    "2026-07-09",
    "2026-08-17",
    "2026-10-12",
    "2026-11-20",
    "2026-12-08",
    "2026-12-25",
];

export const CRONOGRAMA_INSTITUCIONAL = [
    {
    fecha: "2026-08-03",
    tipo: "academico",
    titulo: "Inicio de clases",
    descripcion: "Comienzo del cuatrimestre",
    laborable: true,
    },
    {
    fecha: "2026-09-18",
    tipo: "academico",
    titulo: "Primer parcial",
    descripcion: "Evaluación parcial por materia",
    laborable: true,
    },
    {
    fecha: "2026-10-12",
    tipo: "feriado",
    titulo: "Día del Respeto a la Diversidad Cultural",
    descripcion: "Feriado institucional/nacional",
    laborable: false,
    },
    {
    fecha: "2026-11-15",
    tipo: "academico",
    titulo: "Entrega de trabajos prácticos",
    descripcion: "Fecha límite de entrega",
    laborable: true,
    },
    {
    fecha: "2026-09-04",
    tipo: "jornada",
    titulo: "Jornada institucional",
    descripcion: "Capacitación docente y reunión de equipo",
    laborable: false,
    },
    {
    fecha: "2026-09-25",
    tipo: "convivencia",
    titulo: "Convivencia escolar",
    descripcion: "Actividad de integración entre cursos",
    laborable: true,
    },
    {
    fecha: "2026-09-30",
    tipo: "reunion",
    titulo: "Reunión de familias",
    descripcion: "Encuentro con tutores y docentes",
    laborable: true,
    },
    {
    fecha: "2026-10-16",
    tipo: "examen",
    titulo: "Examen final",
    descripcion: "Evaluación final por materia",
    laborable: true,
    },
    {
    fecha: "2026-10-23",
    tipo: "vencimiento",
    titulo: "Vencimiento de matrícula",
    descripcion: "Último día para regularizar la matrícula",
    laborable: true,
    },
];

export function formatearFechaISO(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
export function esFinDeSemana(fecha) {
    const dia = fecha.getDay();
    return dia === 0 || dia === 6;
}

export function esFeriadoNacional(fecha) {
    return FERIADOS_NACIONALES.includes(formatearFechaISO(fecha));
}

export function obtenerEventoInstitucional(fecha) {
    const iso = formatearFechaISO(fecha);
    return CRONOGRAMA_INSTITUCIONAL.find((evento) => evento.fecha === iso) || null;
}

export function esDiaNoLaborable(fecha) {
    const evento = obtenerEventoInstitucional(fecha);

    if (evento?.laborable === false) return true;
    if (esFinDeSemana(fecha)) return true;
    if (esFeriadoNacional(fecha)) return true;

    return false;
}

export function clasificarDia(fecha) {
    const evento = obtenerEventoInstitucional(fecha);

    if (evento) return evento.tipo;
    if (esFeriadoNacional(fecha)) return "feriado";
    if (esFinDeSemana(fecha)) return "fin-de-semana";

    return "laborable";
}