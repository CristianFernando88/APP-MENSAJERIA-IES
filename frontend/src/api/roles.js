import { apiGet } from "./apiClient";

export function listarRoles() {
  return apiGet("/roles/");
}