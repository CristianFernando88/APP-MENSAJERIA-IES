import { createContext, useContext, useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuth } from "./AuthContext";
import { listarCanales } from "../api/canales";
import { listarMiembrosCanal } from "../api/miembrosCanal";

const NotificacionesContext = createContext(null);

// Componente invisible para escuchar canales en segundo plano
function CanalListener({ canalId, userId, onNuevoMensaje }) {
  useWebSocket(`canal/${canalId}`, (data) => {
    if (data.usuario_id !== userId) {
      onNuevoMensaje(data);
    }
  });
  return null;
}

export function NotificacionesProvider({ children }) {
  const { user } = useAuth();
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [canales, setCanales] = useState([]);

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

  // 1. Cargar canales del usuario
  useEffect(() => {
    if (!user) return;
    async function cargar() {
      try {
        const [resCanales, resMiembros] = await Promise.all([listarCanales(), listarMiembrosCanal()]);
        const esAdmin = user.roles?.some(r => ["admin", "super_admin"].includes(r.nombre));
        if (esAdmin) {
          setCanales(resCanales);
        } else {
          const misIds = resMiembros.filter(m => Number(m.usuario_id) === Number(user.id_usuario)).map(m => Number(m.canal_id));
          setCanales(resCanales.filter(c => misIds.includes(Number(c.id_canal))));
        }
      } catch (e) { console.error(e); }
    }
    cargar();
  }, [user]);

  // 2. Escuchar SIEMPRE los Mensajes Directos (NUEVO)
  useWebSocket(`directo/${user?.id_usuario}`, (data) => {
    if (data && data.emisor_id && data.emisor_id !== user.id_usuario) {
      reproducirSonido();
      setTotalNoLeidos(prev => prev + 1);
    }
  });

  // 3. Función que se ejecuta cuando un Canal recibe un mensaje
  const handleNuevoMensajeCanal = (data) => {
    reproducirSonido();
    setTotalNoLeidos(prev => prev + 1);
  };

  // 4. Función para que los componentes limpien el contador
  const limpiarContador = (cantidad = 1) => {
    setTotalNoLeidos(prev => Math.max(0, prev - cantidad));
  };

  return (
    <NotificacionesContext.Provider value={{ totalNoLeidos, limpiarContador, setTotalNoLeidos }}>
      {/* Listeners invisibles para cada canal */}
      {canales.map(canal => (
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