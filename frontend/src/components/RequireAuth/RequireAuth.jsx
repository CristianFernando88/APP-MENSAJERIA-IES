import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children, roles }) {
  const { user, loading, hasRole } = useAuth();

  // 1. Mientras carga, no decidir nada
  if (loading) {
    return <p className="cargando">Verificando sesión...</p>;
  }

  // 2. Sin sesión → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si se especifican roles, verificar
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  // 4. Todo OK
  return children;
}