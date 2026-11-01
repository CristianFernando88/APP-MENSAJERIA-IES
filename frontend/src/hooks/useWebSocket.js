// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";

// Fallback por si falla la variable en Vercel
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const WS_URL = API_URL.replace(/^http/, "ws");

export function useWebSocket(path, onMessageReceived) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const onMessageRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!path) {
      setIsConnected(false);
      return;
    }

    let fullUrl = "";
    if (path.startsWith("canal/")) {
      fullUrl = `${WS_URL}/mensajes/ws/${path}`;
    } else if (path.startsWith("directo/")) {
      fullUrl = `${WS_URL}/mensajes-directos/ws/${path}`;
    } else {
      console.error("Ruta de WebSocket no válida:", path);
      return;
    }

    let reconnectTimer;
    let isIntentionalClose = false;

    const connect = () => {
      const socket = new WebSocket(fullUrl);
      ws.current = socket;

      socket.onopen = () => setIsConnected(true);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessageRef.current) onMessageRef.current(data);
        } catch (err) {
          console.error("Error en WebSocket:", err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Si se cierra y no fue porque cambiamos de canal, intentamos reconectar
        if (!isIntentionalClose) {
          reconnectTimer = setTimeout(() => {
            console.log("Reconectando WebSocket...");
            connect();
          }, 3000); // Reintenta cada 3 segundos
        }
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimer);
      if (ws.current) ws.current.close();
    };
  }, [path]);

  const sendMessage = (data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  return { isConnected, sendMessage };
}