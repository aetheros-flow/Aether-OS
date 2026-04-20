import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  CalendarHeart,
  NotebookText,
  Plus,
  Loader2,
  Cake,
  Star,
  RefreshCw,
  Trash2,
  Pencil,
  ChevronRight,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { toast } from 'sonner';

import { useFamiliaData } from '../hooks/useFamiliaData';
import type {
  FamiliaMember,
  FamiliaTradition,
  NewMemberInput,
  NewTraditionInput,
  NewNoteInput,
} from '../types';
import { RELATIONSHIP_OPTIONS, FREQUENCY_OPTIONS } from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'arbol' | 'fechas' | 'notas';

// ── Neo-Dark accent ───────────────────────────────────────────────────────────
const ACCENT = '#C81CDE';
const ACCENT_SOFT = '#E879F9';

// ── Motion physics ────────────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' };
const hoverPhysics = { scale: 1.01 };

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_MEMBER: NewMemberInput = {
  name: '',
  relationship: 'Madre',
  birthday: '',
  notes: '',
};

const DEFAULT_TRADITION: NewTraditionInput = {
  name: '',
  frequency: 'Anual',
  last_date: '',
  notes: '',
};

const DEFAULT_NOTE: NewNoteInput = { content: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysUntilBirthday(birthday: string | null): number | null {
  if (!birthday) return null;
  const today = new Date();
  const bday  = new Date(birthday);
  const next  = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.setHours(0, 0, 0, 0)) / 86_400_000);
}

