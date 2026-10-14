// src/services/servidoresService.js
// Servicio de alto nivel para la jerarquía Servidor -> Categoría -> Canal.
// Reutiliza apiClient.js (Bearer token + manejo de errores) y los endpoints reales del backend.

import { apiGet, apiPost, apiPut, apiDelete } from "../api/apiClient";

const SERVIDORES = "/servidores/";
const CATEGORIAS = "/categorias/";
const CANALES = "/canales/";

// ---------- Lecturas básicas ----------

export async function obtenerServidores() {
  const data = await apiGet(SERVIDORES);
  return Array.isArray(data) ? data : [];
}

export async function obtenerServidorPorId(servidorId) {
  return apiGet(`/servidores/${servidorId}`);
}

export async function obtenerCategorias() {
  const data = await apiGet(CATEGORIAS);
  return Array.isArray(data) ? data : [];
}

export async function obtenerCategoriaPorId(categoriaId) {
  return apiGet(`/categorias/${categoriaId}`);
}

export async function obtenerCanales() {
  const data = await apiGet(CANALES);
  return Array.isArray(data) ? data : [];
}

export async function obtenerCanalPorId(canalId) {
  return apiGet(`/canales/${canalId}`);
}

// ---------- Filtrado por servidor / categoría ----------

export async function obtenerCategoriasPorServidor(servidorId) {
  const categorias = await obtenerCategorias();
  return categorias.filter((c) => Number(c.servidor_id) === Number(servidorId));
}

export async function obtenerCanalesPorServidor(servidorId) {
  const canales = await obtenerCanales();
  return canales.filter((c) => Number(c.servidor_id) === Number(servidorId));
}

export async function obtenerCanalesPorCategoria(servidorId, categoriaId) {
  const canales = await obtenerCanalesPorServidor(servidorId);
  if (categoriaId === null || categoriaId === undefined || categoriaId === "") {
    return canales.filter((c) => c.categoria_id === null || c.categoria_id === undefined);
  }
  return canales.filter((c) => Number(c.categoria_id) === Number(categoriaId));
}

// ---------- Jerarquía completa de un servidor ----------

/**
 * Devuelve un servidor con sus categorías y, dentro de cada una, los canales.
 * Incluye además los canales sin categoría asignada.
 *
 * @param {number|string} servidorId
 * @returns {Promise<{ servidor, categorias: Array<{...categoria, canales: Array}>, sinCategoria: Array }>}
 */
export async function obtenerJerarquiaServidor(servidorId) {
  const [servidor, todasCategorias, todosCanales] = await Promise.all([
    obtenerServidorPorId(servidorId),
    obtenerCategorias(),
    obtenerCanales(),
  ]);

  const id = Number(servidorId);

  const categoriasDelServidor = todasCategorias
    .filter((c) => Number(c.servidor_id) === id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const canalesDelServidor = todosCanales
    .filter((c) => Number(c.servidor_id) === id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const categorias = categoriasDelServidor.map((categoria) => ({
    ...categoria,
    canales: canalesDelServidor.filter(
      (canal) => Number(canal.categoria_id) === Number(categoria.id_categoria)
    ),
  }));

  const idsCategorias = new Set(categoriasDelServidor.map((c) => Number(c.id_categoria)));
  const sinCategoria = canalesDelServidor.filter(
    (canal) =>
      canal.categoria_id === null ||
      canal.categoria_id === undefined ||
      !idsCategorias.has(Number(canal.categoria_id))
  );

  return { servidor, categorias, sinCategoria };
}

// ---------- Escrituras (por si se requieren desde la misma sección) ----------

export function crearServidor(data) {
  return apiPost(SERVIDORES, data);
}

export function actualizarServidor(servidorId, data) {
  return apiPut(`/servidores/${servidorId}`, data);
}

export function eliminarServidor(servidorId) {
  return apiDelete(`/servidores/${servidorId}`);
}

export function crearCategoria(data) {
  return apiPost(CATEGORIAS, data);
}

export function actualizarCategoria(categoriaId, data) {
  return apiPut(`/categorias/${categoriaId}`, data);
}

export function eliminarCategoria(categoriaId) {
  return apiDelete(`/categorias/${categoriaId}`);
}

export function crearCanal(data) {
  return apiPost(CANALES, data);
}

export function actualizarCanal(canalId, data) {
  return apiPut(`/canales/${canalId}`, data);
}

export function eliminarCanal(canalId) {
  return apiDelete(`/canales/${canalId}`);
}

// ---------- Alias / compatibilidad ----------

const servidoresService = {
  obtenerServidores,
  obtenerServidorPorId,
  obtenerCategorias,
  obtenerCategoriaPorId,
  obtenerCanales,
  obtenerCanalPorId,
  obtenerCategoriasPorServidor,
  obtenerCanalesPorServidor,
  obtenerCanalesPorCategoria,
  obtenerJerarquiaServidor,
  crearServidor,
  actualizarServidor,
  eliminarServidor,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  crearCanal,
  actualizarCanal,
  eliminarCanal,
  // aliases estilo inglés
  getServers: obtenerServidores,
  getServerById: obtenerServidorPorId,
  getCategories: obtenerCategorias,
  getChannels: obtenerCanales,
  getHierarchy: obtenerJerarquiaServidor,
  // aliases estilo existente
  listarServidores: obtenerServidores,
  listarCategorias: obtenerCategorias,
  listarCanales: obtenerCanales,
};

export default servidoresService;