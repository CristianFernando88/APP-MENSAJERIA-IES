import { apiGet, apiPatch, apiPost } from "./apiClient";

export function crearSugerencia(data) {
  return apiPost("/sugerencias/", data);
}

export function listarSugerencias() {
  return apiGet("/sugerencias/");
}

export function marcarSugerenciaLeida(id) {
  return apiPatch(`/sugerencias/${id}/leida`, {});
}
