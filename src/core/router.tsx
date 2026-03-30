import { createBrowserRouter } from 'react-router-dom';
import DashboardPage from '../universes/base/pages/DashboardPage';
import DineroDashboard from '../universes/dinero/pages/DineroDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/dinero',
    element: <DineroDashboard />,
  }
]);