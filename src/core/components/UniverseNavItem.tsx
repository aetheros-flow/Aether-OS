import type { LucideIcon } from 'lucide-react';

interface UniverseNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  /** true cuando el fondo del universo es claro (Ocio, Des. Prof.) */
  lightBg?: boolean;
}

export default function UniverseNavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  lightBg = false,
}: UniverseNavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.97] text-left"
      style={{
        background: isActive
          ? (lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)')
          : 'transparent',
        boxShadow: isActive
          ? `inset 3px 0 0 ${lightBg ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)'}`
          : 'none',
        color: isActive
          ? (lightBg ? '#1A1A2E' : '#FFFFFF')
          : (lightBg ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.46)'),
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = lightBg
            ? 'rgba(0,0,0,0.07)'
            : 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLButtonElement).style.color = lightBg
            ? 'rgba(0,0,0,0.75)'
            : 'rgba(255,255,255,0.75)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = lightBg
            ? 'rgba(0,0,0,0.48)'
            : 'rgba(255,255,255,0.46)';
        }
      }}
    >
      <Icon
        size={18}
        strokeWidth={isActive ? 2.5 : 2}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 700 : 500,
          letterSpacing: isActive ? '-0.01em' : '0',
        }}
      >
        {label}
      </span>
    </button>
  );
}
