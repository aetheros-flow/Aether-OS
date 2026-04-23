//src/core/router.tsx

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
import PantallaShell from '../universes/ocio/pantalla/pages/PantallaShell';
import HomeView from '../universes/ocio/pantalla/pages/HomeView';
import MoviesView from '../universes/ocio/pantalla/pages/MoviesView';
import ShowsView from '../universes/ocio/pantalla/pages/ShowsView';
import ProfileView from '../universes/ocio/pantalla/pages/ProfileView';
import TitleDetailView from '../universes/ocio/pantalla/pages/TitleDetailView';
import VideosShell from '../universes/ocio/videos/pages/VideosShell';
import VideosHomeView from '../universes/ocio/videos/pages/HomeView';
import VideosListsView from '../universes/ocio/videos/pages/ListsView';
import VideosListDetailView from '../universes/ocio/videos/pages/ListDetailView';
import VideosWatchedView from '../universes/ocio/videos/pages/WatchedView';
import VideosProfileView from '../universes/ocio/videos/pages/ProfileView';
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
  {
    path: '/ocio/pantalla',
    element: protect(<PantallaShell />),
    children: [
      { index: true,              element: <HomeView /> },
      { path: 'movies',           element: <MoviesView /> },
      { path: 'shows',            element: <ShowsView /> },
      { path: 'profile',          element: <ProfileView /> },
      { path: ':mediaType/:tmdbId', element: <TitleDetailView /> },
    ],
  },
  {
    path: '/ocio/videos',
    element: protect(<VideosShell />),
    children: [
      { index: true,          element: <VideosHomeView /> },
      { path: 'lists',        element: <VideosListsView /> },
      { path: 'list/:listId', element: <VideosListDetailView /> },
      { path: 'watched',      element: <VideosWatchedView /> },
      { path: 'profile',      element: <VideosProfileView /> },
    ],
  },
  { path: '/diagnostics', element: protect(<AetherDiagnostics />) },
]);