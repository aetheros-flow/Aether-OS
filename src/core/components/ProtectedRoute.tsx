import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // El AuthProvider ya maneja el loading globalmente y muestra un spinner.
  // Sin embargo, por si acaso, podemos prevenir el renderizado si aún está cargando.
  if (loading) return null;

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
