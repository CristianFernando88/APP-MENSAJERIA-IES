import { useState } from "react";
import { Send, Plus, Search, X, Hash } from "lucide-react";
import Modal from "../../components/ui/Modal/Modal";
import "./Mensajes.css";


const CONTACTOS = [
  { id: 1, nombre: "Martina Ruiz", rol: "admin", cargo: "Preceptor" },
  { id: 2, nombre: "Ana Pérez", rol: "admin", cargo: "Directora" },
  { id: 3, nombre: "Roberto Pérez", rol: "tutor", cargo: "Tutor de Mateo Castro" },
  { id: 4, nombre: "María Gómez", rol: "tutor", cargo: "Tutora de Sofía Gómez" },
  { id: 5, nombre: "Mateo Castro", rol: "alumno", cargo: "4to Grado A" },
];

const CANALES = [
  { id: 101, nombre: "4to Grado A", cargo: "Canal del curso" },
  { id: 102, nombre: "5to Grado B", cargo: "Canal del curso" },
];

const YO_ID = 99;

const conversacionesIniciales = [
  {
    id: 1,
    tipo: "privado",
    contactoId: 1,
    leido: true,
    mensajes: [
      { id: 1, emisorId: 1, texto: "Hola, recordá que mañana es la reunión de padres.", hora: "09:15" },
      { id: 2, emisorId: YO_ID, texto: "Perfecto, ahí estaré. Gracias!", hora: "09:20" },
    ],
  },
  {
    id: 2,
    tipo: "privado",
    contactoId: 3,
    leido: false,
    mensajes: [
      { id: 1, emisorId: 3, texto: "Buenas, quería consultar sobre la matrícula.", hora: "10:30" },
    ],
  },
  {
    id: 3,
    tipo: "canal",
    canalId: 101,
    leido: false,
    mensajes: [
      { id: 1, emisorId: 1, texto: "Recuerden traer firmada la autorización para la salida.", hora: "08:00" },
    ],
  },
  {
    id: 4,
    tipo: "canal",
    canalId: 102,
    leido: true,
    mensajes: [
      { id: 1, emisorId: 2, texto: "Mañana el acto es a las 9:00 en el patio.", hora: "Ayer" },
    ],
  },
];

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "no-leidos", label: "No leídos" },
  { key: "canales", label: "Canales" },
];

