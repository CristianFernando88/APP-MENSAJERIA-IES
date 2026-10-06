import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const USUARIOS_DEMO = [
  { email: "admin@ies.edu.ar", password: "admin123", id_usuario: 1, nombre_usuario: "martina.ruiz", rol: "admin" },
  { email: "tutor@ies.edu.ar", password: "tutor123", id_usuario: 2, nombre_usuario: "roberto.perez", rol: "tutor" },
  { email: "alumno@ies.edu.ar", password: "alumno123", id_usuario: 3, nombre_usuario: "mateo.castro", rol: "alumno" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const encontrado = USUARIOS_DEMO.find((u) => u.email === email && u.password === password);
    if (!encontrado) {
      throw new Error("Email o contraseña incorrectos");
    }
    const { password: _descarte, ...usuarioSinPassword } = encontrado;
    setUser(usuarioSinPassword);
    return usuarioSinPassword;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);