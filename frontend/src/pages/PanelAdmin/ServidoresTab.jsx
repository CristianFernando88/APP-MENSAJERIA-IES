import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Server, ChevronLeft, ChevronRight, X } from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import useConfirmacion from "../../hooks/useConfirmacion";
import { useAuth } from "../../context/AuthContext";
import { crearServidor, actualizarServidor, eliminarServidor } from "../../api/servidores";

const POR_PAGINA = 10;
const formVacio = { nombre: "", descripcion: "" };

export default function ServidoresTab({ servidores, setServidores, usuarios }) {
  const { user } = useAuth();
  const { pedir, dialogo } = useConfirmacion();

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return servidores;
    return servidores.filter(
      (s) =>
        (s.nombre || "").toLowerCase().includes(term) ||
        (s.descripcion || "").toLowerCase().includes(term)
    );
  }, [servidores, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  useEffect(() => setPagina(1), [busqueda]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(formVacio);
    setError("");
    setModal(true);
  };

  const abrirEditar = (s) => {
    setEditando(s);
    setForm({ nombre: s.nombre || "", descripcion: s.descripcion || "" });
    setError("");
    setModal(true);
  };

  const cerrar = () => {
    if (guardando) return;
    setModal(false);
    setEditando(null);
    setError("");
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");

    const ok = await pedir({
      titulo: editando ? "Guardar cambios" : "Crear servidor",
      mensaje: editando
        ? `¿Guardar los cambios de "${form.nombre.trim()}"?`
        : `¿Crear el servidor "${form.nombre.trim()}"?`,
      textoConfirmar: editando ? "Guardar" : "Crear",
    });
    if (!ok) return;

    setGuardando(true);
    try {
      if (editando) {
        const actualizado = await actualizarServidor(editando.id_servidor, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
        });
        setServidores((prev) =>
          prev.map((s) => (s.id_servidor === actualizado.id_servidor ? actualizado : s))
        );
      } else {
        const nuevo = await crearServidor({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          creador_id: user.id_usuario,
        });
        setServidores((prev) => [...prev, nuevo]);
      }
      cerrar();
    } catch (err) {
      setError(err.message || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (s) => {
    const ok = await pedir({
      titulo: "Eliminar servidor",
      mensaje: `¿Eliminar el servidor "${s.nombre}"? Se borran sus categorías, canales y membresías.`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
    });
    if (!ok) return;
    setError("");
    try {
      await eliminarServidor(s.id_servidor);
      setServidores((prev) => prev.filter((x) => x.id_servidor !== s.id_servidor));
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab__header">
        <h2><Server size={18} /> Servidores ({servidores.length})</h2>
        <Button size="sm" onClick={abrirNuevo}><Plus size={15} /> Nuevo servidor</Button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-buscar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar servidor..."
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
          {busqueda ? "No se encontraron servidores." : "No hay servidores. Creá el primero."}
        </p>
      ) : (
        <div className="admin-tabla-wrap">
          <table className="admin-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Creador</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((s) => (
                <tr key={s.id_servidor}>
                  <td>#{s.id_servidor}</td>
                  <td><strong>{s.nombre}</strong></td>
                  <td>{s.descripcion || "—"}</td>
                  <td>{usuarios.find((u) => u.id_usuario === s.creador_id)?.nombre_usuario ?? s.creador_id}</td>
                  <td>{s.fecha_creacion ? new Date(s.fecha_creacion).toLocaleDateString("es-AR") : "—"}</td>
                  <td>
                    <div className="admin-acciones">
                      <button className="admin-icon-btn" onClick={() => abrirEditar(s)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleEliminar(s)} title="Eliminar">
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
        <Modal title={editando ? "Editar servidor" : "Nuevo servidor"} onClose={cerrar}>
          <form className="admin-form" onSubmit={guardar}>
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Secundaria" />
            <Input label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Ej: Nivel secundario" />
            {error && <div className="admin-tab__error">{error}</div>}
            <div className="admin-form__actions">
              <Button type="button" variant="outline" onClick={cerrar} disabled={guardando}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear servidor"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogo}
    </div>
  );
}