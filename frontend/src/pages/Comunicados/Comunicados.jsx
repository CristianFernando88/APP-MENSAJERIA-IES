import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Search, Trash2, Eye, RotateCcw, Archive, Ban,
  Hash, Server, User, Globe, X, ChevronDown, Megaphone,
  Users, GraduationCap, Briefcase, Paperclip, FileText, File, Download,
  Image as ImageIcon,
} from "lucide-react";
import Badge from "../../components/ui/Badge/Badge";
import Button from "../../components/ui/Button/Button";
import Input from "../../components/ui/Input/Input";
import Modal from "../../components/ui/Modal/Modal";
import Overlay from "../../components/ui/Overlay/Overlay";
import Toast from "../../components/ui/Toast/Toast";
import {
  listarComunicados, crearComunicado, eliminarComunicado,
  listarPapelera, restaurarComunicado, eliminarDefinitivo,
} from "../../api/comunicados";
import { listarDestinatarios, crearDestinatario } from "../../api/comunicadosDestinatarios";
import { listarVistos, marcarVisto } from "../../api/comunicadosVistos";
import { listarCanales } from "../../api/canales";
import { listarServidores } from "../../api/servidores";
import { listarUsuarios } from "../../api/usuarios";
import { listarMiembrosCanal } from "../../api/miembrosCanal";
import { listarMiembrosServidor } from "../../api/miembrosServidor";
import { listarRoles } from "../../api/roles";
import { listarUsuarioRol } from "../../api/usuarioRol";
import { listarRelaciones } from "../../api/relacionesUsuario";
import { listarAdjuntos, subirAdjuntos } from "../../api/comunicadosAdjuntos";
import useConfirmacion from "../../hooks/useConfirmacion";
import { useAuth } from "../../context/AuthContext";
import "./Comunicados.css";

const ROLES_PUEDEN_PUBLICAR = ["super_admin", "admin", "director", "profesor", "preceptor"];


const ROLES_PERSONAL = ["profesor", "preceptor", "director"];

const ALCANCE_VARIANT = {
  global: "warning",
  servidor: "default",
  canal: "default",
  usuario: "success",
};

const ALCANCE_ETIQUETA = {
  global: "Global",
  servidor: "Servidor",
  canal: "Canal",
  usuario: "Persona",
};

const formVacio = { titulo: "", contenido: "" };
const DESTINOS_VACIOS = { global: true, servidores: [], canales: [], usuarios: [] };
const MS_TOAST = 8000;

const EXTENSIONES_OK = [
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
];
const MAX_TAMANO_ADJ = 10 * 1024 * 1024; // 10 MB
const MAX_ADJUNTOS = 5;

const extensionDe = (nombre) =>
  nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "";

const esImagenAdjunto = (archivo) =>
  archivo.type?.startsWith("image/") ||
  EXTENSIONES_OK.slice(0, 5).includes(extensionDe(archivo.name));

const tamanoDe = (bytes) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

const iconoDeAdjunto = (tipoMime, nombre) => {
  if (tipoMime?.startsWith("image/")) return ImageIcon;
  const ext = extensionDe(nombre ?? "");
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ImageIcon;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return FileText;
  return File;
};

