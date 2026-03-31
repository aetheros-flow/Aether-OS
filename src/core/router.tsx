import { createBrowserRouter } from 'react-router-dom';
import DashboardPage from '../universes/base/pages/DashboardPage';
import DineroDashboard from '../universes/dinero/pages/DineroDashboard';
import LoginPage from './pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/dinero',
    element: <DineroDashboard />,
  }
]);