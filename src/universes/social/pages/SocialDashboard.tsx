import { useState, useMemo } from 'react';
import {
  ArrowLeft, LayoutDashboard, Users, CalendarDays, Globe2,
  Plus, Loader2, MapPin, Trash2, ToggleLeft, ToggleRight,
  Clock, MessageSquare, Check, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useSocialData } from '../hooks/useSocialData';
import type {
  NewContactInput, NewEventInput, NewCommunityInput,
  ContactCategory, EventType, CommunityType, ParticipationFrequency,
  SocialContact, SocialEvent,
} from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'contactos' | 'eventos' | 'comunidades';

// ── Neo-Dark accent ───────────────────────────────────────────────────────────
const ACCENT = '#1447E6';
const ACCENT_SOFT = '#3B82F6';

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

// ── Constants ─────────────────────────────────────────────────────────────────
const CONTACT_CATEGORIES: ContactCategory[] = ['Amigo', 'Mentor', 'Colega', 'Familiar', 'Conocido'];
const EVENT_TYPES: EventType[]               = ['Reunión', 'Fiesta', 'Networking', 'Deporte', 'Cultural', 'Otro'];
const COMMUNITY_TYPES: CommunityType[]       = ['Online', 'Presencial', 'Híbrido'];
const FREQUENCIES: ParticipationFrequency[]  = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

const CATEGORY_DOT: Record<ContactCategory, string> = {
  Amigo:    '#3B82F6',
  Mentor:   '#A78BFA',
  Colega:   '#22D3EE',
  Familiar: '#FB7185',
  Conocido: '#71717A',
};

const EVENT_TYPE_DOT: Record<EventType, string> = {
  'Reunión':    '#3B82F6',
  'Fiesta':     '#EC4899',
  'Networking': '#818CF8',
  'Deporte':    '#34D399',
  'Cultural':   '#FBBF24',
  'Otro':       '#71717A',
};

