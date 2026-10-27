import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

const RUTA = "/relaciones-usuario/";

export function listarRelaciones() {
  return apiGet(RUTA);
}

export function obtenerRelacion(relacionId) {
  return apiGet(`${RUTA}${relacionId}`);
}

export function crearRelacion(data) {
  return apiPost(RUTA, data);
}

export function actualizarRelacion(relacionId, data) {
  return apiPut(`${RUTA}${relacionId}`, data);
}

export function eliminarRelacion(relacionId) {
  return apiDelete(`${RUTA}${relacionId}`);
}
