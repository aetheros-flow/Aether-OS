import { useState, useMemo } from 'react';
import {
  ArrowLeft, LayoutDashboard, Users, CalendarDays, Globe2,
  Plus, Loader2, MapPin, Trash2, ToggleLeft, ToggleRight,
  Clock, MessageSquare, Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocialData } from '../hooks/useSocialData';
import type {
  NewContactInput, NewEventInput, NewCommunityInput,
  ContactCategory, EventType, CommunityType, ParticipationFrequency,
  SocialContact, SocialEvent,
} from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';

// ── Constants ─────────────────────────────────────────────────────────────────

type TabType = 'dashboard' | 'contactos' | 'eventos' | 'comunidades';

const THEME = {
  bg:       '#1447E6',
  surface:  '#FFFFFF',
  accent:   '#1447E6',
  textMain: '#FFFFFF',
  textDark: '#2D2A26',
  textMuted:'#8A8681',
  sidebarBorder: 'rgba(255,255,255,0.12)',
};

const CONTACT_CATEGORIES: ContactCategory[] = ['Amigo', 'Mentor', 'Colega', 'Familiar', 'Conocido'];
const EVENT_TYPES: EventType[]               = ['Reunión', 'Fiesta', 'Networking', 'Deporte', 'Cultural', 'Otro'];
const COMMUNITY_TYPES: CommunityType[]       = ['Online', 'Presencial', 'Híbrido'];
const FREQUENCIES: ParticipationFrequency[]  = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