export default function Mensajes() {
  const [rolPrueba, setRolPrueba] = useState("admin");

  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedId, setSelectedId] = useState(null);
  const [texto, setTexto] = useState("");
  const [nuevoChatOpen, setNuevoChatOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const getContacto = (id) => CONTACTOS.find((c) => c.id === id);
  const getCanal = (id) => CANALES.find((c) => c.id === id);

  const getInfo = (conv) =>
    conv.tipo === "canal"
      ? { nombre: getCanal(conv.canalId)?.nombre, cargo: getCanal(conv.canalId)?.cargo, esCanal: true }
      : { nombre: getContacto(conv.contactoId)?.nombre, cargo: getContacto(conv.contactoId)?.cargo, esCanal: false };

  const seleccionada = conversaciones.find((c) => c.id === selectedId);
  const infoSeleccionada = seleccionada ? getInfo(seleccionada) : null;

  const conversacionesFiltradas = conversaciones.filter((c) => {
    if (activeTab === "no-leidos") return !c.leido;
    if (activeTab === "canales") return c.tipo === "canal";
    return true;
  });

  const contactosPermitidos = CONTACTOS.filter((c) =>
    rolPrueba === "admin" ? c.rol !== "admin" : c.rol === "admin"
  );

  const contactosParaNuevoChat = contactosPermitidos.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const canalesParaNuevoChat = CANALES.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const marcarLeido = (id) => {
    setConversaciones((prev) => prev.map((c) => (c.id === id ? { ...c, leido: true } : c)));
  };

  const handleSeleccionar = (id) => {
    setSelectedId(id);
    marcarLeido(id);
  };

  const handleSeleccionarContacto = (contacto) => {
    const existente = conversaciones.find((c) => c.tipo === "privado" && c.contactoId === contacto.id);
    if (existente) {
      handleSeleccionar(existente.id);
    } else {
      const nueva = { id: Date.now(), tipo: "privado", contactoId: contacto.id, leido: true, mensajes: [] };
      setConversaciones([nueva, ...conversaciones]);
      setSelectedId(nueva.id);
    }
    setNuevoChatOpen(false);
  };

  const handleSeleccionarCanal = (canal) => {
    const existente = conversaciones.find((c) => c.tipo === "canal" && c.canalId === canal.id);
    if (existente) {
      handleSeleccionar(existente.id);
    } else {
      const nueva = { id: Date.now(), tipo: "canal", canalId: canal.id, leido: true, mensajes: [] };
      setConversaciones([nueva, ...conversaciones]);
      setSelectedId(nueva.id);
    }
    setNuevoChatOpen(false);
  };

  const puedeEscribir = !infoSeleccionada?.esCanal || rolPrueba === "admin";

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || !seleccionada || !puedeEscribir) return;

    const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const nuevoMensaje = { id: Date.now(), emisorId: YO_ID, texto: texto.trim(), hora };

    setConversaciones(
      conversaciones.map((c) =>
        c.id === seleccionada.id ? { ...c, mensajes: [...c.mensajes, nuevoMensaje] } : c
      )
    );
    setTexto("");
  };

  return (
    <section className="mensajes">
      {/* SOLO PARA LA DEMO */}
      <div className="mensajes__dev-switch">
        <span>Ver como:</span>
        <select
          value={rolPrueba}
          onChange={(e) => {
            setRolPrueba(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="admin">Administrador</option>
          <option value="tutor">Tutor</option>
          <option value="alumno">Alumno</option>
        </select>
      </div>

      <div className="mensajes__body">
        <div className={`mensajes__list-panel${selectedId ? " mensajes__list-panel--hidden-mobile" : ""}`}>
          <div className="mensajes__list-header">
            <h1 className="mensajes__title">Mensajes</h1>
            <button className="mensajes__new-btn" onClick={() => { setBusqueda(""); setNuevoChatOpen(true); }} aria-label="Nuevo chat">
              <Plus size={20} />
            </button>
          </div>

          <div className="mensajes__tabs">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`mensajes__tab${activeTab === key ? " mensajes__tab--active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mensajes__list">
            {conversacionesFiltradas.length === 0 && (
              <p className="mensajes__list-empty">No hay conversaciones acá.</p>
            )}

            {conversacionesFiltradas.map((c) => {
              const info = getInfo(c);
              const ultimo = c.mensajes[c.mensajes.length - 1];
              if (!info.nombre) return null;

              return (
                <button
                  key={c.id}
                  className={`mensajes__item${selectedId === c.id ? " mensajes__item--active" : ""}${!c.leido ? " mensajes__item--unread" : ""}`}
                  onClick={() => handleSeleccionar(c.id)}
                >
                  <div className={`mensajes__avatar${info.esCanal ? " mensajes__avatar--canal" : ""}`}>
                    {info.esCanal ? <Hash size={20} /> : info.nombre.charAt(0)}
                  </div>
                  <div className="mensajes__item-content">
                    <div className="mensajes__item-top">
                      <span className="mensajes__item-name">{info.nombre}</span>
                      {ultimo && <span className="mensajes__item-time">{ultimo.hora}</span>}
                    </div>
                    <p className="mensajes__item-snippet">
                      {ultimo ? ultimo.texto : "Iniciar conversación"}
                    </p>
                  </div>
                  {!c.leido && <span className="mensajes__dot" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`mensajes__chat-panel${selectedId ? " mensajes__chat-panel--visible-mobile" : ""}`}>
          {seleccionada && infoSeleccionada ? (
            <>
              <div className="mensajes__chat-header">
                <button className="mensajes__back" onClick={() => setSelectedId(null)}>←</button>
                <div className={`mensajes__avatar mensajes__avatar--sm${infoSeleccionada.esCanal ? " mensajes__avatar--canal" : ""}`}>
                  {infoSeleccionada.esCanal ? <Hash size={16} /> : infoSeleccionada.nombre.charAt(0)}
                </div>
                <div>
                  <p className="mensajes__chat-name">{infoSeleccionada.nombre}</p>
                  <p className="mensajes__chat-cargo">{infoSeleccionada.cargo}</p>
                </div>
              </div>

              <div className="mensajes__bubbles">
                {seleccionada.mensajes.map((m) => (
                  <div key={m.id} className={`mensajes__bubble${m.emisorId === YO_ID ? " mensajes__bubble--propio" : ""}`}>
                    <p>{m.texto}</p>
                    <span className="mensajes__bubble-time">{m.hora}</span>
                  </div>
                ))}
                {seleccionada.mensajes.length === 0 && (
                  <p className="mensajes__bubbles-empty">Todavía no hay mensajes acá.</p>
                )}
              </div>

              {puedeEscribir ? (
                <form className="mensajes__input-row" onSubmit={handleEnviar}>
                  <input
                    type="text"
                    placeholder="Escribí un mensaje..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  <button type="submit" aria-label="Enviar">
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <div className="mensajes__readonly">
                  Solo el administrador puede escribir en este canal.
                </div>
              )}
            </>
          ) : (
            <div className="mensajes__empty-state">
              <p>Seleccioná una conversación</p>
              <span>o iniciá una nueva con el botón +</span>
            </div>
          )}
        </div>
      </div>

      {nuevoChatOpen && (
        <Modal title="Nuevo mensaje" onClose={() => setNuevoChatOpen(false)}>
          <div className="mensajes__search-contacts">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda">
                <X size={16} />
              </button>
            )}
          </div>

          {canalesParaNuevoChat.length > 0 && (
            <>
              <p className="mensajes__modal-section">Canales</p>
              <div className="mensajes__contacts-list">
                {canalesParaNuevoChat.map((c) => (
                  <button key={c.id} className="mensajes__contact-item" onClick={() => handleSeleccionarCanal(c)}>
                    <div className="mensajes__avatar mensajes__avatar--canal">
                      <Hash size={18} />
                    </div>
                    <div>
                      <p className="mensajes__contact-name">{c.nombre}</p>
                      <p className="mensajes__contact-cargo">{c.cargo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="mensajes__modal-section">Contactos</p>
          <div className="mensajes__contacts-list">
            {contactosParaNuevoChat.length === 0 && (
              <p className="mensajes__list-empty">No hay contactos disponibles.</p>
            )}
            {contactosParaNuevoChat.map((c) => (
              <button key={c.id} className="mensajes__contact-item" onClick={() => handleSeleccionarContacto(c)}>
                <div className="mensajes__avatar">{c.nombre.charAt(0)}</div>
                <div>
                  <p className="mensajes__contact-name">{c.nombre}</p>
                  <p className="mensajes__contact-cargo">{c.cargo}</p>
                </div>
              </button>
            ))}
          </div>

          {rolPrueba !== "admin" && (
            <p className="mensajes__hint">
              Como {rolPrueba}, solo podés escribirle al administrador (preceptor/director). Los canales se pueden ver, pero solo el administrador escribe ahí.
            </p>
          )}
        </Modal>
      )}
    </section>
  );
}