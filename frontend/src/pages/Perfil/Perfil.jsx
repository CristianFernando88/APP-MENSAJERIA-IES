import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerUsuario, actualizarUsuario } from "../../api/usuarios";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import Badge from "../../components/ui/Badge/Badge";
import "./Perfil.css";
import { obtenerPerfil, actualizarPerfil, subirFotoPerfil } from "../../api/perfiles";

export default function Perfil() {
  const { user } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [datosPerfil, setDatosPerfil] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [form, setForm] = useState({
    nombre_usuario: "",
    email: "",
    password: "",
    activo: true,
    biografia: "",
  });

  
  useEffect(() => {
    if (!user?.id_usuario) return;

    let cancelado = false;

    async function cargarPerfil() {
      setLoading(true);
      setError("");
      try {
        const data = await obtenerUsuario(user.id_usuario);
        const dataPerfil = await obtenerPerfil(user.id_usuario);
        if (cancelado) return;

        setPerfil(data);
        setDatosPerfil(dataPerfil);
        setForm({
          nombre_usuario: data.nombre_usuario || "",
          email: data.email || "",
          password: "",
          activo: data.activo ?? true,
          biografia: dataPerfil?.biografia || "",
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

  
  const handleSeleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    setMensaje("");
    setError("");

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!formatosPermitidos.includes(archivo.type)) {
      setError("Elegí una imagen JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      e.target.value = "";
      return;
    }

    setArchivoFoto(archivo);
    setFotoPreview(URL.createObjectURL(archivo));
  };

  const handleSubirFoto = async () => {
    if (!user?.id_usuario || !archivoFoto) return;

    setSubiendoFoto(true);
    setMensaje("");
    setError("");

    try {
      const actualizado = await subirFotoPerfil(
        user.id_usuario,
        archivoFoto
      );

      setDatosPerfil(actualizado);
      setFotoPreview(actualizado.foto_perfil || "");
      setArchivoFoto(null);
      setMensaje("Foto de perfil actualizada correctamente.");
    } catch (err) {
      setError(err?.message || "No se pudo subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
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

      const biografiaFinal =
        form.biografia && form.biografia.trim()
          ? form.biografia.trim()
          : null;

      const actualizadoPerfil = await actualizarPerfil(user.id_usuario, {
        biografia: biografiaFinal,
      });

      setPerfil(actualizado);
      setDatosPerfil(actualizadoPerfil);
      setForm((prev) => ({
        ...prev,
        nombre_usuario: actualizado.nombre_usuario,
        email: actualizado.email,
        password: "",
        biografia: biografiaFinal || "",
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
          {fotoPreview || datosPerfil?.foto_perfil ? (
            <img
              src={fotoPreview || datosPerfil.foto_perfil}
              alt="Foto de perfil"
            />
          ) : (
            <span>{iniciales}</span>
          )}
        </div>

        <div>
          <h1 className="perfil__nombre">{perfil?.nombre_usuario}</h1>
          <p className="perfil__username">{perfil?.email}</p>

          <Badge variant={perfil?.activo ? "success" : "danger"}>
            {perfil?.activo ? "Activo" : "Inactivo"}
          </Badge>

          {datosPerfil?.biografia && (
            <p
              style={{
                fontSize: "13px",
                color: "#475569",
                margin: "8px 0 0 0",
                lineHeight: 1.5,
              }}
            >
              {datosPerfil.biografia}
            </p>
          )}
        </div>
      </div>

      <div className="perfil__foto-acciones">
        <label htmlFor="foto-perfil" className="perfil__foto-boton">
          Elegir foto
        </label>

        <input
          id="foto-perfil"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSeleccionarFoto}
          hidden
        />

        {archivoFoto && (
          <button
            type="button"
            className="perfil__foto-boton"
            onClick={handleSubirFoto}
            disabled={subiendoFoto}
          >
            {subiendoFoto ? "Subiendo..." : "Guardar foto"}
          </button>
        )}
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

        {editando && (
          <div className="perfil__grid">
            <div style={{ gridColumn: "1 / -1", width: "100%" }}>
              <label
                htmlFor="biografia"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "#334155",
                }}
              >
                Biografía
              </label>
              <textarea
                id="biografia"
                name="biografia"
                value={form.biografia || ""}
                onChange={handleChange}
                placeholder="Contá tu biografía..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
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
                    biografia: datosPerfil?.biografia || "",
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