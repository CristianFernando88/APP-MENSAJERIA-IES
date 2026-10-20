import { useCallback, useEffect, useRef, useState } from "react";

export default function useListaInfinita(items, { paso = 10, resetKey = "" } = {}) {
    const [limite, setLimite] = useState(paso);
    const contenedorRef = useRef(null);

    const total = items.length;

    useEffect(() => {
    setLimite(paso);
    }, [resetKey, paso]);

    const cargarMas = useCallback(() => {
    setLimite((prev) => {
        if (prev >= total) return prev;
        return Math.min(prev + paso, total);
    });
    }, [paso, total]);

    const manejarScroll = useCallback(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const distanciaAlFinal = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanciaAlFinal <= 120) cargarMas();
    }, [cargarMas]);

    const visibles = items.slice(0, limite);
    const hayMas = limite < total;

    return {
    visibles,
    hayMas,
    limite,
    total,
    contenedorRef,
    manejarScroll,
    cargarMas,
    };
}