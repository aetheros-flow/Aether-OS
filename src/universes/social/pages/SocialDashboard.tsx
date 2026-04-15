import { Users } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';

export default function SocialDashboard() {
  return (
    <UniverseDashboardShell
      color="#1447E6"
      title="Vida Social"
      subtitle="Comunidad & Entorno"
      headerIcon={Users}
      moduleLabel="tu Universo Social"
    />
  );
}
