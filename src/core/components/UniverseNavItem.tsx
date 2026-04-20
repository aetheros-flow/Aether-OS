import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface UniverseNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  /**
   * Color de acento del universo (HEX). Si se pasa, se usa para iluminar
   * el item activo (icono, label, glow lateral). Si no, fallback a blanco.
   */
  accent?: string;
  /** Compatibilidad con la API anterior. Ignorado en el sistema Neo-Dark. */
  lightBg?: boolean;
}

export default function UniverseNavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  accent,
}: UniverseNavItemProps) {
  const accentColor = accent ?? '#FFFFFF';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.96, filter: 'brightness(1.1)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-left overflow-hidden group"
      style={{
        background: isActive
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
        border: isActive
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid transparent',
        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
      }}
    >
      {/* Glow lateral del color del universo cuando está activo */}
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full"
          style={{
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}, 0 0 4px ${accentColor}`,
          }}
        />
      )}

      <Icon
        size={18}
        strokeWidth={isActive ? 2.5 : 2}
        style={{
          flexShrink: 0,
          color: isActive ? accentColor : 'rgba(255,255,255,0.55)',
          filter: isActive ? `drop-shadow(0 0 6px ${accentColor}80)` : 'none',
          transition: 'color 200ms ease, filter 200ms ease',
        }}
      />
      <span
        className="font-sans"
        style={{
          fontSize: 13,
          fontWeight: isActive ? 700 : 500,
          letterSpacing: isActive ? '-0.01em' : '0',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}
