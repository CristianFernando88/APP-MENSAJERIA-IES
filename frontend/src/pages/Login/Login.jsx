import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

// A dónde va cada rol después de loguearse
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
        <h2 className="login__title">IES Connect</h2>
        <h2 className="login__subtitle">BIENVENIDO</h2>

        <Input
          label="Email o usuario"
          name="email"
          type="text"
          value={form.email}
          onChange={handleChange}
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p className="login__error">{error}</p>}

        <Button type="submit" fullWidth disabled={enviando}>
          {enviando ? "Ingresando..." : "Iniciar sesión"}
        </Button>

        <div className="login__demo-hint">
          <p>Usuarios de prueba:</p>
          <ul>
            <li>admin / admin123</li>
            <li>director / director123</li>
            <li>juanperez / profesor123</li>
            <li>pedrolopez / alumno123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}