import { apiGet, apiPost, apiPut } from "./apiClient";

export function obtenerPerfil(usuarioId) {
  return apiGet(`/perfiles/usuario/${usuarioId}`);
}

export function crearPerfil(data) {
  return apiPost("/perfiles/", data);
}

export function actualizarPerfil(usuarioId, data) {
  return apiPut(`/perfiles/usuario/${usuarioId}`, data);
}