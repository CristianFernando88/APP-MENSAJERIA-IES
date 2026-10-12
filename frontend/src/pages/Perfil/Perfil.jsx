import { useState } from "react";
import Input from "../../components/ui/Input/Input";
import Button from "../../components/ui/Button/Button";
import Badge from "../../components/ui/Badge/Badge";
import "./Perfil.css";


const usuarioInicial = {
 
  nombre_usuario: "carlos.castro",
  email: "carlos.castro@iesbelgrano.edu.ar",
  fecha_registro: "01/03/2026",
  activo: true,
  
  nombre: "Carlos",
  apellidos: "Castro",
  foto_perfil: "",
  biografia: "",
};

export default function Perfil() {
  const [form, setForm] = useState(usuarioInicial);
  const [editando, setEditando] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {

    setEditando(false);
  };

  const iniciales = `${form.nombre.charAt(0)}${form.apellidos.charAt(0)}`;

  return (
    <section className="perfil">
      <div className="perfil__header">
        <div className="perfil__avatar">
          {form.foto_perfil ? (
            <img src={form.foto_perfil} alt={form.nombre} />
          ) : (
            <span>{iniciales}</span>
          )}
        </div>
        <div>
          <h1 className="perfil__nombre">
            {form.nombre} {form.apellidos}
          </h1>
          <p className="perfil__username">@{form.nombre_usuario}</p>
          <Badge variant={form.activo ? "success" : "danger"}>
            {form.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

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
        <p className="perfil__meta">Miembro desde {form.fecha_registro}</p>

        <h2 className="perfil__section-title">Datos personales</h2>
        <div className="perfil__grid">
          <Input
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            disabled={!editando}
          />
          <Input
            label="Apellidos"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            disabled={!editando}
          />
        </div>

        <label className="perfil__label" htmlFor="biografia">Biografía</label>
        <textarea
          id="biografia"
          name="biografia"
          className="perfil__textarea"
          rows={4}
          value={form.biografia}
          onChange={handleChange}
          disabled={!editando}
          placeholder="Contanos algo sobre vos..."
        />

        <div className="perfil__actions">
          {editando ? (
            <>
              <Button type="button" variant="outline" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
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