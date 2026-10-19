// src/components/forms/UsuarioForm.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "../ui/Input/Input";
import Select from "../ui/Select/Select";
import Button from "../ui/Button/Button";

export default function UsuarioForm({
  rolesDisponibles = [],
  mostrarServidores = false,
  mostrarRolesGlobales = false,
  onSubmit,
  onCancel,
  guardando = false,
}) {
  const [form, setForm] = useState({
    nombre_usuario: "",
    email: "",
    password: "",
    confirmar_password: "",
    activo: "true",
    nombres: "",
    apellidos: "",
    roles_ids: [],
  });
  
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRol = (rolId) => {
    setForm((prev) => {
      const existe = prev.roles_ids.includes(rolId);
      return {
        ...prev,
        roles_ids: existe
          ? prev.roles_ids.filter((id) => id !== rolId)
          : [...prev.roles_ids, rolId],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre_usuario.trim()) return setError("El nombre de usuario es obligatorio.");
    if (form.nombre_usuario.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
    if (!form.email.trim()) return setError("El email es obligatorio.");
    if (!form.nombres.trim() || !form.apellidos.trim()) return setError("Nombre y apellido son obligatorios.");
    
    if (!form.password || form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmar_password) return setError("Las contraseñas no coinciden.");

    // Validar roles de servidor
    const rolesServidor = form.roles_ids.filter(id => {
      const r = rolesDisponibles.find(x => x.id_rol === id);
      return r?.tipo === "servidor";
    });
    
    if (rolesServidor.length > 0 && mostrarServidores && form.servidores_ids?.length === 0) {
      return setError("Seleccionaste roles de servidor pero no asignaste ningún servidor.");
    }

    onSubmit(form);
  };

  // Filtro de roles a mostrar
  const rolesAMostrar = mostrarRolesGlobales 
    ? rolesDisponibles 
    : rolesDisponibles.filter(r => r.tipo === "servidor");

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      
      <h4 style={{ margin: "0", fontSize: "14px", color: "var(--color-azul-petroleo)", borderBottom: "1px solid #ccc", paddingBottom: "4px" }}>Datos de la cuenta</h4>
      
      <Input label="Nombre de usuario" name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Ej: jperez" />
      <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Ej: juan@email.com" />
      
      <div className="admin-clave">
        <label className="admin-clave-label">Contraseña</label>
        <div className="admin-clave-caja">
          <input 
            name="password" 
            type={verClave ? "text" : "password"} 
            value={form.password} 
            onChange={handleChange} 
            placeholder="Mínimo 6 caracteres" 
            style={{ width: "100%" }}
          />
          <button type="button" onClick={() => setVerClave(!verClave)}>
            {verClave ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      
      <Input label="Repetir contraseña" name="confirmar_password" type={verClave ? "text" : "password"} value={form.confirmar_password} onChange={handleChange} placeholder="Volvé a escribirla" />

      <Select label="Estado" name="activo" value={form.activo} onChange={handleChange} options={[{ value: "true", label: "Activo" }, { value: "false", label: "Inactivo" }]} />

      <h4 style={{ margin: "1rem 0 0 0", fontSize: "14px", color: "var(--color-azul-petroleo)", borderBottom: "1px solid #ccc", paddingBottom: "4px" }}>Datos personales</h4>
      
      <Input label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} placeholder="Ej: Juan Carlos" />
      <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej: Pérez" />

      <div className="admin-grupo" style={{ marginTop: "1rem" }}>
        <span className="admin-grupo-label" style={{ fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "8px" }}>Roles</span>
        <div className="admin-checks" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {rolesAMostrar.map((r) => (
            <label key={r.id_rol} className="admin-check" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "var(--color-gris-azulado)", borderRadius: "6px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.roles_ids.includes(r.id_rol)} onChange={() => toggleRol(r.id_rol)} />
              <span style={{ fontSize: "13px" }}>{r.nombre}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="admin-tab__error" style={{ color: "red", background: "#fee", padding: "8px", borderRadius: "4px", fontSize: "14px" }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem", width: "100%" }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={guardando}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Crear y agregar"}
        </Button>
      </div>
    </form>
  );
}