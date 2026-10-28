import { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiGet } from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const miembroCanalCacheRef = useRef(new Map());

  const asignaciones = Array.isArray(user?.asignaciones) ? user.asignaciones : [];

  const limpiarCacheMiembrosCanal = () => {
    miembroCanalCacheRef.current.clear();
  };

  const rolesEnServidor = (servidorId) => {
    if (!user) return [];
    const nombres = [];

    asignaciones.forEach((asignacion) => {
      if (Number(asignacion.usuario_id) !== Number(user.id_usuario)) return;
      const esGlobal = asignacion.servidor_id == null;
      const perteneceServidor = Number(asignacion.servidor_id) === Number(servidorId);
      if (!esGlobal && !perteneceServidor) return;

      const nombre = asignacion.rol?.nombre || asignacion.nombre_rol || asignacion.rol;
      if (typeof nombre === "string") nombres.push(nombre);
    });

    return [...new Set(nombres)];
  };

  const esAdminInstitucionalDe = (servidorId) =>
    rolesEnServidor(servidorId).some((rol) =>
      ["super_admin", "admin", "director"].includes(rol)
    );

  const esTutorPuro = () => {
    const nombres = [
      ...(user?.roles || []).map((rol) => typeof rol === "string" ? rol : rol.nombre),
      ...asignaciones.map((asignacion) =>
        asignacion.rol?.nombre || asignacion.nombre_rol || asignacion.rol
      ),
    ].filter((rol) => typeof rol === "string");

    return nombres.includes("tutor") &&
      !["profesor", "admin", "super_admin", "director"].some((rol) => nombres.includes(rol));
  };

  const miembroCanalDe = async (canalId) => {
    const clave = Number(canalId);
    if (miembroCanalCacheRef.current.has(clave)) {
      return miembroCanalCacheRef.current.get(clave);
    }

    try {
      const miembros = await apiGet(`/canales/${clave}/miembros`);
      const miembro = Array.isArray(miembros)
        ? miembros.find((item) => Number(item.usuario_id) === Number(user?.id_usuario))
        : null;
      const rol = miembro?.rol_en_canal || null;
      miembroCanalCacheRef.current.set(clave, rol);
      return rol;
    } catch (error) {
      if (error?.message?.includes("404") || error?.status === 404) {
        miembroCanalCacheRef.current.set(clave, null);
      }
      return null;
    }
  };

  const invalidarMiembroCanal = (canalId) => {
    miembroCanalCacheRef.current.delete(Number(canalId));
  };

  useEffect(() => {
    const loadUserFromStorage = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          const userData = await apiGet("/auth/me");
          setUser(userData);
        } catch (error) {
          console.error("Error al recargar la sesión:", error);
          localStorage.removeItem("access_token");
          limpiarCacheMiembrosCanal();
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    // ⚠️ El login usa form-urlencoded, NO JSON
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al iniciar sesión");
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    setUser(data.usuario);
    limpiarCacheMiembrosCanal();
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    limpiarCacheMiembrosCanal();
  };

  const hasRole = (rolesPermitidos) => {
    if (!user || !user.roles || user.roles.length === 0) return false;
    const userRoles = user.roles.map((r) => typeof r === "string" ? r : r.nombre);
    return rolesPermitidos.some((rol) => userRoles.includes(rol));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      hasRole,
      asignaciones,
      rolesEnServidor,
      esAdminInstitucionalDe,
      esTutorPuro,
      miembroCanalDe,
      invalidarMiembroCanal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);