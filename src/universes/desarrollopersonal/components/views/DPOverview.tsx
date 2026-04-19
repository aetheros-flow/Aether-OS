import { Zap, Target, BookOpen, TrendingUp, Stars, Hash } from 'lucide-react';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import { getSunSign, getMoonPhase } from '../../lib/astrologyEngine';
import { getLifePathNumber, NUMBER_MEANINGS } from '../../lib/numerologyEngine';

const ACCENT = '#7c3aed';

export default function DPOverview() {
  const { skills, ikigaiLogs, birthData } = useDesarrolloPersonalData();

  const avgSkillLevel = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.current_level, 0) / skills.length * 10) / 10
    : 0;

  const ikigaiScore = ikigaiLogs.length > 0
    ? Math.round((ikigaiLogs.slice(0, 7).reduce((sum, l) => {
        return sum + [l.love_it, l.good_at_it, l.world_needs_it, l.paid_for_it].filter(Boolean).length;
      }, 0) / (7 * 4)) * 100)
    : 0;

  const moonData   = getMoonPhase();
  const sunSign    = birthData ? getSunSign(birthData.birth_date) : null;
  const lifePathN  = birthData ? getLifePathNumber(birthData.birth_date) : null;
  const lifeMeaning = lifePathN ? NUMBER_MEANINGS[lifePathN] : null;

  const kpis = [
    { label: 'Skills activos',    value: skills.length,    unit: '',      icon: Zap,      color: '#7c3aed' },
    { label: 'Avg. Mastery',      value: avgSkillLevel,    unit: '/10',   icon: TrendingUp, color: '#4f46e5' },
    { label: 'Ikigai Alignment',  value: ikigaiScore,      unit: '%',     icon: Target,   color: '#059669' },
    { label: 'Journal Entries',   value: 0,                unit: '',      icon: BookOpen,  color: '#f59e0b' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HERO */}
      <div className="rounded-[32px] p-8 md:p-10 text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 60%, #4f46e5 100%)' }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/60 mb-3">MÓDULO</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">Human<br />Potential</h2>
        <p className="text-white/60 text-sm max-w-md">
          Trackeá tu evolución en skills, propósito, hábitos y conciencia cósmica. Tu mejor versión es un sistema.
        </p>
        {sunSign && (
          <div className="mt-6 flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3 w-fit">
            <Stars size={16} className="text-amber-300" />
            <span className="text-sm font-bold">{sunSign} · {moonData.phase}</span>
          </div>
        )}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="aether-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: kpi.color + '18' }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-3xl font-black text-[#1c0b3a]">{kpi.value}<span className="text-base font-semibold text-[#8A8681]">{kpi.unit}</span></p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8681] mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* LIFE PATH CARD */}
      {lifePathN && lifeMeaning ? (
        <div className="aether-card p-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {lifePathN}
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed] mb-1">Número de Camino de Vida</p>
              <h3 className="font-serif text-2xl font-bold text-[#1c0b3a] mb-2">{lifeMeaning.title}</h3>
              <p className="text-sm text-[#8A8681] leading-relaxed">{lifeMeaning.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {lifeMeaning.keywords.map(kw => (
                  <span key={kw} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="aether-card p-8 border-2 border-dashed border-purple-200 flex flex-col items-center text-center gap-3">
          <Hash size={32} className="text-purple-300" />
          <h3 className="font-serif text-xl font-bold text-[#1c0b3a]">Activá tu Perfil Cósmico</h3>
          <p className="text-sm text-[#8A8681]">Ingresá tu fecha de nacimiento en las secciones <strong>Cosmos</strong> y <strong>Numerología</strong> para ver tu número de vida, carta natal y más.</p>
        </div>
      )}

      {/* RECENT SKILLS */}
      {skills.length > 0 && (
        <div className="aether-card p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed] mb-6">Top Skills en Progreso</p>
          <div className="space-y-4">
            {skills.slice(0, 4).map(skill => (
              <div key={skill.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-bold text-[#1c0b3a] truncate">{skill.skill_name}</span>
                    <span className="text-xs font-bold text-[#7c3aed] shrink-0 ml-2">{skill.current_level}/{skill.target_level}</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(skill.current_level / skill.target_level) * 100}%`, background: 'linear-gradient(to right, #7c3aed, #818cf8)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
