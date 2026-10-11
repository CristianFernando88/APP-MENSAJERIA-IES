import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import RequireAuth from "./components/RequireAuth/RequireAuth";
import Dashboard from "./pages/Dashboard/Dashboard";
import Servidores from "./pages/Servidores/Servidores";
import Canales from "./pages/Canales/Canales";
import Categorias from "./pages/Categorias/Categorias.";
import Usuarios from "./pages/Usuarios/Usuarios";
import Mensajes from "./pages/Mensajes/Mensajes";
import Calendario from "./pages/Calendario/Calendario";
// import Tareas from "./pages/Tareas/Tareas";
import Comunicados from "./pages/Comunicados/Comunicados";
// import Perfil from "./pages/Perfil/Perfil";
import Miembros from "./pages/Miembros/Miembros";
import PanelAdmin from "./pages/PanelAdmin/PanelAdmin";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/calendario" element={<RequireAuth><Layout><Calendario /></Layout></RequireAuth>} />
      {/* <Route path="/tareas" element={<RequireAuth><Layout><Tareas /></Layout></RequireAuth>} />*/}
      <Route path="/servidores" element={<RequireAuth><Layout><Servidores /></Layout></RequireAuth>} />
      <Route path="/categorias" element={<RequireAuth><Layout><Categorias /></Layout></RequireAuth>} />
      <Route path="/canales" element={<RequireAuth><Layout><Canales /></Layout></RequireAuth>} />
      <Route path="/usuarios" element={<RequireAuth><Layout><Usuarios /></Layout></RequireAuth>} />
      <Route path="/miembros" element={<RequireAuth><Layout><Miembros /></Layout></RequireAuth>} />
      <Route path="/mensajes" element={<RequireAuth><Layout><Mensajes /></Layout></RequireAuth>} />
      <Route path="/comunicados" element={<RequireAuth><Layout><Comunicados /></Layout></RequireAuth>} />
     {/* <Route path="/perfil" element={<RequireAuth><Layout><Perfil /></Layout></RequireAuth>} />*/}
      <Route path="/admin" element={<RequireAuth><Layout><PanelAdmin /></Layout></RequireAuth>} />

      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}