import { apiGet, apiPost, apiPut } from "./apiClient";

/**
 * Obtiene el perfil de un usuario específico.
 */
export function obtenerPerfil(usuarioId) {
  return apiGet(`/perfiles/usuario/${usuarioId}`);
}

/**
 * Crea un nuevo perfil para un usuario.
 */
export function crearPerfil(data) {
  return apiPost("/perfiles/", data);
}

/**
 * Actualiza el perfil existente de un usuario.
 */
export function actualizarPerfil(usuarioId, data) {
  return apiPut(`/perfiles/usuario/${usuarioId}`, data);
}