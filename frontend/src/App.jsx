import './App.css';
import Layout from './components/Layout/Layout';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<Navigate to="/dashboard" replace />} />
        <Route path='/dashboard' element={<Dashboard />} />
        {/* <Route path='/servidores' element={<Servidores />} />
        <Route path='/usuarios' element={<Usuarios />} />
        <Route path='/mensajes' element={<Mensajes />} /> */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;