import { createContext, useContext, useState, useEffect } from "react";
import { apiPost, apiGet } from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const hasRole = (rolesPermitidos) => {
    if (!user || !user.roles || user.roles.length === 0) return false;
    const userRoles = user.roles.map((r) => r.nombre);
    return rolesPermitidos.some((rol) => userRoles.includes(rol));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);