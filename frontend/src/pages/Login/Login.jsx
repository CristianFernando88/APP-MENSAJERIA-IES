import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const HOME_POR_ROL = {
  super_admin: "/admin",
  admin: "/admin",
  director: "/",
  profesor: "/",
  tutor: "/",
  alumno: "/",
  usuario: "/",
};

function getHomeByRoles(roles) {
  if (!roles || roles.length === 0) return "/";
  for (const rol of roles) {
    if (HOME_POR_ROL[rol.nombre]) {
      return HOME_POR_ROL[rol.nombre];
    }
  }
  return "/";
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const usuario = await login(form.email, form.password);
      const destino = getHomeByRoles(usuario.roles);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="on-gradient login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__brand">
          <span className="login__logo">
            <GraduationCap size={30} />
          </span>
          <h1 className="login__title">IES Connect</h1>
          <p className="login__subtitle">Bienvenido de nuevo</p>
        </div>

        <div className="login__campo">
          <label className="login__label" htmlFor="email">
            Email o usuario
          </label>
          <input
            id="email"
            name="email"
            type="text"
            className="login__input"
            value={form.email}
            onChange={handleChange}
            placeholder="admin"
            autoComplete="username"
          />
        </div>

        <div className="login__campo">
          <label className="login__label" htmlFor="password">
            Contraseña
          </label>
          <div className="login__clave">
            <input
              id="password"
              name="password"
              type={verClave ? "text" : "password"}
              className="login__input login__input--clave"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login__ojo"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="login__error">{error}</p>}

        <Button type="submit" fullWidth disabled={enviando} variant="dark">
          {enviando ? "Ingresando..." : "Iniciar sesión"}
        </Button>

        <div className="login__demo-hint">
          <p>Usuarios de prueba</p>
          <ul>
            <li><code>admin</code> / admin123</li>
            <li><code>director</code> / director123</li>
            <li><code>juanperez</code> / profesor123</li>
            <li><code>pedrolopez</code> / alumno123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}