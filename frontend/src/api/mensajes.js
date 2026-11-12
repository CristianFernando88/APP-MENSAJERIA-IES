import { apiGet, apiPost, apiUpload } from "./apiClient";

export function listarMensajes(canalId) {
  const query = canalId ? `?canal_id=${canalId}` : "";
  return apiGet(`/mensajes/${query}`);
}

export function crearMensaje(data) {
  return apiPost("/mensajes/", data);
}

export function subirArchivoMensaje(archivo) {
  return apiUpload("/mensajes/upload", archivo);
}