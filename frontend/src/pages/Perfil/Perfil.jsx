import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerUsuario, actualizarUsuario } from "../../api/usuarios";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import Badge from "../../components/ui/Badge/Badge";
import "./Perfil.css";

export default function Perfil() {
  const { user } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre_usuario: "",
    email: "",
    password: "",
    activo: true,
  });

  
  useEffect(() => {
    if (!user?.id_usuario) return;

    let cancelado = false;

    async function cargarPerfil() {
      setLoading(true);
      setError("");
      try {
        const data = await obtenerUsuario(user.id_usuario);
        if (cancelado) return;

        setPerfil(data);
        setForm({
          nombre_usuario: data.nombre_usuario || "",
          email: data.email || "",
          password: "",
          activo: data.activo ?? true,
        });
      } catch (err) {
        if (!cancelado) setError(err?.message || "No se pudo cargar el perfil");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarPerfil();
    return () => {
      cancelado = true;
    };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id_usuario) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const payload = {
        nombre_usuario: form.nombre_usuario.trim(),
        email: form.email.trim(),
      };

    
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const actualizado = await actualizarUsuario(user.id_usuario, payload);

      setPerfil(actualizado);
      setForm((prev) => ({
        ...prev,
        nombre_usuario: actualizado.nombre_usuario,
        email: actualizado.email,
        password: "",
      }));

      setMensaje("Perfil actualizado correctamente.");
      setEditando(false);
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = perfil?.nombre_usuario
    ? perfil.nombre_usuario.slice(0, 2).toUpperCase()
    : "??";

  if (loading) {
    return <p className="cargando">Cargando perfil...</p>;
  }

  if (error && !perfil) {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="perfil">
      <div className="perfil__header">
        <div className="perfil__avatar">
          <span>{iniciales}</span>
        </div>

        <div>
          <h1 className="perfil__nombre">{perfil?.nombre_usuario}</h1>
          <p className="perfil__username">{perfil?.email}</p>

          <Badge variant={perfil?.activo ? "success" : "danger"}>
            {perfil?.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      {mensaje && <p className="perfil__mensaje-exito">{mensaje}</p>}
      {error && <p className="perfil__mensaje-error">{error}</p>}

      <form className="perfil__form" onSubmit={handleSubmit}>
        <h2 className="perfil__section-title">Datos de la cuenta</h2>

        <div className="perfil__grid">
          <Input
            label="Nombre de usuario"
            name="nombre_usuario"
            value={form.nombre_usuario}
            onChange={handleChange}
            disabled={!editando}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={!editando}
          />
        </div>

        {editando && (
          <div className="perfil__grid">
            <Input
              label="Nueva contraseña (opcional)"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Dejar vacío para no cambiarla"
            />
          </div>
        )}

        <p className="perfil__meta">
          Miembro desde {perfil?.fecha_registro
            ? new Date(perfil.fecha_registro).toLocaleDateString("es-AR")
            : "-"}
        </p>

        <h2 className="perfil__section-title">Roles</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
          {user?.roles?.length ? (
            user.roles.map((rol) => (
              <Badge key={rol.id_rol || rol.nombre} variant="default">
                {rol.nombre}
              </Badge>
            ))
          ) : (
            <span>Sin roles asignados</span>
          )}
        </div>

        <div className="perfil__actions">
          {editando ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditando(false);
                  setForm({
                    nombre_usuario: perfil?.nombre_usuario || "",
                    email: perfil?.email || "",
                    password: "",
                    activo: perfil?.activo ?? true,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setEditando(true)}>
              Editar perfil
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}