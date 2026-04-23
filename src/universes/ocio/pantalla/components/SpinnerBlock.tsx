import { Loader2 } from 'lucide-react';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';

export default function SpinnerBlock({ size = 32 }: { size?: number }) {
  return (
    <div className="w-full flex items-center justify-center py-8">
      <Loader2 size={size} className="animate-spin" style={{ color: PANTALLA_ACCENT }} />
    </div>
  );
}
