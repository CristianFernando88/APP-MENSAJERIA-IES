import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Shield, ChevronLeft, ChevronRight, X } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import useConfirmacion from "../../hooks/useConfirmacion";
import { crearRol, actualizarRol, eliminarRol } from "../../api/roles";

const POR_PAGINA = 10;
const rolVacio = { nombre: "", descripcion: "", tipo: "global" };

export default function RolesTab({ roles, setRoles, asignaciones }) {
  const { pedir, dialogo } = useConfirmacion();

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(rolVacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const conteoAsignaciones = (rolId) =>
    asignaciones.filter((a) => a.rol_id === rolId).length;

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        (r.nombre || "").toLowerCase().includes(term) ||
        (r.descripcion || "").toLowerCase().includes(term)
    );
  }, [roles, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  useEffect(() => setPagina(1), [busqueda]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(rolVacio);
    setError("");
    setModal(true);
  };

  const abrirEditar = (r) => {
    setEditando(r);
    setForm({ nombre: r.nombre || "", descripcion: r.descripcion || "", tipo: r.tipo || "global" });
    setError("");
    setModal(true);
  };

  const cerrar = () => {
    if (guardando) return;
    setModal(false);
    setEditando(null);
    setError("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");

    const ok = await pedir({
      titulo: editando ? "Guardar cambios" : "Crear rol",
      mensaje: editando
        ? `¿Guardar los cambios del rol "${form.nombre.trim()}"?`
        : `¿Crear el rol "${form.nombre.trim()}" (${form.tipo})?`,
      textoConfirmar: editando ? "Guardar" : "Crear",
    });
    if (!ok) return;

    setGuardando(true);
    try {
      if (editando) {
        const actualizado = await actualizarRol(editando.id_rol, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          tipo: form.tipo,
        });
        setRoles((prev) => prev.map((r) => (r.id_rol === actualizado.id_rol ? actualizado : r)));
      } else {
        const nuevo = await crearRol({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          tipo: form.tipo,
        });
        setRoles((prev) => [...prev, nuevo]);
      }
      cerrar();
    } catch (err) {
      setError(err.message || "No se pudo guardar el rol");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (r) => {
    const asignados = conteoAsignaciones(r.id_rol);
    const ok = await pedir({
      titulo: "Eliminar rol",
      mensaje:
        asignados > 0
          ? `El rol "${r.nombre}" está asignado a ${asignados} usuario(s). ¿Eliminarlo de todas formas? Se quitarán las asignaciones.`
          : `¿Eliminar el rol "${r.nombre}"?`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!ok) return;
    setError("");
    try {
      await eliminarRol(r.id_rol);
      setRoles((prev) => prev.filter((x) => x.id_rol !== r.id_rol));
    } catch (err) {
      setError(err.message || "No se pudo eliminar el rol");
    }
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <h2><Shield size={18} /> Roles base ({roles.length})</h2>
        <Button size="sm" onClick={abrirNuevo}><Plus size={15} /> Nuevo rol</Button>
      </div>

      <p className="admin-nota">
        Los roles definen los permisos del sistema. Para asignar un rol a un usuario,
        editá el usuario en la pestaña <strong>Usuarios</strong>.
      </p>

      <div className="admin-toolbar">
        <div className="admin-buscar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} aria-label="Limpiar">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && <div className="admin-tab__error">{error}</div>}

      {filtrados.length === 0 ? (
        <p className="admin-tab__vacio">
          {busqueda ? "No se encontraron roles." : "No hay roles definidos. Creá el primero."}
        </p>
      ) : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Asignaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.id_rol}>
                  <td><strong>{r.nombre}</strong></td>
                  <td>
                    <span className={`badge-tipo badge-tipo--${r.tipo}`}>{r.tipo}</span>
                  </td>
                  <td>{r.descripcion || "—"}</td>
                  <td>
                    <span className="admin-contador">
                      {conteoAsignaciones(r.id_rol)} usuario{conteoAsignaciones(r.id_rol) === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-acciones">
                      <button className="admin-icon-btn" onClick={() => abrirEditar(r)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleEliminar(r)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="admin-paginacion">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaSegura === 1}>
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button key={n} className={n === paginaSegura ? "activo" : ""} onClick={() => setPagina(n)}>
              {n}
            </button>
          ))}
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaSegura === totalPaginas}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {modal && (
        <Modal title={editando ? "Editar rol" : "Nuevo rol"} onClose={cerrar}>
          <form className="admin-form" onSubmit={guardar}>
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Director" />
            <Input label="Descripción" name="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Director de un servidor" />
            <Select
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              options={[
                { value: "global", label: "Global" },
                { value: "servidor", label: "Servidor" },
              ]}
            />
            {error && <div className="admin-tab__error">{error}</div>}
            <div className="admin-form__actions">
              <Button type="button" variant="outline" onClick={cerrar} disabled={guardando}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear rol"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogo}
    </div>
  );
}