import { apiGet, apiPost, apiPut, apiUpload } from "./apiClient";

export function obtenerPerfil(usuarioId) {
  return apiGet(`/perfiles/usuario/${usuarioId}`);
}

export function crearPerfil(data) {
  return apiPost("/perfiles/", data);
}

export function actualizarPerfil(usuarioId, data) {
  return apiPut(`/perfiles/usuario/${usuarioId}`, data);
}

export function subirFotoPerfil(usuarioId, archivo) {
  return apiUpload(`/perfiles/usuario/${usuarioId}/foto`, archivo);
}
