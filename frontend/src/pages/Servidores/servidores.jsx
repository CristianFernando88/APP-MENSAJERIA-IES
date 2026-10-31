import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import "./servidores.css";
import { listarServidores } from "../../api/servidores";
import { listarCategoriasPorServidor, crearCategoria, actualizarCategoria, eliminarCategoria } from "../../api/categorias";
import { listarCanales, crearCanal, actualizarCanal, eliminarCanal } from "../../api/canales";
import { listarMiembrosServidor, crearMiembroServidor, actualizarMiembroServidor, eliminarMiembroServidor } from "../../api/miembrosServidor";
import { listarUsuarioRol, crearUsuarioRol, eliminarUsuarioRol } from "../../api/usuarioRol";
import { listarRoles } from "../../api/roles";
import { obtenerPerfil, actualizarPerfil, crearPerfil } from "../../api/perfiles";
import { crearRelacionUsuario } from "../../api/relacionesUsuario";
import { useAuth } from "../../context/AuthContext";

import * as miembrosCanalApi from "../../api/miembrosCanal";
import * as usuariosApi from "../../api/usuarios";
import * as relacionesApi from "../../api/relacionesUsuario";

const SOLO_MIS_SERVIDORES = true;

const ROLES_QUE_VEN_TODO = ["administrador"];
const TAMANO_VISTA = 10;
const ROLES_CANAL = ["miembro", "admin", "tutor"];
const TIPOS_VINCULO = ["padre", "madre", "tutor", "hermano"];


const llamar = (fn, ...args) => {
  if (typeof fn !== "function") {
    return Promise.reject(new Error("Falta implementar esa función en la carpeta api/"));
  }
  return fn(...args);
};

const mensajeError = (error, porDefecto = "Ocurrió un error") => {
  const msg = error?.message || "";
  if (!msg || msg.includes("[object Object]")) return `${porDefecto}: datos inválidos, revisá los campos.`;
  return msg;
};

const formatearFecha = (f) => {
  if (!f) return "—";
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR");
};

const etiquetaTipo = (t) => (t === "chat" ? "General / Chat" : t === "informativo" ? "Informativo" : t);
const aTipoApi = (v) => (v === "chat" || v === "General / Chat" ? "chat" : "informativo");

const generarPasswordTemporal = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("") + "1!";
};

const nombreUsuarioLibre = (email, usuarios) => {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (base.length < 3) base = `usuario${base}`; // el backend exige al menos 3 caracteres
  const usados = new Set(usuarios.map((u) => String(u.nombre_usuario || "").toLowerCase()));
  let candidato = base;
  let n = 1;
  while (usados.has(candidato)) {
    n += 1;
    candidato = `${base}${n}`;
  }
  return candidato;
};


const btnProps = (fn) => ({
  role: "button",
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  },
});

function useVistas(items, clave) {
  const [limite, setLimite] = useState(TAMANO_VISTA);
  useEffect(() => {
    setLimite(TAMANO_VISTA);
  }, [clave]);
  return {
    visibles: items.slice(0, limite),
    total: items.length,
    hayMas: limite < items.length,
    verMas: () => setLimite((l) => l + TAMANO_VISTA),
  };
}

