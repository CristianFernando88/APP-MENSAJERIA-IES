import { apiGet, apiPost, apiDelete } from "./apiClient";

export function listarDestinatarios() {
  return apiGet("/comunicados-destinatarios/");
}

export function crearDestinatario(data) {
  return apiPost("/comunicados-destinatarios/", data);
}

export function eliminarDestinatario(id) {
  return apiDelete(`/comunicados-destinatarios/${id}`);
}