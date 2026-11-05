import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children, roles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // 1. Mientras carga, no decidir nada
  if (loading) {
    return <p className="cargando">Verificando sesión...</p>;
  }

  // 2. Sin sesión → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const debeCambiarPassword = user.debe_cambiar_password;
  const estaEnCambioPassword = location.pathname === "/cambiar-password-inicial";

  if (debeCambiarPassword && !estaEnCambioPassword) {
    return <Navigate to="/cambiar-password-inicial" replace />;
  }

  if (!debeCambiarPassword && estaEnCambioPassword) {
    return <Navigate to="/" replace />;
  }


  // 3. Si se especifican roles, verificar
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  // 4. Todo OK
  return children;
}