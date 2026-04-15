import { Gamepad2 } from 'lucide-react';
import UniverseDashboardShell from '../../../core/components/UniverseDashboardShell';

export default function OcioDashboard() {
  return (
    <UniverseDashboardShell
      color="#00E5FF"
      title="Ocio"
      subtitle="Tiempo & Recreación"
      headerIcon={Gamepad2}
      moduleLabel="tu Universo de Ocio"
      lightBg
    />
  );
}
