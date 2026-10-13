import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { queryParams } from "./queryParams";

export function listarCanales(query) {
  return apiGet(`/canales/${queryParams({ query })}`);
}

export function crearCanal(data) {
  return apiPost("/canales/", data);
}

export function obtenerCanal(canalId) {
  return apiGet(`/canales/${canalId}`);
}

export function actualizarCanal(canalId, data) {
  return apiPut(`/canales/${canalId}`, data);
}

export function eliminarCanal(canalId) {
  return apiDelete(`/canales/${canalId}`);
}