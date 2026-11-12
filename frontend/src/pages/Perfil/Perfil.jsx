import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerUsuario } from "../../api/usuarios";
import Button from "../../components/ui/Button/Button";
import Badge from "../../components/ui/Badge/Badge";
import "./Perfil.css";
import { obtenerPerfil, actualizarPerfil, subirFotoPerfil, eliminarFotoPerfil } from "../../api/perfiles";

export default function Perfil() {
  const { user } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [datosPerfil, setDatosPerfil] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [biografia, setBiografia] = useState("");
  const [guardandoBio, setGuardandoBio] = useState(false);

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
        setBiografia(dataPerfil?.biografia || "");
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

  // --- Foto (editable) ---
  const handleSeleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

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
    setError("");

    try {
      const actualizado = await subirFotoPerfil(user.id_usuario, archivoFoto);

      setDatosPerfil(actualizado);
      setFotoPreview(actualizado.foto_perfil || "");
      setArchivoFoto(null);
    } catch (err) {
      setError(err?.message || "No se pudo subir la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleQuitarFoto = async () => {
    if (!user?.id_usuario) return;
    setSubiendoFoto(true);
    setError("");
    try {
      const actualizado = await eliminarFotoPerfil(user.id_usuario);
      setDatosPerfil(actualizado);
      setFotoPreview("");
      setArchivoFoto(null);
    } catch (err) {
      setError(err?.message || "No se pudo quitar la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  // --- Biografía (editable) ---
  const handleGuardarBiografia = async () => {
    if (!user?.id_usuario) return;

    setGuardandoBio(true);
    setError("");

    try {
      const biografiaFinal = biografia && biografia.trim() ? biografia.trim() : null;

      const actualizadoPerfil = await actualizarPerfil(user.id_usuario, {
        biografia: biografiaFinal,
      });

      setDatosPerfil(actualizadoPerfil);
      setBiografia(actualizadoPerfil?.biografia || "");
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la biografía");
    } finally {
      setGuardandoBio(false);
    }
  };

  const iniciales = perfil?.nombre_usuario
    ? perfil.nombre_usuario.slice(0, 2).toUpperCase()
    : "??";

  const campoSoloLectura = (etiqueta, valor) => (
    <div className="perfil__campo">
      <span className="perfil__campo-etiqueta">{etiqueta}</span>
      <span className="perfil__campo-valor">{valor || "-"}</span>
    </div>
  );

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
          <h1 className="perfil__nombre">
            {datosPerfil?.nombres || datosPerfil?.apellidos
              ? `${datosPerfil?.nombres || ""} ${datosPerfil?.apellidos || ""}`.trim()
              : perfil?.nombre_usuario}
          </h1>
          <p className="perfil__username">@{perfil?.nombre_usuario}</p>

          <Badge variant={perfil?.activo ? "success" : "danger"}>
            {perfil?.activo ? "Activo" : "Inactivo"}
          </Badge>
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

        {(fotoPreview || datosPerfil?.foto_perfil) && !archivoFoto && (
          <button
            type="button"
            className="perfil__foto-boton"
            onClick={handleQuitarFoto}
            disabled={subiendoFoto}
          >
            {subiendoFoto ? "Quitando..." : "Quitar foto"}
          </button>
        )}
      </div>

      {error && <p className="perfil__mensaje-error">{error}</p>}

      <div className="perfil__bloque">
        <h2 className="perfil__section-title">Datos personales</h2>
        <p className="perfil__nota">
          Estos datos solo pueden ser cargados por un administrador.
        </p>
        <div className="perfil__campos">
          {campoSoloLectura("Nombres", datosPerfil?.nombres)}
          {campoSoloLectura("Apellidos", datosPerfil?.apellidos)}
          {campoSoloLectura("DNI", datosPerfil?.dni)}
        </div>
      </div>

      <div className="perfil__bloque">
        <h2 className="perfil__section-title">Datos de la cuenta</h2>
        <div className="perfil__campos">
          {campoSoloLectura("Nombre de usuario", perfil?.nombre_usuario)}
          {campoSoloLectura("Email", perfil?.email)}
          {campoSoloLectura(
            "Miembro desde",
            perfil?.fecha_registro
              ? new Date(perfil.fecha_registro).toLocaleDateString("es-AR")
              : "-"
          )}
        </div>
      </div>

      <div className="perfil__bloque">
        <h2 className="perfil__section-title">Roles</h2>
        <div className="perfil__roles">
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
      </div>

      <div className="perfil__bloque">
        <h2 className="perfil__section-title">Biografía</h2>
        <textarea
          id="biografia"
          name="biografia"
          className="perfil__textarea"
          value={biografia || ""}
          onChange={(e) => setBiografia(e.target.value)}
          placeholder="Contá tu biografía..."
          rows={3}
        />
        <div className="perfil__actions">
          <Button
            type="button"
            onClick={handleGuardarBiografia}
            disabled={guardandoBio}
          >
            {guardandoBio ? "Guardando..." : "Guardar biografía"}
          </Button>
        </div>
      </div>
    </section>
  );
}
