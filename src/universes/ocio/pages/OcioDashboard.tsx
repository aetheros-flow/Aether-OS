import { useState, useMemo } from 'react';
import {
  ArrowLeft, LayoutDashboard, BookOpen, Tv, Puzzle, Star, Plus,
  Loader2, Trash2, CheckCircle2, Circle, Clock, Edit3, Sparkles,
  ExternalLink, Library, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
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

// ── Neo-Dark accent ───────────────────────────────────────────────────────────
const ACCENT = '#00E5FF';

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

const LEBRARY_URL = 'https://lebrary.netlify.app/';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = ['Netflix', 'HBO Max', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Crunchyroll', 'Otro'];
const BOOK_STATUSES: BookStatus[]   = ['Por leer', 'Leyendo', 'Leído'];
const WATCH_STATUSES: WatchStatus[] = ['Pendiente', 'Viendo', 'Visto'];
const BUCKET_STATUSES: BucketStatus[] = ['Pendiente', 'En progreso', 'Completado'];

const STATUS_COLORS: Record<string, string> = {
  'Por leer':    '#71717A',
  'Leyendo':     '#00E5FF',
  'Leído':       '#34D399',
  'Pendiente':   '#71717A',
  'Viendo':      '#00E5FF',
  'Visto':       '#34D399',
  'En progreso': '#FBBF24',
  'Completado':  '#34D399',
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
        <motion.button
          key={n}
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(String(n))}
        >
          <Star
            size={22}
            fill={Number(value) >= n ? ACCENT : 'none'}
            stroke={Number(value) >= n ? ACCENT : '#3F3F46'}
            style={{ filter: Number(value) >= n ? `drop-shadow(0 0 6px ${ACCENT}80)` : 'none' }}
          />
        </motion.button>
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

  // ── AI Insight heuristic ──────────────────────────────────────────────────
  const aiInsight = useMemo(() => {
    if (booksRead === 0 && watchedCount === 0 && activeHobbies === 0 && bucket.length === 0) {
      return 'Empieza por sembrar: agrega un libro, una serie o una experiencia que quieras vivir.';
    }
    const inProgressBooks = books.filter(b => b.status === 'Leyendo').length;
    const watchingNow = watchlist.filter(w => w.status === 'Viendo').length;
    if (inProgressBooks >= 3) return `Tienes ${inProgressBooks} libros en curso. Termina uno antes de empezar otro.`;
    if (watchingNow >= 4) return `${watchingNow} series en simultáneo. Tu mente agradecerá enfoque.`;
    if (bucketDone > 0 && bucketDone / Math.max(bucket.length, 1) > 0.5) {
      return `${bucketDone} de ${bucket.length} experiencias completadas. Estás viviendo, no solo planeando.`;
    }
    if (activeHobbies >= 3) return `${activeHobbies} hobbies activos: el cerebro creativo prospera con variedad.`;
    return `${booksRead} libros, ${watchedCount} títulos vistos. El ocio consciente es nutrición mental.`;
  }, [booksRead, watchedCount, activeHobbies, bucket, books, watchlist, bucketDone]);

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-black text-white relative overflow-hidden">
      {/* ── Background glows ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-[0.18] blur-[120px]"
          style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full opacity-[0.12] blur-[140px]"
          style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
        />
      </div>

      <UniverseMobileHeader title="Ocio & Hobbies" subtitle="Entretenimiento & Pasatiempos" color="#0A0A0A" />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
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
            <h1 className="font-serif text-2xl tracking-tight text-white">Ocio</h1>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Tiempo & Recreación</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-6">
          <UniverseNavItem accent={ACCENT} icon={LayoutDashboard} label="Resumen"    isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          {/* Biblioteca → externallink to Lebrary */}
          <motion.a
            href={LEBRARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors group"
            style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <Library size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}60)` }} />
            <span className="flex-1">Biblioteca</span>
            <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          </motion.a>
          <UniverseNavItem accent={ACCENT} icon={Tv}              label="Pantalla"   isActive={activeTab === 'pantalla'}  onClick={() => handleTabChange('pantalla')} />
          <UniverseNavItem accent={ACCENT} icon={Puzzle}          label="Hobbies"    isActive={activeTab === 'hobbies'}   onClick={() => handleTabChange('hobbies')} />
          <UniverseNavItem accent={ACCENT} icon={Star}            label="Bucket List" isActive={activeTab === 'bucket'}   onClick={() => handleTabChange('bucket')} />
        </div>
      </nav>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
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
                    if (activeTab === 'biblioteca') setBookModalOpen(true);
                    else if (activeTab === 'pantalla') setWatchModalOpen(true);
                    else if (activeTab === 'hobbies') setHobbyModalOpen(true);
                    else if (activeTab === 'bucket') setBucketModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs"
                  style={{ backgroundColor: ACCENT, color: '#000', boxShadow: `0 0 24px ${ACCENT}60` }}
                >
                  <Plus size={13} strokeWidth={3} />
                  {activeTab === 'biblioteca' ? 'Agregar Libro' : activeTab === 'pantalla' ? 'Agregar Título' : activeTab === 'hobbies' ? 'Agregar Hobby' : 'Agregar Experiencia'}
                </motion.button>
              )}
            </div>
            <h2 className="font-serif font-medium mb-5 text-white tracking-tight" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', lineHeight: 1.05 }}>
              {activeTab === 'dashboard'   ? 'Tu universo de ocio' :
               activeTab === 'biblioteca' ? 'Biblioteca personal' :
               activeTab === 'pantalla'   ? 'Series & Películas' :
               activeTab === 'hobbies'    ? 'Hobbies activos' :
               'Bucket List'}
            </h2>

            {/* AI Insight strip */}
            <div className="neo-card neo-card-lg flex items-start gap-4">
              <div className="p-2.5 rounded-2xl shrink-0" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}>
                <Sparkles size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 8px ${ACCENT}80)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1.5">Aether Insight</p>
                <p className="text-[15px] leading-relaxed text-white/90">{aiInsight}</p>
              </div>
            </div>
          </motion.header>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* KPI Cards */}
              {[
                { label: 'Libros leídos',         value: booksRead,     icon: BookOpen, sub: `de ${books.length} en biblioteca` },
                { label: 'Series/Películas vistas', value: watchedCount, icon: Tv,       sub: `de ${watchlist.length} en watchlist` },
                { label: 'Hobbies activos',        value: activeHobbies, icon: Puzzle,   sub: 'registrados' },
                { label: 'Bucket completado',      value: bucketDone,    icon: Star,     sub: `de ${bucket.length} experiencias` },
              ].map(({ label, value, icon: Icon, sub }) => (
                <motion.div key={label} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                      <Icon size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}80)` }} />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">{label}</span>
                  </div>
                  <span className="text-5xl font-bold tracking-tight text-white">{value}</span>
                  <span className="text-sm font-medium text-zinc-400">{sub}</span>
                </motion.div>
              ))}

              {/* Recent books — links to Lebrary */}
              <motion.div variants={itemVariants} className="sm:col-span-2 neo-card neo-card-lg flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <Library size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}60)` }} />
                    <h3 className="font-serif text-lg text-white tracking-tight">Biblioteca · Lebrary</h3>
                  </div>
                  <motion.a
                    href={LEBRARY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={tapPhysics}
                    className="flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase"
                    style={{ color: ACCENT }}
                  >
                    Abrir <ExternalLink size={11} />
                  </motion.a>
                </div>
                {books.slice(0, 4).length === 0 ? (
                  <p className="text-sm text-zinc-500 mb-4">Sin libros registrados aún.</p>
                ) : (
                  <div className="flex flex-col gap-3 mb-5">
                    {books.slice(0, 4).map(book => (
                      <div key={book.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{book.title}</p>
                          <p className="text-xs text-zinc-500">{book.author}</p>
                        </div>
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full ml-3 shrink-0" style={{ backgroundColor: `${STATUS_COLORS[book.status]}22`, color: STATUS_COLORS[book.status], border: `1px solid ${STATUS_COLORS[book.status]}40` }}>
                          {book.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Lebrary CTA */}
                <motion.a
                  href={LEBRARY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={tapPhysics}
                  className="mt-auto flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold text-sm group"
                  style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
                >
                  <span>Ir a Lebrary — tu biblioteca virtual</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </motion.div>

              {/* Bucket progress */}
              <motion.div variants={itemVariants} className="sm:col-span-2 neo-card neo-card-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-white tracking-tight">Bucket List</h3>
                  <motion.button whileTap={tapPhysics} onClick={() => handleTabChange('bucket')} className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: ACCENT }}>Ver todo</motion.button>
                </div>
                {bucket.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sin experiencias registradas aún.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {bucket.slice(0, 4).map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        {item.status === 'Completado' ? (
                          <CheckCircle2 size={18} style={{ color: STATUS_COLORS['Completado'] }} />
                        ) : item.status === 'En progreso' ? (
                          <Clock size={18} style={{ color: STATUS_COLORS['En progreso'] }} />
                        ) : (
                          <Circle size={18} style={{ color: STATUS_COLORS['Pendiente'] }} />
                        )}
                        <p className="text-sm font-medium flex-1 text-white/90">{item.description}</p>
                        <span className="text-xs text-zinc-500">{item.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── BIBLIOTECA ── */}
          {activeTab === 'biblioteca' && (
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.length === 0 ? (
                <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
                  <BookOpen size={40} className="text-zinc-600" />
                  <p className="mt-4 font-bold text-base text-zinc-400">Sin libros todavía</p>
                  <p className="text-sm mt-1 text-zinc-500">Agrega tu primer libro a la biblioteca.</p>
                </motion.div>
              ) : books.map(book => (
                <motion.div key={book.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                      <BookOpen size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}80)` }} />
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[book.status]}22`, color: STATUS_COLORS[book.status], border: `1px solid ${STATUS_COLORS[book.status]}40` }}>
                      {book.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug text-white">{book.title}</h3>
                    <p className="text-sm mt-1 text-zinc-400">{book.author}</p>
                  </div>
                  {book.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14} fill={n <= book.rating! ? ACCENT : 'none'} stroke={n <= book.rating! ? ACCENT : '#3F3F46'} />
                      ))}
                    </div>
                  )}
                  {book.notes && (
                    <p className="text-xs leading-relaxed text-zinc-500">{book.notes}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                    <motion.button whileTap={tapPhysics} onClick={() => openEditBook(book)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" style={{ color: ACCENT }}>
                      <Edit3 size={14} /> Editar
                    </motion.button>
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteBook(book.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── PANTALLA ── */}
          {activeTab === 'pantalla' && (
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.length === 0 ? (
                <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
                  <Tv size={40} className="text-zinc-600" />
                  <p className="mt-4 font-bold text-base text-zinc-400">Watchlist vacía</p>
                  <p className="text-sm mt-1 text-zinc-500">Agrega series y películas para ver.</p>
                </motion.div>
              ) : watchlist.map(item => (
                <motion.div key={item.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                        <Tv size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}80)` }} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">{item.platform}</span>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[item.status]}22`, color: STATUS_COLORS[item.status], border: `1px solid ${STATUS_COLORS[item.status]}40` }}>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug text-white">{item.title}</h3>
                    {item.genre && <p className="text-sm mt-1 text-zinc-400">{item.genre}</p>}
                  </div>
                  {item.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14} fill={n <= item.rating! ? ACCENT : 'none'} stroke={n <= item.rating! ? ACCENT : '#3F3F46'} />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                    <motion.button whileTap={tapPhysics} onClick={() => openEditWatch(item)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" style={{ color: ACCENT }}>
                      <Edit3 size={14} /> Editar
                    </motion.button>
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteWatch(item.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── HOBBIES ── */}
          {activeTab === 'hobbies' && (
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hobbies.length === 0 ? (
                <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
                  <Puzzle size={40} className="text-zinc-600" />
                  <p className="mt-4 font-bold text-base text-zinc-400">Sin hobbies registrados</p>
                  <p className="text-sm mt-1 text-zinc-500">Agrega tus actividades favoritas.</p>
                </motion.div>
              ) : hobbies.map(hobby => (
                <motion.div key={hobby.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card neo-card-lg flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                      <Puzzle size={18} style={{ color: ACCENT, filter: `drop-shadow(0 0 6px ${ACCENT}80)` }} />
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                      {hobby.frequency}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white">{hobby.name}</h3>
                  {hobby.last_practiced && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-zinc-500" />
                      <p className="text-xs text-zinc-500">
                        Última vez: {new Date(hobby.last_practiced).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {hobby.notes && (
                    <p className="text-xs leading-relaxed text-zinc-400">{hobby.notes}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteHobby(hobby.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── BUCKET LIST ── */}
          {activeTab === 'bucket' && (
            <motion.div variants={containerVariants} className="flex flex-col gap-4">
              {bucket.length === 0 ? (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
                  <Star size={40} className="text-zinc-600" />
                  <p className="mt-4 font-bold text-base text-zinc-400">Bucket list vacío</p>
                  <p className="text-sm mt-1 text-zinc-500">Agrega experiencias que quieres vivir.</p>
                </motion.div>
              ) : (
                <>
                  {BUCKET_STATUSES.map(status => {
                    const items = bucket.filter(b => b.status === status);
                    if (items.length === 0) return null;
                    return (
                      <motion.div key={status} variants={itemVariants} className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status], boxShadow: `0 0 8px ${STATUS_COLORS[status]}` }} />
                          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">{status} ({items.length})</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {items.map(item => (
                            <motion.div key={item.id} whileHover={hoverPhysics} className="neo-card neo-card-lg flex items-center gap-4 !py-4">
                              <motion.button
                                whileTap={tapPhysics}
                                onClick={() => {
                                  const next: BucketStatus = item.status === 'Pendiente' ? 'En progreso' : item.status === 'En progreso' ? 'Completado' : 'Pendiente';
                                  handleBucketStatus(item.id, next);
                                }}
                                className="shrink-0"
                              >
                                {item.status === 'Completado' ? (
                                  <CheckCircle2 size={22} style={{ color: STATUS_COLORS['Completado'] }} />
                                ) : item.status === 'En progreso' ? (
                                  <Clock size={22} style={{ color: STATUS_COLORS['En progreso'] }} />
                                ) : (
                                  <Circle size={22} style={{ color: STATUS_COLORS['Pendiente'] }} />
                                )}
                              </motion.button>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-white" style={{ textDecoration: item.status === 'Completado' ? 'line-through' : 'none', opacity: item.status === 'Completado' ? 0.5 : 1 }}>
                                  {item.description}
                                </p>
                                <p className="text-xs mt-0.5 text-zinc-500">{item.category}</p>
                              </div>
                              <motion.button whileTap={tapPhysics} onClick={() => handleDeleteBucket(item.id)} className="shrink-0 p-2 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-red-400">
                                <Trash2 size={14} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}

        </motion.div>
      </main>

      {/* ── MODAL: LIBRO ─────────────────────────────────────────────────── */}
      <AetherModal isOpen={bookModalOpen} onClose={closeBookModal} title={editingBook ? 'Editar Libro' : 'Nuevo Libro'}>
        <form onSubmit={handleBookSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Título</label>
            <input type="text" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="neo-input" placeholder="El nombre del libro" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Autor</label>
            <input type="text" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="neo-input" placeholder="Nombre del autor" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Estado</label>
            <select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value as BookStatus })} className="neo-input appearance-none">
              {BOOK_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Valoración</label>
            <StarRating value={newBook.rating} onChange={v => setNewBook({ ...newBook, rating: v })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas</label>
            <textarea value={newBook.notes} onChange={e => setNewBook({ ...newBook, notes: e.target.value })} className="neo-input resize-none h-24" placeholder="Reflexiones, frases destacadas..." />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT, color: '#000', boxShadow: `0 0 32px ${ACCENT}50` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBook ? 'Guardar Cambios' : 'Agregar a Biblioteca'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: WATCHLIST ─────────────────────────────────────────────── */}
      <AetherModal isOpen={watchModalOpen} onClose={closeWatchModal} title={editingWatch ? 'Editar Título' : 'Nuevo Título'}>
        <form onSubmit={handleWatchSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Título</label>
            <input type="text" required value={newWatch.title} onChange={e => setNewWatch({ ...newWatch, title: e.target.value })} className="neo-input" placeholder="Nombre de la serie o película" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Plataforma</label>
              <select value={newWatch.platform} onChange={e => setNewWatch({ ...newWatch, platform: e.target.value })} className="neo-input appearance-none">
                {PLATFORMS.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Estado</label>
              <select value={newWatch.status} onChange={e => setNewWatch({ ...newWatch, status: e.target.value as WatchStatus })} className="neo-input appearance-none">
                {WATCH_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Género</label>
            <input type="text" value={newWatch.genre} onChange={e => setNewWatch({ ...newWatch, genre: e.target.value })} className="neo-input" placeholder="Drama, Comedia, Thriller..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Valoración</label>
            <StarRating value={newWatch.rating} onChange={v => setNewWatch({ ...newWatch, rating: v })} />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT, color: '#000', boxShadow: `0 0 32px ${ACCENT}50` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingWatch ? 'Guardar Cambios' : 'Agregar a Pantalla'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: HOBBY ─────────────────────────────────────────────────── */}
      <AetherModal isOpen={hobbyModalOpen} onClose={() => { setHobbyModalOpen(false); setNewHobby(DEFAULT_HOBBY); }} title="Nuevo Hobby">
        <form onSubmit={handleHobbySubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Nombre</label>
            <input type="text" required value={newHobby.name} onChange={e => setNewHobby({ ...newHobby, name: e.target.value })} className="neo-input" placeholder="Fotografía, Guitarra, Ajedrez..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Frecuencia</label>
            <input type="text" value={newHobby.frequency} onChange={e => setNewHobby({ ...newHobby, frequency: e.target.value })} className="neo-input" placeholder="Diario, Semanal, Mensual..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Última vez practicado</label>
            <input type="date" value={newHobby.last_practiced} onChange={e => setNewHobby({ ...newHobby, last_practiced: e.target.value })} className="neo-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notas</label>
            <textarea value={newHobby.notes} onChange={e => setNewHobby({ ...newHobby, notes: e.target.value })} className="neo-input resize-none h-20" placeholder="Objetivo, nivel actual..." />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT, color: '#000', boxShadow: `0 0 32px ${ACCENT}50` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Hobby'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: BUCKET ────────────────────────────────────────────────── */}
      <AetherModal isOpen={bucketModalOpen} onClose={() => { setBucketModalOpen(false); setNewBucket(DEFAULT_BUCKET); }} title="Nueva Experiencia">
        <form onSubmit={handleBucketSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Descripción</label>
            <textarea required value={newBucket.description} onChange={e => setNewBucket({ ...newBucket, description: e.target.value })} className="neo-input resize-none h-24" placeholder="Correr una maratón, Aprender a surfear..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Categoría</label>
            <input type="text" value={newBucket.category} onChange={e => setNewBucket({ ...newBucket, category: e.target.value })} className="neo-input" placeholder="Viajes, Deportes, Creatividad..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Estado inicial</label>
            <select value={newBucket.status} onChange={e => setNewBucket({ ...newBucket, status: e.target.value as BucketStatus })} className="neo-input appearance-none">
              {BUCKET_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT, color: '#000', boxShadow: `0 0 32px ${ACCENT}50` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agregar al Bucket List'}
          </motion.button>
        </form>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',  label: 'Resumen',    icon: LayoutDashboard },
          { id: 'biblioteca', label: 'Libros',     icon: Library         },
          { id: 'pantalla',   label: 'Pantalla',   icon: Tv              },
          { id: 'hobbies',    label: 'Hobbies',    icon: Puzzle          },
          { id: 'bucket',     label: 'Bucket',     icon: Star            },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'biblioteca') {
            window.open(LEBRARY_URL, '_blank', 'noopener,noreferrer');
          } else {
            handleTabChange(tab as TabType);
          }
        }}
        activeColor={ACCENT}
        bgColor="#0A0A0A"
      />
    </div>
  );
}
