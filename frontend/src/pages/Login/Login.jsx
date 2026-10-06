import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      const usuario = login(form.email, form.password);
      navigate(usuario.rol === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="on-gradient login">
      <form className="login__card" onSubmit={handleSubmit}>
        <h2 className="login__title">IES Connect</h2>
        <h2 className="login__subtitle">BIENVENIDO</h2>

        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={error} />
        <Input label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} />

        <Button type="submit" fullWidth>Iniciar sesión</Button>

        <div className="login__demo-hint">
          <p>Usuarios de prueba:</p>
          <ul>
            <li>admin@ies.edu.ar / admin123</li>
            <li>tutor@ies.edu.ar / tutor123</li>
            <li>alumno@ies.edu.ar / alumno123</li>
          </ul>
        </div>
      </form>
    </div>
  );
}