const CATEGORY_COLORS: Record<ContactCategory, string> = {
  Amigo:    'bg-blue-100 text-blue-700',
  Mentor:   'bg-purple-100 text-purple-700',
  Colega:   'bg-cyan-100 text-cyan-700',
  Familiar: 'bg-rose-100 text-rose-700',
  Conocido: 'bg-gray-100 text-gray-600',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  'Reunión':    'bg-blue-100 text-blue-700',
  'Fiesta':     'bg-pink-100 text-pink-700',
  'Networking': 'bg-indigo-100 text-indigo-700',
  'Deporte':    'bg-green-100 text-green-700',
  'Cultural':   'bg-amber-100 text-amber-700',
  'Otro':       'bg-gray-100 text-gray-600',
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
  if (!lastContactDate) return { label: 'Sin registro', color: 'text-gray-400', dot: 'bg-gray-300' };
  const days = Math.floor((Date.now() - new Date(lastContactDate).getTime()) / 86_400_000);
  if (days <= 30)  return { label: `Hace ${days}d`,  color: 'text-emerald-600', dot: 'bg-emerald-400' };
  if (days <= 90)  return { label: `Hace ${days}d`,  color: 'text-amber-600',   dot: 'bg-amber-400' };
  return              { label: `Hace ${days}d`,  color: 'text-rose-600',    dot: 'bg-rose-400' };
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white/20 selection:text-white"
      style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
    >

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <nav
        className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r"
        style={{ backgroundColor: THEME.bg, borderColor: THEME.sidebarBorder }}
      >
        <div className="flex items-center gap-4 p-6 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="aether-title text-white text-xl md:text-2xl">Vida Social</h1>
            <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Comunidad & Entorno
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <UniverseNavItem icon={LayoutDashboard} label="Resumen"      isActive={activeTab === 'dashboard'}    onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem icon={Users}           label="Contactos"    isActive={activeTab === 'contactos'}    onClick={() => handleTabChange('contactos')} />
          <UniverseNavItem icon={CalendarDays}    label="Eventos"      isActive={activeTab === 'eventos'}      onClick={() => handleTabChange('eventos')} />
          <UniverseNavItem icon={Globe2}          label="Comunidades"  isActive={activeTab === 'comunidades'}  onClick={() => handleTabChange('comunidades')} />
        </div>
      </nav>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-20 md:pb-0">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="aether-eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {activeTab === 'dashboard'   ? 'Tu Red de Vida'      :
               activeTab === 'contactos'  ? 'Personas Importantes' :
               activeTab === 'eventos'    ? 'Agenda Social'        :
               'Comunidades Activas'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="aether-metric-xl text-white">
                {activeTab === 'dashboard'   ? contacts.length       :
                 activeTab === 'contactos'   ? contacts.length       :
                 activeTab === 'eventos'     ? upcomingEvents.length :
                 activeComms}
              </span>
              <span className="text-xl font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {activeTab === 'dashboard'   ? ' personas'    :
                 activeTab === 'contactos'   ? ' contactos'   :
                 activeTab === 'eventos'     ? ' próximos'    :
                 ' activas'}
              </span>
            </div>
          </div>

          {activeTab !== 'dashboard' && (
            <button
              onClick={() => {
                setFormError(null);
                if (activeTab === 'contactos')   setIsContactModalOpen(true);
                if (activeTab === 'eventos')     setIsEventModalOpen(true);
                if (activeTab === 'comunidades') setIsCommunityModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 text-sm shadow-xl"
              style={{ backgroundColor: THEME.surface, color: THEME.accent }}
            >
              <Plus size={18} />
              {activeTab === 'contactos'   ? 'Nuevo Contacto'   :
               activeTab === 'eventos'     ? 'Nuevo Evento'     :
               'Nueva Comunidad'}
            </button>
          )}
        </header>

        {/* ══════════════════ DASHBOARD ══════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Contactos Activos</span>
                </div>
                <span className="aether-metric-md text-[#2D2A26]">{contacts.length}</span>
                <p className="text-sm text-[#8A8681]">personas en tu red</p>
              </div>

              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Eventos Este Mes</span>
                </div>
                <span className="aether-metric-md text-[#2D2A26]">
                  {upcomingEvents.filter(e => {
                    const d = new Date(e.event_date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </span>
                <p className="text-sm text-[#8A8681]">en el calendario</p>
              </div>

              <div className="aether-card flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Globe2 size={18} style={{ color: THEME.accent }} />
                  <span className="aether-eyebrow">Conexiones Nuevas</span>
                </div>
                <span className="aether-metric-md text-[#2D2A26]">{newConnectionsThisYear}</span>
                <p className="text-sm text-[#8A8681]">este año</p>
              </div>
            </div>

            {/* Quick summary: contact health */}
            <div className="aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-[#2D2A26]">Estado de tu Red Social</h3>
                <button
                  onClick={() => handleTabChange('contactos')}
                  className="text-xs font-bold px-4 py-2 rounded-full transition-colors hover:bg-gray-100"
                  style={{ color: THEME.accent }}
                >
                  Ver todos →
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Users size={32} className="text-gray-300" />
                  <p className="text-sm text-[#8A8681] text-center">
                    Aún no tienes contactos. ¡Empieza a construir tu red!
                  </p>
                  <button
                    onClick={() => { setFormError(null); setIsContactModalOpen(true); }}
                    className="text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
                    style={{ backgroundColor: THEME.accent, color: '#fff' }}
                  >
                    Agregar primer contacto
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {contacts.slice(0, 6).map(c => {
                    const health = relationshipHealth(c.last_contact_date);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-3 px-1 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-xl px-3 transition-colors"
                        onClick={() => setSelectedContact(c)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                            style={{ backgroundColor: THEME.accent }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#2D2A26]">{c.name}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.category]}`}>
                              {c.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${health.dot}`} />
                          <span className={`text-xs font-semibold ${health.color}`}>{health.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming events quick view */}
            {upcomingEvents.length > 0 && (
              <div className="aether-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-[#2D2A26]">Próximos Eventos</h3>
                  <button
                    onClick={() => handleTabChange('eventos')}
                    className="text-xs font-bold px-4 py-2 rounded-full transition-colors hover:bg-gray-100"
                    style={{ color: THEME.accent }}
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {upcomingEvents.slice(0, 4).map(ev => (
                    <div key={ev.id} className="flex items-center gap-4 py-2">
                      <div
                        className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white font-bold"
                        style={{ backgroundColor: THEME.accent }}
                      >
                        <span className="text-xs leading-none">
                          {new Date(ev.event_date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-lg leading-none">
                          {new Date(ev.event_date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2D2A26] truncate">{ev.title}</p>
                        {ev.location && (
                          <p className="text-xs text-[#8A8681] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {ev.location}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${EVENT_TYPE_COLORS[ev.type]}`}>
                        {ev.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Communities summary */}
            <div className="aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-[#2D2A26]">Mis Comunidades</h3>
                <button
                  onClick={() => handleTabChange('comunidades')}
                  className="text-xs font-bold px-4 py-2 rounded-full transition-colors hover:bg-gray-100"
                  style={{ color: THEME.accent }}
                >
                  Ver todas →
                </button>
              </div>
              {communities.length === 0 ? (
                <p className="text-sm text-[#8A8681] text-center py-4">Sin comunidades registradas aún.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {communities.slice(0, 6).map(com => (
                    <div key={com.id} className="rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {com.type}
                        </span>
                        <div className={`w-2.5 h-2.5 rounded-full ${com.is_active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      </div>
                      <p className="text-sm font-bold text-[#2D2A26] truncate">{com.name}</p>
                      <p className="text-xs text-[#8A8681]">{com.frequency}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════ CONTACTOS ══════════════════ */}
        {activeTab === 'contactos' && (
          <div className="flex flex-col gap-6">
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20 gap-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <Users size={40} className="text-white/40" />
                <p className="aether-title text-white text-center">Sin contactos aún</p>
                <p className="text-sm font-medium text-white/70 text-center">
                  Registra las personas importantes de tu vida.
                </p>
                <button
                  onClick={() => { setFormError(null); setIsContactModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: THEME.surface, color: THEME.accent }}
                >
                  <Plus size={16} /> Agregar contacto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {contacts.map(c => {
                  const health = relationshipHealth(c.last_contact_date);
                  return (
                    <div
                      key={c.id}
                      className="aether-card aether-card-interactive cursor-pointer"
                      onClick={() => setSelectedContact(c)}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shrink-0"
                          style={{ backgroundColor: THEME.accent }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[c.category]}`}>
                          {c.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#2D2A26] mb-2">{c.name}</h3>
                      {c.notes && (
                        <p className="text-xs text-[#8A8681] mb-3 line-clamp-2">{c.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${health.dot}`} />
                        <span className={`text-xs font-semibold ${health.color}`}>
                          Último contacto: {health.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ EVENTOS ══════════════════ */}
        {activeTab === 'eventos' && (
          <div className="flex flex-col gap-8">

            {/* Upcoming */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Próximos</span>
                <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 rounded-[32px] border-dashed border-2 border-white/20 gap-3"
                  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                  <CalendarDays size={32} className="text-white/40" />
                  <p className="text-sm font-medium text-white/70">No hay eventos próximos.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcomingEvents.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onDelete={handleDeleteEvent}
                      accentColor={THEME.accent}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Past */}
            {pastEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Historial</span>
                  <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex flex-col gap-4">
                  {pastEvents.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onDelete={handleDeleteEvent}
                      accentColor={THEME.accent}
                      past
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ══════════════════ COMUNIDADES ══════════════════ */}
        {activeTab === 'comunidades' && (
          <div className="flex flex-col gap-6">
            {communities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20 gap-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <Globe2 size={40} className="text-white/40" />
                <p className="aether-title text-white text-center">Sin comunidades aún</p>
                <p className="text-sm font-medium text-white/70 text-center">
                  Registra los grupos y comunidades a los que perteneces.
                </p>
                <button
                  onClick={() => { setFormError(null); setIsCommunityModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: THEME.surface, color: THEME.accent }}
                >
                  <Plus size={16} /> Agregar comunidad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {communities.map(com => (
                  <div key={com.id} className="aether-card flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        com.type === 'Online' ? 'bg-cyan-100 text-cyan-700' :
                        com.type === 'Presencial' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {com.type}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCommunityActive(com.id, com.is_active)}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                          aria-label={com.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {com.is_active
                            ? <ToggleRight size={22} style={{ color: THEME.accent }} />
                            : <ToggleLeft size={22} className="text-gray-400" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCommunity(com.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#2D2A26]">{com.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${com.is_active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        <span className={`text-xs font-semibold ${com.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {com.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <Clock size={13} className="text-gray-400" />
                      <span className="text-xs text-[#8A8681] font-medium">
                        Participación {com.frequency.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Contact Modal */}
      <AetherModal
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setFormError(null); }}
        title="Nuevo Contacto"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateContact} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej: María González"
              value={newContact.name}
              onChange={e => setNewContact({ ...newContact, name: e.target.value })}
              className="aether-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Categoría</label>
            <select
              value={newContact.category}
              onChange={e => setNewContact({ ...newContact, category: e.target.value as ContactCategory })}
              className="aether-input appearance-none"
            >
              {CONTACT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Último Contacto</label>
            <input
              type="date"
              value={newContact.last_contact_date}
              onChange={e => setNewContact({ ...newContact, last_contact_date: e.target.value })}
              className="aether-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas</label>
            <textarea
              rows={3}
              placeholder="Contexto, cómo se conocieron, intereses comunes..."
              value={newContact.notes}
              onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
              className="aether-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60"
            style={{ backgroundColor: THEME.accent, color: '#fff' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Contacto'}
          </button>
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
                  style={{ backgroundColor: THEME.accent }}
                >
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[selectedContact.category]}`}>
                    {selectedContact.category}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.dot}`} />
                    <span className={`text-sm font-semibold ${health.color}`}>
                      Último contacto: {health.label}
                    </span>
                  </div>
                </div>
              </div>

              {selectedContact.last_contact_date && (
                <div className="flex flex-col gap-1">
                  <span className="aether-eyebrow">Fecha del último contacto</span>
                  <p className="text-sm font-semibold text-[#2D2A26]">
                    {formatDate(selectedContact.last_contact_date)}
                  </p>
                </div>
              )}

              {selectedContact.notes && (
                <div className="flex flex-col gap-1">
                  <span className="aether-eyebrow">Notas</span>
                  <p className="text-sm text-[#2D2A26] leading-relaxed">{selectedContact.notes}</p>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="aether-eyebrow">Agregado el</span>
                <p className="text-sm font-semibold text-[#2D2A26]">{formatDate(selectedContact.created_at)}</p>
              </div>

              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-sm text-rose-500 hover:bg-rose-50 transition-colors mt-2"
              >
                <Trash2 size={15} /> Eliminar contacto
              </button>
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
          <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Título</label>
            <input
              type="text"
              required
              placeholder="Ej: Cumpleaños de Martín"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="aether-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha</label>
              <input
                type="date"
                required
                value={newEvent.event_date}
                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="aether-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Tipo</label>
              <select
                value={newEvent.type}
                onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                className="aether-input appearance-none"
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Lugar</label>
            <input
              type="text"
              placeholder="Ej: Casa de Juan, Zoom, etc."
              value={newEvent.location}
              onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
              className="aether-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas</label>
            <textarea
              rows={2}
              placeholder="Detalles adicionales..."
              value={newEvent.notes}
              onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })}
              className="aether-input resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60"
            style={{ backgroundColor: THEME.accent, color: '#fff' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Evento'}
          </button>
        </form>
      </AetherModal>

      {/* Community Modal */}
      <AetherModal
        isOpen={isCommunityModalOpen}
        onClose={() => { setIsCommunityModalOpen(false); setFormError(null); }}
        title="Nueva Comunidad"
      >
        {formError && (
          <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>
        )}
        <form onSubmit={handleCreateCommunity} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej: Club de Lectura, Meetup React, etc."
              value={newCommunity.name}
              onChange={e => setNewCommunity({ ...newCommunity, name: e.target.value })}
              className="aether-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Tipo</label>
              <select
                value={newCommunity.type}
                onChange={e => setNewCommunity({ ...newCommunity, type: e.target.value as CommunityType })}
                className="aether-input appearance-none"
              >
                {COMMUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Frecuencia</label>
              <select
                value={newCommunity.frequency}
                onChange={e => setNewCommunity({ ...newCommunity, frequency: e.target.value as ParticipationFrequency })}
                className="aether-input appearance-none"
              >
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
            <div>
              <p className="text-sm font-bold text-[#2D2A26]">Participación activa</p>
              <p className="text-xs text-[#8A8681] mt-0.5">¿Participas actualmente en esta comunidad?</p>
            </div>
            <button
              type="button"
              onClick={() => setNewCommunity(c => ({ ...c, is_active: !c.is_active }))}
              aria-label="Toggle activa"
            >
              {newCommunity.is_active
                ? <ToggleRight size={28} style={{ color: THEME.accent }} />
                : <ToggleLeft size={28} className="text-gray-400" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="aether-btn mt-2 shadow-lg hover:shadow-xl disabled:opacity-60"
            style={{ backgroundColor: THEME.accent, color: '#fff' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Comunidad'}
          </button>
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
        activeColor="#93C5FD"
        bgColor="#0F3CC9"
      />
    </div>
  );
}

// ── Event Card Sub-component ──────────────────────────────────────────────────

interface EventCardProps {
  event: SocialEvent;
  onDelete: (id: string) => void;
  accentColor: string;
  past?: boolean;
}

function EventCard({ event, onDelete, accentColor, past = false }: EventCardProps) {
  return (
    <div className={`aether-card flex items-start gap-5 ${past ? 'opacity-60' : ''}`}>
      <div
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white font-bold"
        style={{ backgroundColor: past ? '#9CA3AF' : accentColor }}
      >
        <span className="text-[10px] leading-none uppercase tracking-wide">
          {new Date(event.event_date).toLocaleDateString('es-ES', { month: 'short' })}
        </span>
        <span className="text-xl leading-tight">
          {new Date(event.event_date).getDate()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#2D2A26] truncate">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.type]}`}>
                {event.type}
              </span>
              {event.location && (
                <span className="text-xs text-[#8A8681] flex items-center gap-1">
                  <MapPin size={10} /> {event.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors shrink-0"
            aria-label="Eliminar evento"
          >
            <Trash2 size={15} />
          </button>
        </div>
        {event.notes && (
          <p className="text-xs text-[#8A8681] mt-2 line-clamp-2 flex items-start gap-1">
            <MessageSquare size={11} className="mt-0.5 shrink-0" /> {event.notes}
          </p>
        )}
        {past && (
          <div className="flex items-center gap-1.5 mt-2">
            <Check size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Pasado — {formatDate(event.event_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
