import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./NoAutorizado.css";

export default function NoAutorizado() {
  const { user } = useAuth();

  const volver = user ? "/" : "/login";

  return (
    <main className="panel centro">
      <p className="codigo-403">403</p>
      <h2>Acceso denegado</h2>
      <p className="panel-sub">
        Tu rol no tiene permiso para ver esta página.
      </p>
      <Link to={volver} className="btn-volver">
        Volver al inicio
      </Link>
    </main>
  );
}