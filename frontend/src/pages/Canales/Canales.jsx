import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Hash, Megaphone, Plus, Pencil, Trash2, Users, ChevronRight, AlertCircle, Loader2, X
} from "lucide-react";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Select from "../../components/ui/Select/Select";
import Modal from "../../components/ui/Modal/Modal";
import { listarCanales } from "../../api/canales";
import { listarMiembrosCanal, crearMiembroCanal, actualizarMiembroCanal, eliminarMiembroCanal } from "../../api/miembrosCanal";
import { listarUsuarios } from "../../api/usuarios";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import { listarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { useAuth } from "../../context/AuthContext";
import "./Canales.css";

export default function Canales() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // --- Datos base ---
  const [canales, setCanales] = useState([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const [todosLosRoles, setTodosLosRoles] = useState([]);
  const [rolesDefinidos, setRolesDefinidos] = useState([]);
  const [miembrosCanal, setMiembrosCanal] = useState([]);
  const [miembrosServidor, setMiembrosServidor] = useState([]);

  // --- UI ---
  const [busqueda, setBusqueda] = useState("");
  const [canalSeleccionadoId, setCanalSeleccionadoId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Modales ---
  const [modalMiembro, setModalMiembro] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [rolEnCanal, setRolEnCanal] = useState("miembro");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // 1. Cargar todo
  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      try {
        const [resCanales, resUsuarios, resAsignaciones, resRoles, resMiembrosCanal, resMiembrosServidor] = await Promise.all([
          listarCanales(),
          listarUsuarios(),
          listarUsuarioRol(),
          listarRoles(),
          listarMiembrosCanal(),
          listarMiembrosServidor()
        ]);
        if (cancelado) return;
        setCanales(resCanales || []);
        setTodosLosUsuarios(resUsuarios || []);
        setTodosLosRoles(resAsignaciones || []);
        setRolesDefinidos(resRoles || []);
        setMiembrosCanal(resMiembrosCanal || []);
        setMiembrosServidor(resMiembrosServidor || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, []);

  // 2. Filtrar canales según membresía
  const misCanales = useMemo(() => {
    if (!user) return [];
    if (hasRole(["super_admin", "admin"])) return canales;

    const misIdsCanal = miembrosCanal
      .filter((m) => Number(m.usuario_id) === Number(user.id_usuario))
      .map((m) => Number(m.canal_id));

    return canales.filter((c) => misIdsCanal.includes(Number(c.id_canal)));
  }, [canales, miembrosCanal, user, hasRole]);

  // Auto-seleccionar el primer canal
  useEffect(() => {
    if (misCanales.length > 0 && !misCanales.some(c => c.id_canal === canalSeleccionadoId)) {
      setCanalSeleccionadoId(misCanales[0].id_canal);
    } else if (misCanales.length === 0) {
      setCanalSeleccionadoId(null);
    }
  }, [misCanales, canalSeleccionadoId]);

  const canalesFiltrados = misCanales.filter(c => (c.nombre || "").toLowerCase().includes(busqueda.toLowerCase()));
  const canalActivo = misCanales.find(c => c.id_canal === canalSeleccionadoId);

  // 3. Permisos (Admin, Director del servidor, Preceptor del servidor)
  const puedeGestionar = useMemo(() => {
    if (!user || !canalActivo) return false;
    if (hasRole(["super_admin", "admin"])) return true;

    // Verificamos si es director o preceptor en el servidor de este canal
    return todosLosRoles.some((ur) => {
      if (Number(ur.usuario_id) !== Number(user.id_usuario)) return false;
      if (Number(ur.servidor_id) !== Number(canalActivo.servidor_id)) return false;
      const rol = rolesDefinidos.find(r => r.id_rol === ur.rol_id);
      return ["director", "preceptor"].includes(rol?.nombre?.toLowerCase());
    });
  }, [user, canalActivo, hasRole, todosLosRoles, rolesDefinidos]);

  // 4. Miembros del canal activo
  const miembrosDelCanal = useMemo(() => {
    if (!canalActivo) return [];
    const ids = miembrosCanal
      .filter((m) => Number(m.canal_id) === Number(canalActivo.id_canal))
      .map((m) => Number(m.usuario_id));
    return todosLosUsuarios.filter((u) => ids.includes(Number(u.id_usuario)));
  }, [miembrosCanal, canalActivo, todosLosUsuarios]);

  // 5. Handlers
  const nombreDeUsuario = (id) => {
    const u = todosLosUsuarios.find(x => x.id_usuario === id);
    return u ? u.nombre_usuario : `Usuario ${id}`;
  };

  const rolEnCanalDe = (usuarioId) => {
    return miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo?.id_canal)?.rol_en_canal || "miembro";
  };

  const agregarMiembro = async () => {
    if (!usuarioSeleccionado || !canalActivo) return;
    setGuardando(true);
    try {
      await crearMiembroCanal({
        usuario_id: Number(usuarioSeleccionado),
        canal_id: Number(canalActivo.id_canal),
        rol_en_canal: rolEnCanal
      });
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
      setModalMiembro(false);
      setUsuarioSeleccionado("");
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRolMiembro = async (usuarioId, nuevoRol) => {
    if (!canalActivo) return;
    try {
      // Como el backend pide el id del miembro_canal, lo buscamos en el array
      const registro = miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo.id_canal);
      if (!registro) return;
      
      await actualizarMiembroCanal(registro.id_miembro_canal, { rol_en_canal: nuevoRol });
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const quitarMiembro = async (usuarioId) => {
    if (!canalActivo) return;
    if (!window.confirm("¿Quitar a este usuario del canal?")) return;
    try {
      const registro = miembrosCanal.find(m => Number(m.usuario_id) === usuarioId && Number(m.canal_id) === canalActivo.id_canal);
      if (!registro) return;
      
      await eliminarMiembroCanal(registro.id_miembro_canal);
      const data = await listarMiembrosCanal();
      setMiembrosCanal(data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="canales">
      <div className="canales__header">
        <h1 className="canales__title">Mis Canales</h1>
      </div>

      <div className="canales__explorer" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* BARRA LATERAL */}
        <aside style={{ width: "280px", flexShrink: 0, background: "var(--color-blanco)", padding: "1rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
          <div className="canales__search" style={{ marginBottom: "1rem", margin: 0 }}>
            <Search size={18} />
            <input type="text" placeholder="Buscar canal..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          {loading && <p className="canales__empty">Cargando...</p>}
          {!loading && canalesFiltrados.length === 0 && <p className="canales__empty">No estás en ningún canal.</p>}

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            {canalesFiltrados.map((c) => (
              <li key={c.id_canal}>
                <button
                  onClick={() => setCanalSeleccionadoId(c.id_canal)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left",
                    background: c.id_canal === canalSeleccionadoId ? "var(--color-azul-petroleo)" : "transparent",
                    color: c.id_canal === canalSeleccionadoId ? "white" : "var(--texto-oscuro)",
                  }}
                >
                  {c.tipo === "informativo" ? <Megaphone size={16} /> : <Hash size={16} />}
                  <span style={{ flex: 1, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* PANEL PRINCIPAL */}
        <main style={{ flex: 1, minWidth: "300px", background: "var(--color-blanco)", padding: "1.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", minHeight: "400px" }}>
          {!canalActivo ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--texto-secundario)" }}>
              <Hash size={32} style={{ marginBottom: "1rem" }} />
              <p>Seleccioná un canal para ver sus miembros.</p>
            </div>
          ) : (
            <>
              <header style={{ borderBottom: "1px solid #ddd", paddingBottom: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    {canalActivo.tipo === "informativo" ? <Megaphone size={20} /> : <Hash size={20} />} {canalActivo.nombre}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--texto-secundario)" }}>Canal de {canalActivo.tipo}</p>
                </div>
                <Button size="sm" onClick={() => navigate("/mensajes", { state: { canal: canalActivo } })}>
                  Entrar al chat <ChevronRight size={16} />
                </Button>
              </header>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Miembros del canal ({miembrosDelCanal.length})</h3>
                  {puedeGestionar && (
                    <Button size="sm" onClick={() => { setUsuarioSeleccionado(""); setRolEnCanal("miembro"); setModalMiembro(true); }}>
                      <Plus size={16} /> Agregar miembro
                    </Button>
                  )}
                </div>

                {miembrosDelCanal.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--texto-secundario)", padding: "1rem" }}>No hay miembros en este canal.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {miembrosDelCanal.map((u) => (
                      <li key={u.id_usuario} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: "var(--color-gris-azulado)", borderRadius: "8px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-menta-palido)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "var(--color-azul-petroleo)" }}>
                            {u.nombre_usuario.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: "block", fontSize: "14px" }}>{u.nombre_usuario}</strong>
                            <span style={{ fontSize: "12px", color: "var(--texto-secundario)" }}>{u.email}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {puedeGestionar ? (
                            <select
                              value={rolEnCanalDe(u.id_usuario)}
                              onChange={(e) => cambiarRolMiembro(u.id_usuario, e.target.value)}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px", background: "white" }}
                            >
                              <option value="admin">Admin</option>
                              <option value="tutor">Tutor</option>
                              <option value="miembro">Miembro</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: "12px", fontWeight: 600, background: "var(--color-menta-palido)", padding: "2px 8px", borderRadius: "12px", color: "var(--color-azul-petroleo)" }}>
                              {rolEnCanalDe(u.id_usuario)}
                            </span>
                          )}
                          {puedeGestionar && (
                            <button onClick={() => quitarMiembro(u.id_usuario)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c00", padding: "4px" }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* MODAL AGREGAR MIEMBRO */}
      {modalMiembro && canalActivo && (
        <Modal title="Agregar miembro al canal" onClose={() => setModalMiembro(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Select
              label="Usuario (solo miembros del servidor)"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              options={todosLosUsuarios
                .filter(u => 
                  // Solo usuarios que estén en el servidor de este canal
                  miembrosServidor.some(ms => Number(ms.servidor_id) === Number(canalActivo.servidor_id) && Number(ms.usuario_id) === Number(u.id_usuario)) &&
                  // Y que no estén ya en el canal
                  !miembrosDelCanal.some(m => m.id_usuario === u.id_usuario)
                )
                .map(u => ({ value: u.id_usuario, label: `${u.nombre_usuario} (${u.email})` }))
              }
              placeholder="Elegir usuario..."
            />
            
            <Select
              label="Rol en el canal"
              value={rolEnCanal}
              onChange={(e) => setRolEnCanal(e.target.value)}
              options={[
                { value: "miembro", label: "Miembro (solo escribe)" },
                { value: "tutor", label: "Tutor" },
                { value: "admin", label: "Admin (modera el canal)" }
              ]}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
              <Button type="button" variant="outline" onClick={() => setModalMiembro(false)}>Cancelar</Button>
              <Button disabled={!usuarioSeleccionado || guardando} onClick={agregarMiembro}>
                {guardando ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}