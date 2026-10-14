import { apiGet, apiPost } from "./apiClient";

export function listarMiembrosServidor() {
  return apiGet("/miembros-servidor/");
}

export function obtenerMiembroServidor(usuarioId, servidorId) {
  return apiGet(`/miembros-servidor/${usuarioId}/${servidorId}`);
}

export function unirseAServidor(usuarioId, servidorId) {
  return apiPost("/miembros-servidor/", {
    usuario_id: usuarioId,
    servidor_id: servidorId,
    activo: true,
  });
}

export default {
  listarMiembrosServidor,
  obtenerMiembroServidor,
  unirseAServidor,
};