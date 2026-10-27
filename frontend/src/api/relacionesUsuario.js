import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarRelacionesUsuario() {
    return apiGet("/relaciones-usuario");
}

export function obtenerRelacionUsuario(relacionId) {
    return apiGet(`/relaciones-usuario/${relacionId}`);
}

export function crearRelacionUsuario(data) {
    return apiPost("/relaciones-usuario", data);
}

export function actualizarRelacionUsuario(relacionId, data) {
    return apiPut(`/relaciones-usuario/${relacionId}`, data);
}

export function eliminarRelacionUsuario(relacionId) {
    return apiDelete(`/relaciones-usuario/${relacionId}`);
}