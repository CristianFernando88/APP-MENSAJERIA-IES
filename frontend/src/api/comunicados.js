import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarComunicados() {
  return apiGet("/comunicados/");
}

export function crearComunicado(data) {
  return apiPost("/comunicados/", data);
}

export function obtenerComunicado(id) {
  return apiGet(`/comunicados/${id}`);
}

export function actualizarComunicado(id, data) {
  return apiPut(`/comunicados/${id}`, data);
}

export function eliminarComunicado(id) {
  return apiDelete(`/comunicados/${id}`);
}