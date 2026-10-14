import { apiGet, apiPost, apiDelete } from "./apiClient";

export function listarUsuarioRol(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.usuario_id) params.append("usuario_id", filtros.usuario_id);
  if (filtros.servidor_id) params.append("servidor_id", filtros.servidor_id);
  const qs = params.toString();
  return apiGet(`/usuario-rol/${qs ? `?${qs}` : ""}`);
}

export function crearUsuarioRol(data) {
  return apiPost("/usuario-rol/", data);
}

export function eliminarUsuarioRol(usuarioId, rolId, servidorId) {
  const qs = servidorId ? `?servidor_id=${servidorId}` : "";
  return apiDelete(`/usuario-rol/usuario/${usuarioId}/rol/${rolId}${qs}`);
}