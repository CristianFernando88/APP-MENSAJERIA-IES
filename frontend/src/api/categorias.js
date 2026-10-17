// src/api/categorias.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarCategorias() {
  return apiGet("/categorias/");
}

export function obtenerCategoria(categoriaId) {
  return apiGet(`/categorias/${categoriaId}`);
}

export function crearCategoria(data) {
  return apiPost("/categorias/", data);
}

export function actualizarCategoria(categoriaId, data) {
  return apiPut(`/categorias/${categoriaId}`, data);
}

export function eliminarCategoria(categoriaId) {
  return apiDelete(`/categorias/${categoriaId}`);
}

// Filtro por servidor (antes vivía en services/servidoresService.js)
export async function listarCategoriasPorServidor(servidorId) {
  const categorias = await listarCategorias();
  return categorias.filter((c) => Number(c.servidor_id) === Number(servidorId));
}