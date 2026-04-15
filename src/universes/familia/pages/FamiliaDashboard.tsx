import { Home } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';

export default function FamiliaDashboard() {
  return (
    <UniverseDashboardShell
      color="#C81CDE"
      title="Familia"
      subtitle="Hogar & Raíces"
      headerIcon={Home}
      moduleLabel="tu Universo Familiar"
    />
  );
}
