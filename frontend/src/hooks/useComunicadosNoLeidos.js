import { useCallback, useEffect, useState } from "react";
import { listarComunicados } from "../api/comunicados";
import { listarDestinatarios } from "../api/comunicadosDestinatarios";
import { listarVistos } from "../api/comunicadosVistos";
import { listarMiembrosCanal } from "../api/miembrosCanal";
import { listarMiembrosServidor } from "../api/miembrosServidor";
import { listarRelaciones } from "../api/relacionesUsuario";
import { useAuth } from "../context/AuthContext";
import { useNotificaciones } from "../context/NotificacionesContext";

export function useComunicadosNoLeidos() {
  const { user } = useAuth();
  const { revisionComunicados } = useNotificaciones();
  const [cantidad, setCantidad] = useState(0);
  const [comunicadosNoLeidos, setComunicadosNoLeidos] = useState([]);
  const [loading, setLoading] = useState(false);

  const refrescar = useCallback(async () => {
    const usuarioId = Number(user?.id_usuario);
    if (!usuarioId) {
      setCantidad(0);
      setComunicadosNoLeidos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [com, dest, vis, mc, ms, relaciones] = await Promise.all([
        listarComunicados(), listarDestinatarios(), listarVistos(),
        listarMiembrosCanal(), listarMiembrosServidor(), listarRelaciones(),
      ]);

      const hijosIds = new Set();
      relaciones.forEach((r) => {
        const usuarioRel = Number(r.usuario_id);
        const relacionado = Number(r.relacionado_id);
        const tipo = String(r.tipo ?? r.tipo_relacion ?? "").toLowerCase();
        if (tipo && !["tutor", "padre", "madre"].includes(tipo)) return;

        if (usuarioRel === usuarioId && relacionado !== usuarioId) hijosIds.add(relacionado);
        if (relacionado === usuarioId && usuarioRel !== usuarioId) hijosIds.add(usuarioRel);
      });

      const misCanales = new Set();
      mc.forEach((m) => {
        if (Number(m.usuario_id) === usuarioId || hijosIds.has(Number(m.usuario_id))) {
          misCanales.add(Number(m.canal_id));
        }
      });

      const misServidores = new Set();
      ms.forEach((m) => {
        if (Number(m.usuario_id) === usuarioId || hijosIds.has(Number(m.usuario_id))) {
          misServidores.add(Number(m.servidor_id));
        }
      });

      const vistosIds = new Set(
        vis.filter((v) => Number(v.usuario_id) === usuarioId)
          .map((v) => Number(v.comunicado_id))
      );

      const meCorresponde = (comunicadoId) => {
        const destinoId = Number(comunicadoId);
        const destinos = dest.filter((d) => Number(d.comunicado_id) === destinoId);
        if (destinos.length === 0) {
          const comunicado = com.find((c) => Number(c.id_comunicado) === destinoId);
          return String(comunicado?.tipo ?? "").toLowerCase() === "global";
        }
        return destinos.some((d) =>
          (d.usuario_id != null && Number(d.usuario_id) === usuarioId) ||
          (d.canal_id != null && misCanales.has(Number(d.canal_id))) ||
          (d.servidor_id != null && misServidores.has(Number(d.servidor_id)))
        );
      };

      const lista = com.filter((c) =>
        meCorresponde(c.id_comunicado) && !vistosIds.has(Number(c.id_comunicado))
      );
      setComunicadosNoLeidos(lista);
      setCantidad(lista.length);
    } catch (error) {
      console.error("Error al contar comunicados no leídos:", error);
      setComunicadosNoLeidos([]);
      setCantidad(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    let activo = true;
    const cargar = async () => { if (activo) await refrescar(); };
    cargar();
    const timer = setInterval(cargar, 30000);
    return () => { activo = false; clearInterval(timer); };
  }, [refrescar, revisionComunicados]);

  return { cantidad, comunicadosNoLeidos, loading, refrescar };
}

export default function useComunicadosNoLeidosCompat() {
  const { cantidad } = useComunicadosNoLeidos();
  return cantidad;
}