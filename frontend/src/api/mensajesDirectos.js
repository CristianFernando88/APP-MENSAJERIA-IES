import { apiGet, apiPost } from "./apiClient";

export function listarMensajesDirectos() {
  return apiGet("/mensajes-directos/");
}

export function crearMensajeDirecto(data) {
  return apiPost("/mensajes-directos/", data);
}