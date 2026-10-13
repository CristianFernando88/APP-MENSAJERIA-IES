import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { queryParams } from "./queryParams";

export function listarUsuarios(filtros = {}) {
  return apiGet(`/usuarios/${queryParams(filtros)}`);
}

export function crearUsuario(data) {
  return apiPost("/usuarios/", data);
}

export function obtenerUsuario(usuarioId) {
  return apiGet(`/usuarios/${usuarioId}`);
}

export function actualizarUsuario(usuarioId, data) {
  return apiPut(`/usuarios/${usuarioId}`, data);
}

export function eliminarUsuario(usuarioId) {
  return apiDelete(`/usuarios/${usuarioId}`);
}