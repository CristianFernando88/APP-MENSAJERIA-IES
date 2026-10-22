// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
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

    // NUEVA LÓGICA: Detectar si es canal o directo para armar la URL
    let fullUrl = "";
    if (path.startsWith("canal/")) {
      fullUrl = `${WS_URL}/mensajes/ws/${path}`;
    } else if (path.startsWith("directo/")) {
      fullUrl = `${WS_URL}/mensajes-directos/ws/${path}`;
    } else {
      console.error("Ruta de WebSocket no válida:", path);
      return;
    }

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

    socket.onclose = () => setIsConnected(false);

    return () => {
      socket.close();
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