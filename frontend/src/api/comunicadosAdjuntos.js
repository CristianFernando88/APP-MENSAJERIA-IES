import { apiGet, apiDelete, apiUpload } from "./apiClient";

export function listarAdjuntos(comunicadoId) {
  return apiGet(`/comunicados/${comunicadoId}/adjuntos`);
}

export function subirAdjunto(comunicadoId, archivo) {
  return apiUpload(`/comunicados/${comunicadoId}/adjuntos`, archivo);
}

export function eliminarAdjunto(adjuntoId) {
  return apiDelete(`/comunicados-adjuntos/${adjuntoId}`);
}
