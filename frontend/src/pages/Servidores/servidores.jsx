import React, { useState, useMemo, useEffect } from "react";
import "./servidores.css";
import { listarServidores } from "../../api/servidores";
import { listarCategoriasPorServidor, crearCategoria, actualizarCategoria, eliminarCategoria } from "../../api/categorias";
import { listarCanales, crearCanal, actualizarCanal, eliminarCanal } from "../../api/canales";
import { listarMiembrosServidor, crearMiembroServidor, actualizarMiembroServidor, eliminarMiembroServidor } from "../../api/miembrosServidor";
import { crearMiembroCanal, eliminarMiembroCanal } from "../../api/miembrosCanal";
import { listarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { obtenerUsuario } from "../../api/usuarios";
import { obtenerPerfil } from "../../api/perfiles";

const IconSearch = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconChevronRight = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const IconChevronDown = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IconChevronUp = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);
const IconPlus = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconHash = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);
const IconUsers = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconTag = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const IconServer = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);
const IconClose = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconTrash = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconArrowLeft = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function Servidores() {
  const [servidores, setServidores] = useState([]);
  const [servidorActivo, setServidorActivo] = useState(null);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [tabActiva, setTabActiva] = useState("canales");
  const [errorCarga, setErrorCarga] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [busquedaCanal, setBusquedaCanal] = useState("");
  const [filtroTipoCanal, setFiltroTipoCanal] = useState("todos");

  const [busquedaCategoria, setBusquedaCategoria] = useState("");

  const [busquedaMiembro, setBusquedaMiembro] = useState("");
  const [filtroRolMiembro, setFiltroRolMiembro] = useState("todos");

  const [canales, setCanales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [miembros, setMiembros] = useState([]);

  const [miembroDetalle, setMiembroDetalle] = useState(null);
  const [perfilMiembro, setPerfilMiembro] = useState(null);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [formData, setFormData] = useState({});

  const [accordionOpen, setAccordionOpen] = useState({
    canales: true,
    roles: false,
    vinculos: false,
    servidor: false,
  });

  const [nuevoCanalSelec, setNuevoCanalSelec] = useState("");
  const [nuevoRolCanal, setNuevoRolCanal] = useState("miembro");
  const [reemplazarCanal, setReemplazarCanal] = useState("no");

  const [nuevoRolSelec, setNuevoRolSelec] = useState("");
  const [tipoVinculo, setTipoVinculo] = useState("padre");
  const [usuarioVinculo, setUsuarioVinculo] = useState("");

  const ID_USUARIO_ACTUAL = 1;

  useEffect(() => {
    const cargarServidores = async () => {
      setCargando(true);
      setErrorCarga(null);
      try {
        const data = await listarServidores();
        // CORRECCIÓN: el backend devuelve `id_servidor`; el resto del componente usa `id`.
        // Sin este campo, srv.id era undefined y todos los servidores quedaban "activos".
        setServidores(data.map((s) => ({ ...s, id: s.id_servidor })));
        if (data.length > 0) {
          setServidorActivo((anterior) =>
            anterior ?? {
              id: data[0].id_servidor,
              nombre: data[0].nombre,
              descripcion: data[0].descripcion,
            }
          );
        }
      } catch (error) {
        setErrorCarga(error?.message || "No se pudieron cargar los servidores");
      } finally {
        setCargando(false);
      }
    };
    cargarServidores();
  }, []);

  useEffect(() => {
    const cargarCanales = async () => {
      if (!servidorActivo) return;
      setCargando(true);
      setErrorCarga(null);
      try {
        const data = await listarCanales();
        const dataFiltrados = data.filter(
          (c) => Number(c.servidor_id) === Number(servidorActivo.id)
        );
        setCanales(
          dataFiltrados.map((c) => ({
            id: c.id_canal,
            servidorId: c.servidor_id,
            nombre: c.nombre,
            tipo: c.tipo === "chat" ? "General / Chat" : c.tipo === "informativo" ? "Informativo" : c.tipo,
            categoria: c.categoria_id,
            descripcion: c.descripcion,
          }))
        );
      } catch (error) {
        setErrorCarga(error?.message || "No se pudieron cargar los canales");
      } finally {
        setCargando(false);
      }
    };
    cargarCanales();
  }, [servidorActivo]);

  useEffect(() => {
    const cargarCategorias = async () => {
      if (!servidorActivo) return;
      try {
        const data = await listarCategoriasPorServidor(servidorActivo.id);
        setCategorias(
          data.map((cat) => ({
            id: cat.id_categoria,
            servidorId: cat.servidor_id,
            nombre: cat.nombre,
            descripcion: cat.descripcion,
            orden: cat.orden,
          }))
        );
      } catch (error) {
        setErrorCarga(error?.message || "No se pudieron cargar las categorías");
      }
    };
    cargarCategorias();
  }, [servidorActivo]);

  useEffect(() => {
    const cargarMiembros = async () => {
      if (!servidorActivo) return;
      setCargando(true);
      setErrorCarga(null);
      try {
        const data = await listarMiembrosServidor();
        const membresias = data.filter(
          (m) => Number(m.servidor_id) === Number(servidorActivo.id)
        );
        const asignaciones = await listarUsuarioRol({
          servidor_id: servidorActivo.id,
        });
        const rolesData = await listarRoles();
        const rolesPorId = {};
        rolesData.forEach((r) => {
          rolesPorId[r.id_rol] = r.nombre;
        });
        const miembrosEnriquecidos = await Promise.all(
          membresias.map(async (m) => {
            let perfil = null;
            let perfilExiste = true;
            try {
              perfil = await obtenerPerfil(m.usuario_id);
            } catch (error) {
              perfilExiste = false;
            }
            const usuario = await obtenerUsuario(m.usuario_id);
            const rolesAsignados = asignaciones
              .filter((a) => Number(a.usuario_id) === Number(m.usuario_id))
              .map((a) => rolesPorId[a.rol_id])
              .filter(Boolean);
            return {
              ...m,
              id: m.usuario_id,
              servidorId: m.servidor_id,
              usuarioId: m.usuario_id,
              tienePerfil: perfilExiste,
              nombres: perfil?.nombres || usuario?.nombre_usuario || "",
              apellidos: perfil?.apellidos || "",
              email: usuario?.email || "",
              rol: rolesAsignados[0] || "Sin rol",
              activo: m.activo ?? usuario?.activo,
              fechaRegistro: usuario?.fecha_registro || m.fecha_union,
              canales: [],
              roles: rolesAsignados,
              vinculosFamiliares: [],
            };
          })
        );
        setMiembros(miembrosEnriquecidos);
      } catch (error) {
        setErrorCarga(error?.message || "No se pudieron cargar los miembros");
      } finally {
        setCargando(false);
      }
    };
    cargarMiembros();
  }, [servidorActivo]);

  useEffect(() => {
    const cargarDetalleMiembro = async () => {
      if (itemSeleccionado?.tipo !== "miembro") return;
      const usuarioId = itemSeleccionado.data?.usuarioId || itemSeleccionado.data?.usuario_id;
      if (!usuarioId) return;
      setCargando(true);
      setErrorCarga(null);
      try {
        const usuario = await obtenerUsuario(usuarioId);
        let perfil = null;
        try {
          perfil = await obtenerPerfil(usuarioId);
        } catch (error) {
          perfil = null;
        }
        setMiembroDetalle(usuario);
        setPerfilMiembro(perfil);
      } catch (error) {
        setPerfilMiembro(null);
      } finally {
        setCargando(false);
      }
    };
    cargarDetalleMiembro();
  }, [itemSeleccionado]);

  const toggleAccordion = (sec) => {
    setAccordionOpen((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleSelect = (tipo, data) => {
    setItemSeleccionado({ tipo, data });
    setFormData({ ...data });
  };

  const handleAbrirNuevoCanal = () => {
    setItemSeleccionado({
      tipo: "nuevo_canal",
      data: { servidorId: servidorActivo?.id, nombre: "", tipo: "General / Chat", categoria: "", descripcion: "" },
    });
    setFormData({ servidorId: servidorActivo?.id, nombre: "", tipo: "General / Chat", categoria: "", descripcion: "" });
  };

  const handleAbrirNuevaCategoria = () => {
    setItemSeleccionado({
      tipo: "nueva_categoria",
      data: { servidorId: servidorActivo?.id, nombre: "", descripcion: "", orden: 1 },
    });
    setFormData({ servidorId: servidorActivo?.id, nombre: "", descripcion: "", orden: 1 });
  };

  const handleAbrirNuevoMiembro = () => {
    setItemSeleccionado({
      tipo: "nuevo_miembro",
      data: {
        servidorId: servidorActivo?.id,
        nombres: "",
        apellidos: "",
        rol: "Alumno",
        email: "",
        dni: "",
        usuario: "",
        activo: true,
        fechaRegistro: new Date().toLocaleDateString(),
        canales: [],
        roles: [],
        vinculosFamiliares: [],
      },
    });
    setFormData({
      servidorId: servidorActivo?.id,
      nombres: "",
      apellidos: "",
      rol: "Alumno",
      email: "",
      dni: "",
      usuario: "",
      activo: true,
      fechaRegistro: new Date().toLocaleDateString(),
      canales: [],
      roles: [],
      vinculosFamiliares: [],
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const servidoresFiltrados = useMemo(() => {
    return servidores.filter((s) =>
      s.nombre.toLowerCase().includes(busquedaServidor.toLowerCase())
    );
  }, [servidores, busquedaServidor]);

  const canalesFiltrados = useMemo(() => {
    return canales.filter((c) => {
      const perteneceServidor = servidorActivo ? Number(c.servidorId) === Number(servidorActivo.id) : true;
      const matchTexto = c.nombre.toLowerCase().includes(busquedaCanal.toLowerCase());
      const matchTipo = filtroTipoCanal === "todos" || c.tipo === filtroTipoCanal;
      return perteneceServidor && matchTexto && matchTipo;
    });
  }, [canales, servidorActivo, busquedaCanal, filtroTipoCanal]);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((cat) => {
      const perteneceServidor = servidorActivo ? Number(cat.servidorId) === Number(servidorActivo.id) : true;
      const matchTexto = cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase());
      return perteneceServidor && matchTexto;
    });
  }, [categorias, servidorActivo, busquedaCategoria]);

  const miembrosFiltrados = useMemo(() => {
    return miembros.filter((m) => {
      const perteneceServidor = servidorActivo ? Number(m.servidorId) === Number(servidorActivo.id) : true;
      const matchTexto = `${m.nombres || ""} ${m.apellidos || ""} ${m.email || ""}`.toLowerCase().includes(busquedaMiembro.toLowerCase());
      const matchRol = filtroRolMiembro === "todos" || (m.rol || "").toLowerCase() === filtroRolMiembro.toLowerCase();
      return perteneceServidor && matchTexto && matchRol;
    });
  }, [miembros, servidorActivo, busquedaMiembro, filtroRolMiembro]);

  const miembrosSinPerfil = miembros.filter((m) => m.tienePerfil === false);

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    if (!itemSeleccionado) return;

    try {
      if (itemSeleccionado.tipo === "miembro") {
        await actualizarMiembroServidor(
          Number(itemSeleccionado.data.usuarioId ?? itemSeleccionado.data.usuario_id),
          Number(itemSeleccionado.data.servidorId ?? itemSeleccionado.data.servidor_id),
          { activo: formData.activo ?? true }
        );
        setMiembros((prev) =>
          prev.map((m) =>
            m.usuarioId === Number(itemSeleccionado.data.usuarioId ?? itemSeleccionado.data.usuario_id)
              ? { ...m, activo: formData.activo ?? true }
              : m
          )
        );
        alert("¡Miembro actualizado con éxito!");
      } else if (itemSeleccionado.tipo === "canal") {
        await actualizarCanal(itemSeleccionado.data.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria_id: formData.categoria ? Number(formData.categoria) : null,
          orden: formData.orden ?? 0,
          tipo: formData.tipo === "chat" || formData.tipo === "General / Chat" ? "chat" : "informativo",
        });
        alert("¡Canal actualizado con éxito!");
      } else if (itemSeleccionado.tipo === "categoria") {
        await actualizarCategoria(itemSeleccionado.data.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          orden: formData.orden ?? 0,
        });
        alert("¡Categoría actualizada con éxito!");
      } else if (itemSeleccionado.tipo === "nuevo_canal") {
        await crearCanal({
          servidor_id: servidorActivo?.id,
          creador_id: ID_USUARIO_ACTUAL,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          categoria_id: formData.categoria ? Number(formData.categoria) : null,
          orden: 0,
          tipo: formData.tipo === "chat" || formData.tipo === "General / Chat" ? "chat" : "informativo",
        });
        alert("¡Nuevo canal creado con éxito!");
        setItemSeleccionado(null);
      } else if (itemSeleccionado.tipo === "nueva_categoria") {
        await crearCategoria({
          servidor_id: servidorActivo?.id,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          orden: formData.orden ?? 1,
        });
        alert("¡Nueva categoría creada con éxito!");
        setItemSeleccionado(null);
      } else if (itemSeleccionado.tipo === "nuevo_miembro") {
        await crearMiembroServidor({
          usuario_id: ID_USUARIO_ACTUAL,
          servidor_id: servidorActivo?.id,
          activo: true,
        });
        alert("¡Nuevo miembro agregado con éxito!");
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(error?.message || "Error al guardar los cambios");
    }
  };

  const handleEliminarCanal = async () => {
    try {
      if (window.confirm(`¿Deseas eliminar el canal #${formData.nombre}?`)) {
        await eliminarCanal(formData.id);
        setCanales((prev) => prev.filter((c) => c.id !== formData.id));
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(error?.message || "Error al eliminar el canal");
    }
  };

  const handleEliminarCategoria = async () => {
    try {
      if (window.confirm(`¿Deseas eliminar la categoría ${formData.nombre}?`)) {
        await eliminarCategoria(formData.id);
        setCategorias((prev) => prev.filter((cat) => cat.id !== formData.id));
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(error?.message || "Error al eliminar la categoría");
    }
  };

  const handleAgregarCanalMiembro = async () => {
    if (!nuevoCanalSelec) return;
    try {
      const miembroCanal = await crearMiembroCanal({
        usuario_id: Number(formData.usuarioId),
        canal_id: Number(nuevoCanalSelec),
        rol_en_canal: nuevoRolCanal,
      });
      const canalObj = canalesFiltrados.find((c) => Number(c.id) === Number(nuevoCanalSelec));
      const nuevosCanales = [
        ...(formData.canales || []),
        {
          id: miembroCanal?.id_miembro_canal,
          nombre: canalObj ? canalObj.nombre : nuevoCanalSelec,
          rolInCanal: nuevoRolCanal,
        },
      ];
      const updated = { ...formData, canales: nuevosCanales };
      setFormData(updated);
      setMiembros((prev) => prev.map((m) => (m.usuarioId === updated.usuarioId ? updated : m)));
      setNuevoCanalSelec("");
    } catch (error) {
      alert(error?.message || "Error al agregar el canal");
    }
  };

  const handleEliminarCanalMiembro = async (idMiembroCanal) => {
    try {
      await eliminarMiembroCanal(idMiembroCanal);
      const nuevosCanales = (formData.canales || []).filter((c) => c.id !== idMiembroCanal);
      const updated = { ...formData, canales: nuevosCanales };
      setFormData(updated);
      setMiembros((prev) => prev.map((m) => (m.usuarioId === updated.usuarioId ? updated : m)));
    } catch (error) {
      alert(error?.message || "Error al eliminar el canal del miembro");
    }
  };

  const handleQuitarDelServidor = async () => {
    try {
      if (window.confirm(`¿Quitar a ${formData.nombres} ${formData.apellidos} del servidor ${servidorActivo?.nombre}?`)) {
        await eliminarMiembroServidor(Number(formData.usuarioId), Number(formData.servidorId));
        setMiembros((prev) => prev.filter((m) => m.usuarioId !== Number(formData.usuarioId)));
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(error?.message || "Error al quitar del servidor");
    }
  };

  const handleAgregarRolMiembro = () => {
    if (!nuevoRolSelec) return;
    const nuevo = { id: Date.now(), nombre: nuevoRolSelec, contexto: `${servidorActivo?.nombre} · asignado hoy por Administrador` };
    const nuevosRoles = [...(formData.roles || []), nuevo];
    const updated = { ...formData, roles: nuevosRoles };
    setFormData(updated);
    setMiembros((prev) => prev.map((m) => (m.usuarioId === updated.usuarioId ? updated : m)));
    setNuevoRolSelec("");
  };

  const handleEliminarRolMiembro = (rolId) => {
    const nuevosRoles = (formData.roles || []).filter((r) => r.id !== rolId);
    const updated = { ...formData, roles: nuevosRoles };
    setFormData(updated);
    setMiembros((prev) => prev.map((m) => (m.usuarioId === updated.usuarioId ? updated : m)));
  };

  const handleVincularFamiliar = () => {
    if (!usuarioVinculo) return;
    const nuevo = `${usuarioVinculo} (${tipoVinculo.toUpperCase()})`;
    const nuevosVinculos = [...(formData.vinculosFamiliares || []), nuevo];
    const updated = { ...formData, vinculosFamiliares: nuevosVinculos };
    setFormData(updated);
    setMiembros((prev) => prev.map((m) => (m.usuarioId === updated.usuarioId ? updated : m)));
    setUsuarioVinculo("");
  };

  return (
    <div style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box", backgroundColor: "#f0f4f8" }}>
      {/* HEADER SUPERIOR */}
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "#0f766e", fontWeight: "700", margin: 0 }}>Mis Servidores</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>Gestión institucional de espacios de comunicación</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "6px 14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0f766e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>
            RG
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>Gómez, Roberto</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>director@colegio.edu</div>
          </div>
        </div>
      </header>

      {errorCarga && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#b91c1c" }}>
          ⚠️ {errorCarga}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* COLUMNA 1: LISTADO DE SERVIDORES */}
        <div style={{ width: "300px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", gap: "8px" }}>
              <IconSearch size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar servidor..."
                value={busquedaServidor}
                onChange={(e) => setBusquedaServidor(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%", color: "#1e293b" }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {servidoresFiltrados.map((srv) => {
                const isActive = servidorActivo?.id === srv.id;
                return (
                  <li key={srv.id}>
                    <button
                      onClick={() => { setServidorActivo(srv); setItemSeleccionado(null); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        border: "1px solid transparent",
                        backgroundColor: isActive ? "#0f766e" : "#f8fafc",
                        color: isActive ? "#ffffff" : "#1e293b",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#fff" : "#0f766e", flexShrink: 0 }}>
                        <IconServer size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: "600", fontSize: "13px", display: "block" }}>{srv.nombre}</span>
                        <span style={{ fontSize: "11px", color: isActive ? "rgba(255,255,255,0.8)" : "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{srv.descripcion}</span>
                      </div>
                      <IconChevronRight size={14} style={{ color: isActive ? "#fff" : "#94a3b8" }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* COLUMNA 2: CONTENIDO CENTRAL */}
        <div style={{ flex: 1, background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f766e", margin: 0 }}>{servidorActivo?.nombre}</h2>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>{servidorActivo?.descripcion}</p>
              </div>
              <button
                onClick={() => setItemSeleccionado(null)}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <IconArrowLeft size={14} /> Volver
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
              <button
                onClick={() => { setTabActiva("canales"); setItemSeleccionado(null); }}
                style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "none", cursor: "pointer", backgroundColor: tabActiva === "canales" ? "#0f766e" : "transparent", color: tabActiva === "canales" ? "#ffffff" : "#475569" }}
              >
                <IconHash size={14} /> Canales
              </button>
              <button
                onClick={() => { setTabActiva("categorias"); setItemSeleccionado(null); }}
                style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "none", cursor: "pointer", backgroundColor: tabActiva === "categorias" ? "#0f766e" : "transparent", color: tabActiva === "categorias" ? "#ffffff" : "#475569" }}
              >
                <IconTag size={14} /> Categorías
              </button>
              <button
                onClick={() => { setTabActiva("miembros"); setItemSeleccionado(null); }}
                style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "none", cursor: "pointer", backgroundColor: tabActiva === "miembros" ? "#0f766e" : "transparent", color: tabActiva === "miembros" ? "#ffffff" : "#475569" }}
              >
                <IconUsers size={14} /> Miembros
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {tabActiva === "canales" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>Canales de {servidorActivo?.nombre} · {canalesFiltrados.length}</span>
                  <button onClick={handleAbrirNuevoCanal} style={{ background: "#ccfbf1", color: "#0f766e", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconPlus size={14} /> Nuevo canal
                  </button>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 10px", gap: "6px" }}>
                    <IconSearch size={14} className="text-slate-400" />
                    <input type="text" placeholder="Filtrar canales por nombre..." value={busquedaCanal} onChange={(e) => setBusquedaCanal(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "12px", width: "100%" }} />
                  </div>
                  <select value={filtroTipoCanal} onChange={(e) => setFiltroTipoCanal(e.target.value)} style={{ padding: "6px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155" }}>
                    <option value="todos">Todos los tipos</option>
                    <option value="General / Chat">General / Chat</option>
                    <option value="Anuncios / Avisos">Anuncios / Avisos</option>
                    <option value="Informativo">Informativo</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {canalesFiltrados.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No hay canales registrados en este servidor.</span>
                  ) : (
                    canalesFiltrados.map((c) => {
                      const isSelected = itemSeleccionado?.tipo === "canal" && itemSeleccionado?.data?.id === c.id;
                      return (
                        <div key={c.id} onClick={() => handleSelect("canal", c)} style={{ padding: "12px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <IconHash size={16} style={{ color: "#0f766e" }} />
                            <div>
                              <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", display: "block" }}>{c.nombre}</span>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>{c.descripcion}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "10px", background: "#ccfbf1", color: "#0f766e", padding: "2px 6px", borderRadius: "6px", fontWeight: "bold" }}>{c.tipo}</span>
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "2px solid #0d9488" : "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#0d9488" : "transparent" }}>
                              {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ffffff" }} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {tabActiva === "categorias" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>Categorías de {servidorActivo?.nombre} · {categoriasFiltradas.length}</span>
                  <button onClick={handleAbrirNuevaCategoria} style={{ background: "#ccfbf1", color: "#0f766e", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconPlus size={14} /> Agregar categoría
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 10px", gap: "6px" }}>
                  <IconSearch size={14} className="text-slate-400" />
                  <input type="text" placeholder="Buscar categoría por nombre..." value={busquedaCategoria} onChange={(e) => setBusquedaCategoria(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "12px", width: "100%" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {categoriasFiltradas.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No hay categorías registradas en este servidor.</span>
                  ) : (
                    categoriasFiltradas.map((cat) => {
                      const isSelected = itemSeleccionado?.tipo === "categoria" && itemSeleccionado?.data?.id === cat.id;
                      return (
                        <div key={cat.id} onClick={() => handleSelect("categoria", cat)} style={{ padding: "14px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f766e" }}>{cat.nombre}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{cat.descripcion}</div>
                          </div>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "2px solid #0d9488" : "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#0d9488" : "transparent" }}>
                            {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ffffff" }} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {tabActiva === "miembros" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b" }}>Miembros de {servidorActivo?.nombre} · {miembrosFiltrados.length}</span>
                  <button onClick={handleAbrirNuevoMiembro} style={{ background: "#ccfbf1", color: "#0f766e", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconPlus size={14} /> Agregar miembro
                  </button>
                </div>
                {miembrosSinPerfil.length > 0 && (
                  <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#92400e" }}>
                    {miembrosSinPerfil.length === 1 ? "1 miembro no tiene perfil creado" : `${miembrosSinPerfil.length} miembros no tienen perfil creado`}: {miembrosSinPerfil.map((m) => m.nombres).join(", ")}.
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 10px", gap: "6px" }}>
                    <IconSearch size={14} className="text-slate-400" />
                    <input type="text" placeholder="Buscar por nombre, apellido o email..." value={busquedaMiembro} onChange={(e) => setBusquedaMiembro(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "12px", width: "100%" }} />
                  </div>
                  <select value={filtroRolMiembro} onChange={(e) => setFiltroRolMiembro(e.target.value)} style={{ padding: "6px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155" }}>
                    <option value="todos">Todos los roles</option>
                    <option value="Director">Director</option>
                    <option value="Profesor">Profesor</option>
                    <option value="Alumno">Alumno</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {miembrosFiltrados.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No hay miembros registrados en este servidor.</span>
                  ) : (
                    miembrosFiltrados.map((m) => {
                      const isSelected = itemSeleccionado?.tipo === "miembro" && itemSeleccionado?.data?.id === m.id;
                      return (
                        <div key={m.id} onClick={() => handleSelect("miembro", m)} style={{ padding: "14px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: "700", fontSize: "13px", color: "#0f766e" }}>{m.apellidos ? `${m.apellidos}, ${m.nombres}` : m.nombres}</span>
                              <span style={{ fontSize: "10px", fontWeight: "600", background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: "6px" }}>{m.rol}</span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>{m.email}</span>
                          </div>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "2px solid #0d9488" : "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#0d9488" : "transparent" }}>
                            {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ffffff" }} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: PANEL LATERAL */}
        {itemSeleccionado && (
          <div style={{ width: "400px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", flexShrink: 0 }}>
            <div style={{ background: "#0f766e", color: "#ffffff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontWeight: "700", fontSize: "13px", textTransform: "capitalize" }}>
                {itemSeleccionado.tipo === "miembro" && "Detalle del miembro"}
                {itemSeleccionado.tipo === "canal" && "Detalle del canal"}
                {itemSeleccionado.tipo === "categoria" && "Detalle de la categoría"}
                {itemSeleccionado.tipo === "nuevo_canal" && "Crear nuevo canal"}
                {itemSeleccionado.tipo === "nueva_categoria" && "Crear nueva categoría"}
                {itemSeleccionado.tipo === "nuevo_miembro" && "Agregar nuevo miembro"}
              </span>
              <button onClick={() => setItemSeleccionado(null)} style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer" }}>
                <IconClose size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {itemSeleccionado.tipo === "miembro" && (
                <>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", gap: "14px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#0f766e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", overflow: "hidden", flexShrink: 0 }}>
                      {perfilMiembro?.foto_perfil ? (
                        <img src={perfilMiembro.foto_perfil} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (perfilMiembro?.nombres || miembroDetalle?.nombre_usuario || miembroDetalle?.nombre || "U").toString().charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700", fontSize: "13px", color: "#0f766e" }}>{perfilMiembro?.nombres ? `${perfilMiembro.nombres} ${perfilMiembro?.apellidos || ""}`.trim() : miembroDetalle?.nombre_usuario || "Miembro"}</span>
                        <span style={{ fontSize: "10px", background: miembroDetalle?.activo === false ? "#fee2e2" : "#dcfce7", color: miembroDetalle?.activo === false ? "#991b1b" : "#166534", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>{miembroDetalle?.activo !== false ? "Activo" : "Inactivo"}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>@{miembroDetalle?.nombre_usuario || "usuario"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "6px" }}><strong>Email:</strong> {miembroDetalle?.email || perfilMiembro?.email || "No registrado"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "2px" }}><strong>DNI:</strong> {perfilMiembro?.dni || miembroDetalle?.dni || "No registrado"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "2px" }}><strong>Fecha de registro:</strong> {miembroDetalle?.fecha_registro || perfilMiembro?.fecha_registro || miembroDetalle?.fechaRegistro || "—"}</div>
                      {perfilMiembro?.biografia ? (
                        <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "6px" }}><strong>Biografía:</strong> {perfilMiembro.biografia}</div>
                      ) : null}
                    </div>
                  </div>
                  {itemSeleccionado.data?.tienePerfil === false && (
                    <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#92400e" }}>
                      Este miembro todavía no tiene un perfil creado.
                    </div>
                  )}
                  <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>DNI</label>
                        <input type="text" value={formData.dni || ""} onChange={(e) => handleInputChange("dni", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Usuario</label>
                        <input type="text" value={formData.usuario || ""} onChange={(e) => handleInputChange("usuario", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Correo electrónico</label>
                      <input type="email" value={formData.email || ""} onChange={(e) => handleInputChange("email", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Registrado el {formData.fechaRegistro || "12/03/2025"}</span>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input type="checkbox" checked={formData.activo ?? true} onChange={(e) => handleInputChange("activo", e.target.checked)} />
                        Cuenta activa
                      </label>
                    </div>
                    <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                      Guardar cambios
                    </button>
                  </form>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", overflow: "hidden" }}>
                      <div onClick={() => toggleAccordion("canales")} style={{ background: "#0f766e", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px" }}>Canales · {formData.canales?.length || 0}</span>
                        {accordionOpen.canales ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                      </div>
                      {accordionOpen.canales && (
                        <div style={{ padding: "14px", background: "#ffffff", display: "flex", flexDirection: "column", gap: "12px" }}>
                          {(formData.canales || []).length === 0 ? (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Sin canales asignados.</span>
                          ) : (
                            (formData.canales || []).map((c) => (
                              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}># {c.nombre}</div>
                                  <div style={{ fontSize: "11px", color: "#64748b" }}>Rol en canal: {c.rolInCanal}</div>
                                </div>
                                <button type="button" onClick={() => handleEliminarCanalMiembro(c.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                  <IconTrash size={16} />
                                </button>
                              </div>
                            ))
                          )}
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Nuevo canal</label>
                                <select value={nuevoCanalSelec} onChange={(e) => setNuevoCanalSelec(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                  <option value="">Seleccionar canal...</option>
                                  {canalesFiltrados.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Rol en canal</label>
                                <select value={nuevoRolCanal} onChange={(e) => setNuevoRolCanal(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                  <option value="miembro">miembro</option>
                                  <option value="admin">admin</option>
                                  <option value="tutor">tutor</option>
                                </select>
                              </div>
                            </div>
                            <button type="button" onClick={handleAgregarCanalMiembro} style={{ padding: "9px", background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>
                              Agregar canal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", overflow: "hidden" }}>
                      <div onClick={() => toggleAccordion("roles")} style={{ background: "#0f766e", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px" }}>Roles · {formData.roles?.length || 0}</span>
                        {accordionOpen.roles ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                      </div>
                      {accordionOpen.roles && (
                        <div style={{ padding: "14px", background: "#ffffff", display: "flex", flexDirection: "column", gap: "12px" }}>
                          {formData.roles?.map((r) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f766e" }}>{r.nombre}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{r.contexto}</div>
                              </div>
                              <button type="button" onClick={() => handleEliminarRolMiembro(r.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                <IconTrash size={16} />
                              </button>
                            </div>
                          ))}
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Asignar rol</label>
                            <select value={nuevoRolSelec} onChange={(e) => setNuevoRolSelec(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                              <option value="">Elegir rol...</option>
                              <option value="Director (servidor)">Director (servidor)</option>
                              <option value="Profesor (servidor)">Profesor (servidor)</option>
                              <option value="Alumno (servidor)">Alumno (servidor)</option>
                              <option value="Administrador (global)">Administrador (global)</option>
                            </select>
                            <button type="button" onClick={handleAgregarRolMiembro} style={{ padding: "9px", background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>
                              Asignar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", overflow: "hidden" }}>
                      <div onClick={() => toggleAccordion("vinculos")} style={{ background: "#0f766e", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px" }}>Vínculos familiares</span>
                        {accordionOpen.vinculos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                      </div>
                      {accordionOpen.vinculos && (
                        <div style={{ padding: "14px", background: "#ffffff", display: "flex", flexDirection: "column", gap: "12px" }}>
                          {(formData.vinculosFamiliares || []).length === 0 ? (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Sin vínculos familiares registrados.</span>
                          ) : (
                            (formData.vinculosFamiliares || []).map((v, i) => (
                              <div key={i} style={{ fontSize: "11px", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                                🛡️ {v}
                              </div>
                            ))
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                            <div>
                              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Tipo</label>
                              <select value={tipoVinculo} onChange={(e) => setTipoVinculo(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                <option value="padre">padre</option>
                                <option value="madre">madre</option>
                                <option value="tutor">tutor</option>
                                <option value="hermano">hermano</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Usuario relacionado</label>
                              <input type="text" value={usuarioVinculo} onChange={(e) => setUsuarioVinculo(e.target.value)} placeholder="Nombre o correo" style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                            </div>
                          </div>
                          <button type="button" onClick={handleVincularFamiliar} style={{ padding: "9px", background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>
                            Vincular
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", overflow: "hidden" }}>
                      <div onClick={() => toggleAccordion("servidor")} style={{ background: "#0f766e", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                        <span style={{ fontWeight: "bold", fontSize: "12px" }}>Servidor</span>
                        {accordionOpen.servidor ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                      </div>
                      {accordionOpen.servidor && (
                        <div style={{ padding: "14px", background: "#ffffff", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1e293b" }}>{servidorActivo?.nombre}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Miembro desde {formData.fechaRegistro || "12/03/2025"}</div>
                            </div>
                            <span style={{ fontSize: "10px", background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>Activo</span>
                          </div>
                          <button type="button" onClick={handleQuitarDelServidor} style={{ padding: "9px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "bold", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <IconTrash size={14} /> Quitar del servidor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {itemSeleccionado.tipo === "canal" && (
                <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombre del Canal</label>
                    <input type="text" value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Tipo</label>
                    <select value={formData.tipo || "General / Chat"} onChange={(e) => handleInputChange("tipo", e.target.value)} style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                      <option value="General / Chat">General / Chat</option>
                      <option value="Anuncios / Avisos">Anuncios / Avisos</option>
                      <option value="Informativo">Informativo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Categoría Organizadora</label>
                    <select value={formData.categoria || ""} onChange={(e) => handleInputChange("categoria", e.target.value)} style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                      {categoriasFiltradas.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "70px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    Guardar cambios de canal
                  </button>
                  <button type="button" onClick={handleEliminarCanal} style={{ width: "100%", padding: "9px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: "bold", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <IconTrash size={14} /> Eliminar canal
                  </button>
                </form>
              )}

              {itemSeleccionado.tipo === "categoria" && (
                <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombre de Categoría</label>
                    <input type="text" value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "80px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Orden jerárquico</label>
                    <input type="number" value={formData.orden || 1} onChange={(e) => handleInputChange("orden", parseInt(e.target.value))} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    Guardar cambios de categoría
                  </button>
                  <button type="button" onClick={handleEliminarCategoria} style={{ width: "100%", padding: "9px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: "bold", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <IconTrash size={14} /> Eliminar categoría
                  </button>
                </form>
              )}

              {itemSeleccionado.tipo === "nuevo_canal" && (
                <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ background: "#f0fdfa", padding: "10px", borderRadius: "8px", border: "1px solid #ccfbf1", fontSize: "11px", color: "#0f766e" }}>
                    Creando canal para el servidor: <strong>{servidorActivo?.nombre}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombre del Canal</label>
                    <input type="text" required placeholder="Ej. 2° año B" value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Tipo de Canal</label>
                    <select value={formData.tipo || "General / Chat"} onChange={(e) => handleInputChange("tipo", e.target.value)} style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                      <option value="General / Chat">General / Chat</option>
                      <option value="Anuncios / Avisos">Anuncios / Avisos</option>
                      <option value="Informativo">Informativo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Categoría</label>
                    <select value={formData.categoria || ""} onChange={(e) => handleInputChange("categoria", e.target.value)} style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                      <option value="">Seleccionar categoría...</option>
                      {categoriasFiltradas.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea placeholder="Breve descripción del canal..." value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "70px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    Registrar nuevo canal
                  </button>
                </form>
              )}

              {itemSeleccionado.tipo === "nueva_categoria" && (
                <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ background: "#f0fdfa", padding: "10px", borderRadius: "8px", border: "1px solid #ccfbf1", fontSize: "11px", color: "#0f766e" }}>
                    Creando categoría para el servidor: <strong>{servidorActivo?.nombre}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombre de Categoría</label>
                    <input type="text" required placeholder="Ej. Talleres y Extensión" value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea placeholder="Descripción de la categoría..." value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "80px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Orden jerárquico</label>
                    <input type="number" value={formData.orden || 1} onChange={(e) => handleInputChange("orden", parseInt(e.target.value))} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    Registrar nueva categoría
                  </button>
                </form>
              )}

              {itemSeleccionado.tipo === "nuevo_miembro" && (
                <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ background: "#f0fdfa", padding: "10px", borderRadius: "8px", border: "1px solid #ccfbf1", fontSize: "11px", color: "#0f766e" }}>
                    Inscribiendo miembro en: <strong>{servidorActivo?.nombre}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombres</label>
                      <input type="text" required value={formData.nombres || ""} onChange={(e) => handleInputChange("nombres", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Apellidos</label>
                      <input type="text" required value={formData.apellidos || ""} onChange={(e) => handleInputChange("apellidos", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Correo electrónico</label>
                    <input type="email" required value={formData.email || ""} onChange={(e) => handleInputChange("email", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>DNI</label>
                      <input type="text" value={formData.dni || ""} onChange={(e) => handleInputChange("dni", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Rol institucional</label>
                      <select value={formData.rol || "Alumno"} onChange={(e) => handleInputChange("rol", e.target.value)} style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                        <option value="Alumno">Alumno</option>
                        <option value="Profesor">Profesor</option>
                        <option value="Director">Director</option>
                        <option value="Tutor">Tutor</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    Guardar y agregar miembro
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
