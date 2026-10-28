import { apiGet, apiDelete } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL;

export function listarAdjuntos(comunicadoId) {
  return apiGet(`/comunicados/${comunicadoId}/adjuntos`);
}

export function eliminarAdjunto(adjuntoId) {
  return apiDelete(`/comunicados-adjuntos/${adjuntoId}`);
}

export async function subirAdjuntos(comunicadoId, archivos) {
  const token = localStorage.getItem("access_token");

  const datos = new FormData();
  for (const archivo of archivos) {
    datos.append("archivos", archivo);
  }

  const respuesta = await fetch(`${API_URL}/comunicados/${comunicadoId}/adjuntos`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: datos,
  });

  if (respuesta.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  if (!respuesta.ok) {
    let detalle = `Error ${respuesta.status}`;
    try {
      const data = await respuesta.json();
      if (data.detail) detalle = data.detail;
    } catch {
    
    }
    throw new Error(detalle);
  }

  return respuesta.json();
}