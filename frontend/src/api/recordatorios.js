import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarRecordatorios() {
  return apiGet("/recordatorios/");
}

export function crearRecordatorio(data) {
  return apiPost("/recordatorios/", data);
}

export function actualizarRecordatorio(id, data) {
  return apiPut(`/recordatorios/${id}`, data);
}

export function eliminarRecordatorio(id) {
  return apiDelete(`/recordatorios/${id}`);
}