// src/api/miembrosServidor.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarMiembrosServidor() {
  return apiGet("/miembros-servidor/");
}

export function crearMiembroServidor(data) {
  return apiPost("/miembros-servidor/", data);
}

export function obtenerMiembroServidor(usuarioId, servidorId) {
  return apiGet(`/miembros-servidor/${usuarioId}/${servidorId}`);
}

export function actualizarMiembroServidor(usuarioId, servidorId, data) {
  return apiPut(`/miembros-servidor/${usuarioId}/${servidorId}`, data);
}

export function eliminarMiembroServidor(usuarioId, servidorId) {
  return apiDelete(`/miembros-servidor/${usuarioId}/${servidorId}`);
}

export function unirseAServidor(usuarioId, servidorId) {
  return crearMiembroServidor({ usuario_id: usuarioId, servidor_id: servidorId, activo: true });
}