import { apiGet } from "./apiClient";

export function listarServidores() {
  return apiGet("/servidores/");
}
