import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card/Card";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from "../../api/usuarios";
import "./Usuarios.css";

const formVacio = { nombre_usuario: "", email: "", contrasena: "", activo: "true" };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async (query = "") => {
    try {
      setError("");
      const datos = await listarUsuarios({ query });
      setUsuarios(datos);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => cargar(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setEditandoId(u.id_usuario);
    setForm({
      nombre_usuario: u.nombre_usuario,
      email: u.email,
      contrasena: "",
      activo: String(u.activo),
    });
    setError("");
    setModalOpen(true);
  };

  const handleEliminar = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.nombre_usuario}"?`)) return;

    try {
      setError("");
      await eliminarUsuario(u.id_usuario);
      await cargar(busqueda);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre_usuario.trim() || !form.email.trim()) {
      setError("El nombre de usuario y el email son obligatorios");
      return;
    }

    setGuardando(true);

    try {
      if (editandoId) {
        await actualizarUsuario(editandoId, {
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
        });
      } else {
        await crearUsuario({
          nombre_usuario: form.nombre_usuario,
          email: form.email,
          activo: form.activo === "true",
          contrasena_hash: form.contrasena || null,
        });
      }

      await cargar(busqueda);
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="usuarios">
      <div className="usuarios__header">
        <h1 className="usuarios__title">Usuarios</h1>
        <Button size="sm" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo usuario
        </Button>
      </div>

      <div className="canales__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p className="usuarios__email">{error}</p>}

      <Card padding="sm">
        <ul className="usuarios__list">
          {usuarios.length === 0 && <li className="usuarios__item">No hay usuarios.</li>}

          {usuarios.map((u) => (
            <li key={u.id_usuario} className="usuarios__item">
              <div>
                <span className="usuarios__name">{u.nombre_usuario}</span>
                <span className="usuarios__email">{u.email}</span>
              </div>

              <div className="usuarios__acciones">
                <Badge variant={u.activo ? "success" : "danger"}>
                  {u.activo ? "Activo" : "Inactivo"}
                </Badge>
                <button
                  className="usuarios__icon-btn"
                  onClick={() => abrirEditar(u)}
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="usuarios__icon-btn usuarios__icon-btn--danger"
                  onClick={() => handleEliminar(u)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {modalOpen && (
        <Modal
          title={editandoId ? "Editar usuario" : "Nuevo usuario"}
          onClose={() => setModalOpen(false)}
        >
          <form className="usuarios__form" onSubmit={handleSubmit}>
            <Input
              label="Nombre de usuario"
              name="nombre_usuario"
              value={form.nombre_usuario}
              onChange={handleChange}
              placeholder="Ej: juanperez"
            />
            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Ej: juan@colegio.com"
            />

            {!editandoId && (
              <Input
                label="Contraseña"
                name="contrasena"
                type="password"
                value={form.contrasena}
                onChange={handleChange}
                placeholder="Opcional"
              />
            )}

            <Select
              label="Estado"
              name="activo"
              value={form.activo}
              onChange={handleChange}
              options={[
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ]}
              placeholder="Elegir estado"
            />

            {error && <p className="usuarios__email">{error}</p>}

            <div className="usuarios__form-actions">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}