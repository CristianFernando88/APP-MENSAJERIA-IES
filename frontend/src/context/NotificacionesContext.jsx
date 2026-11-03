import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuth } from "./AuthContext";
import { listarCanales } from "../api/canales";
import { listarMiembrosCanal } from "../api/miembrosCanal";
import { listarMiembrosServidor } from "../api/miembrosServidor";
import { listarRelaciones } from "../api/relacionesUsuario";
import { listarComunicados } from "../api/comunicados";
import { listarDestinatarios } from "../api/comunicadosDestinatarios";
import Toast from "../components/ui/Toast/Toast";

const NotificacionesContext = createContext(null);

function CanalListener({ canalId, userId, onNuevoMensaje }) {
  useWebSocket(`canal/${canalId}`, (data) => {
    if (Number(data.usuario_id) !== Number(userId)) {
      onNuevoMensaje(data);
    }
  });
  return null;
}

export function NotificacionesProvider({ children }) {
  const { user } = useAuth();
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [canales, setCanales] = useState([]);
  const [toastActivo, setToastActivo] = useState(null);
  const [revisionComunicados, setRevisionComunicados] = useState(0);
  const idsComunicadosConocidosRef = useRef(new Set());
  const primeraCargaComunicadosRef = useRef(true);
  const cargandoComunicadosRef = useRef(false);
  
  // NUEVO: Estado para saber si estamos dentro de la pantalla de mensajes
  const [pausarNotificaciones, setPausarNotificaciones] = useState(false);
  
  // Ref para leer el valor actual dentro del WebSocket sin re-renderizar
  const pausarRef = useRef(pausarNotificaciones);
  useEffect(() => {
    pausarRef.current = pausarNotificaciones;
  }, [pausarNotificaciones]);

  useEffect(() => {
    if (!toastActivo) return undefined;
    const temporizador = setTimeout(() => setToastActivo(null), 8000);
    return () => clearTimeout(temporizador);
  }, [toastActivo]);

  const mostrarToastGlobal = (titulo, detalle, tipo = "info") => {
    setToastActivo({ titulo, detalle, tipo });
  };

  const refrescarComunicados = () => {
    setRevisionComunicados((revision) => revision + 1);
  };

  const reproducirSonido = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  useEffect(() => {
    if (!user) return;
    async function cargar() {
      try {
        const [resCanales, resMiembros] = await Promise.all([listarCanales(), listarMiembrosCanal()]);
        const nombreRolesLegacy = (user.roles || [])
          .map((rol) => typeof rol === "string" ? rol : rol?.nombre)
          .filter(Boolean);

        const esAdminGlobalAsignaciones = (user.asignaciones || []).some((asignacion) => {
          const nombre = asignacion?.rol?.nombre || asignacion?.nombre_rol;
          const tipo = asignacion?.rol?.tipo;
          return asignacion?.servidor_id == null &&
            tipo === "global" &&
            ["admin", "super_admin"].includes(nombre);
        });

        const esAdminGlobalLegacy = nombreRolesLegacy
          .some((nombre) => ["admin", "super_admin"].includes(nombre));

        const esAdmin = esAdminGlobalAsignaciones || esAdminGlobalLegacy;
        if (esAdmin) {
          setCanales(resCanales);
        } else {
          const misIds = resMiembros.filter(m => Number(m.usuario_id) === Number(user.id_usuario)).map(m => Number(m.canal_id));
          setCanales(resCanales.filter(c => misIds.includes(Number(c.id_canal))));
        }
      } catch (e) { console.error(e); }
    }
    cargar();
  }, [user?.id_usuario]);

  // WebSocket de Directos
  useWebSocket(`directo/${user?.id_usuario}`, (data) => {
    if (data && data.emisor_id && Number(data.emisor_id) !== Number(user.id_usuario)) {
      reproducirSonido();
      mostrarToastGlobal("Nuevo mensaje", "Has recibido un mensaje directo", "mensaje");
      // SOLO sumamos si NO estamos en la pantalla de mensajes
      if (!pausarRef.current) {
        setTotalNoLeidos(prev => prev + 1);
      }
    }
  });

  const handleNuevoMensajeCanal = (data) => {
    reproducirSonido();
    mostrarToastGlobal("Nuevo mensaje", "Has recibido un mensaje en un canal", "mensaje");
    // SOLO sumamos si NO estamos en la pantalla de mensajes
    if (!pausarRef.current) {
      setTotalNoLeidos(prev => prev + 1);
    }
  };

  const limpiarContador = (cantidad = 1) => {
    setTotalNoLeidos(prev => Math.max(0, prev - cantidad));
  };

  useEffect(() => {
    idsComunicadosConocidosRef.current = new Set();
    primeraCargaComunicadosRef.current = true;

    if (!user?.id_usuario) return undefined;

    const consultarComunicados = async () => {
      if (document.visibilityState !== "visible" || cargandoComunicadosRef.current) return;
      cargandoComunicadosRef.current = true;

      try {
        const usuarioId = Number(user.id_usuario);
        const [comunicados, destinatarios, miembrosCanal, miembrosServidor, relaciones] =
          await Promise.all([
            listarComunicados(),
            listarDestinatarios(),
            listarMiembrosCanal(),
            listarMiembrosServidor(),
            listarRelaciones(),
          ]);

        const hijosIds = new Set();
        relaciones.forEach((relacion) => {
          const usuarioRel = Number(relacion.usuario_id);
          const relacionado = Number(relacion.relacionado_id);
          const tipo = String(relacion.tipo ?? relacion.tipo_relacion ?? "").toLowerCase();
          if (tipo && !["tutor", "padre", "madre"].includes(tipo)) return;

          if (usuarioRel === usuarioId && relacionado !== usuarioId) hijosIds.add(relacionado);
          if (relacionado === usuarioId && usuarioRel !== usuarioId) hijosIds.add(usuarioRel);
        });

        const canalesAccesibles = new Set();
        miembrosCanal.forEach((miembro) => {
          const miembroId = Number(miembro.usuario_id);
          if (miembroId === usuarioId || hijosIds.has(miembroId)) {
            canalesAccesibles.add(Number(miembro.canal_id));
          }
        });

        const servidoresAccesibles = new Set();
        miembrosServidor.forEach((miembro) => {
          const miembroId = Number(miembro.usuario_id);
          if (miembroId === usuarioId || hijosIds.has(miembroId)) {
            servidoresAccesibles.add(Number(miembro.servidor_id));
          }
        });

        const meCorresponde = (comunicado) => {
          const comunicadoId = Number(comunicado.id_comunicado);
          const destinos = destinatarios.filter(
            (destinatario) => Number(destinatario.comunicado_id) === comunicadoId
          );

          if (destinos.length === 0) {
            return String(comunicado.tipo).toLowerCase() === "global";
          }

          return destinos.some((destinatario) =>
            (destinatario.usuario_id != null && Number(destinatario.usuario_id) === usuarioId) ||
            (destinatario.canal_id != null && canalesAccesibles.has(Number(destinatario.canal_id))) ||
            (destinatario.servidor_id != null && servidoresAccesibles.has(Number(destinatario.servidor_id)))
          );
        };

        if (!primeraCargaComunicadosRef.current) {
          const nuevos = comunicados.filter(
            (comunicado) => !idsComunicadosConocidosRef.current.has(Number(comunicado.id_comunicado))
          );
          const nuevosValidos = nuevos.filter(meCorresponde);

          if (nuevosValidos.length > 0) {
            const comunicado = [...nuevosValidos].sort(
              (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
            )[0];
            mostrarToastGlobal("Nuevo comunicado", comunicado.titulo, "comunicado");
          }
        }

        idsComunicadosConocidosRef.current = new Set(
          comunicados.map((comunicado) => Number(comunicado.id_comunicado))
        );
        primeraCargaComunicadosRef.current = false;
        setRevisionComunicados((revision) => revision + 1);
      } catch (error) {
        console.error("Error al detectar nuevos comunicados:", error);
      } finally {
        cargandoComunicadosRef.current = false;
      }
    };

    consultarComunicados();
    const intervalo = setInterval(consultarComunicados, 10000);
    const alVolver = () => {
      if (document.visibilityState === "visible") consultarComunicados();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      cargandoComunicadosRef.current = false;
    };
  }, [user?.id_usuario]);

  return (
    <NotificacionesContext.Provider value={{ 
      totalNoLeidos, 
      limpiarContador, 
      setTotalNoLeidos,
      setPausarNotificaciones,
      mostrarToastGlobal,
      refrescarComunicados,
      revisionComunicados
    }}>
      {toastActivo && (
        <Toast
          titulo={toastActivo.titulo}
          detalle={toastActivo.detalle}
          onCerrar={() => setToastActivo(null)}
        />
      )}
      {user && canales.map(canal => (
        <CanalListener 
          key={canal.id_canal} 
          canalId={canal.id_canal} 
          userId={user.id_usuario} 
          onNuevoMensaje={handleNuevoMensajeCanal} 
        />
      ))}
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);