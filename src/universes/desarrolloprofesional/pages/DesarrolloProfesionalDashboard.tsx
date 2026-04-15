import { Briefcase } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';

export default function DesarrolloProfesionalDashboard() {
  return (
    <UniverseDashboardShell
      color="#FFD700"
      title="Profesional"
      subtitle="Carrera & Propósito"
      headerIcon={Briefcase}
      moduleLabel="tu Desarrollo Profesional"
      lightBg
    />
  );
}
