import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lightbulb, Mail, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { obtenerPerfil } from "../../api/perfiles";
import { crearSugerencia } from "../../api/sugerencias";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import "./Sugerencias.css";

const FORM_INICIAL = {
  nombres: "",
  apellidos: "",
  mensaje: "",
};

export default function Sugerencias() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  useEffect(() => {
    if (!user?.id_usuario) return;

    let activo = true;

    obtenerPerfil(user.id_usuario)
      .then((perfil) => {
        if (!activo) return;

        setForm((actual) => ({
          ...actual,
          nombres: actual.nombres || perfil?.nombres || "",
          apellidos: actual.apellidos || perfil?.apellidos || "",
        }));
      })
      .catch(() => {
        // Si el usuario no tiene perfil, completa los campos a mano.
      });

    return () => {
      activo = false;
    };
  }, [user?.id_usuario]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((actual) => ({ ...actual, [name]: value }));
    setErrores((actual) => ({ ...actual, [name]: "" }));
    setErrorGeneral("");
  };

  const validar = () => {
    const nuevosErrores = {};
    const nombres = form.nombres.trim();
    const apellidos = form.apellidos.trim();
    const mensaje = form.mensaje.trim();

    if (!nombres) {
      nuevosErrores.nombres = "Ingresá tu nombre.";
    } else if (nombres.length > 100) {
      nuevosErrores.nombres = "El nombre no puede superar los 100 caracteres.";
    }

    if (!apellidos) {
      nuevosErrores.apellidos = "Ingresá tu apellido.";
    } else if (apellidos.length > 100) {
      nuevosErrores.apellidos = "El apellido no puede superar los 100 caracteres.";
    }

    if (mensaje.length < 10) {
      nuevosErrores.mensaje = "Escribí al menos 10 caracteres.";
    } else if (mensaje.length > 1000) {
      nuevosErrores.mensaje = "La sugerencia no puede superar los 1000 caracteres.";
    }

    return nuevosErrores;
  };

  const enviar = async (e) => {
    e.preventDefault();

    if (enviando) return;

    setErrorGeneral("");

    const nuevosErrores = validar();

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);

    try {
      await crearSugerencia({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        mensaje: form.mensaje.trim(),
      });

      setEnviada(true);
      setForm((actual) => ({ ...actual, mensaje: "" }));
      setErrores({});
    } catch (err) {
      setErrorGeneral(
        err?.message || "No se pudo enviar la sugerencia. Intentá de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  const enviarOtra = () => {
    setEnviada(false);
    setErrorGeneral("");
    setErrores({});
  };

  return (
    <section className="sugerencias">
      <header className="sugerencias__header">
        <span className="sugerencias__icono" aria-hidden="true">
          <Lightbulb size={24} />
        </span>

        <div>
          <h1 className="sugerencias__title">Sugerencias</h1>
          <p className="sugerencias__subtitle">
            Contanos qué podemos mejorar de IES Connect. Tu opinión llega
            directamente al equipo de desarrollo.
          </p>
        </div>
      </header>

      {enviada ? (
        <section
          className="sugerencias__card sugerencias__exito"
          aria-live="polite"
        >
          <CheckCircle2 size={48} className="sugerencias__exito-icono" />

          <h2 className="sugerencias__exito-title">
            ¡Gracias por tu sugerencia!
          </h2>

          <p className="sugerencias__exito-texto">
            Ya la recibimos. El equipo de desarrollo la va a revisar.
          </p>

          <div className="sugerencias__acciones sugerencias__acciones--centradas">
            <Button variant="outline" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>

            <Button onClick={enviarOtra}>Enviar otra sugerencia</Button>
          </div>
        </section>
      ) : (
        <form className="sugerencias__card" onSubmit={enviar} noValidate>
          <div>
            <h2 className="sugerencias__card-title">Nueva sugerencia</h2>
            <p className="sugerencias__card-texto">
              Los campos con <span className="sugerencias__requerido">*</span>{" "}
              son obligatorios.
            </p>
          </div>

          <div className="sugerencias__grid">
            <Input
              label="Nombre *"
              name="nombres"
              value={form.nombres}
              onChange={cambiar}
              error={errores.nombres}
              placeholder="Tu nombre"
            />

            <Input
              label="Apellido *"
              name="apellidos"
              value={form.apellidos}
              onChange={cambiar}
              error={errores.apellidos}
              placeholder="Tu apellido"
            />
          </div>

          <div className="sugerencias__correo">
            <Mail
              size={18}
              className="sugerencias__correo-icono"
              aria-hidden="true"
            />

            <div className="sugerencias__correo-texto">
              <span className="sugerencias__correo-label">
                Correo registrado
              </span>
              <span className="sugerencias__correo-valor">
                {user?.email || "No disponible"}
              </span>
              <span className="sugerencias__correo-ayuda">
                La sugerencia se enviará asociada a este correo.
              </span>
            </div>
          </div>

          <div className="sugerencias__campo">
            <label className="sugerencias__label" htmlFor="mensaje">
              Sugerencia *
            </label>

            <textarea
              id="mensaje"
              name="mensaje"
              className={`sugerencias__textarea${
                errores.mensaje ? " sugerencias__textarea--error" : ""
              }`}
              value={form.mensaje}
              onChange={cambiar}
              maxLength={1000}
              rows={6}
              placeholder="Contanos qué mejorarías, qué te gustaría agregar o qué problema encontraste..."
            />

            <div className="sugerencias__meta">
              {errores.mensaje ? (
                <span className="sugerencias__error">
                  {errores.mensaje}
                </span>
              ) : (
                <span className="sugerencias__ayuda">
                  Mínimo 10 caracteres.
                </span>
              )}

              <span className="sugerencias__contador">
                {form.mensaje.length}/1000
              </span>
            </div>
          </div>

          {errorGeneral && (
            <div className="sugerencias__alerta" role="alert">
              {errorGeneral}
            </div>
          )}

          <div className="sugerencias__acciones">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={enviando}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={enviando}>
              <Send size={16} />
              {enviando ? "Enviando..." : "Enviar sugerencia"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
