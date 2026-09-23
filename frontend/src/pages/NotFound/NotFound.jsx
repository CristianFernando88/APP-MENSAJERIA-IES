import { Link } from 'react-router-dom';
function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>404 - Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}

export default NotFound;