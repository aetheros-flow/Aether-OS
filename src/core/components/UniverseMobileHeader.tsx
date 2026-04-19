import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UniverseMobileHeaderProps {
  title: string;
  subtitle?: string;
  /** Universe identity color (hex) */
  color?: string;
  /** Text + icon color — defaults to white; use dark hex for light-bg universes */
  textColor?: string;
  /** Optional right-side slot (e.g. a CTA button) */
  rightSlot?: React.ReactNode;
}

export default function UniverseMobileHeader({
  title,
  subtitle,
  color = '#1447E6',
  textColor = '#ffffff',
  rightSlot,
}: UniverseMobileHeaderProps) {
  const navigate = useNavigate();

  const isDark = textColor === '#ffffff' || textColor === '#fff';
  const btnBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.42)';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center gap-3 px-4"
      style={{
        height: 56,
        background: color,
        boxShadow: '0 1px 0 rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center justify-center rounded-full transition-all active:scale-90"
        style={{
          width: 36,
          height: 36,
          backgroundColor: btnBg,
          color: textColor,
          flexShrink: 0,
        }}
        aria-label="Volver al inicio"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {subtitle && (
          <p
            className="leading-none mb-0.5 truncate"
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: subtitleColor,
            }}
          >
            {subtitle}
          </p>
        )}
        <h1
          className="font-black truncate leading-none"
          style={{ fontSize: 15, color: textColor, letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div className="flex items-center" style={{ flexShrink: 0 }}>
          {rightSlot}
        </div>
      )}
    </header>
  );
}
