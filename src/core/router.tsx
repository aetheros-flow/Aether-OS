import { createBrowserRouter } from 'react-router-dom';
import AetherDiagnostics from '../universes/base/pages/AetherDiagnostics';
import DashboardPage from '../universes/base/pages/DashboardPage';
import DineroDashboard from '../universes/dinero/pages/DineroDashboard';
import SaludDashboard from '../universes/salud/pages/SaludDashboard';
import AmorDashboard from '../universes/amor/pages/AmorDashboard';
import DesarrolloPersonalDashboard from '../universes/desarrollopersonal/pages/DesarrolloPersonalDashboard';
import DesarrolloProfesionalDashboard from '../universes/desarrolloprofesional/pages/DesarrolloProfesionalDashboard';
import SocialDashboard from '../universes/social/pages/SocialDashboard';
import FamiliaDashboard from '../universes/familia/pages/FamiliaDashboard';
import OcioDashboard from '../universes/ocio/pages/OcioDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

const protect = (element: React.ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  { path: '/', element: protect(<DashboardPage />) },
  { path: '/dinero', element: protect(<DineroDashboard />) },
  { path: '/salud', element: protect(<SaludDashboard />) },
  { path: '/amor', element: protect(<AmorDashboard />) },
  { path: '/desarrollopersonal', element: protect(<DesarrolloPersonalDashboard />) },
  { path: '/desarrolloprofesional', element: protect(<DesarrolloProfesionalDashboard />) },
  { path: '/social', element: protect(<SocialDashboard />) },
  { path: '/familia', element: protect(<FamiliaDashboard />) },
  { path: '/ocio', element: protect(<OcioDashboard />) },
  { path: '/diagnostics', element: protect(<AetherDiagnostics />) },
]);