import { apiGet } from "./apiClient";

export function listarMiembrosServidor() {
  return apiGet("/miembros-servidor/");
}