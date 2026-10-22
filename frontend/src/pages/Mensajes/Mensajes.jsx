import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Search, Hash, ChevronLeft, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { listarMensajes } from "../../api/mensajes";
import { listarMensajesDirectos, actualizarMensajeDirecto } from "../../api/mensajesDirectos";
import { listarMensajesVistos, crearMensajeVisto } from "../../api/mensajesVistos";
import { listarUsuarios } from "../../api/usuarios";
import { listarCanales } from "../../api/canales";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
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

export default function Mensajes() {
  const { user, hasRole } = useAuth();
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

  const mensajesEndRef = useRef(null);
  const chatActivoRef = useRef(chatActivo);

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
        const [resCanales, resUsuarios, resMiembros, resDMs, resVistos] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarMiembrosCanal(),
          listarMensajesDirectos(),
          listarMensajesVistos()
        ]);

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

  const contactosParaNuevoChat = useMemo(() => {
    const misCanalesIds = miembrosCanal.filter(m => Number(m.usuario_id) === Number(user.id_usuario)).map(m => Number(m.canal_id));
    const usuariosEnMisCanales = new Set();
    miembrosCanal.forEach(m => { if (misCanalesIds.includes(Number(m.canal_id))) usuariosEnMisCanales.add(Number(m.usuario_id)); });

    return usuarios
      .filter(u => 
        usuariosEnMisCanales.has(Number(u.id_usuario)) && 
        Number(u.id_usuario) !== Number(user.id_usuario) && 
        getNombre(u.id_usuario).toLowerCase().includes(busquedaUsuario.toLowerCase())
      )
      .sort((a, b) => getNombre(a.id_usuario).localeCompare(getNombre(b.id_usuario)));
  }, [usuarios, miembrosCanal, user.id_usuario, busquedaUsuario]);

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
            <button className="mensajes__new-btn" onClick={() => setModalNuevoChat(true)}><Plus size={20} /></button>
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
                    <div className="mensajes__avatar">{getNombre(u.id_usuario).charAt(0)}</div>
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
                  {chatActivo.tipo === "canal" ? <Hash size={16} /> : chatActivo.nombre.charAt(0)}
                </div>
                <div>
                  <p className="mensajes__chat-name">{chatActivo.nombre}</p>
                  <p className="mensajes__chat-cargo" style={{ color: "var(--color-verde-teal)" }}>
                    🟢 En línea
                  </p>
                </div>
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

              <form className="mensajes__input-row" onSubmit={handleEnviar}>
                <input type="text" placeholder="Escribí un mensaje..." value={texto} onChange={(e) => setTexto(e.target.value)} />
                <button type="submit" disabled={!texto.trim()}><Send size={18} /></button>
              </form>
            </>
          ) : (
            <div className="mensajes__empty-state">
              <p>Seleccioná una conversación</p>
              <span>para comenzar a chatear</span>
            </div>
          )}
        </div>
      </div>

      {modalNuevoChat && (
        <Modal title="Nuevo mensaje directo" onClose={() => setModalNuevoChat(false)}>
          <div className="mensajes__search-contacts" style={{ marginBottom: "1rem" }}>
            <Search size={18} />
            <input type="text" placeholder="Buscar usuario..." value={busquedaUsuario} onChange={(e) => setBusquedaUsuario(e.target.value)} autoFocus />
          </div>
          
          <div className="mensajes__contacts-list">
            {contactosParaNuevoChat.length === 0 && <p className="mensajes__list-empty">No se encontraron usuarios.</p>}
            {contactosParaNuevoChat.map((u) => (
              <button key={u.id_usuario} className="mensajes__contact-item" onClick={() => { setChatActivo({ tipo: "directo", id: u.id_usuario, nombre: getNombre(u.id_usuario) }); setModalNuevoChat(false); }}>
                <div className="mensajes__avatar">{getNombre(u.id_usuario).charAt(0)}</div>
                <div>
                  <p className="mensajes__contact-name">{getNombre(u.id_usuario)}</p>
                  <p className="mensajes__contact-cargo">@{u.nombre_usuario}</p>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}