const DEFAULT_CONTACT: NewContactInput = {
  name: '', category: 'Amigo', last_contact_date: new Date().toISOString().split('T')[0], notes: '',
};
const DEFAULT_EVENT: NewEventInput = {
  title: '', event_date: new Date().toISOString().split('T')[0], type: 'Reunión', location: '', notes: '',
};
const DEFAULT_COMMUNITY: NewCommunityInput = {
  name: '', type: 'Presencial', is_active: true, frequency: 'Semanal',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function relationshipHealth(lastContactDate: string | null): { label: string; color: string; dot: string } {
  if (!lastContactDate) return { label: 'Sin registro', color: '#71717A', dot: '#52525B' };
  const days = Math.floor((Date.now() - new Date(lastContactDate).getTime()) / 86_400_000);
  if (days <= 30)  return { label: `Hace ${days}d`,  color: '#34D399', dot: '#34D399' };
  if (days <= 90)  return { label: `Hace ${days}d`,  color: '#FBBF24', dot: '#FBBF24' };
  return              { label: `Hace ${days}d`,  color: '#FB7185', dot: '#FB7185' };
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SocialDashboard() {
  const navigate = useNavigate();
  const {
    contacts, events, communities, loading,
    createContact, deleteContact,
    createEvent, deleteEvent,
    createCommunity, toggleCommunityActive, deleteCommunity,
  } = useSocialData();

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState<TabType>('dashboard');

  // Modal states
  const [isContactModalOpen,   setIsContactModalOpen]   = useState(false);
  const [isEventModalOpen,     setIsEventModalOpen]     = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [formError,            setFormError]            = useState<string | null>(null);

  // Contact detail modal
  const [selectedContact, setSelectedContact] = useState<SocialContact | null>(null);

  // Form drafts
  const [newContact,   setNewContact]   = useState<NewContactInput>(DEFAULT_CONTACT);
  const [newEvent,     setNewEvent]     = useState<NewEventInput>(DEFAULT_EVENT);
  const [newCommunity, setNewCommunity] = useState<NewCommunityInput>(DEFAULT_COMMUNITY);

  // ── Derived data ──────────────────────────────────────────────────────────
  const upcomingEvents = useMemo(() => events.filter(e => isUpcoming(e.event_date)), [events]);
  const pastEvents     = useMemo(() => events.filter(e => !isUpcoming(e.event_date)), [events]);
  const activeComms    = useMemo(() => communities.filter(c => c.is_active).length, [communities]);

  // Contacts touched this year
  const thisYear = new Date().getFullYear();
  const newConnectionsThisYear = useMemo(() =>
    contacts.filter(c => c.created_at && new Date(c.created_at).getFullYear() === thisYear).length,
  [contacts, thisYear]);

  // ── AI Insight heuristic ──────────────────────────────────────────────────
  const aiInsight = useMemo(() => {
    if (contacts.length === 0 && events.length === 0 && communities.length === 0) {
      return 'Tu red está vacía. Empieza por mapear las personas más cercanas: una llamada, un mensaje, una semilla.';
    }
    const stale = contacts.filter(c => {
      if (!c.last_contact_date) return true;
      const days = (Date.now() - new Date(c.last_contact_date).getTime()) / 86_400_000;
      return days > 90;
    }).length;
    if (stale >= 3) return `${stale} contactos llevan más de 3 meses sin saber de ti. Reactiva al menos uno hoy.`;
    if (upcomingEvents.length >= 4) return `${upcomingEvents.length} eventos próximos: tu agenda social está vibrante.`;
    if (upcomingEvents.length === 0 && contacts.length > 0) return 'Sin eventos próximos. Agendar es la diferencia entre intención y conexión.';
    if (activeComms >= 3) return `${activeComms} comunidades activas: pertenencia múltiple = identidad rica.`;
    return `${contacts.length} contactos, ${activeComms} comunidades activas. La calidad de tu red define tu futuro.`;
  }, [contacts, events, communities, upcomingEvents, activeComms]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleTabChange = (tab: TabType) => { setActiveTab(tab); };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setFormError(null);
    try {
      await createContact(newContact);
      setIsContactModalOpen(false);
      setNewContact(DEFAULT_CONTACT);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setIsSubmitting(false); }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setFormError(null);
    try {
      await createEvent(newEvent);
      setIsEventModalOpen(false);
      setNewEvent(DEFAULT_EVENT);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setIsSubmitting(false); }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setFormError(null);
    try {
      await createCommunity(newCommunity);
      setIsCommunityModalOpen(false);
      setNewCommunity(DEFAULT_COMMUNITY);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    await deleteContact(id);
    setSelectedContact(null);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await deleteEvent(id);
  };

  const handleDeleteCommunity = async (id: string) => {
    if (!confirm('¿Eliminar esta comunidad?')) return;
    await deleteCommunity(id);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && contacts.length === 0 && events.length === 0 && communities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT_SOFT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-black text-white relative overflow-hidden selection:bg-blue-500/30">
      {/* ── Background glows ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-[0.20] blur-[120px]"
          style={{ background: `radial-gradient(circle, ${ACCENT_SOFT}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full opacity-[0.14] blur-[140px]"
          style={{ background: `radial-gradient(circle, ${ACCENT_SOFT}, transparent 70%)` }}
        />
      </div>

      <UniverseMobileHeader title="Vida Social" subtitle="Comunidad & Entorno" color="#0A0A0A" />

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
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
            <h1 className="font-serif text-2xl tracking-tight text-white">Vida Social</h1>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Comunidad & Entorno</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-6">
          <UniverseNavItem accent={ACCENT_SOFT} icon={LayoutDashboard} label="Resumen"      isActive={activeTab === 'dashboard'}    onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={Users}           label="Contactos"    isActive={activeTab === 'contactos'}    onClick={() => handleTabChange('contactos')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={CalendarDays}    label="Eventos"      isActive={activeTab === 'eventos'}      onClick={() => handleTabChange('eventos')} />
          <UniverseNavItem accent={ACCENT_SOFT} icon={Globe2}          label="Comunidades"  isActive={activeTab === 'comunidades'}  onClick={() => handleTabChange('comunidades')} />
        </div>
      </nav>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-14 md:pt-10 pb-20 md:pb-0 relative z-10">

        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* ── Header ── */}
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
                    setFormError(null);
                    if (activeTab === 'contactos')   setIsContactModalOpen(true);
                    if (activeTab === 'eventos')     setIsEventModalOpen(true);
                    if (activeTab === 'comunidades') setIsCommunityModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs"
                  style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 24px ${ACCENT_SOFT}60` }}
                >
                  <Plus size={13} strokeWidth={3} />
                  {activeTab === 'contactos' ? 'Nuevo Contacto' : activeTab === 'eventos' ? 'Nuevo Evento' : 'Nueva Comunidad'}
                </motion.button>
              )}
            </div>
            <h2 className="font-serif font-medium mb-5 text-white tracking-tight" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', lineHeight: 1.05 }}>
              {activeTab === 'dashboard'   ? 'Tu red de vida' :
               activeTab === 'contactos'  ? 'Personas importantes' :
               activeTab === 'eventos'    ? 'Agenda social' :
               'Comunidades activas'}
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

          {/* ══════════════════ DASHBOARD ══════════════════ */}
          {activeTab === 'dashboard' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-6">

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: 'Contactos Activos',   value: contacts.length,                icon: Users,        sub: 'personas en tu red' },
                  { label: 'Eventos Este Mes',    value: upcomingEvents.filter(e => {
                    const d = new Date(e.event_date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length,                                                              icon: CalendarDays, sub: 'en el calendario' },
                  { label: 'Conexiones Nuevas',   value: newConnectionsThisYear,         icon: Globe2,       sub: 'este año' },
                ].map(({ label, value, icon: Icon, sub }) => (
                  <motion.div key={label} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT_SOFT}1A`, border: `1px solid ${ACCENT_SOFT}30` }}>
                        <Icon size={16} style={{ color: ACCENT_SOFT, filter: `drop-shadow(0 0 6px ${ACCENT_SOFT}80)` }} />
                      </div>
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">{label}</span>
                    </div>
                    <span className="text-5xl font-bold tracking-tight text-white">{value}</span>
                    <p className="text-sm text-zinc-400">{sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick summary: contact health */}
              <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-white tracking-tight">Estado de tu Red Social</h3>
                  <motion.button whileTap={tapPhysics} onClick={() => handleTabChange('contactos')} className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT_SOFT }}>
                    Ver todos →
                  </motion.button>
                </div>

                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Users size={32} className="text-zinc-600" />
                    <p className="text-sm text-zinc-400 text-center">
                      Aún no tienes contactos. ¡Empieza a construir tu red!
                    </p>
                    <motion.button
                      whileTap={tapPhysics}
                      onClick={() => { setFormError(null); setIsContactModalOpen(true); }}
                      className="text-xs font-bold px-5 py-2.5 rounded-full"
                      style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 24px ${ACCENT_SOFT}60` }}
                    >
                      Agregar primer contacto
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {contacts.slice(0, 6).map(c => {
                      const health = relationshipHealth(c.last_contact_date);
                      return (
                        <motion.div
                          key={c.id}
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between py-3 px-3 border-b border-white/5 last:border-0 cursor-pointer rounded-xl hover:bg-white/[0.03] transition-colors"
                          onClick={() => setSelectedContact(c)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                              style={{ backgroundColor: CATEGORY_DOT[c.category], boxShadow: `0 0 12px ${CATEGORY_DOT[c.category]}60` }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{c.name}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${CATEGORY_DOT[c.category]}22`, color: CATEGORY_DOT[c.category], border: `1px solid ${CATEGORY_DOT[c.category]}40` }}>
                                {c.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: health.dot, boxShadow: `0 0 8px ${health.dot}` }} />
                            <span className="text-xs font-semibold" style={{ color: health.color }}>{health.label}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Upcoming events quick view */}
              {upcomingEvents.length > 0 && (
                <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-lg text-white tracking-tight">Próximos Eventos</h3>
                    <motion.button whileTap={tapPhysics} onClick={() => handleTabChange('eventos')} className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT_SOFT }}>
                      Ver todos →
                    </motion.button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {upcomingEvents.slice(0, 4).map(ev => (
                      <div key={ev.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold text-white"
                          style={{ backgroundColor: ACCENT_SOFT, boxShadow: `0 0 16px ${ACCENT_SOFT}50` }}
                        >
                          <span className="text-[9px] leading-none uppercase tracking-wider opacity-90">
                            {new Date(ev.event_date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg leading-none mt-0.5">
                            {new Date(ev.event_date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                          {ev.location && (
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {ev.location}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: `${EVENT_TYPE_DOT[ev.type]}22`, color: EVENT_TYPE_DOT[ev.type], border: `1px solid ${EVENT_TYPE_DOT[ev.type]}40` }}>
                          {ev.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Communities summary */}
              <motion.div variants={itemVariants} className="neo-card neo-card-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-white tracking-tight">Mis Comunidades</h3>
                  <motion.button whileTap={tapPhysics} onClick={() => handleTabChange('comunidades')} className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT_SOFT }}>
                    Ver todas →
                  </motion.button>
                </div>
                {communities.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Sin comunidades registradas aún.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {communities.slice(0, 6).map(com => (
                      <motion.div key={com.id} whileHover={hoverPhysics} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ACCENT_SOFT}1A`, color: ACCENT_SOFT, border: `1px solid ${ACCENT_SOFT}40` }}>
                            {com.type}
                          </span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: com.is_active ? '#34D399' : '#52525B', boxShadow: com.is_active ? '0 0 8px #34D399' : 'none' }} />
                        </div>
                        <p className="text-sm font-bold text-white truncate">{com.name}</p>
                        <p className="text-xs text-zinc-500">{com.frequency}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════════ CONTACTOS ══════════════════ */}
          {activeTab === 'contactos' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-6">
              {contacts.length === 0 ? (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/10 bg-white/[0.02] gap-4">
                  <Users size={40} className="text-zinc-600" />
                  <p className="font-serif text-2xl text-white text-center">Sin contactos aún</p>
                  <p className="text-sm font-medium text-zinc-500 text-center">
                    Registra las personas importantes de tu vida.
                  </p>
                  <motion.button
                    whileTap={tapPhysics}
                    onClick={() => { setFormError(null); setIsContactModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm"
                    style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 24px ${ACCENT_SOFT}60` }}
                  >
                    <Plus size={16} /> Agregar contacto
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {contacts.map(c => {
                    const health = relationshipHealth(c.last_contact_date);
                    return (
                      <motion.div
                        key={c.id}
                        variants={itemVariants}
                        whileHover={hoverPhysics}
                        className="neo-card neo-card-lg cursor-pointer"
                        onClick={() => setSelectedContact(c)}
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shrink-0"
                            style={{ backgroundColor: CATEGORY_DOT[c.category], boxShadow: `0 0 16px ${CATEGORY_DOT[c.category]}60` }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${CATEGORY_DOT[c.category]}22`, color: CATEGORY_DOT[c.category], border: `1px solid ${CATEGORY_DOT[c.category]}40` }}>
                            {c.category}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">{c.name}</h3>
                        {c.notes && (
                          <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{c.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: health.dot, boxShadow: `0 0 8px ${health.dot}` }} />
                          <span className="text-xs font-semibold" style={{ color: health.color }}>
                            Último contacto: {health.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════ EVENTOS ══════════════════ */}
          {activeTab === 'eventos' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-8">

              {/* Upcoming */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">Próximos</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 rounded-[32px] border-dashed border-2 border-white/10 bg-white/[0.02] gap-3">
                    <CalendarDays size={32} className="text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-500">No hay eventos próximos.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {upcomingEvents.map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Past */}
              {pastEvents.length > 0 && (
                <motion.section variants={itemVariants}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Historial</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {pastEvents.map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onDelete={handleDeleteEvent}
                        past
                      />
                    ))}
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}

          {/* ══════════════════ COMUNIDADES ══════════════════ */}
          {activeTab === 'comunidades' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-6">
              {communities.length === 0 ? (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/10 bg-white/[0.02] gap-4">
                  <Globe2 size={40} className="text-zinc-600" />
                  <p className="font-serif text-2xl text-white text-center">Sin comunidades aún</p>
                  <p className="text-sm font-medium text-zinc-500 text-center">
                    Registra los grupos y comunidades a los que perteneces.
                  </p>
                  <motion.button
                    whileTap={tapPhysics}
                    onClick={() => { setFormError(null); setIsCommunityModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm"
                    style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 24px ${ACCENT_SOFT}60` }}
                  >
                    <Plus size={16} /> Agregar comunidad
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {communities.map(com => (
                    <motion.div key={com.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${ACCENT_SOFT}1A`, color: ACCENT_SOFT, border: `1px solid ${ACCENT_SOFT}40` }}>
                          {com.type}
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileTap={tapPhysics}
                            onClick={() => toggleCommunityActive(com.id, com.is_active)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            aria-label={com.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {com.is_active
                              ? <ToggleRight size={22} style={{ color: ACCENT_SOFT }} />
                              : <ToggleLeft size={22} className="text-zinc-500" />}
                          </motion.button>
                          <motion.button
                            whileTap={tapPhysics}
                            onClick={() => handleDeleteCommunity(com.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">{com.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: com.is_active ? '#34D399' : '#52525B', boxShadow: com.is_active ? '0 0 8px #34D399' : 'none' }} />
                          <span className="text-xs font-semibold" style={{ color: com.is_active ? '#34D399' : '#71717A' }}>
                            {com.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <Clock size={13} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400 font-medium">
                          Participación {com.frequency.toLowerCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Contact Modal */}
      <AetherModal
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setFormError(null); }}
        title="Nuevo Contacto"
      >
        {formError && (
          <p className="text-xs font-bold text-red-400 mb-4 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateContact} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre</label>
            <input
              type="text" required placeholder="Ej: María González"
              value={newContact.name}
              onChange={e => setNewContact({ ...newContact, name: e.target.value })}
              className="neo-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Categoría</label>
            <select
              value={newContact.category}
              onChange={e => setNewContact({ ...newContact, category: e.target.value as ContactCategory })}
              className="neo-input appearance-none"
            >
              {CONTACT_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Último Contacto</label>
            <input
              type="date"
              value={newContact.last_contact_date}
              onChange={e => setNewContact({ ...newContact, last_contact_date: e.target.value })}
              className="neo-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas</label>
            <textarea
              rows={3} placeholder="Contexto, cómo se conocieron, intereses comunes..."
              value={newContact.notes}
              onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
              className="neo-input resize-none"
            />
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit" disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Contacto'}
          </motion.button>
        </form>
      </AetherModal>

      {/* Contact Detail Modal */}
      <AetherModal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact?.name ?? ''}
      >
        {selectedContact && (() => {
          const health = relationshipHealth(selectedContact.last_contact_date);
          return (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shrink-0"
                  style={{ backgroundColor: CATEGORY_DOT[selectedContact.category], boxShadow: `0 0 20px ${CATEGORY_DOT[selectedContact.category]}60` }}
                >
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${CATEGORY_DOT[selectedContact.category]}22`, color: CATEGORY_DOT[selectedContact.category], border: `1px solid ${CATEGORY_DOT[selectedContact.category]}40` }}>
                    {selectedContact.category}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: health.dot, boxShadow: `0 0 8px ${health.dot}` }} />
                    <span className="text-sm font-semibold" style={{ color: health.color }}>
                      Último contacto: {health.label}
                    </span>
                  </div>
                </div>
              </div>

              {selectedContact.last_contact_date && (
                <div className="flex flex-col gap-1">
                  <span className="neo-eyebrow">Fecha del último contacto</span>
                  <p className="text-sm font-semibold text-white">
                    {formatDate(selectedContact.last_contact_date)}
                  </p>
                </div>
              )}

              {selectedContact.notes && (
                <div className="flex flex-col gap-1">
                  <span className="neo-eyebrow">Notas</span>
                  <p className="text-sm text-white/90 leading-relaxed">{selectedContact.notes}</p>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="neo-eyebrow">Agregado el</span>
                <p className="text-sm font-semibold text-white">{formatDate(selectedContact.created_at)}</p>
              </div>

              <motion.button
                whileTap={tapPhysics}
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors mt-2 border border-red-500/30"
              >
                <Trash2 size={15} /> Eliminar contacto
              </motion.button>
            </div>
          );
        })()}
      </AetherModal>

      {/* Event Modal */}
      <AetherModal
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setFormError(null); }}
        title="Nuevo Evento"
      >
        {formError && (
          <p className="text-xs font-bold text-red-400 mb-4 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Título</label>
            <input
              type="text" required placeholder="Ej: Cumpleaños de Martín"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="neo-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Fecha</label>
              <input
                type="date" required
                value={newEvent.event_date}
                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="neo-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Tipo</label>
              <select
                value={newEvent.type}
                onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                className="neo-input appearance-none"
              >
                {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Lugar</label>
            <input
              type="text" placeholder="Ej: Casa de Juan, Zoom, etc."
              value={newEvent.location}
              onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
              className="neo-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas</label>
            <textarea
              rows={2} placeholder="Detalles adicionales..."
              value={newEvent.notes}
              onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })}
              className="neo-input resize-none"
            />
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit" disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Evento'}
          </motion.button>
        </form>
      </AetherModal>

      {/* Community Modal */}
      <AetherModal
        isOpen={isCommunityModalOpen}
        onClose={() => { setIsCommunityModalOpen(false); setFormError(null); }}
        title="Nueva Comunidad"
      >
        {formError && (
          <p className="text-xs font-bold text-red-400 mb-4 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateCommunity} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre</label>
            <input
              type="text" required placeholder="Ej: Club de Lectura, Meetup React, etc."
              value={newCommunity.name}
              onChange={e => setNewCommunity({ ...newCommunity, name: e.target.value })}
              className="neo-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Tipo</label>
              <select
                value={newCommunity.type}
                onChange={e => setNewCommunity({ ...newCommunity, type: e.target.value as CommunityType })}
                className="neo-input appearance-none"
              >
                {COMMUNITY_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Frecuencia</label>
              <select
                value={newCommunity.frequency}
                onChange={e => setNewCommunity({ ...newCommunity, frequency: e.target.value as ParticipationFrequency })}
                className="neo-input appearance-none"
              >
                {FREQUENCIES.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">Participación activa</p>
              <p className="text-xs text-zinc-500 mt-0.5">¿Participas actualmente en esta comunidad?</p>
            </div>
            <motion.button
              whileTap={tapPhysics}
              type="button"
              onClick={() => setNewCommunity(c => ({ ...c, is_active: !c.is_active }))}
              aria-label="Toggle activa"
            >
              {newCommunity.is_active
                ? <ToggleRight size={28} style={{ color: ACCENT_SOFT }} />
                : <ToggleLeft size={28} className="text-zinc-500" />}
            </motion.button>
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit" disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT_SOFT, color: '#fff', boxShadow: `0 0 32px ${ACCENT_SOFT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Comunidad'}
          </motion.button>
        </form>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',   label: 'Resumen',     icon: LayoutDashboard },
          { id: 'contactos',   label: 'Contactos',   icon: Users           },
          { id: 'eventos',     label: 'Eventos',     icon: CalendarDays    },
          { id: 'comunidades', label: 'Comunidades', icon: Globe2          },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor={ACCENT_SOFT}
        bgColor="#0A0A0A"
      />
    </div>
  );
}

// ── Event Card Sub-component ──────────────────────────────────────────────────

interface EventCardProps {
  event: SocialEvent;
  onDelete: (id: string) => void;
  past?: boolean;
}

function EventCard({ event, onDelete, past = false }: EventCardProps) {
  const dotColor = past ? '#52525B' : ACCENT_SOFT;
  return (
    <motion.div whileHover={hoverPhysics} className={`neo-card neo-card-lg flex items-start gap-5 ${past ? 'opacity-60' : ''}`}>
      <div
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white font-bold"
        style={{ backgroundColor: dotColor, boxShadow: past ? 'none' : `0 0 16px ${ACCENT_SOFT}50` }}
      >
        <span className="text-[10px] leading-none uppercase tracking-wide opacity-90">
          {new Date(event.event_date).toLocaleDateString('es-ES', { month: 'short' })}
        </span>
        <span className="text-xl leading-tight mt-0.5">
          {new Date(event.event_date).getDate()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${EVENT_TYPE_DOT[event.type]}22`, color: EVENT_TYPE_DOT[event.type], border: `1px solid ${EVENT_TYPE_DOT[event.type]}40` }}>
                {event.type}
              </span>
              {event.location && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <MapPin size={10} /> {event.location}
                </span>
              )}
            </div>
          </div>
          <motion.button
            whileTap={tapPhysics}
            onClick={() => onDelete(event.id)}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
            aria-label="Eliminar evento"
          >
            <Trash2 size={15} />
          </motion.button>
        </div>
        {event.notes && (
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2 flex items-start gap-1">
            <MessageSquare size={11} className="mt-0.5 shrink-0" /> {event.notes}
          </p>
        )}
        {past && (
          <div className="flex items-center gap-1.5 mt-2">
            <Check size={12} className="text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium">Pasado — {formatDate(event.event_date)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
