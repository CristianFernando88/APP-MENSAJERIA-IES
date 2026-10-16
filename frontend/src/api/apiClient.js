// src/api/apiClient.js
// Todas las llamadas al backend pasan por acá.

const API_URL = import.meta.env.VITE_API_URL;


// ============================================
// HELPER: Manejo de errores
// ============================================
async function manejarRespuesta(response) {
  // Token vencido o inválido → volver al login
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  // Otros errores
  if (!response.ok) {
    let detail = `Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.detail) detail = data.detail;
    } catch {
      // Si no se puede parsear el JSON, dejamos el mensaje genérico
    }
    throw new Error(detail);
  }

  // 204 No Content (DELETE) → sin body
  if (response.status === 204) {
    return null;
  }

  return response.json();
}


// ============================================
// GET
// ============================================
export async function apiGet(ruta) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${ruta}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return manejarRespuesta(response);
}


// ============================================
// POST
// ============================================
export async function apiPost(ruta, data) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${ruta}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return manejarRespuesta(response);
}


// ============================================
// PUT
// ============================================
export async function apiPut(ruta, data) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${ruta}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return manejarRespuesta(response);
}


// ============================================
// PATCH
// ============================================
export async function apiPatch(ruta, data) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${ruta}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return manejarRespuesta(response);
}

// ============================================
// DELETE
// ============================================
export async function apiDelete(ruta) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${ruta}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return manejarRespuesta(response);
}