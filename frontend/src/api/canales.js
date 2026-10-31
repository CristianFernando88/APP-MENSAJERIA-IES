// src/api/canales.js
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

// TODO BACKEND: Implementar estos endpoints de miembros y permisos de canal.
export async function getMiembrosCanal(canalId) {
  try { return await apiGet(`/canales/${canalId}/miembros`); } catch { return []; }
}

// TODO BACKEND: Implementar este endpoint de usuarios disponibles por canal.
export async function getMiembrosDisponibles(canalId) {
  try { return await apiGet(`/canales/${canalId}/miembros-disponibles`); } catch { return []; }
}