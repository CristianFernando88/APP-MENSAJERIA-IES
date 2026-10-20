// src/api/mensajes.js
import { apiGet, apiPost } from "./apiClient";

export function listarMensajes(canalId) {
  const query = canalId ? `?canal_id=${canalId}` : "";
  return apiGet(`/mensajes/${query}`);
}

export function crearMensaje(data) {
  return apiPost("/mensajes/", data);
}