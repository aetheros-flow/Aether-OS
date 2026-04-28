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
  color: string;       // hex accent
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

  return (
    <article
      onClick={() => navigate(universe.path)}
      className="glass-panel rounded-2xl overflow-hidden relative group flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-1.5 active:scale-[0.98]"
      style={{
        minHeight: 380,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 4px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={universe.imageUrl}
          alt={universe.name}
          className="w-full h-full object-cover opacity-35 mix-blend-screen group-hover:opacity-52 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15121b] via-[#15121b]/75 to-transparent" />
        {/* Colored glow at center on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: `radial-gradient(circle at 50% 80%, ${universe.color}18 0%, transparent 65%)` }}
        />
      </div>

      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* Icon badge — top left only, no menu button */}
        <header className="flex items-start mb-auto">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md"
            style={{ background: `${universe.color}1A` }}
          >
            <span style={{ color: universe.color }}>{universe.icon}</span>
          </div>
        </header>

        {/* Bottom content */}
        <div className="mt-8">
          <h3
            className="font-sans text-[22px] font-bold tracking-tight leading-tight mb-1.5"
            style={{ color: universe.color }}
          >
            {universe.name}
          </h3>
          <p className="text-[13px] leading-relaxed text-white/50 mb-5 line-clamp-2">
            {universe.description}
          </p>

          {/* Alignment bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">
                Alignment
              </span>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: universe.color }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${universe.color}80, ${universe.color})`,
                  boxShadow: `0 0 8px ${universe.color}60`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