const PieVistas = ({ vistas }) =>
  vistas.total > 0 ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b", paddingTop: "4px" }}>
      <span>Mostrando {vistas.visibles.length} de {vistas.total}</span>
      {vistas.hayMas && (
        <button type="button" onClick={vistas.verMas} style={{ background: "#ccfbf1", color: "#0f766e", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
          Ver más
        </button>
      )}
    </div>
  ) : null;

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
  const { user } = useAuth();
  const [servidores, setServidores] = useState([]);
  const [servidorActivo, setServidorActivo] = useState(null);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [tabActiva, setTabActiva] = useState("canales");
  const [errorCarga, setErrorCarga] = useState(null);
  const [cargandoServidores, setCargandoServidores] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [busquedaCanal, setBusquedaCanal] = useState("");
  const [filtroTipoCanal, setFiltroTipoCanal] = useState("todos");

  const [busquedaCategoria, setBusquedaCategoria] = useState("");

  const [busquedaMiembro, setBusquedaMiembro] = useState("");
  const [filtroRolMiembro, setFiltroRolMiembro] = useState("todos");

  const [canales, setCanales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usuariosTodos, setUsuariosTodos] = useState(null);

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

  const [nuevoRolSelec, setNuevoRolSelec] = useState("");
  const [tipoVinculo, setTipoVinculo] = useState("padre");
  const [usuarioVinculo, setUsuarioVinculo] = useState("");

  const [perfilActual, setPerfilActual] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const ID_USUARIO_ACTUAL = user?.id_usuario;

  const servidorRef = useRef(null);
  servidorRef.current = servidorActivo?.id ?? null;
  const abiertoRef = useRef(null);
  abiertoRef.current = itemSeleccionado?.tipo === "miembro" ? Number(itemSeleccionado.data.usuarioId) : null;
  const miembrosRef = useRef([]);
  miembrosRef.current = miembros;

  const requiereSesion = () => {
    if (!ID_USUARIO_ACTUAL) {
      alert("No hay una sesión activa.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const cargarPerfilActual = async () => {
      if (!user?.id_usuario) return;
      try {
        const [p, u] = await Promise.all([
          obtenerPerfil(user.id_usuario).catch(() => null),
          llamar(usuariosApi.obtenerUsuario, user.id_usuario).catch(() => null),
        ]);
        setPerfilActual(p);
        setUsuarioActual(u);
      } catch (error) {
        setPerfilActual(null);
      }
    };
    cargarPerfilActual();
  }, [user]);

  useEffect(() => {
    if (!user?.id_usuario) return undefined;
    let cancelado = false;
    const cargarServidores = async () => {
      setCargandoServidores(true);
      setErrorCarga(null);
      try {
        const [todos, membresias] = await Promise.all([
          listarServidores(),
          SOLO_MIS_SERVIDORES ? listarMiembrosServidor() : Promise.resolve([]),
        ]);
        const veTodo = (user.roles || []).some((r) => ROLES_QUE_VEN_TODO.includes(String(r.nombre || "").toLowerCase()));
        let visibles = todos;
        if (SOLO_MIS_SERVIDORES && !veTodo) {
          const idsMios = new Set(
            membresias
              .filter((m) => Number(m.usuario_id) === Number(user.id_usuario) && m.activo !== false)
              .map((m) => Number(m.servidor_id))
          );
          visibles = todos.filter(
            (s) => idsMios.has(Number(s.id_servidor)) || Number(s.creador_id) === Number(user.id_usuario)
          );
        }
        if (cancelado) return;
        const normalizados = visibles.map((s) => ({ ...s, id: s.id_servidor }));
        setServidores(normalizados);
        setServidorActivo((anterior) =>
          anterior && normalizados.some((s) => s.id === anterior.id) ? anterior : normalizados[0] ?? null
        );
      } catch (error) {
        if (!cancelado) setErrorCarga(mensajeError(error, "No se pudieron cargar los servidores"));
      } finally {
        if (!cancelado) setCargandoServidores(false);
      }
    };
    cargarServidores();
    return () => {
      cancelado = true;
    };
  }, [user?.id_usuario]);

  const cargarCanales = useCallback(async () => {
    if (!servidorActivo) return [];
    const idSrv = servidorActivo.id;
    try {
      const data = await listarCanales();
      if (servidorRef.current !== idSrv) return [];
      const lista = data
        .filter((c) => Number(c.servidor_id) === Number(idSrv))
        .map((c) => ({
          id: c.id_canal,
          servidorId: c.servidor_id,
          nombre: c.nombre,
          tipo: c.tipo,
          categoria: c.categoria_id,
          descripcion: c.descripcion,
          orden: c.orden ?? 0,
        }));
      setCanales(lista);
      return lista;
    } catch (error) {
      if (servidorRef.current === idSrv) setErrorCarga(mensajeError(error, "No se pudieron cargar los canales"));
      return [];
    }
  }, [servidorActivo]);

  const cargarCategorias = useCallback(async () => {
    if (!servidorActivo) return [];
    const idSrv = servidorActivo.id;
    try {
      const data = await listarCategoriasPorServidor(idSrv);
      if (servidorRef.current !== idSrv) return [];
      const lista = data.map((cat) => ({
        id: cat.id_categoria,
        servidorId: cat.servidor_id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        orden: cat.orden,
        padreId: cat.padre_id,
      }));
      setCategorias(lista);
      return lista;
    } catch (error) {
      if (servidorRef.current === idSrv) setErrorCarga(mensajeError(error, "No se pudieron cargar las categorías"));
      return [];
    }
  }, [servidorActivo]);

  const cargarMiembros = useCallback(async () => {
    if (!servidorActivo) return null;
    const idSrv = servidorActivo.id;
    const nombreSrv = servidorActivo.nombre;
    try {
      const [todas, asignaciones, rolesData, usuariosLista] = await Promise.all([
        listarMiembrosServidor(),
        listarUsuarioRol({ servidor_id: idSrv }),
        listarRoles(),
        llamar(usuariosApi.listarUsuarios).catch(() => null),
      ]);
      const membresias = todas.filter((m) => Number(m.servidor_id) === Number(idSrv));
      const rolesPorId = {};
      rolesData.forEach((r) => {
        rolesPorId[r.id_rol] = r.nombre;
      });
      const usuarioPorId = {};
      (usuariosLista || []).forEach((u) => {
        usuarioPorId[u.id_usuario] = u;
      });

      const enriquecidos = await Promise.all(
        membresias.map(async (m) => {
          const perfil = await obtenerPerfil(m.usuario_id).catch(() => null);
          const usuario =
            usuarioPorId[m.usuario_id] ?? (await llamar(usuariosApi.obtenerUsuario, m.usuario_id).catch(() => null));
          const rolesAsignados = asignaciones
            .filter((a) => Number(a.usuario_id) === Number(m.usuario_id) && Number(a.servidor_id) === Number(idSrv))
            .map((a) => {
              const quien = usuarioPorId[a.asignado_por]?.nombre_usuario;
              return {
                id: a.id_usuario_rol,
                rolId: a.rol_id,
                nombre: rolesPorId[a.rol_id] || `Rol #${a.rol_id}`,
                contexto: `${nombreSrv} · asignado el ${formatearFecha(a.fecha_asignacion)}${quien ? ` por ${quien}` : ""}`,
              };
            });
          return {
            ...m,
            id: m.usuario_id,
            servidorId: m.servidor_id,
            usuarioId: m.usuario_id,
            perfil,
            usuario,
            nombreUsuario: usuario?.nombre_usuario || "",
            tienePerfil: perfil !== null,
            nombres: perfil?.nombres || usuario?.nombre_usuario || "",
            apellidos: perfil?.apellidos || "",
            email: usuario?.email || "",
            rol: rolesAsignados[0]?.nombre || "Sin rol",
            activo: m.activo ?? usuario?.activo,
            fechaRegistro: usuario?.fecha_registro || m.fecha_union,
            canales: [],
            roles: rolesAsignados,
            vinculosFamiliares: [],
          };
        })
      );
      if (servidorRef.current !== idSrv) return null;
      setRoles(rolesData);
      setMiembros(enriquecidos);
      return enriquecidos;
    } catch (error) {
      if (servidorRef.current === idSrv) setErrorCarga(mensajeError(error, "No se pudieron cargar los miembros"));
      return null;
    }
  }, [servidorActivo]);

  useEffect(() => {
    setErrorCarga(null);
    setCanales([]);
    setCategorias([]);
    setMiembros([]);
    cargarCanales();
    cargarCategorias();
    cargarMiembros();
  }, [cargarCanales, cargarCategorias, cargarMiembros]);

  // Datos de cuenta y perfil del miembro abierto
  useEffect(() => {
    if (itemSeleccionado?.tipo !== "miembro") return undefined;
    const usuarioId = Number(itemSeleccionado.data?.usuarioId);
    if (!usuarioId) return undefined;
    let cancelado = false;
    (async () => {
      try {
        const [usuario, perfil] = await Promise.all([
          llamar(usuariosApi.obtenerUsuario, usuarioId),
          obtenerPerfil(usuarioId).catch(() => null),
        ]);
        if (cancelado) return;
        setMiembroDetalle(usuario);
        setPerfilMiembro(perfil);
        setFormData((prev) => ({
          ...prev,
          dni: perfil?.dni || "",
          nombres: perfil?.nombres || "",
          apellidos: perfil?.apellidos || "",
          usuario: usuario?.nombre_usuario || "",
          email: usuario?.email || "",
        }));
      } catch (error) {
        if (!cancelado) setErrorCarga(mensajeError(error, "No se pudo cargar el detalle del miembro"));
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [itemSeleccionado]);

  const resolverNombre = async (id) => {
    const m = miembrosRef.current.find((x) => Number(x.usuarioId) === Number(id));
    if (m) return m.apellidos ? `${m.apellidos}, ${m.nombres}` : m.nombres;
    try {
      const [u, p] = await Promise.all([
        llamar(usuariosApi.obtenerUsuario, id),
        obtenerPerfil(id).catch(() => null),
      ]);
      return p?.nombres ? `${p.apellidos ? p.apellidos + ", " : ""}${p.nombres}` : u?.nombre_usuario || `Usuario #${id}`;
    } catch (error) {
      return `Usuario #${id}`;
    }
  };

  const cargarRelacionesMiembro = useCallback(
    async (usuarioId) => {
      const nombrePorCanal = new Map(canales.map((c) => [Number(c.id), c.nombre]));
      let listaCanales = [];
      let listaVinculos = [];
      try {
        const mc = await llamar(miembrosCanalApi.listarMiembrosCanal);
        listaCanales = mc
          .filter((x) => Number(x.usuario_id) === Number(usuarioId) && nombrePorCanal.has(Number(x.canal_id)))
          .map((x) => ({
            id: x.id_miembro_canal,
            canalId: x.canal_id,
            nombre: nombrePorCanal.get(Number(x.canal_id)),
            rolInCanal: x.rol_en_canal,
          }));
      } catch (error) {
        setErrorCarga(`Canales del miembro: ${mensajeError(error, "no se pudieron cargar")}`);
      }
      try {
        const rel = await llamar(relacionesApi.listarRelacionesUsuario);
        const propias = rel.filter(
          (r) => Number(r.usuario_id) === Number(usuarioId) || Number(r.relacionado_id) === Number(usuarioId)
        );
        listaVinculos = await Promise.all(
          propias.map(async (r) => {
            const esOrigen = Number(r.usuario_id) === Number(usuarioId);
            const otroId = esOrigen ? r.relacionado_id : r.usuario_id;
            const nombre = await resolverNombre(otroId);
            const tipo = String(r.tipo || "").toUpperCase();
            return {
              id: r.id_relacion,
              otroId: Number(otroId),
              esOrigen,
              tipo: r.tipo,
              texto: esOrigen ? `${nombre} (${tipo})` : `${tipo} de ${nombre}`,
            };
          })
        );
      } catch (error) {
        setErrorCarga(`Vínculos familiares: ${mensajeError(error, "no se pudieron cargar")}`);
      }
      if (abiertoRef.current !== Number(usuarioId)) return;
      setFormData((prev) => ({ ...prev, canales: listaCanales, vinculosFamiliares: listaVinculos }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canales]
  );

  useEffect(() => {
    if (itemSeleccionado?.tipo === "miembro") {
      cargarRelacionesMiembro(Number(itemSeleccionado.data.usuarioId));
    }
  }, [itemSeleccionado, cargarRelacionesMiembro]);

  const toggleAccordion = (sec) => {
    setAccordionOpen((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleSelect = (tipo, data) => {
    setItemSeleccionado({ tipo, data });
    setNuevoCanalSelec("");
    setNuevoRolSelec("");
    setUsuarioVinculo("");
    if (tipo === "canal") {
      setFormData({ ...data, tipo: etiquetaTipo(data.tipo), categoria: data.categoria ?? "" });
    } else if (tipo === "miembro") {
      setMiembroDetalle(data.usuario ?? null);
      setPerfilMiembro(data.perfil ?? null);
      setFormData({
        ...data,
        dni: data.perfil?.dni || "",
        nombres: data.perfil?.nombres || "",
        apellidos: data.perfil?.apellidos || "",
        usuario: data.nombreUsuario || "",
        email: data.email || "",
      });
    } else {
      setFormData({ ...data });
    }
  };

  const handleAbrirNuevoCanal = () => {
    const base = { servidorId: servidorActivo?.id, nombre: "", tipo: "General / Chat", categoria: "", descripcion: "" };
    setItemSeleccionado({ tipo: "nuevo_canal", data: base });
    setFormData(base);
  };

  const handleAbrirNuevaCategoria = () => {
    const base = { servidorId: servidorActivo?.id, nombre: "", descripcion: "", orden: 1 };
    setItemSeleccionado({ tipo: "nueva_categoria", data: base });
    setFormData(base);
  };

  const handleAbrirNuevoMiembro = () => {
    const base = {
      servidorId: servidorActivo?.id,
      nombres: "",
      apellidos: "",
      rolId: "",
      email: "",
      dni: "",
      usuario: "",
      activo: true,
      canales: [],
      roles: [],
      vinculosFamiliares: [],
    };
    setItemSeleccionado({ tipo: "nuevo_miembro", data: base });
    setFormData(base);
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
      const matchRol =
        filtroRolMiembro === "todos" ||
        (m.roles || []).some((r) => String(r.nombre || "").toLowerCase() === filtroRolMiembro.toLowerCase());
      return perteneceServidor && matchTexto && matchRol;
    });
  }, [miembros, servidorActivo, busquedaMiembro, filtroRolMiembro]);

  const miembrosSinPerfil = miembros.filter((m) => m.tienePerfil === false);

  const vistasCanales = useVistas(canalesFiltrados, `${busquedaCanal}|${filtroTipoCanal}|${servidorActivo?.id}|${canales.length}`);
  const vistasCategorias = useVistas(categoriasFiltradas, `${busquedaCategoria}|${servidorActivo?.id}|${categorias.length}`);
  const vistasMiembros = useVistas(miembrosFiltrados, `${busquedaMiembro}|${filtroRolMiembro}|${servidorActivo?.id}|${miembros.length}`);

  const handleScrollContenido = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 80) return;
    const v = tabActiva === "canales" ? vistasCanales : tabActiva === "categorias" ? vistasCategorias : vistasMiembros;
    if (v.hayMas) v.verMas();
  };

  const guardarMiembroExistente = async () => {
    const d = itemSeleccionado.data;
    const usuarioId = Number(d.usuarioId);
    const servidorId = Number(d.servidorId);
    const activo = formData.activo ?? true;

    const cambiosUsuario = {};
    const usuarioNuevo = String(formData.usuario || "").trim();
    const emailNuevo = String(formData.email || "").trim();
    if (usuarioNuevo && usuarioNuevo !== (miembroDetalle?.nombre_usuario || "")) cambiosUsuario.nombre_usuario = usuarioNuevo;
    if (emailNuevo && emailNuevo !== (miembroDetalle?.email || "")) cambiosUsuario.email = emailNuevo;
    if (activo !== (miembroDetalle?.activo ?? true)) cambiosUsuario.activo = activo;
    if (Object.keys(cambiosUsuario).length > 0) await llamar(usuariosApi.actualizarUsuario, usuarioId, cambiosUsuario);

    if (activo !== (d.activo ?? true)) await actualizarMiembroServidor(usuarioId, servidorId, { activo });

    const dni = String(formData.dni || "").trim();
    const nombres = String(formData.nombres || "").trim();
    const apellidos = String(formData.apellidos || "").trim();
    if (perfilMiembro) {
      if (dni !== (perfilMiembro.dni || "") || nombres !== (perfilMiembro.nombres || "") || apellidos !== (perfilMiembro.apellidos || "")) {
        await actualizarPerfil(usuarioId, { dni: dni || null, nombres: nombres || null, apellidos: apellidos || null });
      }
    } else if (dni || nombres || apellidos) {
      await crearPerfil({ usuario_id: usuarioId, dni: dni || null, nombres: nombres || null, apellidos: apellidos || null, biografia: null });
    }

  };

  const crearMiembroNuevo = async () => {
    const email = String(formData.email || "").trim().toLowerCase();
    const nombres = String(formData.nombres || "").trim();
    const apellidos = String(formData.apellidos || "").trim();
    const dni = String(formData.dni || "").trim();

    const lista = await llamar(usuariosApi.listarUsuarios);
    setUsuariosTodos(lista);
    let usuario = lista.find((u) => String(u.email || "").toLowerCase() === email);
    const existia = Boolean(usuario);
    if (usuario && miembros.some((m) => Number(m.usuarioId) === Number(usuario.id_usuario))) {
      alert("Ese usuario ya es miembro de este servidor.");
      return false;
    }

    let passwordTemporal = null;
    if (!usuario) {
      passwordTemporal = generarPasswordTemporal();
      usuario = await llamar(usuariosApi.crearUsuario, {
        nombre_usuario: nombreUsuarioLibre(email, lista),
        email,
        password: passwordTemporal,
        activo: true,
      });
    }
    const idUsuario = usuario.id_usuario;

    const perfilPrevio = existia ? await obtenerPerfil(idUsuario).catch(() => null) : null;
    if (!perfilPrevio) {
      await crearPerfil({ usuario_id: idUsuario, nombres, apellidos, dni: dni || null, biografia: null });
    }
    await crearMiembroServidor({ usuario_id: idUsuario, servidor_id: servidorActivo.id, activo: true });
    if (formData.rolId) {
      await crearUsuarioRol({
        usuario_id: idUsuario,
        rol_id: Number(formData.rolId),
        servidor_id: servidorActivo.id,
        asignado_por: ID_USUARIO_ACTUAL,
      });
    }
    
    alert(
      passwordTemporal
        ? `¡Nuevo miembro agregado con éxito!\n\nUsuario: ${usuario.nombre_usuario}\nContraseña temporal: ${passwordTemporal}\n\nAnotala y entregásela al usuario: no se vuelve a mostrar.`
        : "¡Nuevo miembro agregado con éxito!"
    );
  };

  const cargarDatos = async () => {
    await Promise.all([
      cargarCanales(),
      cargarCategorias(),
      cargarMiembros(),
    ]);
  };

  const handleGuardarCambios = async (e) => {
  e.preventDefault();
  if (!itemSeleccionado || guardando) return;
  if (!requiereSesion()) return;

  const tipo = itemSeleccionado.tipo;
  if (tipo === "miembro") {
    setItemSeleccionado(null);
    setFormData({});
  }
  setGuardando(true);
  try {
    if (tipo === "miembro") {
      await guardarMiembroExistente();
    } else if (tipo === "canal") {
      await actualizarCanal(itemSeleccionado.data.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria_id: formData.categoria ? Number(formData.categoria) : null,
        orden: formData.orden ?? 0,
        tipo: aTipoApi(formData.tipo),
      });
    } else if (tipo === "categoria") {
      await actualizarCategoria(itemSeleccionado.data.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        orden: Number(formData.orden) || 0,
      });
    } else if (tipo === "nuevo_canal") {
      await crearCanal({
        servidor_id: servidorActivo?.id,
        creador_id: ID_USUARIO_ACTUAL,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria_id: formData.categoria ? Number(formData.categoria) : null,
        orden: 0,
        tipo: aTipoApi(formData.tipo),
      });
    } else if (tipo === "nueva_categoria") {
      await crearCategoria({
        servidor_id: servidorActivo?.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        orden: Number(formData.orden) || 1,
      });
    } else if (tipo === "nuevo_miembro") {
      const creado = await crearMiembroNuevo();
      if (creado === false) return; // ya era miembro: se deja abierto
    }

    setItemSeleccionado(null);
    setFormData({});
    await cargarDatos();
  } catch (error) {
    alert(mensajeError(error, "Error al guardar los cambios"));
    if (tipo === "miembro" || tipo === "nuevo_miembro") await cargarMiembros();
  } finally {
    setGuardando(false);
  }
};

  const handleEliminarCanal = async () => {
    try {
      if (window.confirm(`¿Deseas eliminar el canal #${formData.nombre}?`)) {
        await eliminarCanal(formData.id);
        await cargarCanales();
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(`No se pudo eliminar el canal (puede tener miembros o mensajes asociados): ${mensajeError(error)}`);
    }
  };

  const handleEliminarCategoria = async () => {
    try {
      const canalesDeCategoria = canales.filter((c) => Number(c.categoria) === Number(formData.id));
      const hijas = categorias.filter((cat) => Number(cat.padreId) === Number(formData.id));
      const aviso =
        canalesDeCategoria.length > 0 || hijas.length > 0
          ? ` Sus ${canalesDeCategoria.length} canales y ${hijas.length} subcategorías quedarán sin categoría.`
          : "";
      if (window.confirm(`¿Deseas eliminar la categoría ${formData.nombre}?${aviso}`)) {
        for (const c of canalesDeCategoria) await actualizarCanal(c.id, { categoria_id: null });
        for (const h of hijas) await actualizarCategoria(h.id, { padre_id: null });
        await eliminarCategoria(formData.id);
        await Promise.all([cargarCategorias(), cargarCanales()]);
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(mensajeError(error, "Error al eliminar la categoría"));
    }
  };

  const handleAgregarCanalMiembro = async () => {
    if (!nuevoCanalSelec) return;
    const usuarioId = Number(itemSeleccionado.data.usuarioId);
    if ((formData.canales || []).some((c) => Number(c.canalId) === Number(nuevoCanalSelec))) {
      alert("El miembro ya pertenece a ese canal.");
      return;
    }
    try {
      await llamar(miembrosCanalApi.crearMiembroCanal, {
        usuario_id: usuarioId,
        canal_id: Number(nuevoCanalSelec),
        rol_en_canal: nuevoRolCanal,
      });
      setNuevoCanalSelec("");
      await cargarRelacionesMiembro(usuarioId);
    } catch (error) {
      alert(mensajeError(error, "Error al agregar el canal"));
    }
  };

  const handleEliminarCanalMiembro = async (idMiembroCanal) => {
    try {
      await llamar(miembrosCanalApi.eliminarMiembroCanal, idMiembroCanal);
      await cargarRelacionesMiembro(Number(itemSeleccionado.data.usuarioId));
    } catch (error) {
      alert(mensajeError(error, "Error al eliminar el canal del miembro"));
    }
  };

  const refrescarRolesMiembro = async (usuarioId) => {
    const lista = await cargarMiembros();
    const actualizado = lista?.find((m) => Number(m.usuarioId) === Number(usuarioId));
    if (actualizado && abiertoRef.current === Number(usuarioId)) {
      setFormData((prev) => ({ ...prev, roles: actualizado.roles, rol: actualizado.rol }));
    }
  };

  const handleAgregarRolMiembro = async () => {
    if (!nuevoRolSelec) return;
    if (!requiereSesion()) return;
    const usuarioId = Number(itemSeleccionado.data.usuarioId);
    if ((formData.roles || []).some((r) => Number(r.rolId) === Number(nuevoRolSelec))) {
      alert("El miembro ya tiene ese rol en este servidor.");
      return;
    }
    try {
      await crearUsuarioRol({
        usuario_id: usuarioId,
        rol_id: Number(nuevoRolSelec),
        servidor_id: servidorActivo?.id,
        asignado_por: ID_USUARIO_ACTUAL,
      });
      setNuevoRolSelec("");
      await refrescarRolesMiembro(usuarioId);
    } catch (error) {
      alert(mensajeError(error, "Error al asignar el rol"));
    }
  };

  const handleEliminarRolMiembro = async (rol) => {
    const usuarioId = Number(itemSeleccionado.data.usuarioId);
    try {
      await eliminarUsuarioRol(usuarioId, Number(rol.rolId), Number(servidorActivo?.id));
      await refrescarRolesMiembro(usuarioId);
    } catch (error) {
      alert(mensajeError(error, "Error al quitar el rol"));
    }
  };

  const buscarUsuarioPorTexto = async (texto) => {
    const t = texto.trim().toLowerCase();
    const lista = usuariosTodos ?? (await llamar(usuariosApi.listarUsuarios));
    if (!usuariosTodos) setUsuariosTodos(lista);
    const candidatos = [
      ...miembrosRef.current.map((m) => ({
        id: Number(m.usuarioId),
        claves: [m.email, m.nombreUsuario, `${m.nombres} ${m.apellidos}`.trim(), `${m.apellidos}, ${m.nombres}`],
      })),
      ...lista.map((u) => ({ id: Number(u.id_usuario), claves: [u.email, u.nombre_usuario] })),
    ];
    return candidatos.find((c) => c.claves.some((k) => k && String(k).trim().toLowerCase() === t)) || null;
  };

  const handleVincularFamiliar = async () => {
    if (!usuarioVinculo.trim()) return;
    const usuarioId = Number(itemSeleccionado.data.usuarioId);
    try {
      const destino = await buscarUsuarioPorTexto(usuarioVinculo);
      if (!destino) {
        alert("No se encontró ningún usuario con ese nombre o correo. Escribilo igual que figura en la lista de miembros.");
        return;
      }
      if (destino.id === usuarioId) {
        alert("No podés vincular un usuario consigo mismo.");
        return;
      }
      if ((formData.vinculosFamiliares || []).some((v) => v.otroId === destino.id && v.esOrigen && v.tipo === tipoVinculo)) {
        alert("Ese vínculo ya está registrado.");
        return;
      }
      await llamar(relacionesApi.crearRelacionUsuario, {
        usuario_id: usuarioId,
        relacionado_id: destino.id,
        tipo: tipoVinculo,
      });
      setUsuarioVinculo("");
      await cargarRelacionesMiembro(usuarioId);
    } catch (error) {
      alert(mensajeError(error, "Error al agregar el vínculo"));
    }
  };

  const handleEliminarVinculo = async (idRelacion) => {
    try {
      await llamar(relacionesApi.eliminarRelacionUsuario, idRelacion);
      await cargarRelacionesMiembro(Number(itemSeleccionado.data.usuarioId));
    } catch (error) {
      alert(mensajeError(error, "Error al eliminar el vínculo"));
    }
  };

  const handleQuitarDelServidor = async () => {
    const d = itemSeleccionado.data;
    const usuarioId = Number(d.usuarioId);
    const servidorId = Number(d.servidorId);
    const nombre = d.apellidos ? `${d.apellidos}, ${d.nombres}` : d.nombres;
    try {
      if (window.confirm(`¿Quitar a ${nombre} del servidor ${servidorActivo?.nombre}? También se quitarán sus canales y roles de este servidor.`)) {
        for (const c of formData.canales || []) await llamar(miembrosCanalApi.eliminarMiembroCanal, c.id);
        for (const r of formData.roles || []) await eliminarUsuarioRol(usuarioId, Number(r.rolId), servidorId);
        await eliminarMiembroServidor(usuarioId, servidorId);
        await cargarMiembros();
        setItemSeleccionado(null);
      }
    } catch (error) {
      alert(mensajeError(error, "Error al quitar del servidor"));
      await cargarMiembros();
    }
  };

  const nombreHeader = perfilActual?.apellidos
    ? `${perfilActual.apellidos}, ${perfilActual.nombres}`
    : perfilActual?.nombres || usuarioActual?.nombre_usuario || user?.nombre_usuario || "";
  const emailHeader = usuarioActual?.email || user?.email || "";
  const inicialesHeader = (
    perfilActual?.nombres || perfilActual?.apellidos
      ? `${perfilActual?.nombres?.[0] || ""}${perfilActual?.apellidos?.[0] || ""}`
      : (usuarioActual?.nombre_usuario || user?.nombre_usuario || "U").slice(0, 2)
  ).toUpperCase();

  const canalesParaAsignar = canales.filter(
    (c) => !(formData.canales || []).some((x) => Number(x.canalId) === Number(c.id))
  );
  const rolesParaAsignar = roles.filter(
    (r) => !(formData.roles || []).some((x) => Number(x.rolId) === Number(r.id_rol))
  );

  return (
    <div style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box", backgroundColor: "#f0f4f8" }}>
      {/* HEADER SUPERIOR */}
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "#0f766e", fontWeight: "700", margin: 0 }}>Mis Servidores</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>Gestión institucional de espacios de comunicación</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ffffff", padding: "6px 14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0f766e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", overflow: "hidden" }}>
            {perfilActual?.foto_perfil ? (
              <img src={perfilActual.foto_perfil} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              inicialesHeader
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>{nombreHeader}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{emailHeader}</div>
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
            {servidoresFiltrados.length === 0 && (
              <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                {cargandoServidores ? "Cargando servidores..." : "No hay servidores para mostrar."}
              </div>
            )}
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
              {itemSeleccionado && (
                <button
                  onClick={() => setItemSeleccionado(null)}
                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <IconArrowLeft size={14} /> Volver
                </button>
              )}
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
          <div onScroll={handleScrollContenido} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
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
                    <option value="chat">Chat</option>
                    <option value="informativo">Informativo</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {canalesFiltrados.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No hay canales registrados en este servidor.</span>
                  ) : (
                    vistasCanales.visibles.map((c) => {
                      const isSelected = itemSeleccionado?.tipo === "canal" && itemSeleccionado?.data?.id === c.id;
                      return (
                        <div key={c.id} {...btnProps(() => handleSelect("canal", c))} style={{ padding: "12px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <IconHash size={16} style={{ color: "#0f766e" }} />
                            <div>
                              <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", display: "block" }}>{c.nombre}</span>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>{c.descripcion}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "10px", background: "#ccfbf1", color: "#0f766e", padding: "2px 6px", borderRadius: "6px", fontWeight: "bold" }}>{etiquetaTipo(c.tipo)}</span>
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "2px solid #0d9488" : "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#0d9488" : "transparent" }}>
                              {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#ffffff" }} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <PieVistas vistas={vistasCanales} />
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
                    vistasCategorias.visibles.map((cat) => {
                      const isSelected = itemSeleccionado?.tipo === "categoria" && itemSeleccionado?.data?.id === cat.id;
                      return (
                        <div key={cat.id} {...btnProps(() => handleSelect("categoria", cat))} style={{ padding: "14px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  <PieVistas vistas={vistasCategorias} />
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
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.nombre}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {miembrosFiltrados.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>No hay miembros registrados en este servidor.</span>
                  ) : (
                    vistasMiembros.visibles.map((m) => {
                      const isSelected = itemSeleccionado?.tipo === "miembro" && itemSeleccionado?.data?.id === m.id;
                      return (
                        <div key={m.id} {...btnProps(() => handleSelect("miembro", m))} style={{ padding: "14px 16px", borderRadius: "12px", border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0", backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  <PieVistas vistas={vistasMiembros} />
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
                        (perfilMiembro?.nombres || miembroDetalle?.nombre_usuario || "U").toString().charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700", fontSize: "13px", color: "#0f766e" }}>{perfilMiembro?.nombres ? `${perfilMiembro.nombres} ${perfilMiembro?.apellidos || ""}`.trim() : miembroDetalle?.nombre_usuario || "Miembro"}</span>
                        <span style={{ fontSize: "10px", background: miembroDetalle?.activo === false ? "#fee2e2" : "#dcfce7", color: miembroDetalle?.activo === false ? "#991b1b" : "#166534", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>{miembroDetalle?.activo !== false ? "Activo" : "Inactivo"}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>@{miembroDetalle?.nombre_usuario || "usuario"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "6px" }}><strong>Email:</strong> {miembroDetalle?.email || "No registrado"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "2px" }}><strong>DNI:</strong> {perfilMiembro?.dni || "No registrado"}</div>
                      <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "2px" }}><strong>Fecha de registro:</strong> {formatearFecha(miembroDetalle?.fecha_registro)}</div>
                      {perfilMiembro?.biografia ? (
                        <div style={{ fontSize: "11px", color: "#1e293b", marginTop: "6px" }}><strong>Biografía:</strong> {perfilMiembro.biografia}</div>
                      ) : null}
                    </div>
                  </div>
                  {itemSeleccionado.data?.tienePerfil === false && !perfilMiembro && (
                    <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#92400e" }}>
                      Este miembro todavía no tiene un perfil creado. Al completar sus datos y guardar, se crea.
                    </div>
                  )}
                  <form onSubmit={handleGuardarCambios} style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Nombres</label>
                        <input type="text" value={formData.nombres || ""} onChange={(e) => handleInputChange("nombres", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Apellidos</label>
                        <input type="text" value={formData.apellidos || ""} onChange={(e) => handleInputChange("apellidos", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                      </div>
                    </div>
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
                      <span style={{ fontSize: "11px", color: "#64748b" }}>Registrado el {formatearFecha(miembroDetalle?.fecha_registro)}</span>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input type="checkbox" checked={formData.activo ?? true} onChange={(e) => handleInputChange("activo", e.target.checked)} />
                        Cuenta activa
                      </label>
                    </div>
                    <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
                                  {canalesParaAsignar.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Rol en canal</label>
                                <select value={nuevoRolCanal} onChange={(e) => setNuevoRolCanal(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                  {ROLES_CANAL.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
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
                          {(formData.roles || []).length === 0 && (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Sin roles asignados en este servidor.</span>
                          )}
                          {(formData.roles || []).map((r) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f766e" }}>{r.nombre}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{r.contexto}</div>
                              </div>
                              <button type="button" onClick={() => handleEliminarRolMiembro(r)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                <IconTrash size={16} />
                              </button>
                            </div>
                          ))}
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Asignar rol</label>
                            <select value={nuevoRolSelec} onChange={(e) => setNuevoRolSelec(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                              <option value="">Elegir rol...</option>
                              {rolesParaAsignar.map((r) => (
                                <option key={r.id_rol} value={r.id_rol}>{r.nombre} ({r.tipo})</option>
                              ))}
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
                            (formData.vinculosFamiliares || []).map((v) => (
                              <div key={v.id} style={{ fontSize: "11px", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", color: "#1e293b", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>🛡️ {v.texto}</span>
                                <button type="button" onClick={() => handleEliminarVinculo(v.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            ))
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                            <div>
                              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Tipo</label>
                              <select value={tipoVinculo} onChange={(e) => setTipoVinculo(e.target.value)} style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                {TIPOS_VINCULO.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>Usuario relacionado</label>
                              <input type="text" list="usuarios-vinculo" value={usuarioVinculo} onChange={(e) => setUsuarioVinculo(e.target.value)} placeholder="Nombre o correo" style={{ width: "100%", padding: "7px", fontSize: "11px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                              <datalist id="usuarios-vinculo">
                                {miembros
                                  .filter((m) => Number(m.usuarioId) !== Number(itemSeleccionado.data.usuarioId))
                                  .map((m) => (
                                    <option key={m.usuarioId} value={m.email}>{m.apellidos ? `${m.apellidos}, ${m.nombres}` : m.nombres}</option>
                                  ))}
                              </datalist>
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
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Miembro desde {formatearFecha(itemSeleccionado.data?.fecha_union)}</div>
                            </div>
                            <span style={{ fontSize: "10px", background: itemSeleccionado.data?.activo === false ? "#fee2e2" : "#dcfce7", color: itemSeleccionado.data?.activo === false ? "#991b1b" : "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>
                              {itemSeleccionado.data?.activo === false ? "Inactivo" : "Activo"}
                            </span>
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
                    <input type="text" required value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Tipo</label>
                    <select value={formData.tipo || "General / Chat"} onChange={(e) => handleInputChange("tipo", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }}>
                      <option value="General / Chat">General / Chat</option>
                      <option value="Anuncios / Avisos">Anuncios / Avisos</option>
                      <option value="Informativo">Informativo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Categoría Organizadora</label>
                    <select value={formData.categoria ?? ""} onChange={(e) => handleInputChange("categoria", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }}>
                      <option value="">Sin categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "70px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
                    <input type="text" required value={formData.nombre || ""} onChange={(e) => handleInputChange("nombre", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "80px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Orden jerárquico</label>
                    <input type="number" value={formData.orden ?? 1} onChange={(e) => handleInputChange("orden", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
                    <select value={formData.tipo || "General / Chat"} onChange={(e) => handleInputChange("tipo", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }}>
                      <option value="General / Chat">General / Chat</option>
                      <option value="Anuncios / Avisos">Anuncios / Avisos</option>
                      <option value="Informativo">Informativo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Categoría</label>
                    <select value={formData.categoria ?? ""} onChange={(e) => handleInputChange("categoria", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }}>
                      <option value="">Seleccionar categoría...</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <textarea placeholder="Breve descripción del canal..." value={formData.descripcion || ""} onChange={(e) => handleInputChange("descripcion", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", height: "70px", resize: "none", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
                    <input type="number" value={formData.orden ?? 1} onChange={(e) => handleInputChange("orden", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
                      <select value={formData.rolId ?? ""} onChange={(e) => handleInputChange("rolId", e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" }}>
                        <option value="">Sin rol</option>
                        {roles.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={guardando} style={{ width: "100%", padding: "10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
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
