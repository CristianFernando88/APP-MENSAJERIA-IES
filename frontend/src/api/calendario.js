import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarRecordatorios() {
    return apiGet("/recordatorios/");
}

export function obtenerRecordatorio(id) {
    return apiGet(`/recordatorios/${id}`);
}

export function crearRecordatorio(data) {
    return apiPost("/recordatorios/", data);
}

export function actualizarRecordatorio(id, data) {
    return apiPut(`/recordatorios/${id}`, data);
}

export function eliminarRecordatorio(id) {
    return apiDelete(`/recordatorios/${id}`);
}

export function completarRecordatorio(id, completado = true) {
    return actualizarRecordatorio(id, { completado });
}

export default {
    listarRecordatorios,
    obtenerRecordatorio,
    crearRecordatorio,
    actualizarRecordatorio,
    eliminarRecordatorio,
    completarRecordatorio,
};