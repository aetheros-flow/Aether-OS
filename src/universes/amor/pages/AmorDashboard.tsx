import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  CalendarHeart,
  Heart,
  BookHeart,
  Plus,
  Loader2,
  X,
  Trash2,
  Save,
  Sparkles,
  MessageCircleHeart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAmorData } from '../hooks/useAmorData';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';
import {
  MOOD_EMOJI,
  MOOD_LABEL,
  DATE_TYPE_LABEL,
  DATE_TYPE_ICON,
  LOVE_LANGUAGE_LABELS,
  LOVE_LANGUAGE_ICONS,
  DEFAULT_LOVE_SCORES,
} from '../types';
import type {
  MoodType,
  NewSpecialDateInput,
  NewReflectionInput,
  LoveLanguageScores,
  SpecialDate,
} from '../types';

// ── Theme ──────────────────────────────────────────────────────────────────

const THEME = {
  bg:       '#FF0040',
  bgDeep:   '#CC0033',
  surface:  '#FFFFFF',
  accent:   '#FF0040',
  textMain: '#FFFFFF',
  textDark: '#2D2A26',
  textMuted:'#8A8681',
};

type TabType = 'dashboard' | 'fechas' | 'lenguajes' | 'reflexiones';

// ── Default form values ────────────────────────────────────────────────────

const DEFAULT_DATE: NewSpecialDateInput = {
  title: '',
  date:  new Date().toISOString().split('T')[0],
  type:  'aniversario',
  notes: '',
};

const DEFAULT_REFLECTION: NewReflectionInput = {
  content: '',
  mood:    'amor',
};

const MOODS: MoodType[] = ['amor', 'feliz', 'neutral', 'triste', 'tenso'];

// ── Helper: days until next yearly occurrence ──────────────────────────────

