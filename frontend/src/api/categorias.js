import { apiGet } from "./apiClient";

export function listarCategorias() {
  return apiGet("/categorias/");
}