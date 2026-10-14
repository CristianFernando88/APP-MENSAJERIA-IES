import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export function listarNotificaciones() {
    return apiGet("/notificaciones/");
}

export function obtenerNotificacion(id) {
    return apiGet(`/notificaciones/${id}`);
}

export function crearNotificacion(data) {
    return apiPost("/notificaciones/", data);
}

export function actualizarNotificacion(id, data) {
    return apiPut(`/notificaciones/${id}`, data);
}

export function eliminarNotificacion(id) {
    return apiDelete(`/notificaciones/${id}`);
}

export function marcarNotificacionLeida(id) {
    return actualizarNotificacion(id, { leida: true });
}

export default {
    listarNotificaciones,
    obtenerNotificacion,
    crearNotificacion,
    actualizarNotificacion,
    eliminarNotificacion,
    marcarNotificacionLeida,
};