import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UniverseData {
  id: string;
  name: string;
  description: string;
  value: number;       // 0-10
  path: string;
  icon: ReactNode;
  imageUrl: string;
  color: string;       // hex accent — universe identity
  textColorClass: string;
  bgIconClass: string;
  glowClass: string;
}

interface UniverseCardProps {
  universe: UniverseData;
}

export default function UniverseCard({ universe }: UniverseCardProps) {
  const navigate = useNavigate();
  const pct = Math.max(0, Math.min(100, universe.value * 10));
  const accent = universe.color;

  return (
    <button
      type="button"
      onClick={() => navigate(universe.path)}
      className="group w-full flex items-center gap-4 p-2 pr-4 rounded-xl text-left transition-all duration-300 active:scale-[0.99]"
      style={{
        background: 'rgba(33,30,39,0.30)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(33,30,39,0.60)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(33,30,39,0.30)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
      }}
    >
      {/* Thumbnail with gradient + colored glow */}
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden relative">
        <img
          src={universe.imageUrl}
          alt={universe.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 100%, ${accent}33 0%, transparent 70%)` }}
        />
      </div>

      {/* Title + one-line description */}
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <h3
          className="font-sans text-[18px] md:text-[20px] font-semibold tracking-tight leading-tight truncate"
          style={{ color: accent }}
        >
          {universe.name}
        </h3>
        <p className="text-[13px] leading-snug text-white/55 line-clamp-1">
          {universe.description}
        </p>
      </div>

      {/* Percentage + mini progress bar — keeps universe color */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums"
          style={{ color: accent }}
        >
          {pct.toFixed(0)}%
        </span>
        <div
          className="w-12 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: accent,
              boxShadow: `0 0 8px ${accent}80`,
            }}
          />
        </div>
      </div>
    </button>
  );
}
