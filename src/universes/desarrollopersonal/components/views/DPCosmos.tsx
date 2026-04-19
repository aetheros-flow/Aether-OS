import { useState, useEffect } from 'react';
import { Stars, MapPin, Clock, Calendar, Loader2, RefreshCw, Sparkles, Moon, Sun, Zap } from 'lucide-react';
import AetherModal from '../../../../core/components/AetherModal';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import {
  getSunSign, getMoonPhase, getDailyInsight,
  type BirthData, type AstroInsight,
} from '../../lib/astrologyEngine';
import type { UserBirthData } from '../../types';

const ACCENT = '#7c3aed';

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const SIGN_ELEMENTS: Record<string, { element: string; color: string }> = {
  Aries: { element: 'Fuego', color: '#ef4444' }, Leo: { element: 'Fuego', color: '#ef4444' }, Sagittarius: { element: 'Fuego', color: '#ef4444' },
  Taurus: { element: 'Tierra', color: '#84cc16' }, Virgo: { element: 'Tierra', color: '#84cc16' }, Capricorn: { element: 'Tierra', color: '#84cc16' },
  Gemini: { element: 'Aire', color: '#38bdf8' }, Libra: { element: 'Aire', color: '#38bdf8' }, Aquarius: { element: 'Aire', color: '#38bdf8' },
  Cancer: { element: 'Agua', color: '#818cf8' }, Scorpio: { element: 'Agua', color: '#818cf8' }, Pisces: { element: 'Agua', color: '#818cf8' },
};

// Año actual para carta solar
const CURRENT_YEAR = new Date().getFullYear();

// Temas del año por signo solar (carta astral anual simplificada)
const ANNUAL_THEMES: Record<string, { theme: string; focus: string; challenge: string }> = {
  Aries:       { theme: 'Liderazgo & Nueva Identidad', focus: 'Iniciar proyectos propios con audacia', challenge: 'Aprender a escuchar antes de actuar' },
  Taurus:      { theme: 'Recursos & Estabilidad', focus: 'Consolidar ingresos y relaciones duraderas', challenge: 'Resistencia al cambio necesario' },
  Gemini:      { theme: 'Comunicación & Aprendizaje', focus: 'Expandir red de contactos y conocimiento', challenge: 'Dispersión de energía en demasiados frentes' },
  Cancer:      { theme: 'Hogar & Raíces Emocionales', focus: 'Profundizar vínculos y crear espacios seguros', challenge: 'Soltar el pasado para avanzar' },
  Leo:         { theme: 'Creatividad & Expresión', focus: 'Brillar con autenticidad en proyectos creativos', challenge: 'Ego vs. colaboración genuina' },
  Virgo:       { theme: 'Salud & Servicio', focus: 'Optimizar rutinas y sistemas de vida', challenge: 'Perfeccionismo que paraliza la acción' },
  Libra:       { theme: 'Relaciones & Equilibrio', focus: 'Crear alianzas estratégicas y belleza', challenge: 'Indecisión ante bifurcaciones importantes' },
  Scorpio:     { theme: 'Transformación & Poder', focus: 'Soltar lo que ya no sirve para renacer', challenge: 'Resistencia a la vulnerabilidad' },
  Sagittarius: { theme: 'Expansión & Filosofía', focus: 'Viajes, estudios y nuevas visiones del mundo', challenge: 'Exageración y falta de seguimiento' },
  Capricorn:   { theme: 'Ambición & Estructura', focus: 'Construir legado y autoridad profesional', challenge: 'Aislamiento emocional por enfocarse en metas' },
  Aquarius:    { theme: 'Innovación & Comunidad', focus: 'Proyectos que impactan colectivos', challenge: 'Desconexión emocional de lo individual' },
  Pisces:      { theme: 'Espiritualidad & Intuición', focus: 'Creatividad, meditación y consciencia expandida', challenge: 'Escape de responsabilidades concretas' },
};

type HoroscopeData = {
  date_range: string;
  current_date: string;
  description: string;
  compatibility: string;
  color: string;
  lucky_number: string;
  lucky_time: string;
  mood: string;
} | null;

