import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import RequireAuth from "./components/RequireAuth/RequireAuth";
import { NotificacionesProvider } from "./context/NotificacionesContext"; // NUEVO
import Dashboard from "./pages/Dashboard/Dashboard";
import Servidores from "./pages/Servidores/servidores.jsx";
import Canales from "./pages/Canales/Canales";
import Categorias from "./pages/Categorias/Categorias";
import Usuarios from "./pages/Usuarios/Usuarios";
import Mensajes from "./pages/Mensajes/Mensajes";
import Calendario from "./pages/Calendario/Calendario";
import Comunicados from "./pages/Comunicados/Comunicados";
import Perfil from "./pages/Perfil/Perfil";
import Miembros from "./pages/Miembros/Miembros";
import PanelAdmin from "./pages/PanelAdmin/PanelAdmin";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound/NotFound";
import NoAutorizado from "./pages/NoAutorizado/NoAutorizado";

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas - Todos los usuarios logueados */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <NotificacionesProvider>
              <Layout>
                <Dashboard />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/calendario"
        element={
          <RequireAuth>
            <NotificacionesProvider>
              <Layout>
                <Calendario />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/mensajes"
        element={
          <RequireAuth>
            <NotificacionesProvider>
              <Layout>
                <Mensajes />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/comunicados"
        element={
          <RequireAuth>
            <NotificacionesProvider>
              <Layout>
                <Comunicados />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/perfil"
        element={
          <RequireAuth>
            <NotificacionesProvider>
              <Layout>
                <Perfil />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />

      {/* Rutas protegidas por rol */}
      <Route
        path="/servidores"
        element={
          <RequireAuth roles={["admin", "super_admin", "director"]}>
            <NotificacionesProvider>
              <Layout>
                <Servidores />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/categorias"
        element={
          <RequireAuth roles={["admin", "super_admin", "director"]}>
            <NotificacionesProvider>
              <Layout>
                <Categorias />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/canales"
        element={
          <RequireAuth roles={["admin", "super_admin", "director", "profesor"]}>
            <NotificacionesProvider>
              <Layout>
                <Canales />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/miembros"
        element={
          <RequireAuth roles={["admin", "super_admin", "director", "profesor"]}>
            <NotificacionesProvider>
              <Layout>
                <Miembros />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RequireAuth roles={["admin", "super_admin"]}>
            <NotificacionesProvider>
              <Layout>
                <Usuarios />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth roles={["admin", "super_admin"]}>
            <NotificacionesProvider>
              <Layout>
                <PanelAdmin />
              </Layout>
            </NotificacionesProvider>
          </RequireAuth>
        }
      />

      {/* Página 403 */}
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <NotificacionesProvider>
            <Layout>
              <NotFound />
            </Layout>
          </NotificacionesProvider>
        }
      />
    </Routes>
  );
}