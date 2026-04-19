import { useState } from 'react';
import { Hash, Loader2, Calendar, User, RefreshCw, Zap } from 'lucide-react';
import AetherModal from '../../../../core/components/AetherModal';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import {
  getNumerologyProfile, NUMBER_MEANINGS,
  getPersonalYearNumber, getPersonalDayNumber,
} from '../../lib/numerologyEngine';
import type { UserBirthData } from '../../types';

const ACCENT = '#7c3aed';

const NUMBER_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16',
  5: '#06b6d4', 6: '#3b82f6', 7: '#8b5cf6', 8: '#ec4899',
  9: '#6366f1', 11: '#fbbf24', 22: '#34d399', 33: '#f472b6',
};

export default function DPNumerologia() {
  const { birthData, saveBirthData } = useDesarrolloPersonalData();

  const [isSetupOpen,  setIsSetupOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);
  const [form, setForm] = useState<Omit<UserBirthData, 'id' | 'user_id' | 'created_at'>>({
    birth_date: '', birth_time: '', birth_city: '', birth_latitude: null, birth_longitude: null,
    birth_timezone: 'America/Argentina/Buenos_Aires', full_name: '',
  });

  const handleSetup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await saveBirthData(form);
      setIsSetupOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSetup = () => {
    if (birthData) {
      setForm({
        birth_date:      birthData.birth_date,
        birth_time:      birthData.birth_time ?? '',
        birth_city:      birthData.birth_city ?? '',
        birth_latitude:  birthData.birth_latitude,
        birth_longitude: birthData.birth_longitude,
        birth_timezone:  birthData.birth_timezone ?? 'America/Argentina/Buenos_Aires',
        full_name:       birthData.full_name,
      });
    }
    setIsSetupOpen(true);
  };

  /* ─── NO BIRTH DATA ── */
  if (!birthData?.birth_date || !birthData?.full_name) {
    return (
      <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-lg mx-auto mt-10">
          <div className="rounded-[32px] p-10 text-center text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 100%)' }}>
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Hash size={36} className="text-amber-300" />
            </div>
            <h2 className="font-serif text-3xl font-bold mb-3">Numerología</h2>
            <p className="text-white/60 text-sm mb-8">
              Ingresá tu nombre completo y fecha de nacimiento para calcular tu perfil numerológico completo.
            </p>
            <button onClick={openSetup} className="px-10 py-4 bg-white text-[#2d1b69] rounded-full text-[11px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
              Activar Numerología
            </button>
          </div>
        </div>
        <NumerologySetupModal isOpen={isSetupOpen} form={form} setForm={setForm} formError={formError} isSubmitting={isSubmitting} onSubmit={handleSetup} onClose={() => setIsSetupOpen(false)} />
      </div>
    );
  }

  /* ─── WITH DATA ── */
  const profile = getNumerologyProfile(birthData.birth_date, birthData.full_name);
  const today = new Date();
  const personalYear = getPersonalYearNumber(birthData.birth_date, today.getFullYear());
  const personalDay  = getPersonalDayNumber(birthData.birth_date, today);

  const mainNumbers = [
    { key: 'lifePath',   label: 'Camino de Vida',   value: profile.lifePathNumber,   desc: 'Tu misión fundamental' },
    { key: 'expression', label: 'Expresión',         value: profile.expressionNumber, desc: 'Cómo te manifiestas' },
    { key: 'soulUrge',   label: 'Impulso del Alma',  value: profile.soulUrgeNumber,   desc: 'Tu deseo más profundo' },
  ];

  const cyclicalNumbers = [
    { label: 'Año Personal',  value: personalYear,          period: String(today.getFullYear()) },
    { label: 'Día Personal',  value: personalDay,           period: today.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#7c3aed] mb-1">NUMEROLOGÍA PITAGÓRICA</p>
          <h2 className="font-serif text-3xl font-bold text-[#1c0b3a]">Tu Código Numérico</h2>
        </div>
        <button onClick={openSetup} className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide border border-purple-200 text-[#7c3aed] hover:bg-purple-50 transition-all">
          <RefreshCw size={12} /> Editar datos
        </button>
      </div>

      {/* LIFE PATH HERO */}
      {(() => {
        const m = NUMBER_MEANINGS[profile.lifePathNumber];
        return m ? (
          <div className="rounded-[32px] p-8 md:p-10 text-white shadow-2xl" style={{ background: `linear-gradient(135deg, #1c0b3a 0%, ${NUMBER_COLORS[profile.lifePathNumber] ?? ACCENT}88 100%)` }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-2">Número de Camino de Vida</p>
            <div className="flex items-baseline gap-4">
              <span className="font-black text-7xl" style={{ color: NUMBER_COLORS[profile.lifePathNumber] ?? '#fff' }}>{profile.lifePathNumber}</span>
              <div>
                <h3 className="font-serif text-3xl font-bold">{m.title}</h3>
                {m.isMaster && <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-300/20 px-3 py-1 rounded-full">Master Number</span>}
              </div>
            </div>
            <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-xl">{m.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {m.keywords.map(kw => (
                <span key={kw} className="px-3 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-wide">{kw}</span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 mb-1">Sombra</p>
              <p className="text-sm text-white/60 italic">{m.shadow}</p>
            </div>
          </div>
        ) : null;
      })()}

      {/* MAIN NUMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mainNumbers.map(n => {
          const meaning = NUMBER_MEANINGS[n.value];
          return (
            <div key={n.key} className="aether-card p-6">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8A8681] mb-3">{n.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black" style={{ color: NUMBER_COLORS[n.value] ?? ACCENT }}>{n.value}</span>
                {meaning?.isMaster && <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">MASTER</span>}
              </div>
              {meaning && (
                <>
                  <p className="font-serif text-lg font-bold text-[#1c0b3a] mb-1">{meaning.title}</p>
                  <p className="text-[11px] text-[#8A8681]">{n.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {meaning.keywords.map(kw => (
                      <span key={kw} className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: (NUMBER_COLORS[n.value] ?? ACCENT) + '18', color: NUMBER_COLORS[n.value] ?? ACCENT }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* CYCLICAL NUMBERS */}
      <div className="aether-card p-8">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed] mb-6">Números Cíclicos</p>
        <div className="grid grid-cols-2 gap-6">
          {cyclicalNumbers.map(n => {
            const meaning = NUMBER_MEANINGS[n.value];
            return (
              <div key={n.label} className="rounded-2xl p-5" style={{ backgroundColor: (NUMBER_COLORS[n.value] ?? ACCENT) + '10' }}>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8A8681] mb-1">{n.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black" style={{ color: NUMBER_COLORS[n.value] ?? ACCENT }}>{n.value}</span>
                  <span className="text-xs font-bold text-[#8A8681]">{n.period}</span>
                </div>
                {meaning && <p className="text-sm font-bold text-[#1c0b3a] mt-1">{meaning.title}</p>}
                {n.label === 'Año Personal' && meaning && (
                  <p className="text-[11px] text-[#8A8681] mt-1 leading-relaxed">{meaning.description.substring(0, 80)}…</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SHADOW WORK */}
      <div className="aether-card p-8 border-l-4" style={{ borderLeftColor: ACCENT }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} style={{ color: ACCENT }} />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed]">Shadow Work del {today.getFullYear()}</p>
        </div>
        <p className="text-sm text-[#8A8681] leading-relaxed">
          {NUMBER_MEANINGS[personalYear]?.shadow ?? 'Explorá las tendencias desafiantes de tu año personal para crecer con consciencia.'}
        </p>
      </div>

      {/* DATA ROW */}
      <div className="flex items-center gap-4 text-xs text-[#8A8681]">
        <User size={12} /> {birthData.full_name}
        <Calendar size={12} className="ml-2" /> {new Date(birthData.birth_date + 'T12:00:00').toLocaleDateString('es-AR')}
      </div>

      <NumerologySetupModal isOpen={isSetupOpen} form={form} setForm={setForm} formError={formError} isSubmitting={isSubmitting} onSubmit={handleSetup} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
}

function NumerologySetupModal({ isOpen, form, setForm, formError, isSubmitting, onSubmit, onClose }: {
  isOpen: boolean; form: any; setForm: (f: any) => void;
  formError: string | null; isSubmitting: boolean;
  onSubmit: (e: { preventDefault(): void }) => void; onClose: () => void;
}) {
  return (
    <AetherModal isOpen={isOpen} onClose={onClose} title="Datos Numerológicos">
      {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="aether-eyebrow">Nombre completo de nacimiento</label>
          <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nombre tal como figura en tu DNI/partida" className="aether-input" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="aether-eyebrow">Fecha de nacimiento</label>
          <input type="date" required value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className="aether-input" />
        </div>
        <p className="text-xs text-[#8A8681] bg-purple-50 px-4 py-3 rounded-xl">
          El nombre completo al nacer es fundamental en numerología. Usá el nombre legal completo, incluyendo apellidos.
        </p>
        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-xl disabled:opacity-60" style={{ backgroundColor: '#7c3aed' }}>
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Calcular perfil'}
          </button>
        </div>
      </form>
    </AetherModal>
  );
}
