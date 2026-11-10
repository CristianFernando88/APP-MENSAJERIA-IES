import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    console.log(`[WS CANAL ${canalId}] Mensaje recibido:`, data);
    if (Number(data.usuario_id) !== Number(userId)) {
      onNuevoMensaje(data);
    } else {
      console.log(`[WS CANAL ${canalId}] Ignorado: es mi propio mensaje`);
    }
  });
  return null;
}

export function NotificacionesProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [canales, setCanales] = useState([]);
  const [toastActivo, setToastActivo] = useState(null);
  const [avisosMensajes, setAvisosMensajes] = useState([]);
  const [revisionComunicados, setRevisionComunicados] = useState(0);
  const idsComunicadosConocidosRef = useRef(new Set());
  const primeraCargaComunicadosRef = useRef(true);
  const cargandoComunicadosRef = useRef(false);
  
  
  const [pausarNotificaciones, setPausarNotificaciones] = useState(false);
  
  
  const pausarRef = useRef(pausarNotificaciones);
  const idsAvisosMensajesRef = useRef(new Set());
  useEffect(() => {
    pausarRef.current = pausarNotificaciones;
  }, [pausarNotificaciones]);

  useEffect(() => {
    if (!toastActivo) return undefined;
    const temporizador = setTimeout(() => setToastActivo(null), 8000);
    return () => clearTimeout(temporizador);
  }, [toastActivo]);

  const mostrarToastGlobal = (titulo, detalle, tipo = "info", accion = null) => {
    setToastActivo({ titulo, detalle, tipo, accion });
  };

  const registrarAvisoMensaje = (titulo, data) => {
    const id = data?.id_mensaje_directo ?? data?.id_mensaje;
    const clave = String(id ?? `${Date.now()}-${Math.random()}`);
    if (idsAvisosMensajesRef.current.has(clave)) return;
    idsAvisosMensajesRef.current.add(clave);
    const detalle = data?.contenido ? `"${String(data.contenido).slice(0, 80)}"` : undefined;
    setAvisosMensajes((prev) =>
      [{ id: clave, titulo, detalle, fecha: data?.fecha_envio }, ...prev].slice(0, 8)
    );
  };

  const limpiarAvisosMensajes = () => {
    setAvisosMensajes([]);
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

  useEffect(() => {
    console.log("Canales para notificaciones:", canales);
  }, [canales]);


  useWebSocket(user?.id_usuario ? `directo/${user.id_usuario}` : null, (data) => {
    if (data && data.emisor_id && Number(data.emisor_id) !== Number(user.id_usuario)) {
      
      if (!pausarRef.current) {
        reproducirSonido();
        mostrarToastGlobal("Nuevo mensaje", "Has recibido un mensaje directo", "mensaje", "/mensajes");
        registrarAvisoMensaje("Nuevo mensaje", data);
        setTotalNoLeidos(prev => prev + 1);
      }
    }
  });

  const handleNuevoMensajeCanal = (data) => {
    if (pausarRef.current) return; 
    console.log("[CONTEXTO] Nuevo mensaje en canal, disparando Toast");
    reproducirSonido();
    if (window.location.pathname !== "/mensajes") {
      mostrarToastGlobal("Nuevo mensaje", "Has recibido un mensaje en un canal", "mensaje", "/mensajes");
    }
    setTotalNoLeidos(prev => prev + 1);
    registrarAvisoMensaje("Nuevo mensaje en un canal", data);
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
            mostrarToastGlobal("Nuevo comunicado", comunicado.titulo, "comunicado", "/comunicados");
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
      revisionComunicados,
      avisosMensajes,
      limpiarAvisosMensajes
    }}>
      {toastActivo && (
        <Toast
          titulo={toastActivo.titulo}
          detalle={toastActivo.detalle}
          onAccion={toastActivo.accion ? () => { navigate(toastActivo.accion); setToastActivo(null); } : undefined}
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