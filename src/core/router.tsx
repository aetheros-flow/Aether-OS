import { createBrowserRouter } from 'react-router-dom';
import AetherDiagnostics from '../universes/base/pages/AetherDiagnostics'; // <-- Agregá esto arriba
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

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  { path: '/', element: <DashboardPage /> },
  { path: '/dinero', element: <DineroDashboard /> },
  { path: '/salud', element: <SaludDashboard /> },
  { path: '/amor', element: <AmorDashboard /> },
  { path: '/desarrollopersonal', element: <DesarrolloPersonalDashboard /> },
  { path: '/desarrolloprofesional', element: <DesarrolloProfesionalDashboard /> },
  { path: '/social', element: <SocialDashboard /> },
  { path: '/familia', element: <FamiliaDashboard /> },
  { path: '/ocio', element: <OcioDashboard /> },
  // ... tus otras rutas
  { path: '/diagnostics', element: <AetherDiagnostics /> },
]);