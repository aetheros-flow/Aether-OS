import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
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
import AuraLayout from '../../../components/layout/AuraLayout';
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

const ACCENT = '#E05A7A';
const ACCENT_SOFT = '#F08DA4';

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

// ── Helpers ────────────────────────────────────────────────────────────────

function daysUntilNext(dateStr: string): number {
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  let next = new Date(today.getFullYear(), target.getMonth(), target.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

function formatDateEs(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Score bar Neo-Dark ─────────────────────────────────────────────────────

function ScoreBar({ value, color, max = 5 }: { value: number; color: string; max?: number }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 12px ${color}80`,
          }}
        />
      </div>
      <span className="text-sm font-black tabular-nums w-4 text-right text-white">{value}</span>
    </div>
  );
}

// ── Animations ─────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' } as const;
const hoverPhysics = { scale: 1.01 } as const;

// ── Main component ─────────────────────────────────────────────────────────

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

  const [activeTab,        setActiveTab]        = useState<TabType>('dashboard');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [formError,        setFormError]        = useState<string | null>(null);

  const [isDateModalOpen,       setIsDateModalOpen]       = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isLangEditMode,        setIsLangEditMode]        = useState(false);
  const [deleteConfirmDate,     setDeleteConfirmDate]     = useState<SpecialDate | null>(null);
  const [deleteConfirmRefId,    setDeleteConfirmRefId]    = useState<string | null>(null);

  const [newDate,       setNewDate]       = useState<NewSpecialDateInput>(DEFAULT_DATE);
  const [newReflection, setNewReflection] = useState<NewReflectionInput>(DEFAULT_REFLECTION);

  const [ownScores,     setOwnScores]     = useState<LoveLanguageScores>(
    loveLanguages?.own_scores ?? DEFAULT_LOVE_SCORES
  );
  const [partnerScores, setPartnerScores] = useState<LoveLanguageScores | null>(
    loveLanguages?.partner_scores ?? null
  );
  const [showPartner,   setShowPartner]   = useState<boolean>(!!loveLanguages?.partner_scores);

  useMemo(() => {
    if (loveLanguages) {
      setOwnScores(loveLanguages.own_scores);
      setPartnerScores(loveLanguages.partner_scores);
      setShowPartner(!!loveLanguages.partner_scores);
    }
  }, [loveLanguages]);

  const nextDate = useMemo(() => {
    if (!specialDates.length) return null;
    return [...specialDates].sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))[0];
  }, [specialDates]);

  const relationshipScore = useMemo(() => {
    if (!loveLanguages?.own_scores) return null;
    const scores = Object.values(loveLanguages.own_scores) as number[];
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    return Math.round(avg * 2);
  }, [loveLanguages]);

  const topLoveLanguage = useMemo(() => {
    if (!loveLanguages?.own_scores) return null;
    const entries = Object.entries(loveLanguages.own_scores) as [keyof LoveLanguageScores, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [loveLanguages]);

  const aiInsight = useMemo(() => {
    if (!loveLanguages && reflections.length === 0 && specialDates.length === 0) {
      return 'Aún no tengo señales de tu vida amorosa. Empezá completando tus lenguajes del amor.';
    }
    if (nextDate) {
      const d = daysUntilNext(nextDate.date);
      if (d <= 7) return `Se acerca "${nextDate.title}" en ${d === 0 ? 'hoy mismo' : `${d} día${d > 1 ? 's' : ''}`}. Preparate emocionalmente.`;
    }
    if (relationshipScore !== null && relationshipScore >= 8) {
      return `Tu sintonía emocional marca ${relationshipScore}/10. Estás en una frecuencia sana — sostené los rituales que te llevaron acá.`;
    }
    if (relationshipScore !== null && relationshipScore < 6) {
      return `Tu puntaje relacional está en ${relationshipScore}/10. Considerá una conversación honesta esta semana.`;
    }
    return 'Tu universo afectivo se está calibrando. Una nueva reflexión hoy potenciaría tu lectura.';
  }, [loveLanguages, reflections.length, specialDates.length, nextDate, relationshipScore]);

  const handleTabChange = (tab: TabType) => { setActiveTab(tab); };

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
    setOwnScores(loveLanguages?.own_scores ?? DEFAULT_LOVE_SCORES);
    setPartnerScores(loveLanguages?.partner_scores ?? DEFAULT_LOVE_SCORES);
    setShowPartner(!!loveLanguages?.partner_scores);
    setFormError(null);
    setIsLangEditMode(true);
  };

  if (loading && !specialDates.length && !reflections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B1714]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard',   label: 'Resumen',     icon: <LayoutDashboard /> },
    { id: 'fechas',      label: 'Fechas',      icon: <CalendarHeart /> },
    { id: 'lenguajes',   label: 'Lenguajes',   icon: <Heart /> },
    { id: 'reflexiones', label: 'Diario',      icon: <BookHeart /> },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'fechas' && (
        <motion.button onClick={() => setIsDateModalOpen(true)} whileHover={hoverPhysics} whileTap={tapPhysics} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider text-white" style={{ background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}40` }}>
          <Plus size={13} strokeWidth={3} /> Nueva Fecha
        </motion.button>
      )}
      {activeTab === 'reflexiones' && (
        <motion.button onClick={() => setIsReflectionModalOpen(true)} whileHover={hoverPhysics} whileTap={tapPhysics} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider text-white" style={{ background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}40` }}>
          <Plus size={13} strokeWidth={3} /> Nueva Reflexión
        </motion.button>
      )}
    </div>
  );

  const title = activeTab === 'dashboard' ? 'Tu historia de amor' : activeTab === 'fechas' ? 'Fechas especiales' : activeTab === 'lenguajes' ? 'Lenguajes del amor' : 'Reflexiones';

  return (
    <AuraLayout
      title={title}
      accentColor={ACCENT}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => handleTabChange(tab as TabType)}
      headerActions={headerActions}
    >
      <div className="flex flex-col gap-8 pb-10">

        {/* AI Insights */}
        {activeTab === 'dashboard' && (
          <motion.section
            variants={itemVariants}
            whileHover={hoverPhysics}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative mb-6 rounded-[28px] p-5 md:p-6 bg-zinc-900/70 backdrop-blur-xl border border-white/5 overflow-hidden"
          >
            <div aria-hidden className="absolute inset-0 opacity-[0.10]" style={{ background: `radial-gradient(800px circle at 0% 0%, ${ACCENT}, transparent 50%)` }} />
            <div className="relative flex items-start gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}>
                <Sparkles size={18} style={{ color: ACCENT }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-black tracking-[0.22em] mb-1.5 text-zinc-500">Aether AI · Lectura Afectiva</p>
                <p className="text-[15px] font-medium text-white/90 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Stats strip */}
        {activeTab === 'dashboard' && (
          <motion.div variants={itemVariants} className="flex gap-2.5 flex-wrap mb-8">
            {[
              { icon: '💑', label: 'Relación',      val: relationshipScore ?? '—', unit: '/10' },
              { icon: '📅', label: 'Próxima fecha', val: nextDate ? `${daysUntilNext(nextDate.date)}d` : '—', unit: '' },
              { icon: '📖', label: 'Reflexiones',   val: reflections.length, unit: 'notas' },
              { icon: '💬', label: 'Fechas',        val: specialDates.length, unit: 'total' },
            ].map(stat => (
              <motion.div key={stat.label} whileHover={hoverPhysics} whileTap={tapPhysics} className="neo-chip">
                <span className="text-base leading-none">{stat.icon}</span>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500 leading-tight">{stat.label}</p>
                  <p className="text-[15px] font-black text-white leading-none">
                    {stat.val}
                    {stat.unit ? <span className="text-[10px] font-bold text-zinc-500 ml-0.5">{stat.unit}</span> : null}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ TAB: DASHBOARD ══════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <motion.div variants={itemVariants} className="flex flex-col gap-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming dates */}
              <motion.div whileHover={{ y: -2 }} className="neo-card neo-card-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-black tracking-[0.22em] text-zinc-500">Próximas fechas</p>
                  <button
                    onClick={() => handleTabChange('fechas')}
                    className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Ver todas →
                  </button>
                </div>
                {specialDates.length === 0 ? (
                  <p className="text-sm font-medium text-zinc-500">Aún no hay fechas guardadas.</p>
                ) : (
                  <div className="flex flex-col">
                    {[...specialDates]
                      .sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))
                      .slice(0, 4)
                      .map((d, i) => {
                        const days = daysUntilNext(d.date);
                        return (
                          <div key={d.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}>
                              {DATE_TYPE_ICON[d.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-white">{d.title}</p>
                              <p className="text-[11px] text-zinc-500">{formatDateShort(d.date)}</p>
                            </div>
                            <div
                              className="px-2.5 py-1 rounded-full text-xs font-black"
                              style={{
                                background: days === 0 ? ACCENT : days <= 7 ? `${ACCENT}25` : 'rgba(255,255,255,0.05)',
                                color:      days === 0 ? '#fff'  : days <= 7 ? ACCENT      : 'rgba(255,255,255,0.55)',
                                border:     days <= 7 ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.05)',
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
              </motion.div>

              {/* Latest reflections */}
              <motion.div whileHover={{ y: -2 }} className="neo-card neo-card-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-black tracking-[0.22em] text-zinc-500">Últimas reflexiones</p>
                  <button
                    onClick={() => handleTabChange('reflexiones')}
                    className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Ver todas →
                  </button>
                </div>
                {reflections.length === 0 ? (
                  <p className="text-sm font-medium text-zinc-500">Aún no hay reflexiones escritas.</p>
                ) : (
                  <div className="flex flex-col">
                    {reflections.slice(0, 3).map((r, i) => (
                      <div key={r.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span className="text-2xl leading-none mt-0.5 shrink-0">{MOOD_EMOJI[r.mood]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 text-white/85 leading-snug">{r.content}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">{formatTimestamp(r.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Love language snapshot */}
            {loveLanguages ? (
              <motion.div whileHover={{ y: -2 }} className="neo-card neo-card-lg">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] uppercase font-black tracking-[0.22em] text-zinc-500">Lenguajes del amor</p>
                  <button
                    onClick={() => handleTabChange('lenguajes')}
                    className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Ver detalle →
                  </button>
                </div>
                <div className="flex flex-col gap-3.5">
                  {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-base w-6 shrink-0">{LOVE_LANGUAGE_ICONS[key]}</span>
                      <span className="text-xs font-bold w-40 shrink-0 text-white/70">{LOVE_LANGUAGE_LABELS[key]}</span>
                      <ScoreBar value={loveLanguages.own_scores[key]} color={ACCENT} />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 rounded-[28px] border-dashed border border-white/10 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden">
                <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{ background: `radial-gradient(600px circle at 50% 0%, ${ACCENT}, transparent 60%)` }} />
                <Sparkles className="w-7 h-7 mb-3 relative" style={{ color: ACCENT }} />
                <p className="text-sm font-bold text-white/80 mb-3 relative">Completa tus lenguajes del amor</p>
                <motion.button
                  whileHover={hoverPhysics}
                  whileTap={tapPhysics}
                  onClick={() => handleTabChange('lenguajes')}
                  className="text-xs font-black px-4 py-2 rounded-full text-white relative"
                  style={{ background: ACCENT, boxShadow: `0 4px 16px ${ACCENT}40` }}
                >
                  Completar ahora →
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: FECHAS ESPECIALES ══════════════════════════════════════ */}
        {activeTab === 'fechas' && (
          <motion.div variants={itemVariants} className="flex flex-col gap-6">
            {specialDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 rounded-[32px] border-dashed border border-white/10 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden">
                <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{ background: `radial-gradient(600px circle at 50% 0%, ${ACCENT}, transparent 60%)` }} />
                <CalendarHeart className="w-10 h-10 mb-3 relative" style={{ color: ACCENT }} />
                <p className="text-white font-bold mb-1 relative">Sin fechas especiales</p>
                <p className="text-sm text-zinc-400 relative">Agregá tu aniversario, cumpleaños o momentos importantes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...specialDates]
                  .sort((a, b) => daysUntilNext(a.date) - daysUntilNext(b.date))
                  .map(d => {
                    const days = daysUntilNext(d.date);
                    const isToday = days === 0;
                    const isSoon  = days <= 7;
                    return (
                      <motion.div
                        key={d.id}
                        whileHover={{ scale: 1.01, y: -3 }}
                        whileTap={tapPhysics}
                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                        className="neo-card relative overflow-hidden flex flex-col gap-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}>
                            {DATE_TYPE_ICON[d.type]}
                          </div>
                          <button
                            onClick={() => setDeleteConfirmDate(d)}
                            className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-black tracking-[0.22em] mb-1.5" style={{ color: ACCENT }}>
                            {DATE_TYPE_LABEL[d.type]}
                          </p>
                          <h3 className="text-lg font-bold tracking-tight text-white">{d.title}</h3>
                          <p className="text-sm mt-1 text-zinc-400">{formatDateEs(d.date)}</p>
                          {d.notes && (
                            <p className="text-sm mt-2 italic text-zinc-500">{d.notes}</p>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-500">Próxima vez</span>
                          <span
                            className="text-sm font-black px-3 py-1 rounded-full"
                            style={{
                              background: isToday ? ACCENT : isSoon ? `${ACCENT}25` : 'rgba(255,255,255,0.05)',
                              color:      isToday ? '#fff' : isSoon ? ACCENT      : 'rgba(255,255,255,0.65)',
                              border:     isSoon ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            {isToday ? '¡Hoy! 🎉' : `en ${days} días`}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: LENGUAJES DEL AMOR ═════════════════════════════════════ */}
        {activeTab === 'lenguajes' && (
          <motion.div variants={itemVariants} className="flex flex-col gap-6 max-w-3xl">

            {!isLangEditMode ? (
              <>
                <div className="neo-card neo-card-lg flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-xl tracking-tight text-white">Mis lenguajes del amor</h2>
                      {loveLanguages?.updated_at && (
                        <p className="text-xs mt-0.5 text-zinc-500">Actualizado el {formatTimestamp(loveLanguages.updated_at)}</p>
                      )}
                    </div>
                    <motion.button
                      whileHover={hoverPhysics}
                      whileTap={tapPhysics}
                      onClick={handleEnterLangEdit}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black text-white"
                      style={{ background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}40` }}
                    >
                      {loveLanguages ? 'Editar' : 'Completar'}
                    </motion.button>
                  </div>

                  {loveLanguages ? (
                    <div className="flex flex-col gap-5">
                      {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xl w-7">{LOVE_LANGUAGE_ICONS[key]}</span>
                          <span className="text-sm font-semibold w-48 shrink-0 text-white/80">{LOVE_LANGUAGE_LABELS[key]}</span>
                          <ScoreBar value={loveLanguages.own_scores[key]} color={ACCENT} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <MessageCircleHeart className="w-10 h-10" style={{ color: ACCENT }} />
                      <p className="text-sm text-center max-w-xs text-zinc-400">
                        Completá tu perfil de lenguajes del amor para entender mejor qué necesitás en una relación.
                      </p>
                    </div>
                  )}
                </div>

                {loveLanguages?.partner_scores && (
                  <div className="neo-card neo-card-lg flex flex-col gap-5">
                    <h2 className="font-bold text-xl tracking-tight text-white">Lenguajes de mi pareja</h2>
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xl w-7">{LOVE_LANGUAGE_ICONS[key]}</span>
                        <span className="text-sm font-semibold w-48 shrink-0 text-white/80">{LOVE_LANGUAGE_LABELS[key]}</span>
                        <ScoreBar value={loveLanguages.partner_scores![key]} color={ACCENT_SOFT} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="neo-card neo-card-lg">
                  <h3 className="font-bold mb-4 text-white">¿Qué son los lenguajes del amor?</h3>
                  <div className="flex flex-col gap-3">
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex items-start gap-3">
                        <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                        <p className="text-sm font-bold text-white/80">{LOVE_LANGUAGE_LABELS[key]}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4 text-zinc-500">Calificá cada lenguaje del 1 (menos importante) al 5 (muy importante).</p>
                </div>
              </>
            ) : (
              <div className="neo-card neo-card-lg flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl tracking-tight text-white">Editar lenguajes del amor</h2>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsLangEditMode(false)}
                    className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl">{formError}</p>
                )}

                <section>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-5" style={{ color: ACCENT }}>Mis puntuaciones</p>
                  <div className="flex flex-col gap-5">
                    {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                          <span className="text-sm font-semibold text-white/85">{LOVE_LANGUAGE_LABELS[key]}</span>
                          <span className="ml-auto text-sm font-black tabular-nums" style={{ color: ACCENT }}>{ownScores[key]} / 5</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={ownScores[key]}
                          onChange={e => setOwnScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-full"
                          style={{ accentColor: ACCENT }}
                        />
                        <div className="flex justify-between text-[11px] text-zinc-500"><span>1 — Poco</span><span>5 — Mucho</span></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: ACCENT_SOFT }}>Lenguajes de mi pareja</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setShowPartner(v => !v);
                        if (!partnerScores) setPartnerScores(DEFAULT_LOVE_SCORES);
                      }}
                      className="text-xs font-black px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: showPartner ? `${ACCENT_SOFT}20` : 'rgba(255,255,255,0.05)',
                        color:      showPartner ? ACCENT_SOFT       : '#A1A1AA',
                        border:     showPartner ? `1px solid ${ACCENT_SOFT}40` : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {showPartner ? 'Quitar' : 'Agregar'}
                    </motion.button>
                  </div>

                  {showPartner && partnerScores && (
                    <div className="flex flex-col gap-5">
                      {(Object.keys(LOVE_LANGUAGE_LABELS) as (keyof typeof LOVE_LANGUAGE_LABELS)[]).map(key => (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{LOVE_LANGUAGE_ICONS[key]}</span>
                            <span className="text-sm font-semibold text-white/85">{LOVE_LANGUAGE_LABELS[key]}</span>
                            <span className="ml-auto text-sm font-black tabular-nums" style={{ color: ACCENT_SOFT }}>{partnerScores[key]} / 5</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={1}
                            value={partnerScores[key]}
                            onChange={e => setPartnerScores(prev => prev ? ({ ...prev, [key]: Number(e.target.value) }) : DEFAULT_LOVE_SCORES)}
                            className="w-full"
                            style={{ accentColor: ACCENT_SOFT }}
                          />
                          <div className="flex justify-between text-[11px] text-zinc-500"><span>1 — Poco</span><span>5 — Mucho</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <motion.button
                  onClick={handleSaveLoveLanguages}
                  whileTap={tapPhysics}
                  disabled={isSubmitting}
                  className="neo-btn-accent flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}40` }}
                >
                  {isSubmitting
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><Save size={16} /> Guardar lenguajes</>
                  }
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: REFLEXIONES ════════════════════════════════════════════ */}
        {activeTab === 'reflexiones' && (
          <motion.div variants={itemVariants} className="flex flex-col gap-5">
            {reflections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 rounded-[32px] border-dashed border border-white/10 bg-zinc-900/50 backdrop-blur-xl relative overflow-hidden">
                <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{ background: `radial-gradient(600px circle at 50% 0%, ${ACCENT}, transparent 60%)` }} />
                <BookHeart className="w-10 h-10 mb-3 relative" style={{ color: ACCENT }} />
                <p className="text-white font-bold mb-1 relative">Sin reflexiones aún</p>
                <p className="text-sm text-zinc-400 relative">Escribí sobre tu relación, cómo te sentís y qué querés mejorar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reflections.map(r => (
                  <motion.div
                    key={r.id}
                    whileHover={{ scale: 1.01, y: -3 }}
                    whileTap={tapPhysics}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="neo-card flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl leading-none">{MOOD_EMOJI[r.mood]}</span>
                        <span
                          className="text-[10px] uppercase font-black tracking-[0.18em] px-3 py-1 rounded-full"
                          style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
                        >
                          {MOOD_LABEL[r.mood]}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteConfirmRefId(r.id)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        aria-label="Eliminar reflexión"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-sm font-medium leading-relaxed flex-1 text-white/85">{r.content}</p>
                    <p className="text-xs text-zinc-500">{formatTimestamp(r.created_at)}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ══ MODAL: NUEVA FECHA ESPECIAL ════════════════════════════════════ */}
      <AetherModal
        isOpen={isDateModalOpen}
        onClose={() => { setIsDateModalOpen(false); setFormError(null); setNewDate(DEFAULT_DATE); }}
        title="Nueva Fecha Especial"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-300 mb-4 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateDate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre de la fecha</label>
            <input
              type="text"
              required
              placeholder="Ej: Primer beso, Aniversario de novios…"
              value={newDate.title}
              onChange={e => setNewDate(d => ({ ...d, title: e.target.value }))}
              className="neo-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Tipo</label>
            <select
              value={newDate.type}
              onChange={e => setNewDate(d => ({ ...d, type: e.target.value as SpecialDate['type'] }))}
              className="neo-input appearance-none"
            >
              {(Object.entries(DATE_TYPE_LABEL) as [SpecialDate['type'], string][]).map(([val, label]) => (
                <option key={val} value={val} className="bg-zinc-900">{DATE_TYPE_ICON[val]} {label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Fecha</label>
            <input
              type="date"
              required
              value={newDate.date}
              onChange={e => setNewDate(d => ({ ...d, date: e.target.value }))}
              className="neo-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas (opcional)</label>
            <textarea
              rows={3}
              placeholder="Algún detalle especial sobre este día…"
              value={newDate.notes}
              onChange={e => setNewDate(d => ({ ...d, notes: e.target.value }))}
              className="neo-input resize-none"
            />
          </div>
          <motion.button
            type="submit"
            whileTap={tapPhysics}
            disabled={isSubmitting}
            className="neo-btn-accent mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}40` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar fecha'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ══ MODAL: NUEVA REFLEXIÓN ══════════════════════════════════════════ */}
      <AetherModal
        isOpen={isReflectionModalOpen}
        onClose={() => { setIsReflectionModalOpen(false); setFormError(null); setNewReflection(DEFAULT_REFLECTION); }}
        title="Nueva Reflexión"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-300 mb-4 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateReflection} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">¿Cómo te sentís?</label>
            <div className="flex gap-2.5 flex-wrap">
              {MOODS.map(m => {
                const active = newReflection.mood === m;
                return (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    key={m}
                    type="button"
                    onClick={() => setNewReflection(r => ({ ...r, mood: m }))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
                    style={{
                      background: active ? `${ACCENT}20` : 'rgba(255,255,255,0.04)',
                      border:     active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.08)',
                      color:      active ? ACCENT : '#A1A1AA',
                    }}
                  >
                    <span>{MOOD_EMOJI[m]}</span>
                    <span>{MOOD_LABEL[m]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Reflexión</label>
            <textarea
              rows={5}
              required
              placeholder="¿Qué querés recordar hoy sobre tu relación? ¿Algo que agradecer, mejorar, o simplemente sentiste…"
              value={newReflection.content}
              onChange={e => setNewReflection(r => ({ ...r, content: e.target.value }))}
              className="neo-input resize-none"
            />
          </div>
          <motion.button
            type="submit"
            whileTap={tapPhysics}
            disabled={isSubmitting}
            className="neo-btn-accent mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}40` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar reflexión'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ══ MODAL: CONFIRMAR ELIMINACIÓN DE FECHA ══════════════════════════ */}
      <AetherModal
        isOpen={!!deleteConfirmDate}
        onClose={() => setDeleteConfirmDate(null)}
        title="Eliminar fecha"
      >
        <p className="text-sm text-white/85 mb-6">
          ¿Seguro que querés eliminar <strong className="text-white">{deleteConfirmDate?.title}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileTap={tapPhysics}
            onClick={() => setDeleteConfirmDate(null)}
            className="flex-1 neo-btn"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={tapPhysics}
            onClick={handleDeleteDate}
            disabled={isSubmitting}
            className="flex-1 neo-btn-accent disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#EF4444', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </motion.button>
        </div>
      </AetherModal>

      {/* ══ MODAL: CONFIRMAR ELIMINACIÓN DE REFLEXIÓN ══════════════════════ */}
      <AetherModal
        isOpen={!!deleteConfirmRefId}
        onClose={() => setDeleteConfirmRefId(null)}
        title="Eliminar reflexión"
      >
        <p className="text-sm text-white/85 mb-6">¿Seguro que querés eliminar esta reflexión? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <motion.button
            whileTap={tapPhysics}
            onClick={() => setDeleteConfirmRefId(null)}
            className="flex-1 neo-btn"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={tapPhysics}
            onClick={handleDeleteReflection}
            disabled={isSubmitting}
            className="flex-1 neo-btn-accent disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#EF4444', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </motion.button>
        </div>
      </AetherModal>
    </AuraLayout>
  );
}
