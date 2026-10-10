import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Servidores from "./pages/Servidores/servidores";
import Canales from "./pages/Canales/Canales";
import Usuarios from "./pages/Usuarios/Usuarios";
import Miembros from "./pages/Miembros/Miembros";
//import Usuarios from "./pages/Usuarios/Usuarios";
import Mensajes from "./pages/Mensajes/Mensajes";
import Calendario from "./pages/Calendario/Calendario";
import Comunicados from "./pages/Comunicados/Comunicados";
//import Perfil from "./pages/Perfil/Perfil";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/miembros" element={<Layout><Miembros /></Layout>} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/calendario" element={<Layout><Calendario /></Layout>} />
      <Route path="/servidores" element={<Layout><Servidores /></Layout>} />
      <Route path="/canales" element={<Layout><Canales /></Layout>} />
      <Route path="/usuarios" element={<Layout><Usuarios /></Layout>} />
      <Route path="/mensajes" element={<Layout><Mensajes /></Layout>} />
      <Route path="/comunicados" element={<Layout><Comunicados /></Layout>} />
      {/*<Route path="/perfil" element={<Layout><Perfil /></Layout>} />*/}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}