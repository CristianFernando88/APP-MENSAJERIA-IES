import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarMiembrosCanal() {
  return apiGet("/miembros-canal/");
}

export function crearMiembroCanal(data) {
  return apiPost("/miembros-canal/", data);
}

export function obtenerMiembroCanal(miembroCanalId) {
  return apiGet(`/miembros-canal/${miembroCanalId}`);
}

export function actualizarMiembroCanal(miembroCanalId, data) {
  return apiPut(`/miembros-canal/${miembroCanalId}`, data);
}

export function eliminarMiembroCanal(miembroCanalId) {
  return apiDelete(`/miembros-canal/${miembroCanalId}`);
}