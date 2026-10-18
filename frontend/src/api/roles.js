// src/api/roles.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarRoles() {
  return apiGet("/roles/");
}

export function obtenerRol(rolId) {
  return apiGet(`/roles/${rolId}`);
}

export function crearRol(data) {
  return apiPost("/roles/", data);
}

export function actualizarRol(rolId, data) {
  return apiPut(`/roles/${rolId}`, data);
}

export function eliminarRol(rolId) {
  return apiDelete(`/roles/${rolId}`);
}