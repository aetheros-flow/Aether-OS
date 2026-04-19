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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// ── Constants ─────────────────────────────────────────────────────────────────

type TabType = 'dashboard' | 'arbol' | 'fechas' | 'notas';

const THEME = {
  bg:       '#C81CDE',
  surface:  '#FFFFFF',
  accent:   '#C81CDE',
  textMain: '#FFFFFF',
  textDark: '#2D2A26',
  textMuted:'#8A8681',
  light:    '#F9F0FC',
  lightBorder: '#EDD6F5',
};

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

// ── Relationship color palette ────────────────────────────────────────────────
const RELATIONSHIP_COLORS: Record<string, string> = {
  Madre:    '#FF6B6B',
  Padre:    '#4ECDC4',
  Hermano:  '#45B7D1',
  Hermana:  '#F7DC6F',
  Abuelo:   '#BB8FCE',
  Abuela:   '#F1948A',
  Hijo:     '#82E0AA',
  Hija:     '#F0B27A',
  Pareja:   '#C81CDE',
  Tío:      '#7FB3D3',
  Tía:      '#E59866',
  Primo:    '#58D68D',
  Prima:    '#EC407A',
  Suegro:   '#7986CB',
  Suegra:   '#F48FB1',
  Cuñado:   '#4DB6AC',
  Cuñada:   '#FFB74D',
  Sobrino:  '#4DD0E1',
  Sobrina:  '#AED581',
  Otro:     '#90A4AE',
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white selection:text-black"
      style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
    >

      {/* ── SIDEBAR ───────────────────────────────────────────────────────────── */}
      <nav
        className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r border-white/10"
        style={{ backgroundColor: THEME.bg }}
      >
        <div className="flex items-center gap-4 p-6 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="aether-title text-white">Familia</h1>
            <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Hogar & Raíces</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <UniverseNavItem icon={LayoutDashboard} label="Resumen"          isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem icon={Users}           label="Árbol Familiar"   isActive={activeTab === 'arbol'}     onClick={() => handleTabChange('arbol')} />
          <UniverseNavItem icon={CalendarHeart}   label="Fechas & Tradiciones" isActive={activeTab === 'fechas'} onClick={() => handleTabChange('fechas')} />
          <UniverseNavItem icon={NotebookText}    label="Notas Familiares" isActive={activeTab === 'notas'}     onClick={() => handleTabChange('notas')} />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-20 md:pb-0">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="aether-eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {activeTab === 'dashboard'  ? 'Miembros Familiares'   :
               activeTab === 'arbol'     ? 'Árbol Familiar'         :
               activeTab === 'fechas'    ? 'Fechas & Tradiciones'   :
                                           'Notas Familiares'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="aether-metric-xl text-white">
                {activeTab === 'dashboard'  ? members.length    :
                 activeTab === 'arbol'      ? members.length    :
                 activeTab === 'fechas'     ? traditions.length :
                                              notes.length}
              </span>
              <span className="text-xl font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {activeTab === 'dashboard'  ? ' personas' :
                 activeTab === 'arbol'      ? ' miembros'  :
                 activeTab === 'fechas'     ? ' tradiciones' :
                                              ' notas'}
              </span>
            </div>
          </div>

          {activeTab !== 'dashboard' && (
            <button
              onClick={() => {
                if (activeTab === 'arbol')  openAddMember();
                if (activeTab === 'fechas') openAddTradition();
                if (activeTab === 'notas')  setIsNoteModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 text-sm shadow-xl"
              style={{ backgroundColor: THEME.surface, color: THEME.accent }}
            >
              <Plus size={18} />
              {activeTab === 'arbol'  ? 'Agregar Miembro'   :
               activeTab === 'fechas' ? 'Nueva Tradición'    :
                                        'Nueva Nota'}
            </button>
          )}
        </header>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: DASHBOARD                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Miembros</span>
                </div>
                <span className="aether-metric-md">{members.length}</span>
                <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>en tu árbol familiar</p>
              </div>

              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Cake size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Próximo Evento</span>
                </div>
                {nextEvent ? (
                  <>
                    <span className="aether-metric-md">{nextEvent.daysUntil === 0 ? '¡Hoy!' : `${nextEvent.daysUntil}d`}</span>
                    <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>
                      {nextEvent.daysUntil === 0 ? `¡Cumpleaños de ${nextEvent.name}!` : `Cumpleaños de ${nextEvent.name}`}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="aether-metric-md">—</span>
                    <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>sin eventos próximos</p>
                  </>
                )}
              </div>

              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Star size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Tradiciones</span>
                </div>
                <span className="aether-metric-md">{traditions.length}</span>
                <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>tradiciones activas</p>
              </div>
            </div>

            {/* Upcoming birthdays */}
            {upcomingBirthdays.length > 0 && (
              <div className="aether-card">
                <div className="flex items-center gap-2 mb-5">
                  <Cake size={18} style={{ color: THEME.accent }} />
                  <h3 className="text-sm font-bold tracking-wide" style={{ color: THEME.textDark }}>Cumpleaños próximos</h3>
                  <span className="ml-auto aether-eyebrow px-3 py-1 rounded-lg bg-gray-50">próximos 30 días</span>
                </div>
                <div className="flex flex-col gap-3">
                  {upcomingBirthdays.map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-3 rounded-2xl" style={{ backgroundColor: THEME.light }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? THEME.accent }}
                      >
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: THEME.textDark }}>{m.name}</p>
                        <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>{m.relationship} · {formatDate(m.birthday!)}</p>
                      </div>
                      <div
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: m.daysUntil === 0 ? THEME.accent : m.daysUntil <= 7 ? '#FEF9C3' : THEME.light,
                          color: m.daysUntil === 0 ? '#FFF' : m.daysUntil <= 7 ? '#713F12' : THEME.textMuted,
                        }}
                      >
                        {m.daysUntil === 0 ? '¡Hoy!' : `${m.daysUntil}d`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent members + traditions side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent members */}
              <div className="aether-card">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users size={18} style={{ color: THEME.accent }} />
                    <h3 className="text-sm font-bold tracking-wide" style={{ color: THEME.textDark }}>Árbol Familiar</h3>
                  </div>
                  <button
                    onClick={() => handleTabChange('arbol')}
                    className="flex items-center gap-1 text-xs font-bold transition-colors"
                    style={{ color: THEME.accent }}
                  >
                    Ver todos <ChevronRight size={14} />
                  </button>
                </div>
                {members.length === 0 ? (
                  <EmptySlate icon={<Users size={32} className="opacity-30" />} text="Agrega tu primer miembro familiar" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? THEME.accent }}
                        >
                          {getInitials(m.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: THEME.textDark }}>{m.name}</p>
                          <p className="text-xs" style={{ color: THEME.textMuted }}>{m.relationship}</p>
                        </div>
                        {m.birthday && (
                          <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>{formatDate(m.birthday)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Traditions */}
              <div className="aether-card">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Star size={18} style={{ color: THEME.accent }} />
                    <h3 className="text-sm font-bold tracking-wide" style={{ color: THEME.textDark }}>Tradiciones</h3>
                  </div>
                  <button
                    onClick={() => handleTabChange('fechas')}
                    className="flex items-center gap-1 text-xs font-bold transition-colors"
                    style={{ color: THEME.accent }}
                  >
                    Ver todas <ChevronRight size={14} />
                  </button>
                </div>
                {traditions.length === 0 ? (
                  <EmptySlate icon={<Star size={32} className="opacity-30" />} text="Registra vuestra primera tradición familiar" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {traditionsWithCountdown.slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: THEME.light }}>
                          <Star size={16} style={{ color: THEME.accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: THEME.textDark }}>{t.name}</p>
                          <p className="text-xs" style={{ color: THEME.textMuted }}>{t.frequency}</p>
                        </div>
                        {t.daysUntil !== null && (
                          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.light, color: THEME.accent }}>
                            {t.daysUntil <= 0 ? '¡Ya!' : `${t.daysUntil}d`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick note access */}
            {notes.length > 0 && (
              <div className="aether-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <NotebookText size={18} style={{ color: THEME.accent }} />
                    <h3 className="text-sm font-bold tracking-wide" style={{ color: THEME.textDark }}>Última nota familiar</h3>
                  </div>
                  <button
                    onClick={() => handleTabChange('notas')}
                    className="flex items-center gap-1 text-xs font-bold"
                    style={{ color: THEME.accent }}
                  >
                    Ver todas <ChevronRight size={14} />
                  </button>
                </div>
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: THEME.textDark }}>{notes[0].content}</p>
                <p className="text-xs mt-3" style={{ color: THEME.textMuted }}>
                  {new Date(notes[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ÁRBOL FAMILIAR                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'arbol' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {members.length === 0 ? (
              <EmptyState
                icon={<Users size={48} />}
                title="Tu árbol familiar está vacío"
                description="Agrega los miembros de tu familia para llevar un registro de fechas importantes y mantener el vínculo."
                action={{ label: 'Agregar primer miembro', onClick: openAddMember }}
                accentColor={THEME.accent}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {members.map(m => {
                  const days = getDaysUntilBirthday(m.birthday);
                  const hasBirthdaySoon = days !== null && days <= 30;
                  return (
                    <div key={m.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shrink-0"
                            style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? THEME.accent }}
                          >
                            {getInitials(m.name)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold leading-tight" style={{ color: THEME.textDark }}>{m.name}</h3>
                            <span
                              className="aether-eyebrow px-2 py-0.5 rounded-md inline-block mt-0.5"
                              style={{ backgroundColor: THEME.light, color: THEME.accent }}
                            >
                              {m.relationship}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditMember(m)}
                            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                            style={{ color: THEME.textMuted }}
                            aria-label="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'member', id: m.id })}
                            className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            style={{ color: THEME.textMuted }}
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {m.birthday && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: hasBirthdaySoon ? '#FEF9C3' : THEME.light }}>
                          <Cake size={14} style={{ color: hasBirthdaySoon ? '#CA8A04' : THEME.textMuted }} />
                          <span className="text-xs font-medium" style={{ color: hasBirthdaySoon ? '#713F12' : THEME.textMuted }}>
                            {formatFullDate(m.birthday)}
                          </span>
                          {hasBirthdaySoon && (
                            <span className="ml-auto text-xs font-bold" style={{ color: '#CA8A04' }}>
                              {days === 0 ? '¡Hoy!' : `en ${days}d`}
                            </span>
                          )}
                        </div>
                      )}

                      {m.notes && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>{m.notes}</p>
                      )}
                    </div>
                  );
                })}

                {/* Add card */}
                <button
                  onClick={openAddMember}
                  className="aether-card border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 transition-all hover:border-solid"
                  style={{ borderColor: THEME.lightBorder }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: THEME.light }}>
                    <Plus size={22} style={{ color: THEME.accent }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: THEME.accent }}>Agregar miembro</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: FECHAS & TRADICIONES                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'fechas' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Birthdays section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Cake size={20} className="text-white/70" />
                <h2 className="text-base font-bold text-white/90">Cumpleaños</h2>
                <span className="aether-eyebrow px-2 py-0.5 rounded-md ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {members.filter(m => m.birthday).length} registrados
                </span>
              </div>
              {members.filter(m => m.birthday).length === 0 ? (
                <div className="aether-card py-8">
                  <EmptySlate icon={<Cake size={32} className="opacity-30" />} text="Los cumpleaños se mostrarán aquí cuando agregues miembros con fecha de nacimiento." />
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
                        <div
                          key={m.id}
                          className="aether-card flex items-center gap-4"
                          style={{ borderLeft: `4px solid ${isToday ? THEME.accent : isSoon ? '#EAB308' : THEME.lightBorder}` }}
                        >
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ backgroundColor: RELATIONSHIP_COLORS[m.relationship] ?? THEME.accent }}
                          >
                            {getInitials(m.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: THEME.textDark }}>{m.name}</p>
                            <p className="text-xs" style={{ color: THEME.textMuted }}>{m.relationship} · {formatDate(m.birthday!)}</p>
                          </div>
                          {days !== null && (
                            <div
                              className="shrink-0 text-center px-3 py-2 rounded-xl"
                              style={{ backgroundColor: isToday ? THEME.accent : isSoon ? '#FEF9C3' : THEME.light }}
                            >
                              <p className="text-xs font-bold" style={{ color: isToday ? '#FFF' : isSoon ? '#713F12' : THEME.textMuted }}>
                                {isToday ? '¡HOY!' : `${days}d`}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            {/* Traditions section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Star size={20} className="text-white/70" />
                <h2 className="text-base font-bold text-white/90">Tradiciones Familiares</h2>
                <button
                  onClick={openAddTradition}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF' }}
                >
                  <Plus size={14} /> Nueva
                </button>
              </div>

              {traditions.length === 0 ? (
                <EmptyState
                  icon={<Star size={48} />}
                  title="Sin tradiciones registradas"
                  description="Documenta las tradiciones que unen a tu familia — la cena navideña, el viaje anual, el asado del domingo…"
                  action={{ label: 'Registrar primera tradición', onClick: openAddTradition }}
                  accentColor={THEME.accent}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {traditionsWithCountdown.map(t => (
                    <div key={t.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: THEME.light }}>
                            <Heart size={18} style={{ color: THEME.accent }} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold" style={{ color: THEME.textDark }}>{t.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <RefreshCw size={11} style={{ color: THEME.textMuted }} />
                              <span className="text-xs" style={{ color: THEME.textMuted }}>{t.frequency}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEditTradition(t)} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: THEME.textMuted }} aria-label="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget({ type: 'tradition', id: t.id })} className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors" style={{ color: THEME.textMuted }} aria-label="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {t.last_date && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: THEME.textMuted }}>
                          <span>Última vez:</span>
                          <span className="font-medium">{formatFullDate(t.last_date)}</span>
                        </div>
                      )}

                      {t.nextDate && (
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ backgroundColor: (t.daysUntil ?? 999) <= 30 ? '#FEF9C3' : THEME.light }}
                        >
                          <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>Próxima vez</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: THEME.textDark }}>
                              {t.nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-lg"
                              style={{
                                backgroundColor: (t.daysUntil ?? 999) <= 0 ? THEME.accent : (t.daysUntil ?? 999) <= 30 ? '#EAB308' : THEME.accent,
                                color: '#FFF',
                              }}
                            >
                              {t.daysUntil === null ? '—' : t.daysUntil <= 0 ? '¡Ya!' : `${t.daysUntil}d`}
                            </span>
                          </div>
                        </div>
                      )}

                      {t.notes && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>{t.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: NOTAS FAMILIARES                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notas' && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {notes.length === 0 ? (
              <EmptyState
                icon={<NotebookText size={48} />}
                title="Sin notas familiares"
                description="Guarda acuerdos, metas compartidas, recuerdos o el acta de tu próxima reunión familiar."
                action={{ label: 'Escribir primera nota', onClick: () => setIsNoteModalOpen(true) }}
                accentColor={THEME.accent}
              />
            ) : (
              notes.map(n => (
                <div key={n.id} className="aether-card aether-card-interactive">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>
                      {new Date(n.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <button
                      onClick={() => setDeleteTarget({ type: 'note', id: n.id })}
                      className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      style={{ color: THEME.textMuted }}
                      aria-label="Eliminar nota"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: THEME.textDark }}>{n.content}</p>
                </div>
              ))
            )}
          </div>
        )}
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
            <label className="aether-eyebrow">Nombre completo</label>
            <input
              type="text"
              required
              placeholder="Ej. María García"
              value={memberForm.name}
              onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
              className="aether-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Relación familiar</label>
            <select
              value={memberForm.relationship}
              onChange={e => setMemberForm({ ...memberForm, relationship: e.target.value })}
              className="aether-input appearance-none"
            >
              {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Fecha de nacimiento <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <input
              type="date"
              value={memberForm.birthday}
              onChange={e => setMemberForm({ ...memberForm, birthday: e.target.value })}
              className="aether-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <textarea
              rows={3}
              placeholder="Algo que recordar sobre esta persona..."
              value={memberForm.notes}
              onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })}
              className="aether-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: THEME.accent, color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingMember ? 'Guardar Cambios' : 'Agregar al Árbol')}
          </button>
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
            <label className="aether-eyebrow">Nombre de la tradición</label>
            <input
              type="text"
              required
              placeholder="Ej. Cena de Navidad, Viaje de verano..."
              value={traditionForm.name}
              onChange={e => setTraditionForm({ ...traditionForm, name: e.target.value })}
              className="aether-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Frecuencia</label>
            <select
              value={traditionForm.frequency}
              onChange={e => setTraditionForm({ ...traditionForm, frequency: e.target.value })}
              className="aether-input appearance-none"
            >
              {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Última vez que ocurrió <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <input
              type="date"
              value={traditionForm.last_date}
              onChange={e => setTraditionForm({ ...traditionForm, last_date: e.target.value })}
              className="aether-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas <span className="normal-case font-normal opacity-60">(opcional)</span></label>
            <textarea
              rows={3}
              placeholder="Detalles, personas involucradas, lugar..."
              value={traditionForm.notes}
              onChange={e => setTraditionForm({ ...traditionForm, notes: e.target.value })}
              className="aether-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: THEME.accent, color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTradition ? 'Guardar Cambios' : 'Registrar Tradición')}
          </button>
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
            <label className="aether-eyebrow">Contenido</label>
            <textarea
              rows={6}
              required
              placeholder="Escribe aquí acuerdos, metas, recuerdos o el resumen de una reunión familiar..."
              value={noteForm.content}
              onChange={e => setNoteForm({ content: e.target.value })}
              className="aether-input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !noteForm.content.trim()}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: THEME.accent, color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Nota'}
          </button>
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
        <p className="text-sm mb-6" style={{ color: THEME.textMuted }}>
          {deleteTarget?.type === 'member'    ? 'Este miembro se eliminará de tu árbol familiar.' :
           deleteTarget?.type === 'tradition' ? 'Esta tradición familiar será eliminada permanentemente.' :
                                                'Esta nota será eliminada permanentemente.'}
          {' '}Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 aether-btn"
            style={{ backgroundColor: '#F4F9F2', color: THEME.textDark }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            disabled={isSubmitting}
            className="flex-1 aether-btn disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FF4D4F', color: '#FFF' }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
          </button>
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
        activeColor="#E879F9"
        bgColor="#9C14B0"
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptySlate({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div style={{ color: '#D1C4D8' }}>{icon}</div>
      <p className="text-sm font-medium max-w-xs" style={{ color: '#9CA3AF' }}>{text}</p>
    </div>
  );
}

function EmptyState({
  icon, title, description, action, accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: { label: string; onClick: () => void };
  accentColor: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-20 rounded-[32px] border-2 border-dashed"
      style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.08)' }}
    >
      <div className="mb-4 text-white/30">{icon}</div>
      <h3 className="aether-title text-white mb-2">{title}</h3>
      <p className="text-sm max-w-xs mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>{description}</p>
      <button
        onClick={action.onClick}
        className="flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 text-sm shadow-xl"
        style={{ backgroundColor: '#FFF', color: accentColor }}
      >
        <Plus size={16} /> {action.label}
      </button>
    </div>
  );
}
