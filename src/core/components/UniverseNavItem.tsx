import type { LucideIcon } from 'lucide-react';

interface UniverseNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  /** true cuando el fondo del universo es claro (Ocio, Des. Prof.) */
  lightBg?: boolean;
}

export default function UniverseNavItem({ icon: Icon, label, isActive, onClick, lightBg = false }: UniverseNavItemProps) {
  const activeBg   = lightBg ? 'bg-black/15' : 'bg-white/20';
  const hoverBg    = lightBg ? 'hover:bg-black/10' : 'hover:bg-white/10';
  const textColor  = lightBg ? '#2D2A26' : '#FFFFFF';
  const mutedColor = lightBg ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-2xl transition-all duration-300 active:scale-95 ${isActive ? activeBg : hoverBg}`}
      style={{ color: isActive ? textColor : mutedColor }}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ color: textColor }} />
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </button>
  );
}