export default function DPCosmos() {
  const { birthData, saveBirthData } = useDesarrolloPersonalData();

  const [isSetupOpen,  setIsSetupOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);
  const [horoscope,    setHoroscope]    = useState<HoroscopeData>(null);
  const [loadingHoro,  setLoadingHoro]  = useState(false);
  const [insight,      setInsight]      = useState<AstroInsight | null>(null);

  const [form, setForm] = useState<Omit<UserBirthData, 'id' | 'user_id' | 'created_at'>>({
    birth_date: '',
    birth_time: '',
    birth_city: '',
    birth_latitude: null,
    birth_longitude: null,
    birth_timezone: 'America/Argentina/Buenos_Aires',
    full_name: '',
  });

  // Calcular insight cuando tenemos birth data
  useEffect(() => {
    if (birthData?.birth_date) {
      const bd: BirthData = {
        date: birthData.birth_date,
        time: birthData.birth_time ?? '12:00',
        latitude: birthData.birth_latitude ?? -34.6,
        longitude: birthData.birth_longitude ?? -58.4,
        timezone: birthData.birth_timezone ?? 'America/Argentina/Buenos_Aires',
        city: birthData.birth_city ?? '',
      };
      setInsight(getDailyInsight(bd));
    }
  }, [birthData]);

  // Llamar a la API de horóscopo (aztro — free, no key)
  const fetchHoroscope = async (sign: string) => {
    setLoadingHoro(true);
    try {
      const res = await fetch(`https://aztro.sameerkumar.website/?sign=${sign.toLowerCase()}&day=today`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setHoroscope(data);
    } catch {
      // Silently fail — show client-side insight instead
      setHoroscope(null);
    } finally {
      setLoadingHoro(false);
    }
  };

  const sunSign      = birthData ? getSunSign(birthData.birth_date) : null;
  const moonData     = getMoonPhase();
  const signInfo     = sunSign ? SIGN_ELEMENTS[sunSign] : null;
  const annualTheme  = sunSign ? ANNUAL_THEMES[sunSign] : null;

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

  // Prefill form from existing birth data
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

  /* ─── NO BIRTH DATA ──────────────────────────────────────────────── */
  if (!birthData) {
    return (
      <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-lg mx-auto mt-10">
          <div className="rounded-[32px] p-10 text-center text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 100%)' }}>
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Stars size={36} className="text-amber-300" />
            </div>
            <h2 className="font-serif text-3xl font-bold mb-3">Carta Natal</h2>
            <p className="text-white/60 text-sm mb-8">
              Ingresá tu fecha de nacimiento para activar tu carta natal, la carta astral anual y los tránsitos del día.
            </p>
            <button
              onClick={openSetup}
              className="px-10 py-4 bg-white text-[#2d1b69] rounded-full text-[11px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Configurar perfil cósmico
            </button>
          </div>
        </div>
        <SetupModal isOpen={isSetupOpen} form={form} setForm={setForm} formError={formError} isSubmitting={isSubmitting} onSubmit={handleSetup} onClose={() => setIsSetupOpen(false)} />
      </div>
    );
  }

  /* ─── WITH BIRTH DATA ─────────────────────────────────────────────── */
  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#7c3aed] mb-1">COSMOS</p>
          <h2 className="font-serif text-3xl font-bold text-[#1c0b3a]">Tu Carta Natal</h2>
        </div>
        <button onClick={openSetup} className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide border border-purple-200 text-[#7c3aed] hover:bg-purple-50 transition-all">
          <MapPin size={12} /> Editar datos
        </button>
      </div>

      {/* SUN SIGN HERO */}
      <div className="rounded-[32px] p-8 text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 60%, #4f46e5 100%)' }}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-1">Signo Solar</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl">{SIGN_SYMBOLS[sunSign!] ?? '✦'}</span>
              <div>
                <h3 className="font-serif text-4xl font-bold">{sunSign}</h3>
                {signInfo && (
                  <span className="text-sm font-bold" style={{ color: signInfo.color }}>Elemento {signInfo.element}</span>
                )}
              </div>
            </div>
            {birthData.birth_date && (
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1.5">
                <Calendar size={10} /> {new Date(birthData.birth_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {birthData.birth_time && <><Clock size={10} className="ml-2" /> {birthData.birth_time}</>}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-1">Luna Actual</p>
            <p className="text-xl font-bold">{moonData.phase}</p>
            <p className="text-sm text-amber-300 font-bold">{moonData.illumination}% iluminación</p>
          </div>
        </div>

        {/* HOROSCOPE BUTTON */}
        <div className="mt-6 pt-6 border-t border-white/10">
          {loadingHoro ? (
            <div className="flex items-center gap-2 text-white/70 text-sm"><Loader2 size={14} className="animate-spin" /> Consultando los astros...</div>
          ) : horoscope ? (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-2">Horóscopo de Hoy</p>
              <p className="text-sm text-white/80 leading-relaxed">{horoscope.description}</p>
              <div className="flex gap-4 mt-3 text-xs text-white/50">
                <span>😄 Mood: <strong className="text-white/80">{horoscope.mood}</strong></span>
                <span>🎨 Color: <strong className="text-white/80">{horoscope.color}</strong></span>
                <span>🍀 Número: <strong className="text-white/80">{horoscope.lucky_number}</strong></span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fetchHoroscope(sunSign!)}
              className="flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <RefreshCw size={14} /> Obtener horóscopo de hoy
            </button>
          )}
        </div>
      </div>

      {/* DAILY INSIGHT */}
      {insight && (
        <div className="aether-card p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} style={{ color: ACCENT }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed]">Insight del Día</p>
          </div>
          <h3 className="font-serif text-xl font-bold text-[#1c0b3a] mb-3">{insight.title}</h3>
          <p className="text-sm text-[#8A8681] leading-relaxed mb-4">{insight.description}</p>
          <div className="bg-purple-50 rounded-2xl px-5 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7c3aed] mb-1">Afirmación</p>
            <p className="font-serif text-base italic text-[#1c0b3a]">"{insight.affirmation}"</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {Array.from({ length: insight.intensity }).map((_, i) => (
              <Zap key={i} size={14} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[10px] font-bold text-[#8A8681] uppercase">Intensidad {insight.intensity}/3</span>
          </div>
        </div>
      )}

      {/* CARTA ASTRAL ANUAL */}
      {annualTheme && (
        <div className="aether-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Sun size={18} style={{ color: '#f59e0b' }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#f59e0b]">Carta Astral {CURRENT_YEAR}</p>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#1c0b3a] mb-6">{annualTheme.theme}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-2">Enfoque del año</p>
              <p className="text-sm font-semibold text-[#2D2A26] leading-relaxed">{annualTheme.focus}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-2">Desafío central</p>
              <p className="text-sm font-semibold text-[#2D2A26] leading-relaxed">{annualTheme.challenge}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-purple-50 px-5 py-4 flex items-start gap-3">
            <Moon size={16} className="text-purple-500 mt-0.5 shrink-0" />
            <p className="text-sm text-[#8A8681]">
              <strong className="text-[#1c0b3a]">Nota:</strong> Para una carta astral completa con posiciones planetarias exactas (Retorno Solar), conectá una API como <strong>AstrologyAPI.com</strong> en la configuración del proyecto.
            </p>
          </div>
        </div>
      )}

      {/* BIRTH DATA SUMMARY */}
      <div className="aether-card p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681] mb-4">Datos de nacimiento registrados</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Nombre', value: birthData.full_name },
            { label: 'Fecha', value: birthData.birth_date ? new Date(birthData.birth_date + 'T12:00:00').toLocaleDateString('es-AR') : '—' },
            { label: 'Hora', value: birthData.birth_time ?? '—' },
            { label: 'Ciudad', value: birthData.birth_city ?? '—' },
            { label: 'Timezone', value: birthData.birth_timezone ?? '—' },
            { label: 'Coords', value: birthData.birth_latitude ? `${birthData.birth_latitude?.toFixed(2)}, ${birthData.birth_longitude?.toFixed(2)}` : '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#8A8681]">{item.label}</p>
              <p className="text-sm font-bold text-[#1c0b3a] truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <SetupModal isOpen={isSetupOpen} form={form} setForm={setForm} formError={formError} isSubmitting={isSubmitting} onSubmit={handleSetup} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
}

/* ─── SETUP MODAL ─────────────────────────────────────────────────────────── */
function SetupModal({ isOpen, form, setForm, formError, isSubmitting, onSubmit, onClose }: {
  isOpen: boolean;
  form: any;
  setForm: (f: any) => void;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
  onClose: () => void;
}) {
  return (
    <AetherModal isOpen={isOpen} onClose={onClose} title="Perfil Cósmico">
      {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="aether-eyebrow">Nombre completo</label>
          <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Tu nombre completo de nacimiento" className="aether-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Fecha de nacimiento</label>
            <input type="date" required value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className="aether-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Hora (opcional)</label>
            <input type="time" value={form.birth_time ?? ''} onChange={e => setForm({ ...form, birth_time: e.target.value })} className="aether-input" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="aether-eyebrow">Ciudad de nacimiento</label>
          <input value={form.birth_city ?? ''} onChange={e => setForm({ ...form, birth_city: e.target.value })} placeholder="Buenos Aires, Argentina" className="aether-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Latitud</label>
            <input type="number" step="0.0001" value={form.birth_latitude ?? ''} onChange={e => setForm({ ...form, birth_latitude: e.target.value ? Number(e.target.value) : null })} placeholder="-34.6037" className="aether-input font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Longitud</label>
            <input type="number" step="0.0001" value={form.birth_longitude ?? ''} onChange={e => setForm({ ...form, birth_longitude: e.target.value ? Number(e.target.value) : null })} placeholder="-58.3816" className="aether-input font-mono" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="aether-eyebrow">Timezone</label>
          <select value={form.birth_timezone ?? ''} onChange={e => setForm({ ...form, birth_timezone: e.target.value })} className="aether-input appearance-none">
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</option>
            <option value="America/New_York">Nueva York (EST)</option>
            <option value="America/Los_Angeles">Los Ángeles (PST)</option>
            <option value="Europe/Madrid">Madrid (CET)</option>
            <option value="America/Mexico_City">Ciudad de México (CST)</option>
            <option value="America/Bogota">Bogotá (COT)</option>
            <option value="America/Lima">Lima (PET)</option>
            <option value="America/Santiago">Santiago (CLT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-xl disabled:opacity-60" style={{ backgroundColor: '#7c3aed' }}>
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Guardar perfil'}
          </button>
        </div>
      </form>
    </AetherModal>
  );
}