function getNextTraditionDate(lastDate: string | null, frequency: string): Date | null {
  if (!lastDate) return null;
  const last = new Date(lastDate);
  const next = new Date(last);
  switch (frequency) {
    case 'Semanal':     next.setDate(last.getDate() + 7);   break;
    case 'Mensual':     next.setMonth(last.getMonth() + 1); break;
    case 'Trimestral':  next.setMonth(last.getMonth() + 3); break;
    case 'Semestral':   next.setMonth(last.getMonth() + 6); break;
    case 'Anual':       next.setFullYear(last.getFullYear() + 1); break;
    default:            return null;
  }
  return next;
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Relationship color palette (neon-tuned for dark bg) ──────────────────────
const RELATIONSHIP_COLORS: Record<string, string> = {
  Madre:    '#FB7185',
  Padre:    '#22D3EE',
  Hermano:  '#60A5FA',
  Hermana:  '#FACC15',
  Abuelo:   '#A78BFA',
  Abuela:   '#F472B6',
  Hijo:     '#34D399',
  Hija:     '#FB923C',
  Pareja:   '#E879F9',
  Tío:      '#7DD3FC',
  Tía:      '#FDBA74',
  Primo:    '#86EFAC',
  Prima:    '#F472B6',
  Suegro:   '#818CF8',
  Suegra:   '#F9A8D4',
  Cuñado:   '#5EEAD4',
  Cuñada:   '#FCD34D',
  Sobrino:  '#67E8F9',
  Sobrina:  '#BEF264',
  Otro:     '#94A3B8',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FamiliaDashboard() {
  const navigate  = useNavigate();
  const {
    members, traditions, notes, loading,
    createMember, updateMember, deleteMember,
    createTradition, updateTradition, deleteTradition,
    createNote, deleteNote,
  } = useFamiliaData();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<TabType>('dashboard');
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  // Member modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember,     setEditingMember]     = useState<FamiliaMember | null>(null);
  const [memberForm,        setMemberForm]        = useState<NewMemberInput>(DEFAULT_MEMBER);

  // Tradition modal
  const [isTraditionModalOpen, setIsTraditionModalOpen] = useState(false);
  const [editingTradition,     setEditingTradition]     = useState<FamiliaTradition | null>(null);
  const [traditionForm,        setTraditionForm]        = useState<NewTraditionInput>(DEFAULT_TRADITION);

  // Note modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm,        setNoteForm]        = useState<NewNoteInput>(DEFAULT_NOTE);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'member' | 'tradition' | 'note'; id: string } | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const upcomingBirthdays = useMemo(() =>
    members
      .filter(m => m.birthday !== null)
      .map(m => ({ ...m, daysUntil: getDaysUntilBirthday(m.birthday) ?? 999 }))
      .filter(m => m.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil),
    [members]
  );

  const nextEvent = useMemo(() => {
    if (upcomingBirthdays.length === 0) return null;
    return upcomingBirthdays[0];
  }, [upcomingBirthdays]);

  const traditionsWithCountdown = useMemo(() =>
    traditions.map(t => {
      const nextDate = getNextTraditionDate(t.last_date, t.frequency);
      return { ...t, nextDate, daysUntil: nextDate ? daysUntil(nextDate) : null };
    }),
    [traditions]
  );

  // ── AI Insight heuristic ──────────────────────────────────────────────────
  const aiInsight = useMemo(() => {
    if (members.length === 0) {
      return 'Tu árbol familiar está vacío. Empieza por mapear las raíces que te sostienen.';
    }
    if (nextEvent && nextEvent.daysUntil === 0) {
      return `¡Hoy es el cumpleaños de ${nextEvent.name}! Una llamada hoy vale más que un regalo tarde.`;
    }
    if (nextEvent && nextEvent.daysUntil <= 7) {
      return `${nextEvent.name} cumple en ${nextEvent.daysUntil} día${nextEvent.daysUntil === 1 ? '' : 's'}. Planifica algo: presencia > regalo.`;
    }
    const overdueTraditions = traditionsWithCountdown.filter(t => t.daysUntil !== null && t.daysUntil < 0).length;
    if (overdueTraditions >= 2) {
      return `${overdueTraditions} tradiciones vencidas. Las tradiciones mueren cuando las dejamos morir.`;
    }
    if (members.filter(m => m.birthday).length < members.length / 2) {
      return 'Más de la mitad de tu familia no tiene cumpleaños registrado. Las fechas son anclas de presencia.';
    }
    return `${members.length} miembros, ${traditions.length} tradiciones. La familia es la primera comunidad y el último refugio.`;
  }, [members, nextEvent, traditionsWithCountdown, traditions]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Member
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm(DEFAULT_MEMBER);
    setIsMemberModalOpen(true);
  };

  const openEditMember = (m: FamiliaMember) => {
    setEditingMember(m);
    setMemberForm({ name: m.name, relationship: m.relationship, birthday: m.birthday ?? '', notes: m.notes ?? '' });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMember) {
        await updateMember(editingMember.id, memberForm);
        toast.success('Miembro actualizado');
      } else {
        await createMember(memberForm);
        toast.success('Miembro agregado a tu árbol familiar');
      }
      setIsMemberModalOpen(false);
      setMemberForm(DEFAULT_MEMBER);
      setEditingMember(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tradition
  const openAddTradition = () => {
    setEditingTradition(null);
    setTraditionForm(DEFAULT_TRADITION);
    setIsTraditionModalOpen(true);
  };

  const openEditTradition = (t: FamiliaTradition) => {
    setEditingTradition(t);
    setTraditionForm({ name: t.name, frequency: t.frequency, last_date: t.last_date ?? '', notes: t.notes ?? '' });
    setIsTraditionModalOpen(true);
  };

  const handleSaveTradition = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTradition) {
        await updateTradition(editingTradition.id, traditionForm);
        toast.success('Tradición actualizada');
      } else {
        await createTradition(traditionForm);
        toast.success('Tradición familiar registrada');
      }
      setIsTraditionModalOpen(false);
      setTraditionForm(DEFAULT_TRADITION);
      setEditingTradition(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note
  const handleSaveNote = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;
    setIsSubmitting(true);
    try {
      await createNote(noteForm);
      toast.success('Nota guardada');
      setIsNoteModalOpen(false);
      setNoteForm(DEFAULT_NOTE);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === 'member')    await deleteMember(deleteTarget.id);
      if (deleteTarget.type === 'tradition') await deleteTradition(deleteTarget.id);
      if (deleteTarget.type === 'note')      await deleteNote(deleteTarget.id);
      toast.success('Eliminado correctamente');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading && members.length === 0 && traditions.length === 0 && notes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT_SOFT }} />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-black text-white relative overflow-hidden selection:bg-fuchsia-500/30">
      {/* ── Background glows ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-[0.20] blur-[120px]"
          style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full opacity-[0.14] blur-[140px]"
          style={{ background: `radial-gradient(circle, ${ACCENT_SOFT}, transparent 70%)` }}
        />
      </div>

      <UniverseMobileHeader title="Familia" subtitle="Raíces & Vínculos" color="#0A0A0A" />

      {/* ── SIDEBAR ───────────────────────────────────────────────────────────── */}
      <nav className="hidden md:flex md:w-64 flex-col z-30 shrink-0 bg-black/40 backdrop-blur-xl border-r border-white/5 relative">
        <div className="flex items-center gap-4 p-6 mb-4">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={hoverPhysics}
            whileTap={tapPhysics}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="font-serif text-2xl tracking-tight text-white">Familia</h1>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Hogar & Raíces</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-6">
          <UniverseNavItem accent={ACCENT_SOFT} icon={LayoutDashboard} label="Resumen"          isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={Users}           label="Árbol Familiar"   isActive={activeTab === 'arbol'}     onClick={() => handleTabChange('arbol')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={CalendarHeart}   label="Fechas & Tradiciones" isActive={activeTab === 'fechas'} onClick={() => handleTabChange('fechas')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={NotebookText}    label="Notas Familiares" isActive={activeTab === 'notas'}     onClick={() => handleTabChange('notas')} />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-14 md:pt-10 pb-20 md:pb-0 relative z-10">

        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* ── HEADER ── */}
          <motion.header variants={itemVariants} className="mb-7 md:mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {activeTab !== 'dashboard' && (
                <motion.button
                  whileHover={hoverPhysics}
                  whileTap={tapPhysics}
                  onClick={() => {
                    if (activeTab === 'arbol')  openAddMember();
                    if (activeTab === 'fechas') openAddTradition();
                    if (activeTab === 'notas')  setIsNoteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs"
                  style={{ backgroundColor: ACCENT_SOFT, color: '#000', boxShadow: `0 0 24px ${ACCENT_SOFT}60` }}
                >
                  <Plus size={13} strokeWidth={3} />
                  {activeTab === 'arbol' ? 'Agregar Miembro' : activeTab === 'fechas' ? 'Nueva Tradición' : 'Nueva Nota'}
                </motion.button>
              )}
            </div>
            <h2 className="font-serif font-medium mb-5 text-white tracking-tight" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', lineHeight: 1.05 }}>
              {activeTab === 'dashboard' ? 'Tu familia' :
               activeTab === 'arbol'     ? 'Árbol familiar' :
               activeTab === 'fechas'    ? 'Fechas & tradiciones' :
               'Notas familiares'}
            </h2>

            {/* AI Insight strip */}
            <div className="neo-card neo-card-lg flex items-start gap-4">
              <div className="p-2.5 rounded-2xl shrink-0" style={{ background: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}40` }}>
                <Sparkles size={18} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 8px ${ACCENT_SOFT}80)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1.5">Aether Insight</p>
                <p className="text-[15px] leading-relaxed text-white/90">{aiInsight}</p>
              </div>
            </div>
          </motion.header>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: DASHBOARD                                                     */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-6">

              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                      <Users size={16} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 6px ${ACCENT_SOFT}80)` }} />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Miembros</span>
                  </div>
                  <span className="text-5xl font-bold tracking-tight text-white">{members.length}</span>
                  <p className="text-xs font-medium text-zinc-400">en tu árbol familiar</p>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                      <Cake size={16} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 6px ${ACCENT_SOFT}80)` }} />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Próximo Evento</span>
                  </div>
                  {nextEvent ? (
                    <>
                      <span className="text-5xl font-bold tracking-tight text-white">{nextEvent.daysUntil === 0 ? '¡Hoy!' : `${nextEvent.daysUntil}d`}</span>
                      <p className="text-xs font-medium text-zinc-400">
                        {nextEvent.daysUntil === 0 ? `¡Cumpleaños de ${nextEvent.name}!` : `Cumpleaños de ${nextEvent.name}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-bold tracking-tight text-zinc-700">—</span>
                      <p className="text-xs font-medium text-zinc-500">sin eventos próximos</p>
                    </>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                      <Star size={16} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 6px ${ACCENT_SOFT}80)` }} />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Tradiciones</span>
                  </div>
                  <span className="text-5xl font-bold tracking-tight text-white">{traditions.length}</span>
                  <p className="text-xs font-medium text-zinc-400">tradiciones activas</p>
                </motion.div>
              </div>

              {/* Upcoming birthdays */}
              {upcomingBirthdays.length > 0 && (
                <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                  <div className="flex items-center gap-2 mb-5">
                    <Cake size={18} style={{ color: ACCENT_SOFT }} />
                    <h3 className="font-serif text-lg text-white tracking-tight">Cumpleaños próximos</h3>
                    <span className="ml-auto text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">próximos 30 días</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {upcomingBirthdays.map(m => (
                      <div key={m.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT, boxShadow: `0 0 12px ${RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT}50` }}
                        >
                          {getInitials(m.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-white">{m.name}</p>
                          <p className="text-xs font-medium text-zinc-500">{m.relationship} · {formatDate(m.birthday!)}</p>
                        </div>
                        <div
                          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: m.daysUntil === 0 ? ACCENT_SOFT : m.daysUntil <= 7 ? '#FBBF2422' : 'rgba(255,255,255,0.05)',
                            color: m.daysUntil === 0 ? '#000' : m.daysUntil <= 7 ? '#FBBF24' : '#A1A1AA',
                            border: `1px solid ${m.daysUntil === 0 ? ACCENT_SOFT : m.daysUntil <= 7 ? '#FBBF2440' : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          {m.daysUntil === 0 ? '¡Hoy!' : `${m.daysUntil}d`}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent members + traditions side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent members */}
                <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Users size={18} style={{ color: ACCENT_SOFT }} />
                      <h3 className="font-serif text-lg text-white tracking-tight">Árbol Familiar</h3>
                    </div>
                    <motion.button
                      whileTap={tapPhysics}
                      onClick={() => handleTabChange('arbol')}
                      className="flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase"
                      style={{ color: ACCENT_SOFT }}
                    >
                      Ver todos <ChevronRight size={14} />
                    </motion.button>
                  </div>
                  {members.length === 0 ? (
                    <EmptySlate icon={<Users size={32} className="text-zinc-600" />} text="Agrega tu primer miembro familiar" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {members.slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT }}
                          >
                            {getInitials(m.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-white">{m.name}</p>
                            <p className="text-xs text-zinc-500">{m.relationship}</p>
                          </div>
                          {m.birthday && (
                            <span className="text-xs font-medium text-zinc-500">{formatDate(m.birthday)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Traditions */}
                <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Star size={18} style={{ color: ACCENT_SOFT }} />
                      <h3 className="font-serif text-lg text-white tracking-tight">Tradiciones</h3>
                    </div>
                    <motion.button
                      whileTap={tapPhysics}
                      onClick={() => handleTabChange('fechas')}
                      className="flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase"
                      style={{ color: ACCENT_SOFT }}
                    >
                      Ver todas <ChevronRight size={14} />
                    </motion.button>
                  </div>
                  {traditions.length === 0 ? (
                    <EmptySlate icon={<Star size={32} className="text-zinc-600" />} text="Registra vuestra primera tradición familiar" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {traditionsWithCountdown.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                            <Star size={16} style={{ color: ACCENT_SOFT }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-white">{t.name}</p>
                            <p className="text-xs text-zinc-500">{t.frequency}</p>
                          </div>
                          {t.daysUntil !== null && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${ACCENT_SOFT}1A`, color: ACCENT_SOFT, border: `1px solid ${ACCENT_SOFT}40` }}>
                              {t.daysUntil <= 0 ? '¡Ya!' : `${t.daysUntil}d`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Quick note access */}
              {notes.length > 0 && (
                <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <NotebookText size={18} style={{ color: ACCENT_SOFT }} />
                      <h3 className="font-serif text-lg text-white tracking-tight">Última nota familiar</h3>
                    </div>
                    <motion.button
                      whileTap={tapPhysics}
                      onClick={() => handleTabChange('notas')}
                      className="flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase"
                      style={{ color: ACCENT_SOFT }}
                    >
                      Ver todas <ChevronRight size={14} />
                    </motion.button>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3 text-white/90">{notes[0].content}</p>
                  <p className="text-xs mt-3 text-zinc-500">
                    {new Date(notes[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: ÁRBOL FAMILIAR                                                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'arbol' && (
            <motion.div variants={containerVariants}>
              {members.length === 0 ? (
                <EmptyState
                  icon={<Users size={48} />}
                  title="Tu árbol familiar está vacío"
                  description="Agrega los miembros de tu familia para llevar un registro de fechas importantes y mantener el vínculo."
                  action={{ label: 'Agregar primer miembro', onClick: openAddMember }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {members.map(m => {
                    const days = getDaysUntilBirthday(m.birthday);
                    const hasBirthdaySoon = days !== null && days <= 30;
                    return (
                      <motion.div key={m.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shrink-0"
                              style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT, boxShadow: `0 0 16px ${RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT}50` }}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold leading-tight text-white">{m.name}</h3>
                              <span
                                className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md inline-block mt-0.5"
                                style={{ backgroundColor: `${RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT}22`, color: RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT, border: `1px solid ${RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT}40` }}
                              >
                                {m.relationship}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <motion.button
                              whileTap={tapPhysics}
                              onClick={() => openEditMember(m)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil size={14} />
                            </motion.button>
                            <motion.button
                              whileTap={tapPhysics}
                              onClick={() => setDeleteTarget({ type: 'member', id: m.id })}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>

                        {m.birthday && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ backgroundColor: hasBirthdaySoon ? '#FBBF2418' : 'rgba(255,255,255,0.04)', border: `1px solid ${hasBirthdaySoon ? '#FBBF2440' : 'rgba(255,255,255,0.06)'}` }}
                          >
                            <Cake size={14} style={{ color: hasBirthdaySoon ? '#FBBF24' : '#71717A' }} />
                            <span className="text-xs font-medium" style={{ color: hasBirthdaySoon ? '#FBBF24' : '#A1A1AA' }}>
                              {formatFullDate(m.birthday)}
                            </span>
                            {hasBirthdaySoon && (
                              <span className="ml-auto text-xs font-bold" style={{ color: '#FBBF24' }}>
                                {days === 0 ? '¡Hoy!' : `en ${days}d`}
                              </span>
                            )}
                          </div>
                        )}

                        {m.notes && (
                          <p className="text-xs leading-relaxed line-clamp-2 text-zinc-400">{m.notes}</p>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Add card */}
                  <motion.button
                    variants={itemVariants}
                    whileHover={hoverPhysics}
                    whileTap={tapPhysics}
                    onClick={openAddMember}
                    className="rounded-[32px] border-2 border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-3 py-10 transition-all hover:border-solid hover:bg-white/[0.04]"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}40` }}>
                      <Plus size={22} style={{ color: ACCENT_SOFT }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: ACCENT_SOFT }}>Agregar miembro</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: FECHAS & TRADICIONES                                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'fechas' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-8">

              {/* Birthdays section */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                  <Cake size={18} className="text-zinc-400" />
                  <h2 className="font-serif text-lg text-white tracking-tight">Cumpleaños</h2>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 ml-auto">
                    {members.filter(m => m.birthday).length} registrados
                  </span>
                </div>
                {members.filter(m => m.birthday).length === 0 ? (
                  <div className="neo-card neo-card-lg py-8">
                    <EmptySlate icon={<Cake size={32} className="text-zinc-600" />} text="Los cumpleaños se mostrarán aquí cuando agregues miembros con fecha de nacimiento." />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {members
                      .filter(m => m.birthday)
                      .map(m => {
                        const days = getDaysUntilBirthday(m.birthday);
                        const isSoon  = days !== null && days <= 30;
                        const isToday = days === 0;
                        return (
                          <motion.div
                            key={m.id}
                            whileHover={hoverPhysics}
                            className="neo-card neo-card-lg flex items-center gap-4 !py-5"
                            style={{ borderLeft: `4px solid ${isToday ? ACCENT_SOFT : isSoon ? '#FBBF24' : 'rgba(255,255,255,0.1)'}` }}
                          >
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT, boxShadow: `0 0 12px ${RELATIONSHIP_COLORS[m.relationship] ?? ACCENT_SOFT}50` }}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-white">{m.name}</p>
                              <p className="text-xs text-zinc-500">{m.relationship} · {formatDate(m.birthday!)}</p>
                            </div>
                            {days !== null && (
                              <div
                                className="shrink-0 text-center px-3 py-2 rounded-xl"
                                style={{
                                  backgroundColor: isToday ? ACCENT_SOFT : isSoon ? '#FBBF2418' : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${isToday ? ACCENT_SOFT : isSoon ? '#FBBF2440' : 'rgba(255,255,255,0.08)'}`,
                                }}
                              >
                                <p className="text-xs font-bold" style={{ color: isToday ? '#000' : isSoon ? '#FBBF24' : '#A1A1AA' }}>
                                  {isToday ? '¡HOY!' : `${days}d`}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </motion.section>

              {/* Traditions section */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                  <Star size={18} className="text-zinc-400" />
                  <h2 className="font-serif text-lg text-white tracking-tight">Tradiciones Familiares</h2>
                  <motion.button
                    whileTap={tapPhysics}
                    onClick={openAddTradition}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${ACCENT_SOFT}1A`, color: ACCENT_SOFT, border: `1px solid ${ACCENT_SOFT}40` }}
                  >
                    <Plus size={14} /> Nueva
                  </motion.button>
                </div>

                {traditions.length === 0 ? (
                  <EmptyState
                    icon={<Star size={48} />}
                    title="Sin tradiciones registradas"
                    description="Documenta las tradiciones que unen a tu familia — la cena navideña, el viaje anual, el asado del domingo…"
                    action={{ label: 'Registrar primera tradición', onClick: openAddTradition }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {traditionsWithCountdown.map(t => (
                      <motion.div key={t.id} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                              <Heart size={18} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 6px ${ACCENT_SOFT}80)` }} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white">{t.name}</h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <RefreshCw size={11} className="text-zinc-500" />
                                <span className="text-xs text-zinc-500">{t.frequency}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <motion.button whileTap={tapPhysics} onClick={() => openEditTradition(t)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" aria-label="Editar">
                              <Pencil size={14} />
                            </motion.button>
                            <motion.button whileTap={tapPhysics} onClick={() => setDeleteTarget({ type: 'tradition', id: t.id })} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors" aria-label="Eliminar">
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>

                        {t.last_date && (
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>Última vez:</span>
                            <span className="font-medium text-zinc-400">{formatFullDate(t.last_date)}</span>
                          </div>
                        )}

                        {t.nextDate && (
                          <div
                            className="flex items-center justify-between px-3 py-2 rounded-xl"
                            style={{
                              backgroundColor: (t.daysUntil ?? 999) <= 30 ? '#FBBF2418' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${(t.daysUntil ?? 999) <= 30 ? '#FBBF2440' : 'rgba(255,255,255,0.06)'}`,
                            }}
                          >
                            <span className="text-xs font-medium text-zinc-400">Próxima vez</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white">
                                {t.nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                style={{
                                  backgroundColor: (t.daysUntil ?? 999) <= 0 ? ACCENT_SOFT : (t.daysUntil ?? 999) <= 30 ? '#FBBF24' : ACCENT_SOFT,
                                  color: '#000',
                                }}
                              >
                                {t.daysUntil === null ? '—' : t.daysUntil <= 0 ? '¡Ya!' : `${t.daysUntil}d`}
                              </span>
                            </div>
                          </div>
                        )}

                        {t.notes && (
                          <p className="text-xs leading-relaxed line-clamp-2 text-zinc-400">{t.notes}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB: NOTAS FAMILIARES                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'notas' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-5">
              {notes.length === 0 ? (
                <EmptyState
                  icon={<NotebookText size={48} />}
                  title="Sin notas familiares"
                  description="Guarda acuerdos, metas compartidas, recuerdos o el acta de tu próxima reunión familiar."
                  action={{ label: 'Escribir primera nota', onClick: () => setIsNoteModalOpen(true) }}
                />
              ) : (
                notes.map(n => (
                  <motion.div key={n.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-xs font-medium text-zinc-500">
                        {new Date(n.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <motion.button
                        whileTap={tapPhysics}
                        onClick={() => setDeleteTarget({ type: 'note', id: n.id })}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                        aria-label="Eliminar nota"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/90">{n.content}</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: AGREGAR / EDITAR MIEMBRO                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AetherModal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setEditingMember(null); setMemberForm(DEFAULT_MEMBER); }}
        title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro'}
      >
        <form onSubmit={handleSaveMember} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre completo</label>
            <input
              type="text" required placeholder="Ej. María García"
              value={memberForm.name}
              onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
              className="neo-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Relación familiar</label>
            <select
              value={memberForm.relationship}
              onChange={e => setMemberForm({ ...memberForm, relationship: e.target.value })}
              className="neo-input appearance-none"
            >
              {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Fecha de nacimiento <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <input
              type="date"
              value={memberForm.birthday}
              onChange={e => setMemberForm({ ...memberForm, birthday: e.target.value })}
              className="neo-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <textarea
              rows={3} placeholder="Algo que recordar sobre esta persona..."
              value={memberForm.notes}
              onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })}
              className="neo-input resize-none"
            />
          </div>

          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#000', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingMember ? 'Guardar Cambios' : 'Agregar al Árbol')}
          </motion.button>
        </form>
      </AetherModal>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: AGREGAR / EDITAR TRADICIÓN                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AetherModal
        isOpen={isTraditionModalOpen}
        onClose={() => { setIsTraditionModalOpen(false); setEditingTradition(null); setTraditionForm(DEFAULT_TRADITION); }}
        title={editingTradition ? 'Editar Tradición' : 'Nueva Tradición'}
      >
        <form onSubmit={handleSaveTradition} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre de la tradición</label>
            <input
              type="text" required placeholder="Ej. Cena de Navidad, Viaje de verano..."
              value={traditionForm.name}
              onChange={e => setTraditionForm({ ...traditionForm, name: e.target.value })}
              className="neo-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Frecuencia</label>
            <select
              value={traditionForm.frequency}
              onChange={e => setTraditionForm({ ...traditionForm, frequency: e.target.value })}
              className="neo-input appearance-none"
            >
              {FREQUENCY_OPTIONS.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Última vez que ocurrió <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <input
              type="date"
              value={traditionForm.last_date}
              onChange={e => setTraditionForm({ ...traditionForm, last_date: e.target.value })}
              className="neo-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <textarea
              rows={3} placeholder="Detalles, personas involucradas, lugar..."
              value={traditionForm.notes}
              onChange={e => setTraditionForm({ ...traditionForm, notes: e.target.value })}
              className="neo-input resize-none"
            />
          </div>

          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#000', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTradition ? 'Guardar Cambios' : 'Registrar Tradición')}
          </motion.button>
        </form>
      </AetherModal>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: NUEVA NOTA                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AetherModal
        isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setNoteForm(DEFAULT_NOTE); }}
        title="Nueva Nota Familiar"
      >
        <form onSubmit={handleSaveNote} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Contenido</label>
            <textarea
              rows={6} required
              placeholder="Escribe aquí acuerdos, metas, recuerdos o el resumen de una reunión familiar..."
              value={noteForm.content}
              onChange={e => setNoteForm({ content: e.target.value })}
              className="neo-input resize-none"
            />
          </div>

          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting || !noteForm.content.trim()}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#000', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Nota'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AetherModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <p className="text-sm mb-6 text-zinc-400">
          {deleteTarget?.type === 'member'    ? 'Este miembro se eliminará de tu árbol familiar.' :
           deleteTarget?.type === 'tradition' ? 'Esta tradición familiar será eliminada permanentemente.' :
                                                'Esta nota será eliminada permanentemente.'}
          {' '}Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <motion.button
            whileTap={tapPhysics}
            onClick={() => setDeleteTarget(null)}
            className="flex-1 px-6 py-3.5 rounded-full font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileTap={tapPhysics}
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#EF4444', color: '#FFF', boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </motion.button>
        </div>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard', label: 'Resumen',  icon: LayoutDashboard },
          { id: 'arbol',     label: 'Árbol',    icon: Users           },
          { id: 'fechas',    label: 'Fechas',   icon: CalendarHeart   },
          { id: 'notas',     label: 'Notas',    icon: NotebookText    },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor={ACCENT_SOFT}
        bgColor="#0A0A0A"
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptySlate({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div>{icon}</div>
      <p className="text-sm font-medium max-w-xs text-zinc-500">{text}</p>
    </div>
  );
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
      <div className="mb-4 text-zinc-600">{icon}</div>
      <h3 className="font-serif text-2xl text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm max-w-xs mb-8 text-zinc-500">{description}</p>
      <motion.button
        whileHover={hoverPhysics}
        whileTap={tapPhysics}
        onClick={action.onClick}
        className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm"
        style={{ backgroundColor: ACCENT_SOFT, color: '#000', boxShadow: `0 0 32px ${ACCENT_SOFT}60` }}
      >
        <Plus size={16} /> {action.label}
      </motion.button>
    </div>
  );
}
