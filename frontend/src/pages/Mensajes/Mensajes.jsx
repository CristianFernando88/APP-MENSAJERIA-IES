import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Search, Hash, ChevronLeft, ChevronDown, Plus, Users, UserPlus, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { listarMensajes } from "../../api/mensajes";
import { listarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { listarMensajesDirectos, actualizarMensajeDirecto, getContactosPermitidos } from "../../api/mensajesDirectos";
import { listarMensajesVistos, crearMensajeVisto } from "../../api/mensajesVistos";
import { listarUsuarios } from "../../api/usuarios";
import { getMiembrosCanal, getMiembrosDisponibles, listarCanales } from "../../api/canales";
import { crearMiembroCanal, eliminarMiembroCanal, listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarRelaciones } from "../../api/relacionesUsuario";
import Modal from "../../components/ui/Modal/Modal";
import "./Mensajes.css";

// Componente invisible para escuchar canales en segundo plano (para badges de la pantalla de mensajes)
function CanalListener({ canalId, userId, onNuevoMensaje }) {
  useWebSocket(`canal/${canalId}`, (data) => {
    if (data.usuario_id !== userId) {
      onNuevoMensaje(canalId, data);
    }
  });
  return null;
}

// NUEVO: permisos por rol institucional y rol dentro del canal
function puedeEscribirEnCanal({ user, canal, miRolEnCanal, esTutorPuroFlag, nombresRoles }) {
  if (!user || !canal || !miRolEnCanal || miRolEnCanal === "observador" || esTutorPuroFlag) return false;
  if (!["admin", "miembro"].includes(miRolEnCanal)) return false;

  const rolInstitucional = nombresRoles || [];
  const tipo = String(canal.tipo || "chat").toLowerCase();
  const puedeEscribirInformativo = rolInstitucional.includes("super_admin") ||
    rolInstitucional.includes("admin") || rolInstitucional.includes("director") ||
    (rolInstitucional.includes("profesor") && miRolEnCanal === "admin");

  if (tipo === "informativo") return miRolEnCanal === "admin" && puedeEscribirInformativo;
  return true;
}

function motivoSoloLectura({ user, canal, miRolEnCanal, esTutorPuroFlag }) {
  if (esTutorPuroFlag) return "los tutores tienen acceso de lectura";
  if (miRolEnCanal === "observador") return "tu rol en el canal es observador";
  if (String(canal?.tipo || "chat").toLowerCase() === "informativo" && miRolEnCanal !== "admin") {
    return "solo los administradores pueden escribir en canales informativos";
  }
  if (!miRolEnCanal) return "no eres miembro de este canal";
  return "tu rol no permite escribir mensajes";
}

function rolPrincipalDe(usuarioObj, rolesExtra = []) {
  const roles = [];
  [...(usuarioObj?.roles || []), ...(usuarioObj?.asignaciones || []), ...(rolesExtra || [])].forEach((item) => {
    const nombre = typeof item === "string"
      ? item
      : item?.rol?.nombre || item?.nombre || item?.nombre_rol || item?.rol;
    if (typeof nombre === "string" && nombre.trim()) {
      roles.push(nombre.toLowerCase());
    }
  });
  const prioridad = ["super_admin", "admin", "director", "profesor", "tutor", "alumno", "usuario"];
  const nombres = { super_admin: "Super administrador", admin: "Administrador", director: "Director", profesor: "Profesor", tutor: "Tutor", alumno: "Alumno", usuario: "Usuario" };
  const principal = prioridad.find((rol) => roles.includes(rol));
  return principal ? nombres[principal] : null;
}

export default function Mensajes() {
  const { user, hasRole, asignaciones, miembroCanalDe, invalidarMiembroCanal } = useAuth();
  // NUEVO: Traemos setPausarNotificaciones
  const { setTotalNoLeidos, setPausarNotificaciones } = useNotificaciones();
  
  const [canales, setCanales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);
  const [mensajesDirectos, setMensajesDirectos] = useState([]);
  
  const [chatActivo, setChatActivo] = useState(null); 
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  const [noLeidos, setNoLeidos] = useState({}); 
  const [vistosIds, setVistosIds] = useState(new Set());

  const [modalNuevoChat, setModalNuevoChat] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [pestanaNuevoChat, setPestanaNuevoChat] = useState("canal");
  const [destinoNuevoChat, setDestinoNuevoChat] = useState(null);
  const [alumnoExpandido, setAlumnoExpandido] = useState(null);

  // NUEVO: permisos, contactos, gestión de miembros y avisos locales
  const [contactosPermitidosBackend, setContactosPermitidosBackend] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [usuarioRoles, setUsuarioRoles] = useState([]);
  const [rolesCatalogo, setRolesCatalogo] = useState([]);
  const [miRolEnCanalActivo, setMiRolEnCanalActivo] = useState(null);
  const [modalMiembros, setModalMiembros] = useState(false);
  const [modalAgregarMiembro, setModalAgregarMiembro] = useState(false);
  const [miembrosCanalModal, setMiembrosCanalModal] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [rolNuevoMiembro, setRolNuevoMiembro] = useState("miembro");
  const [toast, setToast] = useState(null);

  const mensajesEndRef = useRef(null);
  const chatActivoRef = useRef(chatActivo);

  const nombresRoles = useMemo(() => {
    const roles = [];
    (user?.roles || []).forEach((rol) => {
      const nombre = typeof rol === "string" ? rol : rol?.nombre;
      if (nombre) roles.push(String(nombre).toLowerCase());
    });
    (asignaciones || user?.asignaciones || []).forEach((asignacion) => {
      const nombre = asignacion?.rol?.nombre || asignacion?.nombre_rol || asignacion?.rol;
      if (typeof nombre === "string") roles.push(nombre.toLowerCase());
    });
    return [...new Set(roles)];
  }, [user, asignaciones]);

  const rolesPorUsuario = useMemo(() => {
    const nombresPorRol = new Map(
      rolesCatalogo.map((rol) => [Number(rol.id_rol), rol.nombre])
    );
    const mapa = new Map();

    usuarioRoles.forEach((asignacion) => {
      const nombreDesdeCatalogo = nombresPorRol.get(Number(asignacion.rol_id));
      const nombre = asignacion?.rol?.nombre || asignacion?.nombre_rol || nombreDesdeCatalogo;
      if (!nombre) return;

      const usuarioId = Number(asignacion.usuario_id);
      const asignaciones = mapa.get(usuarioId) || [];
      asignaciones.push({ rol: { nombre: String(nombre).toLowerCase() } });
      mapa.set(usuarioId, asignaciones);
    });

    return mapa;
  }, [usuarioRoles, rolesCatalogo]);

  const esAlumno = nombresRoles.includes("alumno") &&
    !["super_admin", "admin", "director", "profesor", "tutor"].some((rol) => nombresRoles.includes(rol));
  const esTutorPuroFlag = nombresRoles.includes("tutor") &&
    !["profesor", "admin", "super_admin", "director"].some((rol) => nombresRoles.includes(rol));
  const canalActivo = chatActivo?.tipo === "canal"
    ? canales.find((canal) => Number(canal.id_canal) === Number(chatActivo.id))
    : null;
  const puedeEscribirActivo = chatActivo?.tipo === "canal"
    ? puedeEscribirEnCanal({
        user,
        canal: canalActivo,
        miRolEnCanal: miRolEnCanalActivo,
        esTutorPuroFlag,
        nombresRoles,
      })
    : true;
  const motivoBloqueo = chatActivo?.tipo === "canal"
    ? motivoSoloLectura({ user, canal: canalActivo, miRolEnCanal: miRolEnCanalActivo, esTutorPuroFlag })
    : "";

  useEffect(() => {
    chatActivoRef.current = chatActivo;
  }, [chatActivo]);

  // NUEVO: Limpiamos el contador global y pausamos las notificaciones al entrar
  useEffect(() => {
    setTotalNoLeidos(0);
    setPausarNotificaciones(true);

    // Al salir de la pantalla, reanudamos las notificaciones
    return () => {
      setPausarNotificaciones(false);
    };
  }, [setTotalNoLeidos, setPausarNotificaciones]);

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

  const marcarMensajesComoLeidos = async (usuarioId) => {
    try {
      const pendientes = mensajesDirectos.filter(dm => 
        Number(dm.emisor_id) === Number(usuarioId) && 
        Number(dm.receptor_id) === Number(user.id_usuario) && 
        !dm.leido
      );

      if (pendientes.length > 0) {
        const promesas = pendientes.map(dm => 
          actualizarMensajeDirecto(dm.id_mensaje_directo, { leido: true })
        );
        await Promise.all(promesas);

        setMensajesDirectos(prev => 
          prev.map(dm => 
            pendientes.some(p => p.id_mensaje_directo === dm.id_mensaje_directo) 
              ? { ...dm, leido: true } 
              : dm
          )
        );
      }
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
    }
  };

  const marcarCanalComoVisto = async (canalId, mensajesDelCanal) => {
    try {
      const noVistos = mensajesDelCanal.filter(m => 
        Number(m.usuario_id) !== Number(user.id_usuario) && 
        !vistosIds.has(m.id_mensaje)
      );

      if (noVistos.length > 0) {
        const promesas = noVistos.map(m => 
          crearMensajeVisto({ mensaje_id: m.id_mensaje, usuario_id: user.id_usuario })
        );
        await Promise.all(promesas);

        setVistosIds(prev => {
          const nuevoSet = new Set(prev);
          noVistos.forEach(m => nuevoSet.add(m.id_mensaje));
          return nuevoSet;
        });
      }
    } catch (error) {
      console.error("Error al marcar canal como visto:", error);
    }
  };

  const handleNuevoMensajeCanalFondo = (canalId, mensaje) => {
    if (mensaje.usuario_id !== user.id_usuario) {
      reproducirSonido();
      if (chatActivoRef.current?.tipo !== "canal" || chatActivoRef.current?.id !== canalId) {
        setNoLeidos(prev => ({
          ...prev,
          [`canal-${canalId}`]: (prev[`canal-${canalId}`] || 0) + 1
        }));
      }
    }
  };

  // 1. Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resCanales, resUsuarios, resMiembros, resDMs, resVistos, resContactos, resRelaciones, resUsuarioRoles, resRoles] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarMiembrosCanal(),
          listarMensajesDirectos(),
          listarMensajesVistos(),
          getContactosPermitidos(),
          listarRelaciones().catch((error) => {
            console.error("Error al cargar relaciones usuario:", error);
            return [];
          }),
          listarUsuarioRol().catch((error) => {
            console.error("Error al cargar asignaciones de usuario:", error);
            return [];
          }),
          listarRoles().catch((error) => {
            console.error("Error al cargar roles:", error);
            return [];
          })
        ]);
        setContactosPermitidosBackend(Array.isArray(resContactos) ? resContactos : []);
        setRelaciones(Array.isArray(resRelaciones) ? resRelaciones : []);
        setUsuarioRoles(Array.isArray(resUsuarioRoles) ? resUsuarioRoles : []);
        setRolesCatalogo(Array.isArray(resRoles) ? resRoles : []);

        let misCanales = resCanales;
        if (!hasRole(["super_admin", "admin"])) {
          const misIdsCanales = resMiembros
            .filter(m => Number(m.usuario_id) === Number(user.id_usuario))
            .map(m => Number(m.canal_id));
          misCanales = resCanales.filter(c => misIdsCanales.includes(Number(c.id_canal)));
        }

        setCanales(misCanales);
        setUsuarios(resUsuarios);
        setMiembrosCanal(resMiembros);
        setMensajesDirectos(resDMs);

        const vistosDelUsuario = new Set(
          resVistos.filter(v => Number(v.usuario_id) === Number(user.id_usuario)).map(v => v.mensaje_id)
        );
        setVistosIds(vistosDelUsuario);

        const inicialNoLeidos = {};
        resDMs.forEach(dm => {
          if (dm.receptor_id === user.id_usuario && !dm.leido) {
            const key = `directo-${dm.emisor_id}`;
            inicialNoLeidos[key] = (inicialNoLeidos[key] || 0) + 1;
          }
        });

        const promesasMensajes = misCanales.map(c => listarMensajes(c.id_canal));
        const respuestasMensajes = await Promise.all(promesasMensajes);
        
        misCanales.forEach((canal, index) => {
          const mensajesCanal = respuestasMensajes[index];
          const noVistos = mensajesCanal.filter(m => 
            Number(m.usuario_id) !== Number(user.id_usuario) && 
            !vistosDelUsuario.has(m.id_mensaje)
          );
          if (noVistos.length > 0) {
            inicialNoLeidos[`canal-${canal.id_canal}`] = noVistos.length;
          }
        });

        setNoLeidos(inicialNoLeidos);

      } catch (error) { console.error("Error al cargar datos:", error); } finally { setCargando(false); }
    }
    if (user) cargarDatos();
  }, [user, hasRole]);

  // 2. Cargar historial
  useEffect(() => {
    if (!chatActivo) return;
    setMensajes([]);

    if (chatActivo.tipo === "canal") {
      const miembroLocal = miembrosCanal.find((miembro) =>
        Number(miembro.usuario_id) === Number(user.id_usuario) &&
        Number(miembro.canal_id) === Number(chatActivo.id)
      );
      // CONSERVADO: carga inmediata del rol local para evitar parpadeos
      setMiRolEnCanalActivo(miembroLocal?.rol_en_canal || null);
      miembroCanalDe(chatActivo.id).then((rol) => {
        if (rol) setMiRolEnCanalActivo(rol);
      });

      listarMensajes(chatActivo.id).then(data => {
        const ordenados = data.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
        setMensajes(ordenados);
        
        marcarCanalComoVisto(chatActivo.id, ordenados);
        setNoLeidos(prev => {
          const newState = { ...prev };
          delete newState[`canal-${chatActivo.id}`];
          return newState;
        });
      });
    } else {
      const misDMs = mensajesDirectos.filter(dm => 
        (dm.emisor_id === user.id_usuario && dm.receptor_id === chatActivo.id) ||
        (dm.emisor_id === chatActivo.id && dm.receptor_id === user.id_usuario)
      );
      const ordenados = misDMs.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
      setMensajes(ordenados);

      setNoLeidos(prev => {
        const newState = { ...prev };
        delete newState[`directo-${chatActivo.id}`];
        return newState;
      });

      marcarMensajesComoLeidos(chatActivo.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatActivo]);

  // --- HOOK 1: WEBSOCKET DE CANALES (Solo activo si hay un canal abierto) ---
  const wsCanalPath = chatActivo?.tipo === "canal" ? `canal/${chatActivo.id}` : null;
  const { sendMessage: sendCanal } = useWebSocket(wsCanalPath, (nuevoMensaje) => {
    if (nuevoMensaje.usuario_id !== user.id_usuario) reproducirSonido();
    
    setMensajes(prev => {
      const tempIndex = prev.findIndex(m => m.id_mensaje?.toString().startsWith('temp-') && m.contenido === nuevoMensaje.contenido);
      if (tempIndex !== -1) {
        const nuevoArray = [...prev];
        nuevoArray[tempIndex] = nuevoMensaje;
        return nuevoArray;
      }
      if (prev.some(m => m.id_mensaje === nuevoMensaje.id_mensaje)) return prev;
      return [...prev, nuevoMensaje];
    });

    if (nuevoMensaje.usuario_id !== user.id_usuario) {
      crearMensajeVisto({ mensaje_id: nuevoMensaje.id_mensaje, usuario_id: user.id_usuario });
      setVistosIds(prev => new Set(prev).add(nuevoMensaje.id_mensaje));
    }
  });

  // --- HOOK 2: WEBSOCKET DE DIRECTOS (SIEMPRE ACTIVO) ---
  const { sendMessage: sendDirecto } = useWebSocket(`directo/${user?.id_usuario}`, (nuevoMensaje) => {
    if (nuevoMensaje.emisor_id && nuevoMensaje.receptor_id) {
      const esMio = nuevoMensaje.emisor_id === user.id_usuario;

      setMensajesDirectos(prev => {
        if (esMio) {
          const tempIndex = prev.findIndex(m => m.id_mensaje_directo?.toString().startsWith('temp-') && m.contenido === nuevoMensaje.contenido);
          if (tempIndex !== -1) {
            const nuevoArray = [...prev];
            nuevoArray[tempIndex] = nuevoMensaje;
            return nuevoArray;
          }
        }
        if (prev.some(m => m.id_mensaje_directo === nuevoMensaje.id_mensaje_directo)) return prev;
        return [...prev, nuevoMensaje];
      });

      if (!esMio) {
        reproducirSonido();
        if (chatActivoRef.current?.tipo === "directo" && chatActivoRef.current?.id === nuevoMensaje.emisor_id) {
          setMensajes(prev => {
            if (prev.some(m => m.id_mensaje_directo === nuevoMensaje.id_mensaje_directo)) return prev;
            return [...prev, nuevoMensaje];
          });
          actualizarMensajeDirecto(nuevoMensaje.id_mensaje_directo, { leido: true });
        } else {
          setNoLeidos(prev => ({
            ...prev,
            [`directo-${nuevoMensaje.emisor_id}`]: (prev[`directo-${nuevoMensaje.emisor_id}`] || 0) + 1
          }));
        }
      }
    }
  });

  // 3. Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // 4. ENVIAR MENSAJE (Usa el sendCanal o sendDirecto según corresponda)
  const handleEnviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || !chatActivo) return;
    // NUEVO: bloquea el envío antes de usar los WebSockets conservados
    if (chatActivo.tipo === "canal" && !puedeEscribirActivo) return;

    const textoAEnviar = texto.trim();
    setTexto("");

    if (chatActivo.tipo === "canal") {
      sendCanal({ contenido: textoAEnviar, usuario_id: user.id_usuario });
      
      const mensajeTemporal = {
        id_mensaje: `temp-${Date.now()}`,
        contenido: textoAEnviar,
        usuario_id: user.id_usuario,
        canal_id: chatActivo.id,
        fecha_envio: new Date().toISOString(),
        editado: false
      };
      setMensajes(prev => [...prev, mensajeTemporal]);
      
    } else {
      sendDirecto({ contenido: textoAEnviar, receptor_id: chatActivo.id });
      
      const mensajeTemporal = {
        id_mensaje_directo: `temp-${Date.now()}`,
        contenido: textoAEnviar,
        emisor_id: user.id_usuario,
        receptor_id: chatActivo.id,
        fecha_envio: new Date().toISOString(),
        leido: false
      };
      setMensajes(prev => [...prev, mensajeTemporal]);
      setMensajesDirectos(prev => [...prev, mensajeTemporal]);
    }
  };

  const getNombre = (id) => {
    const u = usuarios.find(x => x.id_usuario === id);
    return u?.perfil ? `${u.perfil.nombres} ${u.perfil.apellidos}` : u?.nombre_usuario || "Desconocido";
  };

  const getFotoPerfil = (id) => {
    const usuario = usuarios.find(
      (u) => Number(u.id_usuario) === Number(id)
    );
    
    return usuario?.perfil?.foto_perfil || "";
  };

  const canalesFiltrados = canales.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  
  const usuariosFiltrados = useMemo(() => {
    const idsConHistorial = new Set();
    mensajesDirectos.forEach(dm => {
      if (dm.emisor_id === user.id_usuario) idsConHistorial.add(dm.receptor_id);
      if (dm.receptor_id === user.id_usuario) idsConHistorial.add(dm.emisor_id);
    });
    return usuarios.filter(u => 
      idsConHistorial.has(u.id_usuario) && 
      u.id_usuario !== user.id_usuario &&
      getNombre(u.id_usuario).toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [usuarios, mensajesDirectos, user.id_usuario, busqueda]);

  const getUltimoMensaje = (usuarioId) => {
    const msjs = mensajesDirectos.filter(dm => 
      (dm.emisor_id === user.id_usuario && dm.receptor_id === usuarioId) ||
      (dm.emisor_id === usuarioId && dm.receptor_id === user.id_usuario)
    );
    if (msjs.length === 0) return "Mensaje privado";
    const ordenados = msjs.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
    return `${ordenados[0].emisor_id === user.id_usuario ? "Tú: " : ""}${ordenados[0].contenido}`;
  };

  const canalesParaNuevoChat = useMemo(() => canales.filter((canal) => {
    const miembroLocal = miembrosCanal.find((miembro) =>
      Number(miembro.usuario_id) === Number(user.id_usuario) &&
      Number(miembro.canal_id) === Number(canal.id_canal)
    );
    return puedeEscribirEnCanal({
      user,
      canal,
      miRolEnCanal: miembroLocal?.rol_en_canal || null,
      esTutorPuroFlag: esTutorPuroFlag,
      nombresRoles,
    });
  }), [canales, miembrosCanal, user, esTutorPuroFlag, nombresRoles]);

  const contactosParaNuevoChat = useMemo(() => {
    const idsHistorial = new Set();
    mensajesDirectos.forEach((dm) => {
      if (Number(dm.emisor_id) === Number(user.id_usuario)) idsHistorial.add(Number(dm.receptor_id));
      if (Number(dm.receptor_id) === Number(user.id_usuario)) idsHistorial.add(Number(dm.emisor_id));
    });

    const misCanalesIds = miembrosCanal
      .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
      .map((m) => Number(m.canal_id));
    const usuariosEnMisCanales = new Set();
    miembrosCanal.forEach((m) => {
      if (misCanalesIds.includes(Number(m.canal_id))) usuariosEnMisCanales.add(Number(m.usuario_id));
    });

    let candidatos = [];
    if (Array.isArray(contactosPermitidosBackend) && contactosPermitidosBackend.length > 0) {
      candidatos = usuarios.filter((u) => contactosPermitidosBackend.some((c) =>
        Number(c.id_usuario ?? c.usuario_id ?? c) === Number(u.id_usuario)
      ));
    } else {
      candidatos = usuarios.filter((u) => usuariosEnMisCanales.has(Number(u.id_usuario)));
    }

    return candidatos.filter((u) => {
      if (Number(u.id_usuario) === Number(user.id_usuario)) return false;
      const rolesUsuario = nombresRolesUsuario(u);
      if (esAlumno) return idsHistorial.has(Number(u.id_usuario));
      if (esTutorPuroFlag) return !rolesUsuario.includes("alumno") && !rolesUsuario.includes("tutor");
      if (rolesUsuario.includes("alumno") && !nombresRoles.includes("admin") && !nombresRoles.includes("super_admin") && !nombresRoles.includes("director") && !nombresRoles.includes("profesor")) return false;
      if (nombresRoles.includes("profesor") && rolesUsuario.includes("alumno")) return false;
      return getNombre(u.id_usuario).toLowerCase().includes(busquedaUsuario.toLowerCase());
    }).sort((a, b) => getNombre(a.id_usuario).localeCompare(getNombre(b.id_usuario)));
  }, [usuarios, miembrosCanal, mensajesDirectos, contactosPermitidosBackend, user, busquedaUsuario, esAlumno, esTutorPuroFlag, nombresRoles]);

  const puedeAgruparAlumnos = nombresRoles.some((rol) =>
    ["super_admin", "admin", "director", "profesor"].includes(rol)
  ) && !esAlumno && !esTutorPuroFlag;

  const alumnosConTutores = useMemo(() => {
    if (!puedeAgruparAlumnos) return [];

    const misCanalesIds = new Set(
      miembrosCanal
        .filter((miembro) => Number(miembro.usuario_id) === Number(user.id_usuario))
        .map((miembro) => Number(miembro.canal_id))
    );

    const canalIdsVisibles = nombresRoles.some((rol) => ["super_admin", "admin", "director"].includes(rol))
      ? new Set(miembrosCanal.map((miembro) => Number(miembro.canal_id)))
      : misCanalesIds;

    const alumnosIds = new Set();
    miembrosCanal.forEach((miembro) => {
      if (!canalIdsVisibles.has(Number(miembro.canal_id))) return;
      const usuario = usuarios.find((item) => Number(item.id_usuario) === Number(miembro.usuario_id));
      if (usuario && nombresRolesUsuario(usuario).includes("alumno")) {
        alumnosIds.add(Number(miembro.usuario_id));
      }
    });

    return usuarios
      .filter((usuario) => alumnosIds.has(Number(usuario.id_usuario)))
      .map((alumno) => {
        const alumnoId = Number(alumno.id_usuario);
        const tutoresPorId = new Map();

        relaciones.forEach((relacion) => {
          const tipo = String(relacion.tipo || "tutor").trim().toLowerCase();
          if (!["tutor", "padre", "madre"].includes(tipo)) return;

          const usuarioId = Number(relacion.usuario_id);
          const relacionadoId = Number(relacion.relacionado_id);
          let tutorId = null;

          if (usuarioId === alumnoId) tutorId = relacionadoId;
          if (relacionadoId === alumnoId) tutorId = usuarioId;
          if (tutorId === null) return;

          const tutor = usuarios.find((item) => Number(item.id_usuario) === Number(tutorId));
          if (tutor && nombresRolesUsuario(tutor).includes("tutor")) {
            tutoresPorId.set(Number(tutorId), { tutor, tipo });
          }
        });

        return {
          alumno,
          tutores: [...tutoresPorId.values()].sort((a, b) =>
            getNombre(a.tutor.id_usuario).localeCompare(getNombre(b.tutor.id_usuario))
          ),
        };
      })
      .sort((a, b) => getNombre(a.alumno.id_usuario).localeCompare(getNombre(b.alumno.id_usuario)));
  }, [puedeAgruparAlumnos, miembrosCanal, usuarios, relaciones, user, nombresRoles, rolesPorUsuario]);

  const personasParaNuevoChat = useMemo(() => {
    const personas = new Map();
    // TODO BACKEND: cuando exista GET /mensajes-directos/contactos, priorizar ese endpoint y dejar este fallback local como respaldo.
    [...contactosParaNuevoChat].forEach((usuario) => {
      personas.set(Number(usuario.id_usuario), usuario);
    });
    return [...personas.values()].sort((a, b) =>
      getNombre(a.id_usuario).localeCompare(getNombre(b.id_usuario))
    );
  }, [contactosParaNuevoChat]);

  function nombresRolesUsuario(usuarioObj) {
    const roles = [];
    const extras = rolesPorUsuario.get(Number(usuarioObj?.id_usuario)) || [];
    [...(usuarioObj?.roles || []), ...(usuarioObj?.asignaciones || []), ...extras].forEach((item) => {
      const nombre = typeof item === "string" ? item : item?.rol?.nombre || item?.nombre || item?.nombre_rol || item?.rol;
      if (typeof nombre === "string" && nombre.trim()) roles.push(nombre.toLowerCase());
    });
    return [...new Set(roles)];
  }

  const mostrarToast = (msg, tipo = "success") => {
    setToast({ msg, tipo });
    window.setTimeout(() => setToast(null), 4000);
  };

  const abrirModalMiembros = async () => {
    if (!chatActivo || chatActivo.tipo !== "canal") return;
    setModalMiembros(true);
    let miembros = await getMiembrosCanal(chatActivo.id);
    if (!miembros || miembros.length === 0) {
      miembros = miembrosCanal.filter((miembro) => Number(miembro.canal_id) === Number(chatActivo.id));
    }
    setMiembrosCanalModal(miembros);
  };

  const abrirAgregarMiembro = async () => {
    setModalAgregarMiembro(true);
    let disponibles = await getMiembrosDisponibles(chatActivo.id);
    if (!disponibles || disponibles.length === 0) {
      const idsActuales = new Set(miembrosCanalModal.map((m) => Number(m.usuario_id)));
      disponibles = usuarios.filter((u) => !idsActuales.has(Number(u.id_usuario))).map((u) => u);
    }
    setUsuariosDisponibles(disponibles);
  };

  const agregarMiembro = async (usuarioId) => {
    try {
      await crearMiembroCanal({ usuario_id: usuarioId, canal_id: chatActivo.id, rol_en_canal: rolNuevoMiembro });
      invalidarMiembroCanal(chatActivo.id);
      const actualizados = await getMiembrosCanal(chatActivo.id);
      setMiembrosCanalModal(actualizados.length > 0
        ? actualizados
        : miembrosCanal.filter((miembro) => Number(miembro.canal_id) === Number(chatActivo.id)));
      setModalAgregarMiembro(false);
      mostrarToast("Miembro agregado correctamente", "success");
    } catch {
      mostrarToast("Aún no disponible, falta backend", "error");
    }
  };

  const quitarMiembro = async (miembro) => {
    const admins = miembrosCanalModal.filter((m) => m.rol_en_canal === "admin");
    const esAuto = Number(miembro.usuario_id) === Number(user.id_usuario);
    if (esAuto && admins.length === 1 && miembro.rol_en_canal === "admin") {
      mostrarToast("No puedes quitarte: eres el último administrador", "error");
      return;
    }
    if (!window.confirm(`¿Quitar a ${getNombre(miembro.usuario_id)} del canal?`)) return;

    try {
      await eliminarMiembroCanal(miembro.id_miembro_canal);
      invalidarMiembroCanal(chatActivo.id);
      setMiembrosCanalModal((prev) => prev.filter((m) =>
        Number(m.id_miembro_canal) !== Number(miembro.id_miembro_canal)
      ));
      mostrarToast("Miembro eliminado", "success");
    } catch {
      mostrarToast("Aún no disponible, falta backend", "error");
    }
  };

  if (cargando) return <p style={{ textAlign: "center", padding: "2rem" }}>Cargando...</p>;

  const formatearHora = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha.endsWith('Z') ? fecha : fecha + 'Z');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="mensajes">
      {canales.map(canal => (
        <CanalListener 
          key={`listener-${canal.id_canal}`} 
          canalId={canal.id_canal} 
          userId={user.id_usuario}
          onNuevoMensaje={handleNuevoMensajeCanalFondo}
        />
      ))}
      
      <div className="mensajes__body">
        
        <div className={`mensajes__list-panel ${chatActivo ? "mensajes__list-panel--hidden-mobile" : ""}`}>
          <div className="mensajes__list-header">
            <h1 className="mensajes__title">Mensajes</h1>
            {!esAlumno && (
              <button className="mensajes__new-btn" onClick={() => setModalNuevoChat(true)} title="Nuevo mensaje"><Plus size={20} /></button>
            )}
          </div>

          <div className="mensajes__search-contacts" style={{ margin: "0 1rem 1rem 1rem", border: "none", padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--color-gris-azulado)", padding: "8px 12px", borderRadius: "8px", width: "100%" }}>
              <Search size={16} style={{ color: "var(--texto-secundario)" }} />
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", marginLeft: "8px", width: "100%" }} />
            </div>
          </div>

          <div className="mensajes__list">
            {canalesFiltrados.length > 0 && (
              <>
                <p className="mensajes__section-title">Canales</p>
                {canalesFiltrados.map((canal) => (
                  <button key={`c-${canal.id_canal}`} className={`mensajes__item ${chatActivo?.tipo === "canal" && chatActivo?.id === canal.id_canal ? "mensajes__item--active" : ""}`} onClick={() => setChatActivo({ tipo: "canal", id: canal.id_canal, nombre: canal.nombre })}>
                    <div className="mensajes__avatar mensajes__avatar--canal"><Hash size={20} /></div>
                    <div className="mensajes__item-content">
                      <div className="mensajes__item-top">
                        <span className="mensajes__item-name">{canal.nombre}</span>
                        {noLeidos[`canal-${canal.id_canal}`] > 0 && (
                          <span style={{ backgroundColor: "var(--color-turquesa-claro)", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "0.7rem", fontWeight: "bold" }}>
                            {noLeidos[`canal-${canal.id_canal}`]}
                          </span>
                        )}
                      </div>
                      <p className="mensajes__item-snippet">Canal de {canal.tipo}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {usuariosFiltrados.length > 0 && (
              <>
                <p className="mensajes__section-title">Mensajes Directos</p>
                {usuariosFiltrados.map((u) => (
                  <button key={`u-${u.id_usuario}`} className={`mensajes__item ${chatActivo?.tipo === "directo" && chatActivo?.id === u.id_usuario ? "mensajes__item--active" : ""}`} onClick={() => setChatActivo({ tipo: "directo", id: u.id_usuario, nombre: getNombre(u.id_usuario) })}>
                    <div className="mensajes__avatar">{u.perfil?.foto_perfil ? <img src={u.perfil.foto_perfil} alt={`Foto de ${getNombre(u.id_usuario)}`} /> : getNombre(u.id_usuario).charAt(0).toUpperCase()}</div>
                    <div className="mensajes__item-content">
                      <div className="mensajes__item-top">
                        <span className="mensajes__item-name">{getNombre(u.id_usuario)}</span>
                        {noLeidos[`directo-${u.id_usuario}`] > 0 && (
                          <span style={{ backgroundColor: "var(--color-turquesa-claro)", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "0.7rem", fontWeight: "bold" }}>
                            {noLeidos[`directo-${u.id_usuario}`]}
                          </span>
                        )}
                      </div>
                      <p className="mensajes__item-snippet">{getUltimoMensaje(u.id_usuario)}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {(canalesFiltrados.length === 0 && usuariosFiltrados.length === 0) && <p className="mensajes__list-empty">No se encontraron conversaciones.</p>}
          </div>
        </div>

        <div className={`mensajes__chat-panel ${chatActivo ? "mensajes__chat-panel--visible-mobile" : ""}`}>
          {chatActivo ? (
            <>
              <div className="mensajes__chat-header">
                <button className="mensajes__back" onClick={() => setChatActivo(null)}><ChevronLeft size={20} /></button>
                <div className={`mensajes__avatar mensajes__avatar--sm ${chatActivo.tipo === "canal" ? "mensajes__avatar--canal" : ""}`}>
                  {chatActivo.tipo === "canal" ? <Hash size={16} /> : getFotoPerfil(chatActivo.id) ? <img src={getFotoPerfil(chatActivo.id)} alt={`Foto de ${chatActivo.nombre}`} /> : chatActivo.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="mensajes__chat-name">{chatActivo.nombre}</p>
                  <p className="mensajes__chat-cargo" style={{ color: "var(--color-verde-teal)" }}>
                    🟢 En línea
                  </p>
                  {chatActivo.tipo === "canal" && miRolEnCanalActivo && (
                    <span className={`mensajes__rol-badge mensajes__rol-badge--${miRolEnCanalActivo}`}>
                      {miRolEnCanalActivo === "admin" ? "Admin" : miRolEnCanalActivo === "observador" ? "Observador" : "Miembro"}
                    </span>
                  )}
                  {chatActivo.tipo === "canal" && esTutorPuroFlag && (
                    <span className="mensajes__rol-badge mensajes__rol-badge--observador">Tutor (lectura)</span>
                  )}
                </div>
                {chatActivo.tipo === "canal" && miRolEnCanalActivo === "admin" && (
                  <button type="button" className="mensajes__members-btn" onClick={abrirModalMiembros} title="Miembros del canal">
                    <Users size={18} />
                  </button>
                )}
              </div>

              <div className="mensajes__bubbles">
                {mensajes.length === 0 && <p className="mensajes__bubbles-empty">No hay mensajes aún.</p>}

                {mensajes.map((m, index) => {
                  const esMio = chatActivo.tipo === "canal" ? m.usuario_id === user.id_usuario : m.emisor_id === user.id_usuario;
                  return (
                    <div key={m.id_mensaje || m.id_mensaje_directo || index} className={`mensajes__bubble ${esMio ? "mensajes__bubble--propio" : ""}`}>
                      {!esMio && chatActivo.tipo === "canal" && (
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px", color: "var(--color-azul-petroleo)" }}>{getNombre(m.usuario_id)}</span>
                      )}
                      <p>{m.contenido}</p>
                      <span className="mensajes__bubble-time">{formatearHora(m.fecha_envio)}</span>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>

              {puedeEscribirActivo || chatActivo.tipo !== "canal" ? (
                <form className="mensajes__input-row" onSubmit={handleEnviar}>
                  <input type="text" placeholder="Escribí un mensaje..." value={texto} onChange={(e) => setTexto(e.target.value)} />
                  <button type="submit" disabled={!texto.trim()}><Send size={18} /></button>
                </form>
              ) : (
                <div className="mensajes__readonly">🔒 Solo lectura — {motivoBloqueo}</div>
              )}
            </>
          ) : (
            <div className="mensajes__empty-state">
              <p>Seleccioná una conversación</p>
              <span>para comenzar a chatear</span>
            </div>
          )}
        </div>
      </div>

      {modalNuevoChat && !esAlumno && (
        <Modal title="Nuevo mensaje" onClose={() => setModalNuevoChat(false)}>
          <form
            className="mensajes__new-message-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!destinoNuevoChat) return;
              setChatActivo(destinoNuevoChat);
              setModalNuevoChat(false);
            }}
          >
            <div className="mensajes__new-message-tabs">
              <button
                type="button"
                className={`mensajes__new-message-tab${pestanaNuevoChat === "canal" ? " mensajes__new-message-tab--active" : ""}`}
                onClick={() => {
                  setPestanaNuevoChat("canal");
                  setDestinoNuevoChat(null);
                }}
              >
                <Hash size={15} /> Canal
              </button>
              <button
                type="button"
                className={`mensajes__new-message-tab${pestanaNuevoChat === "persona" ? " mensajes__new-message-tab--active" : ""}`}
                onClick={() => {
                  setPestanaNuevoChat("persona");
                  setDestinoNuevoChat(null);
                }}
              >
                <Users size={15} /> Persona
              </button>
            </div>

            <div className="mensajes__search-contacts">
              <Search size={18} />
              <input
                type="text"
                placeholder={pestanaNuevoChat === "canal" ? "Buscar canal..." : "Buscar persona..."}
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mensajes__new-message-list">
              {pestanaNuevoChat === "canal" && canalesParaNuevoChat
                .filter((canal) => canal.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()))
                .map((canal) => {
                  const seleccionado = destinoNuevoChat?.tipo === "canal" &&
                    Number(destinoNuevoChat.id) === Number(canal.id_canal);
                  const tipoCanal = String(canal.tipo || "chat").toLowerCase() === "informativo"
                    ? "📢 Informativo"
                    : "💬 Chat";
                  return (
                    <button
                      key={`nuevo-canal-${canal.id_canal}`}
                      type="button"
                      className={`mensajes__new-message-item${seleccionado ? " mensajes__new-message-item--selected" : ""}`}
                      onClick={() => setDestinoNuevoChat({ tipo: "canal", id: canal.id_canal, nombre: canal.nombre })}
                    >
                      <div className="mensajes__avatar mensajes__avatar--canal"><Hash size={18} /></div>
                      <div>
                        <p className="mensajes__contact-name">{canal.nombre}</p>
                        <p className="mensajes__contact-cargo">{tipoCanal}</p>
                      </div>
                    </button>
                  );
                })}

              {pestanaNuevoChat === "persona" && puedeAgruparAlumnos && (
                <>
                  <div className="mensajes__alumnos-seccion">
                    <p className="mensajes__alumnos-seccion-titulo">Alumnos</p>
                    {alumnosConTutores
                      .filter(({ alumno, tutores }) => {
                        const texto = busquedaUsuario.trim().toLowerCase();
                        if (!texto) return true;
                        const coincideAlumno = getNombre(alumno.id_usuario).toLowerCase().includes(texto) ||
                          String(alumno.nombre_usuario || "").toLowerCase().includes(texto);
                        const coincideTutor = tutores.some(({ tutor }) =>
                          getNombre(tutor.id_usuario).toLowerCase().includes(texto) ||
                          String(tutor.nombre_usuario || "").toLowerCase().includes(texto)
                        );
                        return coincideAlumno || coincideTutor;
                      })
                      .map(({ alumno, tutores }) => {
                        const seleccionadoAlumno = destinoNuevoChat?.tipo === "directo" &&
                          Number(destinoNuevoChat.id) === Number(alumno.id_usuario);
                        const abierto = Number(alumnoExpandido) === Number(alumno.id_usuario);
                        return (
                          <div className="mensajes__alumno-grupo" key={`alumno-grupo-${alumno.id_usuario}`}>
                            <button
                              type="button"
                              className={`mensajes__alumno-fila mensajes__new-message-item${seleccionadoAlumno ? " mensajes__new-message-item--selected" : ""}${abierto ? " mensajes__alumno-fila--open" : ""}`}
                              onClick={() => {
                                setChatActivo({ tipo: "directo", id: alumno.id_usuario, nombre: getNombre(alumno.id_usuario) });
                                setModalNuevoChat(false);
                              }}
                            >
                              <div className="mensajes__avatar">
                                {alumno.perfil?.foto_perfil
                                  ? <img src={alumno.perfil.foto_perfil} alt={`Foto de ${getNombre(alumno.id_usuario)}`} />
                                  : getNombre(alumno.id_usuario).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="mensajes__contact-name">{getNombre(alumno.id_usuario)}</p>
                                <div className="mensajes__contact-meta">
                                  <span className="mensajes__contact-username">@{alumno.nombre_usuario}</span>
                                  <span className="mensajes__contact-roles"> · {rolPrincipalDe(alumno, rolesPorUsuario.get(alumno.id_usuario) || []) || "Alumno"}</span>
                                </div>
                              </div>
                            </button>

                            {tutores.length > 0 && (
                              <button
                                type="button"
                                className="mensajes__alumno-tutores-btn"
                                onClick={() => setAlumnoExpandido(abierto ? null : alumno.id_usuario)}
                                aria-label="Ver tutores"
                              >
                                <span>{tutores.length} tutor{tutores.length === 1 ? "" : "es"}</span>
                                <ChevronDown size={16} className={abierto ? "mensajes__chev--abierto" : "mensajes__chev"} />
                              </button>
                            )}

                            {abierto && (
                              <div className="mensajes__tutor-sublista">
                                {tutores
                                  .filter(({ tutor }) => {
                                    const texto = busquedaUsuario.trim().toLowerCase();
                                    if (!texto) return true;
                                    return getNombre(tutor.id_usuario).toLowerCase().includes(texto) ||
                                      String(tutor.nombre_usuario || "").toLowerCase().includes(texto);
                                  })
                                  .map(({ tutor, tipo }) => {
                                    const seleccionadoTutor = destinoNuevoChat?.tipo === "directo" &&
                                      Number(destinoNuevoChat.id) === Number(tutor.id_usuario);
                                    const tipoTutor = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Tutor";
                                    return (
                                      <button
                                        type="button"
                                        key={`tutor-${tutor.id_usuario}`}
                                        className={`mensajes__tutor-fila mensajes__new-message-item${seleccionadoTutor ? " mensajes__new-message-item--selected" : ""}`}
                                        onClick={() => {
                                          setChatActivo({ tipo: "directo", id: tutor.id_usuario, nombre: getNombre(tutor.id_usuario) });
                                          setModalNuevoChat(false);
                                        }}
                                      >
                                        <div className="mensajes__avatar">
                                          {tutor.perfil?.foto_perfil
                                            ? <img src={tutor.perfil.foto_perfil} alt={`Foto de ${getNombre(tutor.id_usuario)}`} />
                                            : getNombre(tutor.id_usuario).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="mensajes__contact-name">{getNombre(tutor.id_usuario)}</p>
                                          <div className="mensajes__contact-meta">
                                            <span className="mensajes__contact-username">@{tutor.nombre_usuario}</span>
                                            <span className="mensajes__contact-roles"> · {rolPrincipalDe(tutor, rolesPorUsuario.get(tutor.id_usuario) || []) || "Tutor"} ({tipoTutor})</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="mensajes__otros-contactos-seccion">
                    <p className="mensajes__alumnos-seccion-titulo">Otros contactos</p>
                    {personasParaNuevoChat
                      .filter((usuario) => {
                        const texto = busquedaUsuario.trim().toLowerCase();
                        const idsAgrupados = new Set(alumnosConTutores.flatMap(({ alumno, tutores }) => [
                          Number(alumno.id_usuario),
                          ...tutores.map(({ tutor }) => Number(tutor.id_usuario)),
                        ]));
                        if (idsAgrupados.has(Number(usuario.id_usuario))) return false;
                        return !texto || getNombre(usuario.id_usuario).toLowerCase().includes(texto) ||
                          String(usuario.nombre_usuario || "").toLowerCase().includes(texto);
                      })
                      .map((usuario) => {
                        const seleccionado = destinoNuevoChat?.tipo === "directo" &&
                          Number(destinoNuevoChat.id) === Number(usuario.id_usuario);
                        return (
                          <button
                            key={`nuevo-contacto-${usuario.id_usuario}`}
                            type="button"
                            className={`mensajes__new-message-item${seleccionado ? " mensajes__new-message-item--selected" : ""}`}
                            onClick={() => {
                              setChatActivo({ tipo: "directo", id: usuario.id_usuario, nombre: getNombre(usuario.id_usuario) });
                              setModalNuevoChat(false);
                            }}
                          >
                            <div className="mensajes__avatar">
                              {usuario.perfil?.foto_perfil
                                ? <img src={usuario.perfil.foto_perfil} alt={`Foto de ${getNombre(usuario.id_usuario)}`} />
                                : getNombre(usuario.id_usuario).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="mensajes__contact-name">{getNombre(usuario.id_usuario)}</p>
                              <div className="mensajes__contact-meta">
                                <span className="mensajes__contact-username">@{usuario.nombre_usuario}</span>
                                <span className="mensajes__contact-roles"> · {rolPrincipalDe(usuario, rolesPorUsuario.get(usuario.id_usuario) || []) || "Usuario"}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}

              {pestanaNuevoChat === "persona" && !puedeAgruparAlumnos && personasParaNuevoChat
                .filter((usuario) =>
                  getNombre(usuario.id_usuario).toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
                  String(usuario.nombre_usuario || "").toLowerCase().includes(busquedaUsuario.toLowerCase())
                )
                .map((usuario) => {
                  const seleccionado = destinoNuevoChat?.tipo === "directo" &&
                    Number(destinoNuevoChat.id) === Number(usuario.id_usuario);
                  return (
                    <button
                      key={`nuevo-contacto-${usuario.id_usuario}`}
                      type="button"
                      className={`mensajes__new-message-item${seleccionado ? " mensajes__new-message-item--selected" : ""}`}
                      onClick={() => {
                        setChatActivo({ tipo: "directo", id: usuario.id_usuario, nombre: getNombre(usuario.id_usuario) });
                        setModalNuevoChat(false);
                      }}
                    >
                      <div className="mensajes__avatar">
                        {usuario.perfil?.foto_perfil
                          ? <img src={usuario.perfil.foto_perfil} alt={`Foto de ${getNombre(usuario.id_usuario)}`} />
                          : getNombre(usuario.id_usuario).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="mensajes__contact-name">{getNombre(usuario.id_usuario)}</p>
                        <div className="mensajes__contact-meta">
                          <span className="mensajes__contact-username">@{usuario.nombre_usuario}</span>
                          <span className="mensajes__contact-roles"> · {rolPrincipalDe(usuario, rolesPorUsuario.get(usuario.id_usuario) || []) || "Usuario"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {pestanaNuevoChat === "canal" && canalesParaNuevoChat
                .filter((canal) => canal.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())).length === 0 && (
                  <p className="mensajes__new-message-hint">No hay canales disponibles para escribir.</p>
                )}

              {pestanaNuevoChat === "persona" && !busquedaUsuario && alumnosConTutores.length === 0 && personasParaNuevoChat.length === 0 && (
                esTutorPuroFlag
                  ? <p className="mensajes__new-message-hint">Los contactos disponibles aparecerán cuando el sistema de permisos esté completo.</p>
                  : <p className="mensajes__new-message-hint">No se encontraron contactos permitidos.</p>
              )}
            </div>

            {destinoNuevoChat && (
              <p className="mensajes__new-message-hint">Seleccionado: {destinoNuevoChat.nombre}</p>
            )}

            <div className="mensajes__new-message-footer">
              <button
                type="button"
                className="mensajes__new-message-cancel"
                onClick={() => setModalNuevoChat(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="mensajes__new-message-submit"
                disabled={!destinoNuevoChat}
              >
                Abrir conversación
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalMiembros && chatActivo?.tipo === "canal" && miRolEnCanalActivo === "admin" && (
        <Modal title="Miembros del canal" onClose={() => { setModalMiembros(false); setModalAgregarMiembro(false); }}>
          <button type="button" className="mensajes__add-member-btn" onClick={abrirAgregarMiembro} title="Añadir miembro">
            <UserPlus size={18} /> Añadir miembro
          </button>
          <div className="mensajes__contacts-list">
            {miembrosCanalModal.map((miembro) => {
              const usuario = usuarios.find((u) => Number(u.id_usuario) === Number(miembro.usuario_id));
              return (
                <div key={miembro.id_miembro_canal || miembro.usuario_id} className="mensajes__contact-item">
                  <div className="mensajes__avatar">{usuario?.perfil?.foto_perfil ? <img src={usuario.perfil.foto_perfil} alt="" /> : getNombre(miembro.usuario_id).charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <p className="mensajes__contact-name">{getNombre(miembro.usuario_id)}</p>
                    <div className="mensajes__contact-meta">
                      <span className="mensajes__contact-username">@{usuario?.nombre_usuario || "usuario"}</span>
                      <span className="mensajes__contact-roles"> · {usuario ? (rolPrincipalDe(usuario, rolesPorUsuario.get(usuario.id_usuario) || []) || "Usuario") : "Usuario"}</span>
                    </div>
                    <span className={`mensajes__rol-badge mensajes__rol-badge--${miembro.rol_en_canal}`}>{miembro.rol_en_canal}</span>
                  </div>
                  <button type="button" className="mensajes__remove-member-btn" onClick={() => quitarMiembro(miembro)} title="Quitar miembro"><X size={16} /></button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {modalAgregarMiembro && chatActivo?.tipo === "canal" && miRolEnCanalActivo === "admin" && (
        <Modal title="Añadir miembro" onClose={() => setModalAgregarMiembro(false)}>
          <div className="mensajes__rol-option mensajes__rol-option--active" style={{ marginBottom: "var(--space-sm)" }}>
            <button type="button" className={rolNuevoMiembro === "miembro" ? "mensajes__rol-option mensajes__rol-option--active" : "mensajes__rol-option"} onClick={() => setRolNuevoMiembro("miembro")}>Miembro</button>
            <button type="button" className={rolNuevoMiembro === "observador" ? "mensajes__rol-option mensajes__rol-option--active" : "mensajes__rol-option"} onClick={() => setRolNuevoMiembro("observador")}>Observador</button>
          </div>
          <div className="mensajes__contacts-list">
            {usuariosDisponibles.map((usuario) => (
              <button key={`disponible-${usuario.id_usuario}`} type="button" className="mensajes__contact-item" onClick={() => agregarMiembro(usuario.id_usuario)}>
                <div className="mensajes__avatar">{usuario?.perfil?.foto_perfil ? <img src={usuario.perfil.foto_perfil} alt="" /> : getNombre(usuario.id_usuario).charAt(0).toUpperCase()}</div>
                <div>
                  <p className="mensajes__contact-name">{getNombre(usuario.id_usuario)}</p>
                  <div className="mensajes__contact-meta"><span className="mensajes__contact-username">@{usuario.nombre_usuario}</span></div>
                </div>
              </button>
            ))}
            {usuariosDisponibles.length === 0 && <p className="mensajes__list-empty">No hay usuarios disponibles.</p>}
          </div>
        </Modal>
      )}

      {toast && <div className={`mensajes__toast mensajes__toast--${toast.tipo}`}>{toast.msg}</div>}
    </section>
  );
}