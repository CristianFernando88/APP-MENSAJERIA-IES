// src/api/servidores.js
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { listarCategorias } from "./categorias";
import { listarCanales } from "./canales";

const SERVIDORES = "/servidores/";

// ---------- CRUD ----------
export function listarServidores() {
  return apiGet(SERVIDORES);
}

export function obtenerServidor(servidorId) {
  return apiGet(`/servidores/${servidorId}`);
}

export function crearServidor(data) {
  return apiPost(SERVIDORES, data);
}

export function actualizarServidor(servidorId, data) {
  return apiPut(`/servidores/${servidorId}`, data);
}

export function eliminarServidor(servidorId) {
  return apiDelete(`/servidores/${servidorId}`);
}

// ---------- Jerarquía ----------
export async function obtenerJerarquiaServidor(servidorId) {
  const [servidor, categorias, canales] = await Promise.all([
    obtenerServidor(servidorId),
    listarCategorias(),
    listarCanales(),
  ]);

  const id = Number(servidorId);

  const categoriasDelServidor = categorias
    .filter((c) => Number(c.servidor_id) === id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const canalesDelServidor = canales
    .filter((c) => Number(c.servidor_id) === id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const resultadoCategorias = categoriasDelServidor.map((categoria) => ({
    ...categoria,
    canales: canalesDelServidor.filter(
      (canal) => Number(canal.categoria_id) === Number(categoria.id_categoria)
    ),
  }));

  const idsCategorias = new Set(
    categoriasDelServidor.map((c) => Number(c.id_categoria))
  );
  const sinCategoria = canalesDelServidor.filter(
    (canal) =>
      canal.categoria_id === null ||
      canal.categoria_id === undefined ||
      !idsCategorias.has(Number(canal.categoria_id))
  );

  return { servidor, categorias: resultadoCategorias, sinCategoria };
}