function tiempoRelativo(iso) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;

  return new Date(iso).toLocaleDateString("es-AR");
}

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const fechaLarga = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function Comunicados() {
  const { user, hasRole } = useAuth();
  const puedePublicar = hasRole(ROLES_PUEDEN_PUBLICAR);

  const { pedir, dialogo } = useConfirmacion();

  const [comunicados, setComunicados] = useState([]);
  const [papelera, setPapelera] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [vistos, setVistos] = useState([]);
  const [canales, setCanales] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usuarioRoles, setUsuarioRoles] = useState([]);
  const [relaciones, setRelaciones] = useState([]);
  const [misCanales, setMisCanales] = useState([]);
  const [misServidores, setMisServidores] = useState([]);

  const [pestana, setPestana] = useState("recibidos");
  const [filtroAlcance, setFiltroAlcance] = useState("todos");
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [form, setForm] = useState(formVacio);
  const [destinos, setDestinos] = useState(DESTINOS_VACIOS);
  const [pestanaDest, setPestanaDest] = useState("servidores");
  const [busquedaAlumnos, setBusquedaAlumnos] = useState("");
  const [busquedaPersonal, setBusquedaPersonal] = useState("");
  const [servidorAbierto, setServidorAbierto] = useState(null);
  const [alumnoAbierto, setAlumnoAbierto] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  const [adjuntosNuevos, setAdjuntosNuevos] = useState([]);
  const [errorAdjuntos, setErrorAdjuntos] = useState("");
  const [dropSobre, setDropSobre] = useState(false);
  const [adjuntosPorComunicado, setAdjuntosPorComunicado] = useState({});
  const [adjuntosDetalle, setAdjuntosDetalle] = useState([]);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const urlsAdjuntos = useRef(new Set());

  const idsConocidos = useRef(new Set());
  const primeraCarga = useRef(true);
  const temporizadorToast = useRef(null);

  const mostrarToast = (com) => {
    setToast(com);
    if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    temporizadorToast.current = setTimeout(() => setToast(null), MS_TOAST);
  };

  const cargarAdjuntosDe = async (ids) => {
    const mapa = {};
    const resultados = await Promise.all(
      ids.map((id) => listarAdjuntos(id).catch(() => []))
    );
    for (let i = 0; i < ids.length; i += 1) {
      mapa[ids[i]] = resultados[i];
    }
    return mapa;
  };

  const cargarTodo = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setError("");

      const [c, pap, d, v, ca, se, us, ro, ur, re, mc, ms] = await Promise.all([
        listarComunicados(),
        listarPapelera(),
        listarDestinatarios(),
        listarVistos(),
        listarCanales(),
        listarServidores(),
        listarUsuarios(),
        listarRoles(),
        listarUsuarioRol(),
        listarRelaciones(),
        listarMiembrosCanal(),
        listarMiembrosServidor(),
      ]);

      setComunicados(c);
      setPapelera(pap);
      setDestinatarios(d);
      setVistos(v);
      setCanales(ca);
      setServidores(se);
      setUsuarios(us);
      setRoles(ro);
      setUsuarioRoles(ur);
      setRelaciones(re);
      setMisCanales(mc.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.canal_id));
      setMisServidores(ms.filter((m) => m.usuario_id === user?.id_usuario).map((m) => m.servidor_id));

      if (!silencioso) {
        setAdjuntosPorComunicado(await cargarAdjuntosDe(c.map((x) => x.id_comunicado)));
      }

      if (!primeraCarga.current) {
        const nuevos = c.filter((x) => !idsConocidos.current.has(x.id_comunicado));
        if (nuevos.length > 0) {
          const recien = [...nuevos].sort(
            (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
          )[0];
          mostrarToast(recien);
        }
      }

      idsConocidos.current = new Set(c.map((x) => x.id_comunicado));
      primeraCarga.current = false;
    } catch (err) {
      if (!silencioso) setError(err.message);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id_usuario]);

  useEffect(() => {
    const consultar = () => {
      if (document.visibilityState === "visible") cargarTodo({ silencioso: true });
    };

    const intervalo = setInterval(consultar, 10000);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargarTodo({ silencioso: true });
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id_usuario]);


  useEffect(
    () => () => {
      for (const url of urlsAdjuntos.current) URL.revokeObjectURL(url);
    },
    []
  );

  useEffect(() => {
    if (!puedePublicar && pestana !== "recibidos") setPestana("recibidos");
  }, [puedePublicar, pestana]);

  const nombreDeUsuario = (u) => {
    if (!u) return "Sistema";
    const perfil = u.perfil;
    const completo = [perfil?.nombres, perfil?.apellidos].filter(Boolean).join(" ").trim();
    return completo || u.nombre_usuario;
  };

  const nombreDe = (id) =>
    nombreDeUsuario(usuarios.find((u) => u.id_usuario === id));


  const rolNombreDe = (rolId) => roles.find((r) => r.id_rol === rolId)?.nombre;

  const alumnos = useMemo(() => {
    const ids = new Set(
      usuarioRoles
        .filter((ur) => rolNombreDe(ur.rol_id) === "alumno")
        .map((ur) => ur.usuario_id)
    );
    return usuarios.filter((u) => ids.has(u.id_usuario));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, usuarioRoles, roles]);

  const personal = useMemo(() => {
    const ids = new Set(
      usuarioRoles
        .filter((ur) => ROLES_PERSONAL.includes(rolNombreDe(ur.rol_id)))
        .map((ur) => ur.usuario_id)
    );
    return usuarios.filter((u) => ids.has(u.id_usuario));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, usuarioRoles, roles]);

  const tutoresDe = (alumnoId) => {
    const otros = new Map();
    for (const r of relaciones) {
      if (r.usuario_id === alumnoId && r.relacionado_id !== alumnoId) {
        otros.set(r.relacionado_id, r.tipo);
      } else if (r.relacionado_id === alumnoId && r.usuario_id !== alumnoId) {
        otros.set(r.usuario_id, r.tipo);
      }
    }
    return [...otros.entries()].map(([id, tipo]) => ({
      id,
      tipo,
      usuario: usuarios.find((u) => u.id_usuario === id),
    }));
  };

  const destinosPorComunicado = useMemo(() => {
    const mapa = {};
    for (const d of destinatarios) {
      if (!mapa[d.comunicado_id]) mapa[d.comunicado_id] = [];
      mapa[d.comunicado_id].push(d);
    }
    return mapa;
  }, [destinatarios]);

  const lectoresPorComunicado = useMemo(() => {
    const mapa = {};
    for (const v of vistos) {
      if (!mapa[v.comunicado_id]) mapa[v.comunicado_id] = [];
      mapa[v.comunicado_id].push(v);
    }
    return mapa;
  }, [vistos]);

  const infoDestino = (d) => {
    if (d.canal_id) {
      return {
        nombre: canales.find((c) => c.id_canal === d.canal_id)?.nombre ?? `Canal ${d.canal_id}`,
        icono: Hash,
      };
    }
    if (d.servidor_id) {
      return {
        nombre: servidores.find((s) => s.id_servidor === d.servidor_id)?.nombre ?? `Servidor ${d.servidor_id}`,
        icono: Server,
      };
    }
    if (d.usuario_id) {
      return { nombre: nombreDe(d.usuario_id), icono: User };
    }
    return { nombre: "Toda la institución", icono: Globe };
  };

  const meCorresponde = (comunicadoId) => {
    const destinosCom = destinosPorComunicado[comunicadoId] ?? [];
    if (destinosCom.length === 0) return true;

    return destinosCom.some(
      (d) =>
        d.usuario_id === user?.id_usuario ||
        (d.canal_id && misCanales.includes(d.canal_id)) ||
        (d.servidor_id && misServidores.includes(d.servidor_id))
    );
  };

  const vistosIds = useMemo(
    () => new Set(vistos.filter((v) => v.usuario_id === user?.id_usuario).map((v) => v.comunicado_id)),
    [vistos, user?.id_usuario]
  );

  const enviados = comunicados.filter((c) => c.publicado_por === user?.id_usuario);
  const recibidos = comunicados.filter((c) => meCorresponde(c.id_comunicado));

  const porFechaDesc = (a, b) =>
    new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);

  const enPapelera = papelera.filter((c) => c.publicado_por === user?.id_usuario);

  const listaBase = useMemo(() => {
    if (pestana === "papelera") return [...enPapelera].sort(porFechaDesc);
    const base = pestana === "enviados" ? enviados : pestana === "todos" ? comunicados : recibidos;
    return [...base].sort(porFechaDesc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana, enviados, recibidos, comunicados, enPapelera]);

  const noLeidosCount = recibidos.filter((c) => !vistosIds.has(c.id_comunicado)).length;

  const filtrados = listaBase.filter((c) => {
    if (soloNoLeidos && vistosIds.has(c.id_comunicado)) return false;
    if (filtroAlcance !== "todos") {
      if (filtroAlcance === "para-mi") {
        if (!meCorresponde(c.id_comunicado)) return false;
      } else if (c.tipo !== filtroAlcance) {
        return false;
      }
    }
    return c.titulo.toLowerCase().includes(busqueda.toLowerCase());
  });

 
  const comunicadoSeleccionado = useMemo(() => {
    if (seleccionadoId == null) return null;
    return (
      comunicados.find((c) => c.id_comunicado === seleccionadoId) ??
      papelera.find((c) => c.id_comunicado === seleccionadoId) ??
      null
    );
  }, [seleccionadoId, comunicados, papelera]);

  useEffect(() => {
    if (!comunicadoSeleccionado) {
      setAdjuntosDetalle([]);
      return;
    }

    let vigente = true;
    listarAdjuntos(comunicadoSeleccionado.id_comunicado)
      .then((data) => {
        if (vigente) setAdjuntosDetalle(data ?? []);
      })
      .catch((err) => console.error(err));

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comunicadoSeleccionado?.id_comunicado]);

  const handleAbrir = (comunicado) => {
    setSeleccionadoId(comunicado.id_comunicado);

    if (pestana === "recibidos" && !vistosIds.has(comunicado.id_comunicado) && user?.id_usuario) {
      marcarVisto(comunicado.id_comunicado, user.id_usuario)
        .then(() => listarVistos())
        .then(setVistos)
        .catch((err) => console.error(err));
    }
  };

  const handleVolver = () => setSeleccionadoId(null);

  const cambiarPestana = (p) => {
    setPestana(p);
    setSeleccionadoId(null);
  };


  const handleEliminar = async (comunicado) => {
    const ok = await pedir({
      titulo: "Mover a la papelera",
      mensaje: `"${comunicado.titulo}" va a dejar de ser visible para todos los destinatarios. Podés restaurarlo después desde la papelera.`,
      textoConfirmar: "Mover a la papelera",
      peligro: true,
    });

    if (!ok) return;

    try {
      setError("");
      await eliminarComunicado(comunicado.id_comunicado);
      setSeleccionadoId(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestaurar = async (comunicado) => {
    const ok = await pedir({
      titulo: "Restaurar comunicado",
      mensaje: `"${comunicado.titulo}" va a volver a estar visible para todos sus destinatarios.`,
      textoConfirmar: "Restaurar",
    });

    if (!ok) return;

    try {
      setError("");
      await restaurarComunicado(comunicado.id_comunicado);
      setSeleccionadoId(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarDefinitivo = async (comunicado) => {
    const ok = await pedir({
      titulo: "Eliminar definitivamente",
      mensaje: `Se va a borrar "${comunicado.titulo}" para siempre, junto con sus destinatarios, registros de lectura y adjuntos. Esta acción NO se puede deshacer.`,
      textoConfirmar: "Eliminar para siempre",
      peligro: true,
    });

    if (!ok) return;

    try {
      setError("");
      await eliminarDefinitivo(comunicado.id_comunicado);
      setSeleccionadoId(null);
      await cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- Adjuntos: agregar / quitar ----------
  const agregarAdjuntos = (lista) => {
    setErrorAdjuntos("");
    const entrada = Array.from(lista ?? []);
    if (entrada.length === 0) return;

    const cupo = MAX_ADJUNTOS - adjuntosNuevos.length;
    if (cupo <= 0) {
      setErrorAdjuntos(`Solo se permiten ${MAX_ADJUNTOS} archivos por comunicado.`);
      return;
    }

    const aceptados = [];
    let rechazo = "";

    for (const archivo of entrada) {
      const ext = extensionDe(archivo.name);

      if (!EXTENSIONES_OK.includes(ext)) {
        rechazo = `Formato no permitido: ${archivo.name}`;
        continue;
      }
      if (archivo.size > MAX_TAMANO_ADJ) {
        rechazo = `${archivo.name} supera los 10 MB`;
        continue;
      }
      if (aceptados.length >= cupo) {
        rechazo = `Solo se permiten ${MAX_ADJUNTOS} archivos por comunicado`;
        break;
      }

      const esImagen = esImagenAdjunto(archivo);
      const url = esImagen ? URL.createObjectURL(archivo) : null;
      if (url) urlsAdjuntos.current.add(url);

      aceptados.push({ archivo, url });
    }

    if (rechazo) setErrorAdjuntos(rechazo);

    if (aceptados.length > 0) {
      setAdjuntosNuevos((prev) => [...prev, ...aceptados]);
    }
  };

  const quitarAdjuntoNuevo = (indice) => {
    setAdjuntosNuevos((prev) => {
      const copia = [...prev];
      const [quitado] = copia.splice(indice, 1);
      if (quitado?.url) {
        URL.revokeObjectURL(quitado.url);
        urlsAdjuntos.current.delete(quitado.url);
      }
      return copia;
    });
  };

  const limpiarAdjuntos = () => {
    for (const url of urlsAdjuntos.current) URL.revokeObjectURL(url);
    urlsAdjuntos.current = new Set();
    setAdjuntosNuevos([]);
    setErrorAdjuntos("");
  };

  const adjuntosImagen = adjuntosNuevos.filter((a) => a.url);
  const adjuntosArchivo = adjuntosNuevos.filter((a) => !a.url);

  const toggleEnLista = (lista, id) =>
    lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];

  const toggleGlobal = () =>
    setDestinos({ global: true, servidores: [], canales: [], usuarios: [] });

  const toggleServidor = (id) =>
    setDestinos((prev) => ({
      ...prev,
      global: false,
      servidores: toggleEnLista(prev.servidores, id),
    }));

  const toggleCanal = (id) =>
    setDestinos((prev) => ({
      ...prev,
      global: false,
      canales: toggleEnLista(prev.canales, id),
    }));

  const toggleUsuario = (id) =>
    setDestinos((prev) => ({
      ...prev,
      global: false,
      usuarios: toggleEnLista(prev.usuarios, id),
    }));

  const quitarDestino = (tipo, id) =>
    setDestinos((prev) => ({
      ...prev,
      [tipo]: prev[tipo].filter((x) => x !== id),
    }));

  const alumnosFiltrados = alumnos.filter((a) =>
    nombreDeUsuario(a).toLowerCase().includes(busquedaAlumnos.toLowerCase())
  );

  const personalFiltrados = personal.filter((p) =>
    nombreDeUsuario(p).toLowerCase().includes(busquedaPersonal.toLowerCase())
  );

  const canalesDelServidor = (servidorId) =>
    canales.filter((c) => c.servidor_id === servidorId);

  const totalDestinos =
    destinos.servidores.length + destinos.canales.length + destinos.usuarios.length;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!puedePublicar) return;
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("El título y el contenido son obligatorios");
      return;
    }

    const alcance = destinos.global
      ? "toda la institución"
      : `${totalDestinos} destino${totalDestinos === 1 ? "" : "s"}`;

    const ok = await pedir({
      titulo: "Publicar comunicado",
      mensaje: `Se va a publicar "${form.titulo.trim()}" para ${alcance}. Los destinatarios lo van a ver al instante y no se puede editar el alcance una vez enviado.`,
      textoConfirmar: "Publicar",
    });

    if (!ok) return;

    setGuardando(true);

    let tipo = "global";
    if (!destinos.global) {
      if (destinos.servidores.length) tipo = "servidor";
      else if (destinos.canales.length) tipo = "canal";
      else tipo = "usuario";
    }

    try {
      const nuevo = await crearComunicado({
        titulo: form.titulo,
        contenido: form.contenido,
        tipo,
        publicado_por: user?.id_usuario,
      });

      for (const canalId of destinos.canales) {
        await crearDestinatario({ comunicado_id: nuevo.id_comunicado, canal_id: canalId });
      }
      for (const servidorId of destinos.servidores) {
        await crearDestinatario({ comunicado_id: nuevo.id_comunicado, servidor_id: servidorId });
      }
      for (const usuarioId of destinos.usuarios) {
        await crearDestinatario({ comunicado_id: nuevo.id_comunicado, usuario_id: usuarioId });
      }

      let subidos = [];
      if (adjuntosNuevos.length > 0) {
        try {
          subidos = await subirAdjuntos(
            nuevo.id_comunicado,
            adjuntosNuevos.map((a) => a.archivo)
          );
        } catch (errAdj) {
          setError(
            `El comunicado se publicó, pero falló la subida de adjuntos: ${errAdj.message}`
          );
        }
      }

      await cargarTodo();


      if (subidos.length > 0) {
        setAdjuntosPorComunicado((prev) => ({
          ...prev,
          [nuevo.id_comunicado]: subidos,
        }));
      }

      setForm(formVacio);
      setDestinos(DESTINOS_VACIOS);
      setServidorAbierto(null);
      setAlumnoAbierto(null);
      limpiarAdjuntos();
      setCrearOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const enPapeleraActual = pestana === "papelera";

  const FILTROS_ALCANCE = [
    { id: "todos", etiqueta: "Todos" },
    { id: "global", etiqueta: "Global" },
    { id: "servidor", etiqueta: "Servidor" },
    { id: "canal", etiqueta: "Canal" },
    { id: "para-mi", etiqueta: "Para mí" },
  ];

  return (
    <section className={`comunicados${comunicadoSeleccionado ? " comunicados--detalle" : ""}`}>
      {/* ============ ENCABEZADO ============ */}
      <header className="comunicados__header">
        <div className="comunicados__header-txt">
          <h1 className="comunicados__title">
            {enPapeleraActual ? "Papelera" : "Comunicados"}
          </h1>
          <p className="comunicados__subtitle">
            {enPapeleraActual
              ? "Los que borraste se pueden restaurar o eliminar para siempre."
              : "Avisos y novedades oficiales del colegio."}
          </p>
        </div>

        {puedePublicar && !enPapeleraActual && (
          <button className="comunicados__new-btn" onClick={() => setCrearOpen(true)}>
            <Plus size={17} /> Nuevo comunicado
          </button>
        )}
      </header>

      {/* ============ SECCIONES ============ */}
      <div className="comunicados__secciones">
        {puedePublicar && (
          <button
            className={`comunicados__seccion${pestana === "enviados" ? " comunicados__seccion--activa" : ""}`}
            onClick={() => cambiarPestana("enviados")}
          >
            Enviados <span className="comunicados__seccion-num">{enviados.length}</span>
          </button>
        )}

        <button
          className={`comunicados__seccion${pestana === "recibidos" ? " comunicados__seccion--activa" : ""}`}
          onClick={() => cambiarPestana("recibidos")}
        >
          Recibidos <span className="comunicados__seccion-num">{recibidos.length}</span>
        </button>

        {puedePublicar && (
          <>
            <button
              className={`comunicados__seccion${pestana === "todos" ? " comunicados__seccion--activa" : ""}`}
              onClick={() => cambiarPestana("todos")}
            >
              Todos <span className="comunicados__seccion-num">{comunicados.length}</span>
            </button>

            <button
              className={`comunicados__seccion${pestana === "papelera" ? " comunicados__seccion--activa" : ""}`}
              onClick={() => cambiarPestana("papelera")}
            >
              Papelera <span className="comunicados__seccion-num">{enPapelera.length}</span>
            </button>
          </>
        )}
      </div>

      <div className="comunicados__filtros">
        <div className="comunicados__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda">
              <X size={16} />
            </button>
          )}
        </div>

        {!enPapeleraActual && (
          <div className="comunicados__chips-filtro">
            {FILTROS_ALCANCE.map((f) => (
              <button
                key={f.id}
                className={`comunicados__chip-filtro${filtroAlcance === f.id ? " comunicados__chip-filtro--activo" : ""}`}
                onClick={() => setFiltroAlcance(f.id)}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      {!enPapeleraActual && noLeidosCount > 0 && (
        <button
          className={`comunicados__filtro${soloNoLeidos ? " comunicados__filtro--activo" : ""}`}
          onClick={() => setSoloNoLeidos((v) => !v)}
        >
          <Eye size={14} /> No leídos ({noLeidosCount})
        </button>
      )}

      {error && <p className="comunicados__empty">{error}</p>}

      {/* ============ LAYOUT: LISTA + DETALLE ============ */}
      <div className="comunicados__layout">
        {/* ---- Lista (tablón) ---- */}
        <div className="comunicados__lista">
          {filtrados.length === 0 && (
            <div className="comunicados__vacio">
              <Megaphone size={40} />
              <p>
                {enPapeleraActual
                  ? "La papelera está vacía."
                  : "Todavía no hay comunicados publicados."}
              </p>
            </div>
          )}

          {filtrados.map((c) => {
            const sinLeer = !enPapeleraActual && !vistosIds.has(c.id_comunicado);
            const activo = comunicadoSeleccionado?.id_comunicado === c.id_comunicado;
            const lectores = (lectoresPorComunicado[c.id_comunicado] ?? []).length;
            const conAdj = adjuntosPorComunicado[c.id_comunicado] ?? [];

            return (
              <article
                key={c.id_comunicado}
                className={`comunicados__card comunicados__card--${c.tipo}${
                  activo ? " comunicados__card--activo" : ""
                }${sinLeer ? " comunicados__card--nuevo" : ""}${
                  enPapeleraActual ? " comunicados__card--archivado" : ""
                }`}
                onClick={() => handleAbrir(c)}
              >
                <span className="comunicados__card-ico">
                  {enPapeleraActual ? <Archive size={20} /> : <Megaphone size={20} />}
                </span>

                <div className="comunicados__card-cuerpo">
                  <div className="comunicados__card-tit">
                    <h2 className="comunicados__card-titulo">{c.titulo}</h2>
                    <span className={`comunicados__alcance comunicados__alcance--${c.tipo}`}>
                      {ALCANCE_ETIQUETA[c.tipo] ?? c.tipo}
                    </span>
                    {sinLeer && (
                      <span className="comunicados__card-nuevo">Nuevo</span>
                    )}
                  </div>

                  <p className="comunicados__card-meta">
                    {nombreDe(c.publicado_por)} · {tiempoRelativo(c.fecha_publicacion)}
                  </p>

                  <p className="comunicados__card-extracto">{c.contenido}</p>

                  <div className="comunicados__card-pie">
                    <div className="comunicados__card-pie-info">
                      <span
                        className={`comunicados__card-estado${lectores > 0 ? " comunicados__card-estado--visto" : ""}`}
                      >
                        <Eye size={13} />
                        {lectores > 0 ? `Visto por ${lectores}` : "Sin lecturas"}
                      </span>

                      {conAdj.length > 0 && (
                        <span className="comunicados__card-clips">
                          <Paperclip size={12} /> {conAdj.length}
                        </span>
                      )}
                    </div>

                    <time className="comunicados__card-fecha">
                      {fechaCorta(c.fecha_publicacion)}
                    </time>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ---- Detalle (documento) ---- */}
        <div className="comunicados__detalle">
          {comunicadoSeleccionado ? (
            (() => {
              const c = comunicadoSeleccionado;
              const destinosCom = destinosPorComunicado[c.id_comunicado] ?? [];
              const lectores = (lectoresPorComunicado[c.id_comunicado] ?? []).map(
                (v) => nombreDe(v.usuario_id)
              );
              const imagenes = adjuntosDetalle.filter((a) => a.tipo_mime.startsWith("image/"));
              const archivos = adjuntosDetalle.filter((a) => !a.tipo_mime.startsWith("image/"));

              return (
                <article className="comunicados__doc">
                  <button className="comunicados__volver" onClick={handleVolver}>
                    <ChevronDown size={16} /> Volver
                  </button>

                  <div className="comunicados__doc-franja">
                    <Megaphone size={20} />
                    <span className="comunicados__doc-franja-txt">Comunicado</span>
                  </div>

                  <div className="comunicados__doc-cuerpo">
                    <Badge variant={ALCANCE_VARIANT[c.tipo] ?? "default"}>
                      {ALCANCE_ETIQUETA[c.tipo] ?? c.tipo}
                    </Badge>

                    <h2 className="comunicados__doc-titulo">{c.titulo}</h2>

                    <p className="comunicados__doc-meta">
                      Publicado por {nombreDe(c.publicado_por)} · {fechaLarga(c.fecha_publicacion)}
                    </p>

                    <div className="comunicados__doc-para">
                      <span className="comunicados__doc-para-label">Para:</span>
                      {destinosCom.length === 0 ? (
                        <span className="comunicados__chip">
                          <Globe size={13} /> Toda la institución
                        </span>
                      ) : (
                        destinosCom.map((d) => {
                          const info = infoDestino(d);
                          const Icono = info.icono;
                          return (
                            <span key={d.id_comunicado_destinatario} className="comunicados__chip">
                              <Icono size={13} /> {info.nombre}
                            </span>
                          );
                        })
                      )}
                    </div>

                    <p className="comunicados__doc-texto">{c.contenido}</p>

                    {adjuntosDetalle.length > 0 && (
                      <div className="comunicados__doc-adjuntos">
                        <span className="comunicados__doc-adjuntos-tit">
                          <Paperclip size={14} /> Adjuntos ({adjuntosDetalle.length})
                        </span>

                        {imagenes.length > 0 && (
                          <div className="comunicados__img-lista">
                            {imagenes.map((adj) => (
                              <button
                                key={adj.id}
                                type="button"
                                className="comunicados__img-card"
                                onClick={() => setImagenAmpliada(adj.url)}
                                aria-label={`Ampliar ${adj.nombre_original}`}
                              >
                                <img
                                  className="comunicados__img-mini"
                                  src={adj.url}
                                  alt={adj.nombre_original}
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {archivos.length > 0 && (
                          <div className="comunicados__archivo-lista">
                            {archivos.map((adj) => {
                              const Icono = iconoDeAdjunto(adj.tipo_mime, adj.nombre_original);

                              return (
                                <div className="comunicados__archivo-card" key={adj.id}>
                                  <span className="comunicados__archivo-ico">
                                    <Icono size={18} />
                                  </span>

                                  <span className="comunicados__archivo-info">
                                    <span className="comunicados__archivo-nombre">
                                      {adj.nombre_original}
                                    </span>
                                    <span className="comunicados__archivo-tamano">
                                      {tamanoDe(adj.tamano_bytes)}
                                    </span>
                                  </span>

                                  <a
                                    className="comunicados__archivo-descargar"
                                    href={adj.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={adj.nombre_original}
                                  >
                                    <Download size={14} /> Descargar
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="comunicados__doc-vistos">
                      <span className="comunicados__doc-vistos-tit">
                        <Eye size={14} /> Visto por {lectores.length}{" "}
                        {lectores.length === 1 ? "persona" : "personas"}
                      </span>
                      {puedePublicar && lectores.length > 0 && (
                        <div className="comunicados__chips">
                          {lectores.map((nombre, i) => (
                            <span key={i} className="comunicados__chip comunicados__chip--visto">
                              {nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {puedePublicar && (
                      <div className="comunicados__acciones-detalle">
                        {enPapeleraActual ? (
                          <>
                            <button
                              className="comunicados__btn-restaurar"
                              onClick={() => handleRestaurar(c)}
                            >
                              <RotateCcw size={16} /> Restaurar
                            </button>
                            <button
                              className="comunicados__eliminar"
                              onClick={() => handleEliminarDefinitivo(c)}
                            >
                              <Ban size={16} /> Borrar definitivamente
                            </button>
                          </>
                        ) : (
                          <button
                            className="comunicados__eliminar"
                            onClick={() => handleEliminar(c)}
                          >
                            <Trash2 size={16} /> Mover a la papelera
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })()
          ) : (
            <div className="comunicados__doc comunicados__doc--vacio">
              <Megaphone size={44} />
              <p>Elegí un comunicado de la lista para leerlo acá.</p>
            </div>
          )}
        </div>
      </div>

      {crearOpen && puedePublicar && (
        <Modal title="Nuevo comunicado" onClose={() => setCrearOpen(false)}>
          <form className="comunicados__form" onSubmit={handleSubmit}>
            <Input
              label="Título"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Reserva matrícula 2027"
            />

            <label className="comunicados__label" htmlFor="contenido">Contenido</label>
            <textarea
              id="contenido"
              name="contenido"
              className="comunicados__textarea"
              rows={5}
              value={form.contenido}
              onChange={handleChange}
              placeholder="Escribí el cuerpo del comunicado..."
            />

            {/* ---- Adjuntos ---- */}
            <div className="comunicados__grupo">
              <span className="comunicados__label">Adjuntos</span>

              <div
                className={`comunicados__dropzone${dropSobre ? " comunicados__dropzone--sobre" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropSobre(true);
                }}
                onDragLeave={() => setDropSobre(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropSobre(false);
                  agregarAdjuntos(e.dataTransfer.files);
                }}
              >
                <Paperclip size={20} />
                <p className="comunicados__dropzone-texto">
                  Arrastrá imágenes o archivos acá, o apretá el botón
                </p>

                <label className="comunicados__dropzone-btn">
                  Adjuntar
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(e) => {
                      agregarAdjuntos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                <p className="comunicados__dropzone-hint">
                  Hasta {MAX_ADJUNTOS} archivos de 10 MB. Imágenes, PDF, Word, Excel, PowerPoint o TXT.
                </p>
              </div>

              {errorAdjuntos && <p className="comunicados__error-adj">{errorAdjuntos}</p>}

              {adjuntosImagen.length > 0 && (
                <div className="comunicados__img-lista">
                  {adjuntosImagen.map((adj) => (
                    <div className="comunicados__img-card" key={adj.url}>
                      <img className="comunicados__img-mini" src={adj.url} alt={adj.archivo.name} />
                      <button
                        type="button"
                        className="comunicados__img-quitar"
                        onClick={() => quitarAdjuntoNuevo(adjuntosNuevos.indexOf(adj))}
                        aria-label="Quitar imagen"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {adjuntosArchivo.length > 0 && (
                <div className="comunicados__archivo-lista">
                  {adjuntosArchivo.map((adj) => (
                    <div
                      className="comunicados__archivo-card"
                      key={adj.archivo.name + adj.archivo.size}
                    >
                      <span className="comunicados__archivo-ico">
                        <File size={18} />
                      </span>

                      <span className="comunicados__archivo-info">
                        <span className="comunicados__archivo-nombre">{adj.archivo.name}</span>
                        <span className="comunicados__archivo-tamano">
                          {tamanoDe(adj.archivo.size)}
                        </span>
                      </span>

                      <button
                        type="button"
                        className="comunicados__archivo-quitar"
                        onClick={() => quitarAdjuntoNuevo(adjuntosNuevos.indexOf(adj))}
                        aria-label="Quitar archivo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---- Selector de destinatarios ---- */}
            <div className="comunicados__grupo">
              <span className="comunicados__label">A quién enviar</span>

              <div className="comunicados__chips-seleccion">
                <button
                  type="button"
                  className={`comunicados__chip-filtro${destinos.global ? " comunicados__chip-filtro--activo" : ""}`}
                  onClick={toggleGlobal}
                >
                  <Globe size={13} /> Global
                </button>

                {destinos.servidores.map((id) => (
                  <span key={`s-${id}`} className="comunicados__chip">
                    <Server size={13} /> {servidores.find((s) => s.id_servidor === id)?.nombre ?? id}
                    <button
                      type="button"
                      className="comunicados__chip-x"
                      onClick={() => quitarDestino("servidores", id)}
                      aria-label="Quitar destino"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {destinos.canales.map((id) => (
                  <span key={`c-${id}`} className="comunicados__chip">
                    <Hash size={13} /> {canales.find((c) => c.id_canal === id)?.nombre ?? id}
                    <button
                      type="button"
                      className="comunicados__chip-x"
                      onClick={() => quitarDestino("canales", id)}
                      aria-label="Quitar destino"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {destinos.usuarios.map((id) => (
                  <span key={`u-${id}`} className="comunicados__chip">
                    <User size={13} /> {nombreDe(id)}
                    <button
                      type="button"
                      className="comunicados__chip-x"
                      onClick={() => quitarDestino("usuarios", id)}
                      aria-label="Quitar destino"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {!destinos.global && totalDestinos === 0 && (
                <p className="comunicados__hint">Elegí al menos un destino, o volvé a Global.</p>
              )}

              {/* Pestañas del selector */}
              <div className="comunicados__pestanas-dest">
                <button
                  type="button"
                  className={`comunicados__pestana-dest${pestanaDest === "servidores" ? " comunicados__pestana-dest--activa" : ""}`}
                  onClick={() => setPestanaDest("servidores")}
                >
                  <Server size={15} /> Servidores
                </button>
                <button
                  type="button"
                  className={`comunicados__pestana-dest${pestanaDest === "personas" ? " comunicados__pestana-dest--activa" : ""}`}
                  onClick={() => setPestanaDest("personas")}
                >
                  <Users size={15} /> Personas
                </button>
              </div>

              {/* --- Pestaña Servidores --- */}
              {pestanaDest === "servidores" && (
                <div className="comunicados__lista-dest">
                  {servidores.map((s) => (
                    <div className="comunicados__destino-fila" key={s.id_servidor}>
                      <label className="comunicados__destino-op">
                        <input
                          type="checkbox"
                          checked={destinos.servidores.includes(s.id_servidor)}
                          onChange={() => toggleServidor(s.id_servidor)}
                        />
                        <Server size={15} /> {s.nombre}
                        <span className="comunicados__destino-sub">Servidor completo</span>
                      </label>

                      <button
                        type="button"
                        className="comunicados__destino-desp"
                        onClick={() =>
                          setServidorAbierto(servidorAbierto === s.id_servidor ? null : s.id_servidor)
                        }
                        aria-label="Ver canales"
                      >
                        <ChevronDown
                          size={16}
                          className={servidorAbierto === s.id_servidor ? "comunicados__chev--abierto" : ""}
                        />
                      </button>

                      {servidorAbierto === s.id_servidor && (
                        <div className="comunicados__sublista">
                          {canalesDelServidor(s.id_servidor).map((canal) => (
                            <label className="comunicados__destino-op" key={canal.id_canal}>
                              <input
                                type="checkbox"
                                checked={destinos.canales.includes(canal.id_canal)}
                                onChange={() => toggleCanal(canal.id_canal)}
                              />
                              <Hash size={14} /> {canal.nombre}
                            </label>
                          ))}
                          {canalesDelServidor(s.id_servidor).length === 0 && (
                            <p className="comunicados__hint">Este servidor no tiene canales.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {servidores.length === 0 && (
                    <p className="comunicados__hint">No hay servidores cargados.</p>
                  )}
                </div>
              )}

              {/* --- Pestaña Personas --- */}
              {pestanaDest === "personas" && (
                <div className="comunicados__selector-personas">
                  {/* Alumnos + tutores */}
                  <span className="comunicados__grupo-sub">
                    <GraduationCap size={14} /> Alumnos
                  </span>

                  <div className="comunicados__buscador-mini">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Buscar alumno por nombre..."
                      value={busquedaAlumnos}
                      onChange={(e) => setBusquedaAlumnos(e.target.value)}
                    />
                  </div>

                  <div className="comunicados__lista-dest">
                    {alumnosFiltrados.map((a) => {
                      const tutores = tutoresDe(a.id_usuario);

                      return (
                        <div className="comunicados__destino-fila" key={a.id_usuario}>
                          <label className="comunicados__destino-op">
                            <input
                              type="checkbox"
                              checked={destinos.usuarios.includes(a.id_usuario)}
                              onChange={() => toggleUsuario(a.id_usuario)}
                            />
                            <GraduationCap size={15} /> {nombreDeUsuario(a)}
                          </label>

                          {tutores.length > 0 && (
                            <button
                              type="button"
                              className="comunicados__destino-desp"
                              onClick={() =>
                                setAlumnoAbierto(alumnoAbierto === a.id_usuario ? null : a.id_usuario)
                              }
                              aria-label="Ver tutores"
                            >
                              <span className="comunicados__destino-sub">
                                {tutores.length} tutor{tutores.length === 1 ? "" : "es"}
                              </span>
                              <ChevronDown
                                size={16}
                                className={alumnoAbierto === a.id_usuario ? "comunicados__chev--abierto" : ""}
                              />
                            </button>
                          )}

                          {alumnoAbierto === a.id_usuario && (
                            <div className="comunicados__sublista">
                              {tutores.map((t) => (
                                <label className="comunicados__destino-op" key={t.id}>
                                  <input
                                    type="checkbox"
                                    checked={destinos.usuarios.includes(t.id)}
                                    onChange={() => toggleUsuario(t.id)}
                                  />
                                  <User size={14} /> {nombreDeUsuario(t.usuario)}
                                  <span className="comunicados__destino-sub">
                                    {t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {alumnosFiltrados.length === 0 && (
                      <p className="comunicados__hint">No se encontraron alumnos.</p>
                    )}
                  </div>

                  {/* Docentes y personal */}
                  <span className="comunicados__grupo-sub">
                    <Briefcase size={14} /> Docentes y personal
                  </span>

                  <div className="comunicados__buscador-mini">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={busquedaPersonal}
                      onChange={(e) => setBusquedaPersonal(e.target.value)}
                    />
                  </div>

                  <div className="comunicados__lista-dest">
                    {personalFiltrados.map((p) => (
                      <label className="comunicados__destino-op" key={p.id_usuario}>
                        <input
                          type="checkbox"
                          checked={destinos.usuarios.includes(p.id_usuario)}
                          onChange={() => toggleUsuario(p.id_usuario)}
                        />
                        <Briefcase size={14} /> {nombreDeUsuario(p)}
                      </label>
                    ))}

                    {personalFiltrados.length === 0 && (
                      <p className="comunicados__hint">No se encontraron docentes ni personal.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="comunicados__empty">{error}</p>}

            <div className="comunicados__form-actions">
              <Button type="button" variant="outline" onClick={() => setCrearOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <Toast
          titulo="Nuevo comunicado"
          detalle={toast.titulo}
          onAccion={() => {
            setPestana("recibidos");
            handleAbrir(toast);
            setToast(null);
          }}
          onCerrar={() => setToast(null)}
        />
      )}

      {imagenAmpliada && (
        <>
          <Overlay onClick={() => setImagenAmpliada(null)} />
          <div className="comunicados__lightbox" onClick={() => setImagenAmpliada(null)}>
            <img
              src={imagenAmpliada}
              alt="Imagen del comunicado"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="comunicados__lightbox-cerrar"
              onClick={(e) => {
                e.stopPropagation();
                setImagenAmpliada(null);
              }}
              aria-label="Cerrar imagen"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}

      {dialogo}
    </section>
  );
}