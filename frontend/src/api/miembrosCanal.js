import { apiGet } from "./apiClient";

export function listarMiembrosCanal() {
  return apiGet("/miembros-canal/");
}
