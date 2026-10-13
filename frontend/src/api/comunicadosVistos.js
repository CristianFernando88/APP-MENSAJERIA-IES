import { apiGet, apiPost, apiDelete } from "./apiClient";

export function listarVistos() {
  return apiGet("/comunicados-vistos/");
}

export function marcarVisto(comunicadoId, usuarioId) {
  return apiPost("/comunicados-vistos/", {
    comunicado_id: comunicadoId,
    usuario_id: usuarioId,
  });
}

export function quitarVisto(vistoId) {
  return apiDelete(`/comunicados-vistos/${vistoId}`);
}