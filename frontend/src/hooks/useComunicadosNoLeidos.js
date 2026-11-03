import { useState, useEffect } from "react";
import { listarComunicados } from "../api/comunicados";
import { listarDestinatarios } from "../api/comunicadosDestinatarios";
import { listarVistos } from "../api/comunicadosVistos";
import { listarMiembrosCanal } from "../api/miembrosCanal";
import { listarMiembrosServidor } from "../api/miembrosServidor";
import { listarRelaciones } from "../api/relacionesUsuario";
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
        const [com, dest, vis, mc, ms, relaciones] = await Promise.all([
          listarComunicados(),
          listarDestinatarios(),
          listarVistos(),
          listarMiembrosCanal(),
          listarMiembrosServidor(),
          listarRelaciones(),
        ]);
        if (!vivo) return;

        const usuarioId = Number(user.id_usuario);
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
          vis
            .filter((v) => Number(v.usuario_id) === usuarioId)
            .map((v) => Number(v.comunicado_id))
        );

        const meCorresponde = (comunicadoId) => {
          const destinoId = Number(comunicadoId);
          const destinos = dest.filter((d) => Number(d.comunicado_id) === destinoId);
          if (destinos.length === 0) return true;
          return destinos.some((d) =>
            (d.usuario_id != null && Number(d.usuario_id) === usuarioId) ||
            (d.canal_id != null && misCanales.has(Number(d.canal_id))) ||
            (d.servidor_id != null && misServidores.has(Number(d.servidor_id)))
          );
        };

        const count = com.filter(
          (c) => meCorresponde(c.id_comunicado) && !vistosIds.has(Number(c.id_comunicado))
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