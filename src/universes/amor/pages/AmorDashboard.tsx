import { Heart } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';

export default function AmorDashboard() {
  return (
    <UniverseDashboardShell
      color="#FF0040"
      title="Vida Amorosa"
      subtitle="Conexión & Relaciones"
      headerIcon={Heart}
      moduleLabel="tu Universo Amoroso"
    />
  );
}
