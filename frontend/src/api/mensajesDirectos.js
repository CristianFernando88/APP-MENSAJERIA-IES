// src/api/mensajesDirectos.js
import { apiGet, apiPost, apiPut } from "./apiClient";

export function listarMensajesDirectos() {
  return apiGet("/mensajes-directos/");
}

export function crearMensajeDirecto(data) {
  return apiPost("/mensajes-directos/", data);
}

// NUEVO: Para actualizar el estado de leído
export function actualizarMensajeDirecto(id, data) {
  return apiPut(`/mensajes-directos/${id}`, data);
}

// TODO BACKEND: Implementar el filtro de contactos permitidos según permisos institucionales.
export async function getContactosPermitidos() {
  try { return await apiGet("/mensajes-directos/contactos"); } catch { return []; }
}