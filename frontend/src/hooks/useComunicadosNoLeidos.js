import { useState, useEffect } from "react";
import { listarComunicados } from "../api/comunicados";
import { listarDestinatarios } from "../api/comunicadosDestinatarios";
import { listarVistos } from "../api/comunicadosVistos";
import { listarMiembrosCanal } from "../api/miembrosCanal";
import { listarMiembrosServidor } from "../api/miembrosServidor";
import { useAuth } from "../context/AuthContext";

export default function useComunicadosNoLeidos() {
  const { user } = useAuth();
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    let vivo = true;

    const calcular = async () => {
      if (!user?.id_usuario) {
        if (vivo) setNoLeidos(0);
        return;
      }

      try {
        const [com, dest, vis, mc, ms] = await Promise.all([
          listarComunicados(),
          listarDestinatarios(),
          listarVistos(),
          listarMiembrosCanal(),
          listarMiembrosServidor(),
        ]);
        if (!vivo) return;

        const misCanales = mc.filter((m) => m.usuario_id === user.id_usuario).map((m) => m.canal_id);
        const misServidores = ms.filter((m) => m.usuario_id === user.id_usuario).map((m) => m.servidor_id);

        const vistosIds = new Set(
          vis.filter((v) => v.usuario_id === user.id_usuario).map((v) => v.comunicado_id)
        );

        const meCorresponde = (comunicadoId) => {
          const destinos = dest.filter((d) => d.comunicado_id === comunicadoId);
          if (destinos.length === 0) return true;
          return destinos.some(
            (d) =>
              d.usuario_id === user.id_usuario ||
              (d.canal_id && misCanales.includes(d.canal_id)) ||
              (d.servidor_id && misServidores.includes(d.servidor_id))
          );
        };

        const count = com.filter(
          (c) => meCorresponde(c.id_comunicado) && !vistosIds.has(c.id_comunicado)
        ).length;

        setNoLeidos(count);
      } catch (error) {
        console.error("Error al contar comunicados no leídos:", error);
      }
    };

    calcular();
    const timer = setInterval(calcular, 30000);

    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [user?.id_usuario]);

  return noLeidos;
}