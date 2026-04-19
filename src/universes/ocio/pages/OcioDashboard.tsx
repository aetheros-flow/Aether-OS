import { useState } from 'react';
import {
  ArrowLeft, LayoutDashboard, BookOpen, Tv, Puzzle, Star, Plus,
  Loader2, Trash2, CheckCircle2, Circle, Clock, Edit3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useOcioData } from '../hooks/useOcioData';
import type {
  NewBookInput, NewWatchInput, NewHobbyInput, NewBucketInput,
  BookStatus, WatchStatus, BucketStatus, OcioBook, OcioWatchlistItem,
} from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'biblioteca' | 'pantalla' | 'hobbies' | 'bucket';

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = {
  bg:       '#00E5FF',
  surface:  '#FFFFFF',
  accent:   '#00B8D9',
  textMain: '#1D293D',
  textMuted:'#4A5568',
  textLight:'rgba(29,41,61,0.65)',
};

// ── Platforms & constants ─────────────────────────────────────────────────────
const PLATFORMS = ['Netflix', 'HBO Max', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Crunchyroll', 'Otro'];
const BOOK_STATUSES: BookStatus[]   = ['Por leer', 'Leyendo', 'Leído'];
const WATCH_STATUSES: WatchStatus[] = ['Pendiente', 'Viendo', 'Visto'];
const BUCKET_STATUSES: BucketStatus[] = ['Pendiente', 'En progreso', 'Completado'];

const STATUS_COLORS: Record<string, string> = {
  'Por leer':    '#94A3B8',
  'Leyendo':     '#00B8D9',
  'Leído':       '#10B981',
  'Pendiente':   '#94A3B8',
  'Viendo':      '#00B8D9',
  'Visto':       '#10B981',
  'En progreso': '#F59E0B',
  'Completado':  '#10B981',
};

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_BOOK: NewBookInput = { title: '', author: '', status: 'Por leer', rating: '', notes: '' };
const DEFAULT_WATCH: NewWatchInput = { title: '', platform: 'Netflix', status: 'Pendiente', genre: '', rating: '' };
const DEFAULT_HOBBY: NewHobbyInput = { name: '', frequency: '', last_practiced: '', notes: '' };
const DEFAULT_BUCKET: NewBucketInput = { description: '', category: '', status: 'Pendiente' };

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(String(n))}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            fill={Number(value) >= n ? THEME.accent : 'none'}
            stroke={Number(value) >= n ? THEME.accent : '#CBD5E1'}
          />
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OcioDashboard() {
  const navigate = useNavigate();
  const {
    books, watchlist, hobbies, bucket, loading,
    createBook, updateBook, deleteBook,
    createWatchItem, updateWatchItem, deleteWatchItem,
    createHobby, deleteHobby,
    createBucketItem, updateBucketItem, deleteBucketItem,
  } = useOcioData();

  const [activeTab,        setActiveTab]        = useState<TabType>('dashboard');
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [bookModalOpen,   setBookModalOpen]   = useState(false);
  const [watchModalOpen,  setWatchModalOpen]  = useState(false);
  const [hobbyModalOpen,  setHobbyModalOpen]  = useState(false);
  const [bucketModalOpen, setBucketModalOpen] = useState(false);

  // ── Edit states ───────────────────────────────────────────────────────────
  const [editingBook,  setEditingBook]  = useState<OcioBook | null>(null);
  const [editingWatch, setEditingWatch] = useState<OcioWatchlistItem | null>(null);

  // ── Form drafts ───────────────────────────────────────────────────────────
  const [newBook,   setNewBook]   = useState<NewBookInput>(DEFAULT_BOOK);
  const [newWatch,  setNewWatch]  = useState<NewWatchInput>(DEFAULT_WATCH);
  const [newHobby,  setNewHobby]  = useState<NewHobbyInput>(DEFAULT_HOBBY);
  const [newBucket, setNewBucket] = useState<NewBucketInput>(DEFAULT_BUCKET);

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const booksRead      = books.filter(b => b.status === 'Leído').length;
  const watchedCount   = watchlist.filter(w => w.status === 'Visto').length;
  const activeHobbies  = hobbies.length;
  const bucketDone     = bucket.filter(b => b.status === 'Completado').length;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab: TabType) => { setActiveTab(tab); };

  const openEditBook = (book: OcioBook) => {
    setEditingBook(book);
    setNewBook({ title: book.title, author: book.author, status: book.status, rating: book.rating ? String(book.rating) : '', notes: book.notes ?? '' });
    setBookModalOpen(true);
  };

  const openEditWatch = (item: OcioWatchlistItem) => {
    setEditingWatch(item);
    setNewWatch({ title: item.title, platform: item.platform, status: item.status, genre: item.genre ?? '', rating: item.rating ? String(item.rating) : '' });
    setWatchModalOpen(true);
  };

  const closeBookModal = () => { setBookModalOpen(false); setEditingBook(null); setNewBook(DEFAULT_BOOK); };
  const closeWatchModal = () => { setWatchModalOpen(false); setEditingWatch(null); setNewWatch(DEFAULT_WATCH); };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBookSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newBook.title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingBook) {
        await updateBook(editingBook.id, newBook);
        toast.success('Libro actualizado');
      } else {
        await createBook(newBook);
        toast.success('Libro agregado a la biblioteca');
      }
      closeBookModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWatchSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newWatch.title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingWatch) {
        await updateWatchItem(editingWatch.id, newWatch);
        toast.success('Título actualizado');
      } else {
        await createWatchItem(newWatch);
        toast.success('Agregado a tu pantalla');
      }
      closeWatchModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHobbySubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newHobby.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createHobby(newHobby);
      toast.success('Hobby registrado');
      setHobbyModalOpen(false);
      setNewHobby(DEFAULT_HOBBY);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBucketSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newBucket.description.trim()) return;
    setIsSubmitting(true);
    try {
      await createBucketItem(newBucket);
      toast.success('Experiencia añadida al bucket list');
      setBucketModalOpen(false);
      setNewBucket(DEFAULT_BUCKET);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try { await deleteBook(id); toast.success('Libro eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteWatch = async (id: string) => {
    try { await deleteWatchItem(id); toast.success('Título eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteHobby = async (id: string) => {
    try { await deleteHobby(id); toast.success('Hobby eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteBucket = async (id: string) => {
    try { await deleteBucketItem(id); toast.success('Experiencia eliminada'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleBucketStatus = async (id: string, status: BucketStatus) => {
    try { await updateBucketItem(id, status); }
    catch { toast.error('Error al actualizar'); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && books.length === 0 && watchlist.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: THEME.textMain }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans"
      style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
    >
      <UniverseMobileHeader title="Ocio & Hobbies" subtitle="Entretenimiento & Pasatiempos" color="#00C4D4" />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <nav
        className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r border-black/10"
        style={{ backgroundColor: THEME.bg }}
      >
        <div className="flex items-center gap-4 p-6 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            style={{ color: THEME.textMain }}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="aether-title" style={{ color: THEME.textMain }}>Ocio</h1>
            <p className="aether-eyebrow" style={{ color: THEME.textLight }}>Tiempo & Recreación</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <UniverseNavItem lightBg icon={LayoutDashboard} label="Resumen"    isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem lightBg icon={BookOpen}        label="Biblioteca" isActive={activeTab === 'biblioteca'} onClick={() => handleTabChange('biblioteca')} />
          <UniverseNavItem lightBg icon={Tv}              label="Pantalla"   isActive={activeTab === 'pantalla'}  onClick={() => handleTabChange('pantalla')} />
          <UniverseNavItem lightBg icon={Puzzle}          label="Hobbies"    isActive={activeTab === 'hobbies'}   onClick={() => handleTabChange('hobbies')} />
          <UniverseNavItem lightBg icon={Star}            label="Bucket List" isActive={activeTab === 'bucket'}   onClick={() => handleTabChange('bucket')} />
        </div>
      </nav>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-14 md:pt-10 pb-20 md:pb-0">

        {/* ── Header ── */}
        {/* ── Daylio header ── */}
        <header className="mb-7 md:mb-10">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {activeTab !== 'dashboard' && (
              <button
                onClick={() => {
                  if (activeTab === 'biblioteca') setBookModalOpen(true);
                  else if (activeTab === 'pantalla') setWatchModalOpen(true);
                  else if (activeTab === 'hobbies') setHobbyModalOpen(true);
                  else if (activeTab === 'bucket') setBucketModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs active:scale-95 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <Plus size={13} strokeWidth={3} />
                {activeTab === 'biblioteca' ? 'Agregar Libro' : activeTab === 'pantalla' ? 'Agregar Título' : activeTab === 'hobbies' ? 'Agregar Hobby' : 'Agregar Experiencia'}
              </button>
            )}
          </div>
          <h2 className="font-black mb-4" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.1, color: THEME.textMain }}>
            {activeTab === 'dashboard'   ? 'Tu universo de ocio' :
             activeTab === 'biblioteca' ? 'Biblioteca personal' :
             activeTab === 'pantalla'   ? 'Series & Películas' :
             activeTab === 'hobbies'    ? 'Hobbies activos' :
             'Bucket List'}
          </h2>
          {activeTab === 'dashboard' && (
            <div className="flex gap-2.5 flex-wrap">
              {[
                { icon: '📚', label: 'Libros leídos', val: booksRead },
                { icon: '🎬', label: 'Watchlist', val: watchlist.length },
                { icon: '🎮', label: 'Hobbies', val: hobbies.length },
                { icon: '✈️', label: 'Bucket list', val: bucket.length },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
                  <span className="text-sm leading-none">{s.icon}</span>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.50)', lineHeight: 1.2 }}>{s.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: THEME.textMain, lineHeight: 1 }}>{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* KPI Cards */}
            {[
              { label: 'Libros leídos',         value: booksRead,     icon: BookOpen, sub: `de ${books.length} en biblioteca` },
              { label: 'Series/Películas vistas', value: watchedCount, icon: Tv,       sub: `de ${watchlist.length} en watchlist` },
              { label: 'Hobbies activos',        value: activeHobbies, icon: Puzzle,   sub: 'registrados' },
              { label: 'Bucket completado',      value: bucketDone,    icon: Star,     sub: `de ${bucket.length} experiencias` },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                    <Icon size={20} style={{ color: THEME.accent }} />
                  </div>
                  <span className="aether-eyebrow" style={{ color: THEME.textMuted }}>{label}</span>
                </div>
                <span className="aether-metric-md" style={{ color: THEME.textMain }}>{value}</span>
                <span className="text-sm font-medium" style={{ color: THEME.textMuted }}>{sub}</span>
              </div>
            ))}

            {/* Recent books */}
            <div className="sm:col-span-2 aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base" style={{ color: THEME.textMain }}>Lectura reciente</h3>
                <button onClick={() => handleTabChange('biblioteca')} className="aether-eyebrow" style={{ color: THEME.accent }}>Ver todo</button>
              </div>
              {books.slice(0, 4).length === 0 ? (
                <p className="text-sm" style={{ color: THEME.textMuted }}>Sin libros registrados aún.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {books.slice(0, 4).map(book => (
                    <div key={book.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: THEME.textMain }}>{book.title}</p>
                        <p className="text-xs" style={{ color: THEME.textMuted }}>{book.author}</p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[book.status]}22`, color: STATUS_COLORS[book.status] }}>
                        {book.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bucket progress */}
            <div className="sm:col-span-2 aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base" style={{ color: THEME.textMain }}>Bucket List</h3>
                <button onClick={() => handleTabChange('bucket')} className="aether-eyebrow" style={{ color: THEME.accent }}>Ver todo</button>
              </div>
              {bucket.length === 0 ? (
                <p className="text-sm" style={{ color: THEME.textMuted }}>Sin experiencias registradas aún.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {bucket.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.status === 'Completado' ? (
                        <CheckCircle2 size={18} style={{ color: STATUS_COLORS['Completado'] }} />
                      ) : item.status === 'En progreso' ? (
                        <Clock size={18} style={{ color: STATUS_COLORS['En progreso'] }} />
                      ) : (
                        <Circle size={18} style={{ color: STATUS_COLORS['Pendiente'] }} />
                      )}
                      <p className="text-sm font-medium flex-1" style={{ color: THEME.textMain }}>{item.description}</p>
                      <span className="text-xs" style={{ color: THEME.textMuted }}>{item.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BIBLIOTECA ── */}
        {activeTab === 'biblioteca' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <BookOpen size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Sin libros todavía</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega tu primer libro a la biblioteca.</p>
              </div>
            ) : books.map(book => (
              <div key={book.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                    <BookOpen size={20} style={{ color: THEME.accent }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[book.status]}22`, color: STATUS_COLORS[book.status] }}>
                    {book.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug" style={{ color: THEME.textMain }}>{book.title}</h3>
                  <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>{book.author}</p>
                </div>
                {book.rating && (
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} fill={n <= book.rating! ? THEME.accent : 'none'} stroke={n <= book.rating! ? THEME.accent : '#CBD5E1'} />
                    ))}
                  </div>
                )}
                {book.notes && (
                  <p className="text-xs leading-relaxed" style={{ color: THEME.textMuted }}>{book.notes}</p>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <button onClick={() => openEditBook(book)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button onClick={() => handleDeleteBook(book.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PANTALLA ── */}
        {activeTab === 'pantalla' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <Tv size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Watchlist vacía</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega series y películas para ver.</p>
              </div>
            ) : watchlist.map(item => (
              <div key={item.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                      <Tv size={20} style={{ color: THEME.accent }} />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100" style={{ color: THEME.textMuted }}>{item.platform}</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[item.status]}22`, color: STATUS_COLORS[item.status] }}>
                    {item.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug" style={{ color: THEME.textMain }}>{item.title}</h3>
                  {item.genre && <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>{item.genre}</p>}
                </div>
                {item.rating && (
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} fill={n <= item.rating! ? THEME.accent : 'none'} stroke={n <= item.rating! ? THEME.accent : '#CBD5E1'} />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <button onClick={() => openEditWatch(item)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button onClick={() => handleDeleteWatch(item.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HOBBIES ── */}
        {activeTab === 'hobbies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hobbies.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <Puzzle size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Sin hobbies registrados</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega tus actividades favoritas.</p>
              </div>
            ) : hobbies.map(hobby => (
              <div key={hobby.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                    <Puzzle size={20} style={{ color: THEME.accent }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100" style={{ color: THEME.textMuted }}>
                    {hobby.frequency}
                  </span>
                </div>
                <h3 className="font-bold text-lg" style={{ color: THEME.textMain }}>{hobby.name}</h3>
                {hobby.last_practiced && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: THEME.textMuted }} />
                    <p className="text-xs" style={{ color: THEME.textMuted }}>
                      Última vez: {new Date(hobby.last_practiced).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {hobby.notes && (
                  <p className="text-xs leading-relaxed" style={{ color: THEME.textMuted }}>{hobby.notes}</p>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <button onClick={() => handleDeleteHobby(hobby.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BUCKET LIST ── */}
        {activeTab === 'bucket' && (
          <div className="flex flex-col gap-4">
            {bucket.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <Star size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Bucket list vacío</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega experiencias que quieres vivir.</p>
              </div>
            ) : (
              <>
                {BUCKET_STATUSES.map(status => {
                  const items = bucket.filter(b => b.status === status);
                  if (items.length === 0) return null;
                  return (
                    <div key={status} className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                        <span className="aether-eyebrow" style={{ color: THEME.textMuted }}>{status} ({items.length})</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {items.map(item => (
                          <div key={item.id} className="aether-card flex items-center gap-4">
                            <button
                              onClick={() => {
                                const next: BucketStatus = item.status === 'Pendiente' ? 'En progreso' : item.status === 'En progreso' ? 'Completado' : 'Pendiente';
                                handleBucketStatus(item.id, next);
                              }}
                              className="shrink-0 transition-transform hover:scale-110"
                            >
                              {item.status === 'Completado' ? (
                                <CheckCircle2 size={22} style={{ color: STATUS_COLORS['Completado'] }} />
                              ) : item.status === 'En progreso' ? (
                                <Clock size={22} style={{ color: STATUS_COLORS['En progreso'] }} />
                              ) : (
                                <Circle size={22} style={{ color: STATUS_COLORS['Pendiente'] }} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm" style={{ color: THEME.textMain, textDecoration: item.status === 'Completado' ? 'line-through' : 'none', opacity: item.status === 'Completado' ? 0.5 : 1 }}>
                                {item.description}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: THEME.textMuted }}>{item.category}</p>
                            </div>
                            <button onClick={() => handleDeleteBucket(item.id)} className="shrink-0 p-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL: LIBRO ─────────────────────────────────────────────────── */}
      <AetherModal isOpen={bookModalOpen} onClose={closeBookModal} title={editingBook ? 'Editar Libro' : 'Nuevo Libro'}>
        <form onSubmit={handleBookSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Título</label>
            <input type="text" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="aether-input" placeholder="El nombre del libro" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Autor</label>
            <input type="text" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="aether-input" placeholder="Nombre del autor" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Estado</label>
            <select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value as BookStatus })} className="aether-input appearance-none">
              {BOOK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Valoración</label>
            <StarRating value={newBook.rating} onChange={v => setNewBook({ ...newBook, rating: v })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas</label>
            <textarea value={newBook.notes} onChange={e => setNewBook({ ...newBook, notes: e.target.value })} className="aether-input resize-none h-24" placeholder="Reflexiones, frases destacadas..." />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBook ? 'Guardar Cambios' : 'Agregar a Biblioteca'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: WATCHLIST ─────────────────────────────────────────────── */}
      <AetherModal isOpen={watchModalOpen} onClose={closeWatchModal} title={editingWatch ? 'Editar Título' : 'Nuevo Título'}>
        <form onSubmit={handleWatchSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Título</label>
            <input type="text" required value={newWatch.title} onChange={e => setNewWatch({ ...newWatch, title: e.target.value })} className="aether-input" placeholder="Nombre de la serie o película" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Plataforma</label>
              <select value={newWatch.platform} onChange={e => setNewWatch({ ...newWatch, platform: e.target.value })} className="aether-input appearance-none">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Estado</label>
              <select value={newWatch.status} onChange={e => setNewWatch({ ...newWatch, status: e.target.value as WatchStatus })} className="aether-input appearance-none">
                {WATCH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Género</label>
            <input type="text" value={newWatch.genre} onChange={e => setNewWatch({ ...newWatch, genre: e.target.value })} className="aether-input" placeholder="Drama, Comedia, Thriller..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Valoración</label>
            <StarRating value={newWatch.rating} onChange={v => setNewWatch({ ...newWatch, rating: v })} />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingWatch ? 'Guardar Cambios' : 'Agregar a Pantalla'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: HOBBY ─────────────────────────────────────────────────── */}
      <AetherModal isOpen={hobbyModalOpen} onClose={() => { setHobbyModalOpen(false); setNewHobby(DEFAULT_HOBBY); }} title="Nuevo Hobby">
        <form onSubmit={handleHobbySubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre</label>
            <input type="text" required value={newHobby.name} onChange={e => setNewHobby({ ...newHobby, name: e.target.value })} className="aether-input" placeholder="Fotografía, Guitarra, Ajedrez..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Frecuencia</label>
            <input type="text" value={newHobby.frequency} onChange={e => setNewHobby({ ...newHobby, frequency: e.target.value })} className="aether-input" placeholder="Diario, Semanal, Mensual..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Última vez practicado</label>
            <input type="date" value={newHobby.last_practiced} onChange={e => setNewHobby({ ...newHobby, last_practiced: e.target.value })} className="aether-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas</label>
            <textarea value={newHobby.notes} onChange={e => setNewHobby({ ...newHobby, notes: e.target.value })} className="aether-input resize-none h-20" placeholder="Objetivo, nivel actual..." />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Hobby'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: BUCKET ────────────────────────────────────────────────── */}
      <AetherModal isOpen={bucketModalOpen} onClose={() => { setBucketModalOpen(false); setNewBucket(DEFAULT_BUCKET); }} title="Nueva Experiencia">
        <form onSubmit={handleBucketSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Descripción</label>
            <textarea required value={newBucket.description} onChange={e => setNewBucket({ ...newBucket, description: e.target.value })} className="aether-input resize-none h-24" placeholder="Correr una maratón, Aprender a surfear..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Categoría</label>
            <input type="text" value={newBucket.category} onChange={e => setNewBucket({ ...newBucket, category: e.target.value })} className="aether-input" placeholder="Viajes, Deportes, Creatividad..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Estado inicial</label>
            <select value={newBucket.status} onChange={e => setNewBucket({ ...newBucket, status: e.target.value as BucketStatus })} className="aether-input appearance-none">
              {BUCKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agregar al Bucket List'}
          </button>
        </form>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',  label: 'Resumen',    icon: LayoutDashboard },
          { id: 'biblioteca', label: 'Libros',     icon: BookOpen        },
          { id: 'pantalla',   label: 'Pantalla',   icon: Tv              },
          { id: 'hobbies',    label: 'Hobbies',    icon: Puzzle          },
          { id: 'bucket',     label: 'Bucket',     icon: Star            },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor="#34D399"
        bgColor="#0F766E"
      />
    </div>
  );
}