function daysUntilNext(dateStr: string): number {
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  // Build "this year's occurrence"
  let next = new Date(today.getFullYear(), target.getMonth(), target.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

function formatDateEs(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
    timeZone: 'UTC',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
    timeZone: 'UTC',
  });
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

// ── Score bar for love languages ───────────────────────────────────────────

function ScoreBar({ value, color, max = 5 }: { value: number; color: string; max?: number }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-4 text-right" style={{ color: THEME.textDark }}>
        {value}
      </span>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 active:scale-[0.97]"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.13)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' }}>
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: '#fff', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.48)' }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function AmorDashboard() {
  const navigate = useNavigate();

  const {
    specialDates,
    loveLanguages,
    reflections,
    loading,
    createSpecialDate,
    deleteSpecialDate,
    saveLoveLanguages,
    createReflection,
    deleteReflection,
  } = useAmorData();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<TabType>('dashboard');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [formError,        setFormError]        = useState<string | null>(null);

  // Modal open/close
  const [isDateModalOpen,       setIsDateModalOpen]       = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isLangEditMode,        setIsLangEditMode]        = useState(false);
  const [deleteConfirmDate,     setDeleteConfirmDate]     = useState<SpecialDate | null>(null);
  const [deleteConfirmRefId,    setDeleteConfirmRefId]    = useState<string | null>(null);

  // Form drafts
  const [newDate,       setNewDate]       = useState<NewSpecialDateInput>(DEFAULT_DATE);
  const [newReflection, setNewReflection] = useState<NewReflectionInput>(DEFAULT_REFLECTION);

  // Love language local editing state (persisted on save)
  const [ownScores,     setOwnScores]     = useState<LoveLanguageScores>(
    loveLanguages?.own_scores ?? DEFAULT_LOVE_SCORES
  );
  const [partnerScores, setPartnerScores] = useState<LoveLanguageScores | null>(
    loveLanguages?.partner_scores ?? null
  );
  const [showPartner,   setShowPartner]   = useState<boolean>(!!loveLanguages?.partner_scores);

  // Sync state when data loads
  useMemo(() => {
    if (loveLanguages) {
      setOwnScores(loveLanguages.own_scores);
      setPartnerScores(loveLanguages.partner_scores);
      setShowPartner(!!loveLanguages.partner_scores);
    }
  }, [loveLanguages]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const nextDate = useMemo(() => {
    if (!specialDates.length) return null;
    return [...specialDates].sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))[0];
  }, [specialDates]);

  const relationshipScore = useMemo(() => {
    if (!loveLanguages?.own_scores) return null;
    const scores = Object.values(loveLanguages.own_scores) as number[];
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    return Math.round(avg * 2); // Map 1-5 → 2-10
  }, [loveLanguages]);

  const topLoveLanguage = useMemo(() => {
    if (!loveLanguages?.own_scores) return null;
    const entries = Object.entries(loveLanguages.own_scores) as [keyof LoveLanguageScores, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [loveLanguages]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleCreateDate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createSpecialDate(newDate);
      setIsDateModalOpen(false);
      setNewDate(DEFAULT_DATE);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDate = async () => {
    if (!deleteConfirmDate) return;
    setIsSubmitting(true);
    try {
      await deleteSpecialDate(deleteConfirmDate.id);
      setDeleteConfirmDate(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLoveLanguages = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await saveLoveLanguages(ownScores, showPartner ? (partnerScores ?? DEFAULT_LOVE_SCORES) : null);
      setIsLangEditMode(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReflection = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createReflection(newReflection);
      setIsReflectionModalOpen(false);
      setNewReflection(DEFAULT_REFLECTION);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReflection = async () => {
    if (!deleteConfirmRefId) return;
    setIsSubmitting(true);
    try {
      await deleteReflection(deleteConfirmRefId);
      setDeleteConfirmRefId(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterLangEdit = () => {
    // Re-seed local state from latest DB values before editing
    setOwnScores(loveLanguages?.own_scores ?? DEFAULT_LOVE_SCORES);
    setPartnerScores(loveLanguages?.partner_scores ?? DEFAULT_LOVE_SCORES);
    setShowPartner(!!loveLanguages?.partner_scores);
    setFormError(null);
    setIsLangEditMode(true);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading && !specialDates.length && !reflections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  // ── Header metric text ────────────────────────────────────────────────────

  const headerMetric = (() => {
    switch (activeTab) {
      case 'dashboard':    return { value: relationshipScore ?? '—', unit: '/ 10',    label: 'Puntaje de Relación' };
      case 'fechas':       return { value: specialDates.length,       unit: 'fechas',  label: 'Fechas Especiales' };
      case 'lenguajes':    return { value: topLoveLanguage ? LOVE_LANGUAGE_LABELS[topLoveLanguage].split(' ')[0] : '—', unit: '', label: 'Tu lenguaje principal' };
      case 'reflexiones':  return { value: reflections.length,        unit: 'notas',   label: 'Reflexiones' };
    }
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white selection:text-black"
      style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
    >

      <UniverseMobileHeader title="Amor" subtitle="Relaciones & Vínculos" color="#FF0040" />

      {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <nav
        className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r border-white/10"
        style={{ backgroundColor: THEME.bg }}
      >
        <div className="flex items-center gap-4 p-6 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"
            aria-label="Volver al inicio"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="aether-title text-white">Vida Amorosa</h1>
            <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Conexión & Relaciones</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <UniverseNavItem icon={LayoutDashboard} label="Resumen"          isActive={activeTab === 'dashboard'}   onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem icon={CalendarHeart}   label="Fechas Especiales" isActive={activeTab === 'fechas'}      onClick={() => handleTabChange('fechas')} />
          <UniverseNavItem icon={Heart}           label="Lenguajes del Amor" isActive={activeTab === 'lenguajes'}   onClick={() => handleTabChange('lenguajes')} />
          <UniverseNavItem icon={BookHeart}       label="Reflexiones"        isActive={activeTab === 'reflexiones'} onClick={() => handleTabChange('reflexiones')} />
        </div>
      </nav>

      {/* ══ MAIN AREA ══════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-14 md:pt-10 pb-20 md:pb-0">

        {/* ── Daylio-style page header ── */}
        <header className="mb-8 md:mb-10">
          {/* Date + tab label row */}
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {activeTab === 'fechas' && (
              <button
                onClick={() => setIsDateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs active:scale-95 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Plus size={13} strokeWidth={3} /> Nueva Fecha
              </button>
            )}
            {activeTab === 'reflexiones' && (
              <button
                onClick={() => setIsReflectionModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs active:scale-95 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Plus size={13} strokeWidth={3} /> Nueva Reflexión
              </button>
            )}
          </div>

          {/* Big title */}
          <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {activeTab === 'dashboard'   ? 'Tu historia de amor' :
             activeTab === 'fechas'      ? 'Fechas especiales' :
             activeTab === 'lenguajes'   ? 'Lenguajes del amor' :
             'Reflexiones'}
          </h2>

          {/* Stats strip — only on dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="flex gap-2.5 flex-wrap">
              {[
                { icon: '💑', label: 'Relación', val: relationshipScore ?? '—', unit: '/10' },
                { icon: '📅', label: 'Próxima fecha', val: nextDate ? `${daysUntilNext(nextDate.date)}d` : '—', unit: '' },
                { icon: '📖', label: 'Reflexiones', val: reflections.length, unit: 'notas' },
                { icon: '💬', label: 'Fechas', val: specialDates.length, unit: 'total' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)' }}
                >
                  <span className="text-base leading-none">{stat.icon}</span>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.48)', lineHeight: 1.2 }}>{stat.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                      {stat.val}{stat.unit ? <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginLeft: 2 }}>{stat.unit}</span> : null}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ══ TAB: DASHBOARD ══════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-5">

            {/* Two-column section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Upcoming dates preview */}
              <div
                className="flex flex-col gap-4 p-5 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                    Próximas fechas
                  </p>
                  <button
                    onClick={() => handleTabChange('fechas')}
                    style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Ver todas →
                  </button>
                </div>
                {specialDates.length === 0 ? (
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Aún no hay fechas guardadas.</p>
                ) : (
                  <div className="flex flex-col">
                    {[...specialDates]
                      .sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))
                      .slice(0, 4)
                      .map((d, i) => {
                        const days = daysUntilNext(d.date);
                        return (
                          <div
                            key={d.id}
                            className="flex items-center gap-3 py-2.5"
                            style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                              style={{ background: 'rgba(255,255,255,0.14)' }}
                            >
                              {DATE_TYPE_ICON[d.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-white">{d.title}</p>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{formatDateShort(d.date)}</p>
                            </div>
                            <div
                              className="px-2.5 py-1 rounded-full text-xs font-black"
                              style={{
                                background: days === 0 ? 'rgba(255,255,255,0.25)' : days <= 7 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                                color: days === 0 ? '#fff' : days <= 7 ? '#fff' : 'rgba(255,255,255,0.55)',
                              }}
                            >
                              {days === 0 ? '¡Hoy!' : `${days}d`}
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>

              {/* Latest reflections preview */}
              <div
                className="flex flex-col gap-4 p-5 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                    Últimas reflexiones
                  </p>
                  <button
                    onClick={() => handleTabChange('reflexiones')}
                    style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Ver todas →
                  </button>
                </div>
                {reflections.length === 0 ? (
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Aún no hay reflexiones escritas.</p>
                ) : (
                  <div className="flex flex-col">
                    {reflections.slice(0, 3).map((r, i) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-3 py-2.5"
                        style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
                      >
                        <span className="text-2xl leading-none mt-0.5 shrink-0">{MOOD_EMOJI[r.mood]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 text-white/85">{r.content}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 3 }}>{formatTimestamp(r.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Love language snapshot */}
            {loveLanguages ? (
              <div
                className="p-5 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                    Lenguajes del amor
                  </p>
                  <button
                    onClick={() => handleTabChange('lenguajes')}
                    style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Ver detalle →
                  </button>
                </div>
                <div className="flex flex-col gap-3.5">
                  {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-base w-6 shrink-0">{LOVE_LANGUAGE_ICONS[key]}</span>
                      <span className="text-xs font-bold w-40 shrink-0 text-white/70">{LOVE_LANGUAGE_LABELS[key]}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(loveLanguages.own_scores[key] / 5) * 100}%`, background: 'rgba(255,255,255,0.85)' }}
                        />
                      </div>
                      <span className="text-xs font-black text-white w-4 text-right">{loveLanguages.own_scores[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-40 rounded-2xl border-dashed border-2"
                style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.10)' }}
              >
                <Sparkles className="w-7 h-7 mb-3" style={{ color: 'rgba(255,255,255,0.45)' }} />
                <p className="text-sm font-bold text-white/70 mb-2">Completa tus lenguajes del amor</p>
                <button
                  onClick={() => handleTabChange('lenguajes')}
                  className="text-xs font-black px-4 py-2 rounded-full transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                >
                  Completar ahora →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: FECHAS ESPECIALES ══════════════════════════════════════ */}
        {activeTab === 'fechas' && (
          <div className="flex flex-col gap-6">
            {specialDates.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
              >
                <CalendarHeart className="w-10 h-10 text-white/60 mb-3" />
                <p className="text-white font-bold mb-1">Sin fechas especiales</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Agregá tu aniversario, cumpleaños o momentos importantes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...specialDates]
                  .sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))
                  .map(d => {
                    const days = daysUntilNext(d.date);
                    const isToday   = days === 0;
                    const isSoon    = days <= 7;
                    return (
                      <div
                        key={d.id}
                        className="aether-card aether-card-interactive relative overflow-hidden p-5 flex flex-col gap-4"
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between">
                          <div
                            className="w-12 h-12 rounded-[16px] flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${THEME.accent}15` }}
                          >
                            {DATE_TYPE_ICON[d.type]}
                          </div>
                          <button
                            onClick={() => setDeleteConfirmDate(d)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-[#8A8681] hover:text-red-500 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Content */}
                        <div>
                          <p className="aether-eyebrow mb-1" style={{ color: THEME.accent }}>
                            {DATE_TYPE_LABEL[d.type]}
                          </p>
                          <h3 className="text-lg font-bold" style={{ color: THEME.textDark }}>{d.title}</h3>
                          <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                            {formatDateEs(d.date)}
                          </p>
                          {d.notes && (
                            <p className="text-sm mt-2 italic" style={{ color: THEME.textMuted }}>{d.notes}</p>
                          )}
                        </div>

                        {/* Days countdown */}
                        <div
                          className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between"
                        >
                          <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>
                            Próxima vez
                          </span>
                          <span
                            className="text-sm font-bold px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: isToday ? THEME.accent : isSoon ? `${THEME.accent}20` : '#F4F9F2',
                              color:           isToday ? '#FFF' : isSoon ? THEME.accent : THEME.textDark,
                            }}
                          >
                            {isToday ? '¡Hoy! 🎉' : `en ${days} días`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: LENGUAJES DEL AMOR ═════════════════════════════════════ */}
        {activeTab === 'lenguajes' && (
          <div className="flex flex-col gap-6 max-w-3xl">

            {!isLangEditMode ? (
              <>
                {/* Display mode */}
                <div className="aether-card p-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-xl" style={{ color: THEME.textDark }}>Mis lenguajes del amor</h2>
                      {loveLanguages?.updated_at && (
                        <p className="text-xs mt-0.5" style={{ color: THEME.textMuted }}>
                          Actualizado el {formatTimestamp(loveLanguages.updated_at)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleEnterLangEdit}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
                      style={{ backgroundColor: THEME.accent, color: '#FFF' }}
                    >
                      {loveLanguages ? 'Editar' : 'Completar'}
                    </button>
                  </div>

                  {loveLanguages ? (
                    <div className="flex flex-col gap-5">
                      {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xl w-7">{LOVE_LANGUAGE_ICONS[key]}</span>
                          <span className="text-sm font-semibold w-48 shrink-0" style={{ color: THEME.textDark }}>
                            {LOVE_LANGUAGE_LABELS[key]}
                          </span>
                          <ScoreBar value={loveLanguages.own_scores[key]} color={THEME.accent} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <MessageCircleHeart className="w-10 h-10" style={{ color: THEME.accent }} />
                      <p className="text-sm text-center max-w-xs" style={{ color: THEME.textMuted }}>
                        Completá tu perfil de lenguajes del amor para entender mejor qué necesitás en una relación.
                      </p>
                    </div>
                  )}
                </div>

                {/* Partner section — display */}
                {loveLanguages?.partner_scores && (
                  <div className="aether-card p-6 flex flex-col gap-5">
                    <h2 className="font-bold text-xl" style={{ color: THEME.textDark }}>Lenguajes de mi pareja</h2>
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xl w-7">{LOVE_LANGUAGE_ICONS[key]}</span>
                        <span className="text-sm font-semibold w-48 shrink-0" style={{ color: THEME.textDark }}>
                          {LOVE_LANGUAGE_LABELS[key]}
                        </span>
                        <ScoreBar value={loveLanguages.partner_scores![key]} color="#FF6B8A" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation card */}
                <div className="aether-card p-6">
                  <h3 className="font-bold mb-4" style={{ color: THEME.textDark }}>¿Qué son los lenguajes del amor?</h3>
                  <div className="flex flex-col gap-3">
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex items-start gap-3">
                        <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                        <div>
                          <p className="text-sm font-bold" style={{ color: THEME.textDark }}>{LOVE_LANGUAGE_LABELS[key]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4" style={{ color: THEME.textMuted }}>
                    Calificá cada lenguaje del 1 (menos importante) al 5 (muy importante).
                  </p>
                </div>
              </>
            ) : (
              /* Edit mode */
              <div className="aether-card p-6 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl" style={{ color: THEME.textDark }}>Editar lenguajes del amor</h2>
                  <button
                    onClick={() => setIsLangEditMode(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-[#8A8681] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
                )}

                {/* Own scores */}
                <section>
                  <p className="aether-eyebrow mb-5" style={{ color: THEME.accent }}>Mis puntuaciones</p>
                  <div className="flex flex-col gap-5">
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                          <span className="text-sm font-semibold" style={{ color: THEME.textDark }}>
                            {LOVE_LANGUAGE_LABELS[key]}
                          </span>
                          <span className="ml-auto text-sm font-bold" style={{ color: THEME.accent }}>
                            {ownScores[key]} / 5
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={ownScores[key]}
                          onChange={e => setOwnScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-full accent-[#FF0040]"
                        />
                        <div className="flex justify-between text-xs" style={{ color: THEME.textMuted }}>
                          <span>1 — Poco</span><span>5 — Mucho</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Partner toggle */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <p className="aether-eyebrow" style={{ color: '#FF6B8A' }}>Lenguajes de mi pareja</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPartner(v => !v);
                        if (!partnerScores) setPartnerScores(DEFAULT_LOVE_SCORES);
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: showPartner ? '#FF6B8A20' : '#F4F9F2',
                        color:           showPartner ? '#FF6B8A'   : THEME.textMuted,
                      }}
                    >
                      {showPartner ? 'Quitar' : 'Agregar'}
                    </button>
                  </div>

                  {showPartner && partnerScores && (
                    <div className="flex flex-col gap-5">
                      {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                            <span className="text-sm font-semibold" style={{ color: THEME.textDark }}>
                              {LOVE_LANGUAGE_LABELS[key]}
                            </span>
                            <span className="ml-auto text-sm font-bold" style={{ color: '#FF6B8A' }}>
                              {partnerScores[key]} / 5
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={partnerScores[key]}
                            onChange={e => setPartnerScores(prev => prev ? ({ ...prev, [key]: Number(e.target.value) }) : DEFAULT_LOVE_SCORES)}
                            className="w-full accent-[#FF6B8A]"
                          />
                          <div className="flex justify-between text-xs" style={{ color: THEME.textMuted }}>
                            <span>1 — Poco</span><span>5 — Mucho</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <button
                  onClick={handleSaveLoveLanguages}
                  disabled={isSubmitting}
                  className="aether-btn flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-60"
                  style={{ backgroundColor: THEME.accent, color: '#FFF' }}
                >
                  {isSubmitting
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><Save size={16} /> Guardar lenguajes</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: REFLEXIONES ════════════════════════════════════════════ */}
        {activeTab === 'reflexiones' && (
          <div className="flex flex-col gap-5">
            {reflections.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
              >
                <BookHeart className="w-10 h-10 text-white/60 mb-3" />
                <p className="text-white font-bold mb-1">Sin reflexiones aún</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Escribí sobre tu relación, cómo te sentís y qué querés mejorar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reflections.map(r => (
                  <div key={r.id} className="aether-card aether-card-interactive p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{MOOD_EMOJI[r.mood]}</span>
                        <span
                          className="aether-eyebrow px-3 py-1 rounded-full"
                          style={{ backgroundColor: `${THEME.accent}15`, color: THEME.accent }}
                        >
                          {MOOD_LABEL[r.mood]}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteConfirmRefId(r.id)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-[#8A8681] hover:text-red-500 transition-colors shrink-0"
                        aria-label="Eliminar reflexión"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: THEME.textDark }}>
                      {r.content}
                    </p>
                    <p className="text-xs" style={{ color: THEME.textMuted }}>
                      {formatTimestamp(r.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══ MODAL: NUEVA FECHA ESPECIAL ════════════════════════════════════ */}
      <AetherModal
        isOpen={isDateModalOpen}
        onClose={() => { setIsDateModalOpen(false); setFormError(null); setNewDate(DEFAULT_DATE); }}
        title="Nueva Fecha Especial"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateDate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre de la fecha</label>
            <input
              type="text"
              required
              placeholder="Ej: Primer beso, Aniversario de novios…"
              value={newDate.title}
              onChange={e => setNewDate(d => ({ ...d, title: e.target.value }))}
              className="aether-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Tipo</label>
            <select
              value={newDate.type}
              onChange={e => setNewDate(d => ({ ...d, type: e.target.value as SpecialDate['type'] }))}
              className="aether-input appearance-none"
            >
              {(Object.entries(DATE_TYPE_LABEL) as [SpecialDate['type'], string][]).map(([val, label]) => (
                <option key={val} value={val}>{DATE_TYPE_ICON[val]} {label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Fecha</label>
            <input
              type="date"
              required
              value={newDate.date}
              onChange={e => setNewDate(d => ({ ...d, date: e.target.value }))}
              className="aether-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas (opcional)</label>
            <textarea
              rows={3}
              placeholder="Algún detalle especial sobre este día…"
              value={newDate.notes}
              onChange={e => setNewDate(d => ({ ...d, notes: e.target.value }))}
              className="aether-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: THEME.accent, color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar fecha'}
          </button>
        </form>
      </AetherModal>

      {/* ══ MODAL: NUEVA REFLEXIÓN ══════════════════════════════════════════ */}
      <AetherModal
        isOpen={isReflectionModalOpen}
        onClose={() => { setIsReflectionModalOpen(false); setFormError(null); setNewReflection(DEFAULT_REFLECTION); }}
        title="Nueva Reflexión"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateReflection} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">¿Cómo te sentís?</label>
            <div className="flex gap-3 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setNewReflection(r => ({ ...r, mood: m }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all active:scale-95 ${newReflection.mood === m ? 'border-[#FF0040] bg-[#FF004015] text-[#FF0040]' : 'border-gray-200 text-[#8A8681]'}`}
                >
                  <span>{MOOD_EMOJI[m]}</span>
                  <span>{MOOD_LABEL[m]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Reflexión</label>
            <textarea
              rows={5}
              required
              placeholder="¿Qué querés recordar hoy sobre tu relación? ¿Algo que agradecer, mejorar, o simplemente sentiste…"
              value={newReflection.content}
              onChange={e => setNewReflection(r => ({ ...r, content: e.target.value }))}
              className="aether-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: THEME.accent, color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar reflexión'}
          </button>
        </form>
      </AetherModal>

      {/* ══ MODAL: CONFIRMAR ELIMINACIÓN DE FECHA ══════════════════════════ */}
      <AetherModal
        isOpen={!!deleteConfirmDate}
        onClose={() => setDeleteConfirmDate(null)}
        title="Eliminar fecha"
      >
        <p className="text-sm text-[#2D2A26] mb-6">
          ¿Seguro que querés eliminar <strong>{deleteConfirmDate?.title}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirmDate(null)}
            className="flex-1 aether-btn"
            style={{ backgroundColor: '#F4F9F2', color: THEME.textDark }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteDate}
            disabled={isSubmitting}
            className="flex-1 aether-btn disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FF4444', color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </button>
        </div>
      </AetherModal>

      {/* ══ MODAL: CONFIRMAR ELIMINACIÓN DE REFLEXIÓN ══════════════════════ */}
      <AetherModal
        isOpen={!!deleteConfirmRefId}
        onClose={() => setDeleteConfirmRefId(null)}
        title="Eliminar reflexión"
      >
        <p className="text-sm text-[#2D2A26] mb-6">
          ¿Seguro que querés eliminar esta reflexión? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirmRefId(null)}
            className="flex-1 aether-btn"
            style={{ backgroundColor: '#F4F9F2', color: THEME.textDark }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteReflection}
            disabled={isSubmitting}
            className="flex-1 aether-btn disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FF4444', color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </button>
        </div>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',   label: 'Resumen',   icon: LayoutDashboard },
          { id: 'fechas',      label: 'Fechas',    icon: CalendarHeart   },
          { id: 'lenguajes',   label: 'Lenguajes', icon: Heart           },
          { id: 'reflexiones', label: 'Diario',    icon: BookHeart       },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor="#FF6B8A"
        bgColor="#CC0033"
      />
    </div>
  );
}
