import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./apiClient";

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

export function listarPapelera() {
  return apiGet("/comunicados/papelera");
}

export function restaurarComunicado(id) {
  return apiPatch(`/comunicados/${id}/restaurar`, {});
}

export function eliminarDefinitivo(id) {
  return apiDelete(`/comunicados/${id}/definitivo`);
}