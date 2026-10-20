import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Send, Search, Hash, ChevronLeft, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { listarMensajes } from "../../api/mensajes";
import { listarMensajesDirectos } from "../../api/mensajesDirectos";
import { listarUsuarios } from "../../api/usuarios";
import { listarCanales } from "../../api/canales";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import Modal from "../../components/ui/Modal/Modal";
import "./Mensajes.css";

export default function Mensajes() {
  const { user, hasRole } = useAuth();
  
  // --- ESTADOS DE DATOS ---
  const [canales, setCanales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);
  const [mensajesDirectos, setMensajesDirectos] = useState([]);
  
  // --- ESTADOS DE UI ---
  const [chatActivo, setChatActivo] = useState(null); 
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  // --- MODAL NUEVO CHAT ---
  const [modalNuevoChat, setModalNuevoChat] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  const mensajesEndRef = useRef(null);

  // 1. Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resCanales, resUsuarios, resMiembros, resDMs] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarMiembrosCanal(),
          listarMensajesDirectos()
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
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    }
    if (user) cargarDatos();
  }, [user, hasRole]);

  // 2. Cargar historial cuando cambia el chat activo
  useEffect(() => {
    if (!chatActivo) return;
    setMensajes([]);

    if (chatActivo.tipo === "canal") {
      listarMensajes(chatActivo.id)
        .then(data => {
          const ordenados = data.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
          setMensajes(ordenados);
        });
    } else {
      const misDMs = mensajesDirectos.filter(dm => 
        (dm.emisor_id === user.id_usuario && dm.receptor_id === chatActivo.id) ||
        (dm.emisor_id === chatActivo.id && dm.receptor_id === user.id_usuario)
      );
      const ordenados = misDMs.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
      setMensajes(ordenados);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatActivo]);

  // 3. Conectar WebSocket
  const wsPath = chatActivo 
    ? (chatActivo.tipo === "canal" ? `canal/${chatActivo.id}` : `directo/${user.id_usuario}`) 
    : null;

  const handleNuevoMensajeWS = useCallback((nuevoMensaje) => {
    if (!chatActivo) return;
    if (chatActivo.tipo === "canal") {
      setMensajes(prev => [...prev, nuevoMensaje]);
    } else {
      if (
        (nuevoMensaje.emisor_id === user.id_usuario && nuevoMensaje.receptor_id === chatActivo.id) ||
        (nuevoMensaje.emisor_id === chatActivo.id && nuevoMensaje.receptor_id === user.id_usuario)
      ) {
        setMensajes(prev => [...prev, nuevoMensaje]);
      }
    }
  }, [chatActivo, user.id_usuario]);

  const { isConnected, sendMessage } = useWebSocket(wsPath, handleNuevoMensajeWS);

  // 4. Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || !isConnected || !chatActivo) return;

    if (chatActivo.tipo === "canal") {
      sendMessage({ contenido: texto, usuario_id: user.id_usuario });
    } else {
      sendMessage({ contenido: texto, receptor_id: chatActivo.id });
    }
    setTexto("");
  };

  const getNombre = (id) => {
    const u = usuarios.find(x => x.id_usuario === id);
    return u?.perfil ? `${u.perfil.nombres} ${u.perfil.apellidos}` : u?.nombre_usuario || "Desconocido";
  };

  // --- FILTROS DE BÚSQUEDA ---
  const canalesFiltrados = canales.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  
  const usuariosFiltrados = useMemo(() => {
    const idsConHistorial = new Set();
    mensajesDirectos.forEach(dm => {
      if (dm.emisor_id === user.id_usuario) idsConHistorial.add(dm.receptor_id);
      if (dm.receptor_id === user.id_usuario) idsConHistorial.add(dm.emisor_id);
    });
    // Filtramos por búsqueda también
    return usuarios.filter(u => 
      idsConHistorial.has(u.id_usuario) && 
      u.id_usuario !== user.id_usuario &&
      getNombre(u.id_usuario).toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [usuarios, mensajesDirectos, user.id_usuario, busqueda]);

    const contactosParaNuevoChat = useMemo(() => {
      // 1. Obtener los IDs de los canales a los que YO pertenezco
      const misCanalesIds = miembrosCanal
        .filter(m => Number(m.usuario_id) === Number(user.id_usuario))
        .map(m => Number(m.canal_id));

      // 2. Obtener los IDs de los usuarios que están en ESOS canales
      const usuariosEnMisCanales = new Set();
      miembrosCanal.forEach(m => {
        if (misCanalesIds.includes(Number(m.canal_id))) {
          usuariosEnMisCanales.add(Number(m.usuario_id));
        }
      });

      // 3. Filtrar la lista de usuarios generales
      return usuarios
        .filter(u => 
          usuariosEnMisCanales.has(Number(u.id_usuario)) && // Está en mis canales
          Number(u.id_usuario) !== Number(user.id_usuario) && // No soy yo
          getNombre(u.id_usuario).toLowerCase().includes(busquedaUsuario.toLowerCase()) // Coincide con la búsqueda
        )
        .sort((a, b) => getNombre(a.id_usuario).localeCompare(getNombre(b.id_usuario))); // Ordenar alfabéticamente
    }, [usuarios, miembrosCanal, user.id_usuario, busquedaUsuario]);

  if (cargando) return <p style={{ textAlign: "center", padding: "2rem" }}>Cargando...</p>;

  return (
    <section className="mensajes">
      <div className="mensajes__body">
        
        {/* PANEL IZQUIERDO: LISTA ÚNICA CON SCROLL */}
        <div className={`mensajes__list-panel ${chatActivo ? "mensajes__list-panel--hidden-mobile" : ""}`}>
          <div className="mensajes__list-header">
            <h1 className="mensajes__title">Mensajes</h1>
            <button className="mensajes__new-btn" onClick={() => setModalNuevoChat(true)}>
              <Plus size={20} />
            </button>
          </div>

          <div className="mensajes__search-contacts" style={{ margin: "0 1rem 1rem 1rem", border: "none", padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--color-gris-azulado)", padding: "8px 12px", borderRadius: "8px", width: "100%" }}>
              <Search size={16} style={{ color: "var(--texto-secundario)" }} />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", marginLeft: "8px", width: "100%" }}
              />
            </div>
          </div>

          <div className="mensajes__list">
            {/* SECCIÓN CANALES */}
            {canalesFiltrados.length > 0 && (
              <>
                <p className="mensajes__section-title">Canales</p>
                {canalesFiltrados.map((canal) => (
                  <button
                    key={`c-${canal.id_canal}`}
                    className={`mensajes__item ${chatActivo?.tipo === "canal" && chatActivo?.id === canal.id_canal ? "mensajes__item--active" : ""}`}
                    onClick={() => setChatActivo({ tipo: "canal", id: canal.id_canal, nombre: canal.nombre })}
                  >
                    <div className="mensajes__avatar mensajes__avatar--canal"><Hash size={20} /></div>
                    <div className="mensajes__item-content">
                      <div className="mensajes__item-top"><span className="mensajes__item-name">{canal.nombre}</span></div>
                      <p className="mensajes__item-snippet">Canal de {canal.tipo}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* SECCIÓN DIRECTOS */}
            {usuariosFiltrados.length > 0 && (
              <>
                <p className="mensajes__section-title">Mensajes Directos</p>
                {usuariosFiltrados.map((u) => (
                  <button
                    key={`u-${u.id_usuario}`}
                    className={`mensajes__item ${chatActivo?.tipo === "directo" && chatActivo?.id === u.id_usuario ? "mensajes__item--active" : ""}`}
                    onClick={() => setChatActivo({ tipo: "directo", id: u.id_usuario, nombre: getNombre(u.id_usuario) })}
                  >
                    <div className="mensajes__avatar">{getNombre(u.id_usuario).charAt(0)}</div>
                    <div className="mensajes__item-content">
                      <div className="mensajes__item-top"><span className="mensajes__item-name">{getNombre(u.id_usuario)}</span></div>
                      <p className="mensajes__item-snippet">Mensaje privado</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {(canalesFiltrados.length === 0 && usuariosFiltrados.length === 0) && (
              <p className="mensajes__list-empty">No se encontraron conversaciones.</p>
            )}
          </div>
        </div>

        {/* PANEL DERECHO (CHAT) */}
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
                  <p className="mensajes__chat-cargo" style={{ color: isConnected ? "var(--color-verde-teal)" : "#C0292C" }}>
                    {isConnected ? "🟢 En línea" : "🔴 Desconectado"}
                  </p>
                </div>
              </div>

              <div className="mensajes__bubbles">
                {mensajes.length === 0 && <p className="mensajes__bubbles-empty">No hay mensajes aún.</p>}

                {mensajes.map((m, index) => {
                  const esMio = chatActivo.tipo === "canal" 
                    ? m.usuario_id === user.id_usuario 
                    : m.emisor_id === user.id_usuario;
                  
                  return (
                    <div key={m.id_mensaje || m.id_mensaje_directo || index} className={`mensajes__bubble ${esMio ? "mensajes__bubble--propio" : ""}`}>
                      {!esMio && chatActivo.tipo === "canal" && (
                        <span style={{ fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px", color: "var(--color-azul-petroleo)" }}>
                          {getNombre(m.usuario_id)}
                        </span>
                      )}
                      <p>{m.contenido}</p>
                      <span className="mensajes__bubble-time">
                        {new Date(m.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>

              <form className="mensajes__input-row" onSubmit={handleEnviar}>
                <input
                  type="text"
                  placeholder="Escribí un mensaje..."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  disabled={!isConnected}
                />
                <button type="submit" disabled={!isConnected || !texto.trim()}><Send size={18} /></button>
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

      {/* MODAL NUEVO CHAT */}
      {modalNuevoChat && (
        <Modal title="Nuevo mensaje directo" onClose={() => setModalNuevoChat(false)}>
          <div className="mensajes__search-contacts" style={{ marginBottom: "1rem" }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="mensajes__contacts-list">
            {contactosParaNuevoChat.length === 0 && (
              <p className="mensajes__list-empty">No se encontraron usuarios.</p>
            )}
            {contactosParaNuevoChat.map((u) => (
              <button 
                key={u.id_usuario} 
                className="mensajes__contact-item" 
                onClick={() => {
                  setChatActivo({ tipo: "directo", id: u.id_usuario, nombre: getNombre(u.id_usuario) });
                  setModalNuevoChat(false);
                }}
              >
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