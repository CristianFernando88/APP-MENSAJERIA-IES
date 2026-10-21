import { apiGet, apiPost } from "./apiClient";

export function listarMensajesVistos() {
  return apiGet("/mensajes-vistos/");
}

export function crearMensajeVisto(data) {
  return apiPost("/mensajes-vistos/", data);
}