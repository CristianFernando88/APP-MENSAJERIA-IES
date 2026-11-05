import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiPut } from "../../api/apiClient";
import Button from "../../components/ui/Button/Button";

export default function CambiarPasswordInicial() {
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { user, actualizarUsuario } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (nuevaPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    try {
      await apiPut("/auth/cambiar-password-inicial", {
        nueva_password: nuevaPassword,
      });

      actualizarUsuario({ debe_cambiar_password: false });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="on-gradient login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__brand">
          <h1 className="login__title">Cambiar contraseña</h1>
          <p className="login__subtitle">
            Hola {user?.nombre_usuario}. Por seguridad, creá una nueva contraseña
            para continuar.
          </p>
        </div>

        <div className="login__campo">
          <label className="login__label" htmlFor="nuevaPassword">
            Nueva contraseña
          </label>
          <input
            id="nuevaPassword"
            type="password"
            className="login__input"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="login__campo">
          <label className="login__label" htmlFor="confirmarPassword">
            Confirmar contraseña
          </label>
          <input
            id="confirmarPassword"
            type="password"
            className="login__input"
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="login__error">{error}</p>}

        <Button type="submit" fullWidth disabled={enviando} variant="dark">
          {enviando ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}