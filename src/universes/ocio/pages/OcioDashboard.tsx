import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Tv, Puzzle, Star, Plus,
  Loader2, Trash2, CheckCircle2, Circle, Clock, Edit3, Sparkles,
  ExternalLink, Library, ArrowRight, Play,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { toast } from 'sonner';

import { useOcioData } from '../hooks/useOcioData';
import { useOcioInsight } from '../hooks/useOcioInsight';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  NewBookInput, NewHobbyInput, NewBucketInput,
  BookStatus, BucketStatus, OcioBook,
} from '../types';
import AetherModal from '../../../core/components/AetherModal';
import AuraLayout, { type TabItem } from '../../../components/layout/AuraLayout';
import { SURFACE, UNIVERSE_ACCENT, alpha } from '../../../lib/universe-palette';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'biblioteca' | 'hobbies' | 'bucket';

// ── Ocio identity — coral clay (Soft Cosmos desaturated) ─────────────────────
const ACCENT = UNIVERSE_ACCENT.ocio;
const ACCENT_SOFT = '#E89588';

// ── Motion physics — mirrors Dinero for rhythm consistency ───────────────────
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
const BOOK_STATUSES: BookStatus[] = ['Por leer', 'Leyendo', 'Leído'];
const BUCKET_STATUSES: BucketStatus[] = ['Pendiente', 'En progreso', 'Completado'];

const STATUS_COLORS: Record<string, string> = {
  'Por leer': '#8E857A',
  'Leyendo': '#7AB8C4',
  'Leído': '#7EC28A',
  'Pendiente': '#8E857A',
  'En progreso': '#D9B25E',
  'Completado': '#7EC28A',
};

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_BOOK: NewBookInput = { title: '', author: '', status: 'Por leer', rating: '', notes: '' };
const DEFAULT_HOBBY: NewHobbyInput = { name: '', frequency: '', last_practiced: '', notes: '' };
const DEFAULT_BUCKET: NewBucketInput = { description: '', category: '', status: 'Pendiente' };

const auraTabs: TabItem[] = [
  { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard size={16} />, mobileLabel: 'Resumen' },
  { id: 'biblioteca', label: 'Biblioteca',  icon: <BookOpen size={16} />,        mobileLabel: 'Libros'  },
  { id: 'hobbies',    label: 'Hobbies',     icon: <Puzzle size={16} />,          mobileLabel: 'Hobbies' },
  { id: 'bucket',     label: 'Bucket List', icon: <Star size={16} />,            mobileLabel: 'Bucket'  },
];

// ── Star rating picker ────────────────────────────────────────────────────────
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
            stroke={Number(value) >= n ? ACCENT : '#4A4238'}
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
    books, hobbies, bucket, loading,
    createBook, updateBook, deleteBook,
    createHobby, deleteHobby,
    createBucketItem, updateBucketItem, deleteBucketItem,
  } = useOcioData();

  const { session } = useAuth();
  const authLebraryUrl = session?.access_token
    ? `${LEBRARY_URL}#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=3600&token_type=bearer&type=magiclink`
    : LEBRARY_URL;

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [hobbyModalOpen, setHobbyModalOpen] = useState(false);
  const [bucketModalOpen, setBucketModalOpen] = useState(false);

  const [editingBook, setEditingBook] = useState<OcioBook | null>(null);

  const [newBook, setNewBook] = useState<NewBookInput>(DEFAULT_BOOK);
  const [newHobby, setNewHobby] = useState<NewHobbyInput>(DEFAULT_HOBBY);
  const [newBucket, setNewBucket] = useState<NewBucketInput>(DEFAULT_BUCKET);

  // Derived KPIs
  const booksRead = books.filter(b => b.status === 'Leído').length;
  const activeHobbies = hobbies.length;
  const bucketDone = bucket.filter(b => b.status === 'Completado').length;

  const insight = useOcioInsight();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openEditBook = (book: OcioBook) => {
    setEditingBook(book);
    setNewBook({ title: book.title, author: book.author, status: book.status, rating: book.rating ? String(book.rating) : '', notes: book.notes ?? '' });
    setBookModalOpen(true);
  };
  const closeBookModal = () => { setBookModalOpen(false); setEditingBook(null); setNewBook(DEFAULT_BOOK); };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBookSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newBook.title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingBook) { await updateBook(editingBook.id, newBook); toast.success('Libro actualizado'); }
      else { await createBook(newBook); toast.success('Libro agregado a la biblioteca'); }
      closeBookModal();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setIsSubmitting(false); }
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
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setIsSubmitting(false); }
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
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setIsSubmitting(false); }
  };
  const handleDeleteBook   = async (id: string) => { try { await deleteBook(id);       toast.success('Libro eliminado');      } catch { toast.error('Error al eliminar'); } };
  const handleDeleteHobby  = async (id: string) => { try { await deleteHobby(id);      toast.success('Hobby eliminado');      } catch { toast.error('Error al eliminar'); } };
  const handleDeleteBucket = async (id: string) => { try { await deleteBucketItem(id); toast.success('Experiencia eliminada'); } catch { toast.error('Error al eliminar'); } };
  const handleBucketStatus = async (id: string, status: BucketStatus) => { try { await updateBucketItem(id, status); } catch { toast.error('Error al actualizar'); } };

  // ── Context-aware "quick add" (matches Dinero's right-side primary CTA) ──
  const primaryAddForTab = () => {
    if (activeTab === 'biblioteca') { setBookModalOpen(true); return; }
    if (activeTab === 'hobbies')    { setHobbyModalOpen(true); return; }
    if (activeTab === 'bucket')     { setBucketModalOpen(true); return; }
    // Dashboard: default to adding a book (most common)
    setBookModalOpen(true);
  };
  const primaryAddLabel =
    activeTab === 'biblioteca' ? 'Nuevo Libro' :
    activeTab === 'hobbies'    ? 'Nuevo Hobby' :
    activeTab === 'bucket'     ? 'Nueva Experiencia' :
    'Add';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SURFACE.bg }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  const headerActions = (
    <>
      <motion.a
        href={authLebraryUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={tapPhysics}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-colors"
        style={{ background: 'rgba(245,239,230,0.05)', border: `1px solid ${SURFACE.border}`, color: SURFACE.text }}
      >
        <Library size={14} /> Lebrary <ExternalLink size={11} className="opacity-60" />
      </motion.a>
      <motion.button
        whileTap={tapPhysics}
        onClick={primaryAddForTab}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest"
        style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 24px ${ACCENT}55` }}
      >
        <Plus size={14} strokeWidth={3} /> {primaryAddLabel}
      </motion.button>
    </>
  );

  return (
    <AuraLayout
      tabs={auraTabs}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === 'pantalla') navigate('/ocio/pantalla');
        else setActiveTab(tab as TabType);
      }}
      accentColor={ACCENT}
      title="Ocio & Hobbies"
      subtitle="Entretenimiento & Pasatiempos"
      headerActions={headerActions}
    >
        {/* ── DASHBOARD (RESUMEN) ── */}
        {activeTab === 'dashboard' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-7xl"
          >
            {/* Hero header (mirrors Dinero's "OVERVIEW / Financial pulse") */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: SURFACE.textMuted }}>Overview</p>
                <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight" style={{ color: SURFACE.text }}>Tu universo de ocio</h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={primaryAddForTab}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714' }}
              >
                <Plus size={15} strokeWidth={2.5} /> Add
              </motion.button>
            </motion.div>

            {/* AI Insight card (Dinero-style) */}
            <motion.section
              variants={itemVariants}
              whileHover={{ scale: 1.005 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="neo-card"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.10]"
                style={{ background: `radial-gradient(800px circle at 0% 0%, ${ACCENT}, transparent 50%)` }}
              />
              <div className="relative flex items-start gap-4">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
                  style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}
                >
                  <Sparkles size={18} style={{ color: ACCENT }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] uppercase font-black tracking-[0.22em]" style={{ color: SURFACE.textMuted }}>Aether AI · Insight</p>
                    {!insight.loading && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                        style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}45` }}
                      >
                        Sugerido {insight.suggestedScore.toFixed(1)}
                        {insight.delta != null && insight.delta !== 0 && (
                          <span className="ml-1 opacity-80">
                            ({insight.delta > 0 ? '+' : ''}{insight.delta.toFixed(1)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] md:text-base font-medium leading-relaxed" style={{ color: SURFACE.text, opacity: 0.9 }}>
                    {insight.reasoning}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 3-metric strip (mirrors Dinero's NET WORTH / INCOME / EXPENSES) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Libros leídos',     value: booksRead,     icon: BookOpen, sub: `de ${books.length} en biblioteca` },
                { label: 'Hobbies activos',   value: activeHobbies, icon: Puzzle,   sub: 'registrados' },
                { label: 'Bucket completado', value: bucketDone,    icon: Star,     sub: `de ${bucket.length} experiencias` },
              ].map(({ label, value, icon: Icon, sub }) => (
                <div key={label} className="neo-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 rounded-xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                      <Icon size={16} style={{ color: ACCENT }} />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>{label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight" style={{ color: SURFACE.text }}>{value}</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: SURFACE.textMuted }}>{sub}</p>
                </div>
              ))}
            </motion.div>

            {/* Sub-app shortcuts (Pantalla, Videos, Biblioteca) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pantalla */}
              <Link to="/ocio/pantalla" className="neo-card neo-card-interactive flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                    <Tv size={16} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>Pantalla</span>
                </div>
                <span className="font-serif text-xl font-medium" style={{ color: SURFACE.text }}>Series &amp; Películas</span>
                <span className="text-xs" style={{ color: SURFACE.textMuted }}>Datos en vivo de TMDB.</span>
                <div className="mt-auto flex items-center justify-between pt-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  <span>Abrir</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
              {/* Videos */}
              <Link to="/ocio/videos" className="neo-card neo-card-interactive flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                    <Play size={16} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>Videos</span>
                </div>
                <span className="font-serif text-xl font-medium" style={{ color: SURFACE.text }}>YouTube &amp; más</span>
                <span className="text-xs" style={{ color: SURFACE.textMuted }}>Listas custom multi-plataforma.</span>
                <div className="mt-auto flex items-center justify-between pt-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  <span>Abrir</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
              {/* Biblioteca · Lebrary */}
              <a
                href={authLebraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-card neo-card-interactive flex flex-col gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                    <Library size={16} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>Biblioteca · Lebrary</span>
                </div>
                <span className="font-serif text-xl font-medium" style={{ color: SURFACE.text }}>Tu biblioteca virtual</span>
                <span className="text-xs" style={{ color: SURFACE.textMuted }}>Gestión completa en Lebrary.</span>
                <div className="mt-auto flex items-center justify-between pt-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                  <span>Abrir</span>
                  <ExternalLink size={13} />
                </div>
              </a>
            </motion.div>

            {/* Recent books + Bucket progress (mirrors Dinero's "This month / Activity" split) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent books */}
              <div className="neo-card flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={16} style={{ color: ACCENT }} />
                    <h3 className="font-serif text-lg tracking-tight" style={{ color: SURFACE.text }}>Últimos libros</h3>
                  </div>
                  <motion.button
                    whileTap={tapPhysics}
                    onClick={() => setActiveTab('biblioteca')}
                    className="text-[10px] font-black tracking-[0.2em] uppercase"
                    style={{ color: ACCENT }}
                  >
                    Ver todo
                  </motion.button>
                </div>
                {books.length === 0 ? (
                  <p className="text-sm" style={{ color: SURFACE.textMuted }}>Sin libros registrados aún.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {books.slice(0, 4).map(book => (
                      <div key={book.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: SURFACE.border }}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: SURFACE.text }}>{book.title}</p>
                          <p className="text-xs" style={{ color: SURFACE.textMuted }}>{book.author}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-3 py-1 rounded-full ml-3 shrink-0"
                          style={{
                            backgroundColor: `${STATUS_COLORS[book.status]}22`,
                            color: STATUS_COLORS[book.status],
                            border: `1px solid ${STATUS_COLORS[book.status]}40`,
                          }}
                        >
                          {book.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bucket recent */}
              <div className="neo-card flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Star size={16} style={{ color: ACCENT }} />
                    <h3 className="font-serif text-lg tracking-tight" style={{ color: SURFACE.text }}>Bucket List</h3>
                  </div>
                  <motion.button
                    whileTap={tapPhysics}
                    onClick={() => setActiveTab('bucket')}
                    className="text-[10px] font-black tracking-[0.2em] uppercase"
                    style={{ color: ACCENT }}
                  >
                    Ver todo
                  </motion.button>
                </div>
                {bucket.length === 0 ? (
                  <p className="text-sm" style={{ color: SURFACE.textMuted }}>Sin experiencias registradas aún.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {bucket.slice(0, 4).map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: SURFACE.border }}>
                        {item.status === 'Completado' ? (
                          <CheckCircle2 size={16} style={{ color: STATUS_COLORS['Completado'] }} />
                        ) : item.status === 'En progreso' ? (
                          <Clock size={16} style={{ color: STATUS_COLORS['En progreso'] }} />
                        ) : (
                          <Circle size={16} style={{ color: STATUS_COLORS['Pendiente'] }} />
                        )}
                        <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: SURFACE.text, opacity: 0.92 }}>{item.description}</p>
                        <span className="text-xs shrink-0" style={{ color: SURFACE.textMuted }}>{item.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── BIBLIOTECA ── */}
        {activeTab === 'biblioteca' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-7xl"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: SURFACE.textMuted }}>Tu biblioteca</p>
                <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight" style={{ color: SURFACE.text }}>
                  {books.length > 0 ? `${books.length} libros` : 'Biblioteca'}
                </h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setBookModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714' }}
              >
                <Plus size={15} strokeWidth={2.5} /> Nuevo libro
              </motion.button>
            </motion.div>

            {books.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <BookOpen size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>Sin libros todavía</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Agrega tu primer libro a la biblioteca.</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map(book => (
                  <motion.div key={book.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                        <BookOpen size={18} style={{ color: ACCENT }} />
                      </div>
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: `${STATUS_COLORS[book.status]}22`,
                          color: STATUS_COLORS[book.status],
                          border: `1px solid ${STATUS_COLORS[book.status]}40`,
                        }}
                      >
                        {book.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-snug" style={{ color: SURFACE.text }}>{book.title}</h3>
                      <p className="text-sm mt-1" style={{ color: SURFACE.textMuted }}>{book.author}</p>
                    </div>
                    {book.rating && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={14} fill={n <= book.rating! ? ACCENT : 'none'} stroke={n <= book.rating! ? ACCENT : '#4A4238'} />
                        ))}
                      </div>
                    )}
                    {book.notes && (
                      <p className="text-xs leading-relaxed" style={{ color: SURFACE.textMuted }}>{book.notes}</p>
                    )}
                    <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: SURFACE.border }}>
                      <motion.button
                        whileTap={tapPhysics}
                        onClick={() => openEditBook(book)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(245,239,230,0.05)', color: ACCENT }}
                      >
                        <Edit3 size={14} /> Editar
                      </motion.button>
                      <motion.button
                        whileTap={tapPhysics}
                        onClick={() => handleDeleteBook(book.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(245,239,230,0.05)', color: '#E18B8B' }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── HOBBIES ── */}
        {activeTab === 'hobbies' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-7xl"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: SURFACE.textMuted }}>Tus prácticas</p>
                <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight" style={{ color: SURFACE.text }}>
                  Hobbies activos
                </h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setHobbyModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714' }}
              >
                <Plus size={15} strokeWidth={2.5} /> Nuevo hobby
              </motion.button>
            </motion.div>

            {hobbies.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <Puzzle size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>Sin hobbies registrados</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Agrega tus actividades favoritas.</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hobbies.map(hobby => (
                  <motion.div key={hobby.id} variants={itemVariants} whileHover={hoverPhysics} className="neo-card flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 rounded-2xl" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}>
                        <Puzzle size={18} style={{ color: ACCENT }} />
                      </div>
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(245,239,230,0.05)', border: `1px solid ${SURFACE.border}`, color: SURFACE.textMuted }}
                      >
                        {hobby.frequency}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg" style={{ color: SURFACE.text }}>{hobby.name}</h3>
                    {hobby.last_practiced && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} style={{ color: SURFACE.textMuted }} />
                        <p className="text-xs" style={{ color: SURFACE.textMuted }}>
                          Última vez: {new Date(hobby.last_practiced).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {hobby.notes && (
                      <p className="text-xs leading-relaxed" style={{ color: SURFACE.textMuted }}>{hobby.notes}</p>
                    )}
                    <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: SURFACE.border }}>
                      <motion.button
                        whileTap={tapPhysics}
                        onClick={() => handleDeleteHobby(hobby.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(245,239,230,0.05)', color: '#E18B8B' }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── BUCKET LIST ── */}
        {activeTab === 'bucket' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-7xl"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: SURFACE.textMuted }}>Experiencias por vivir</p>
                <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight" style={{ color: SURFACE.text }}>
                  Bucket List
                </h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setBucketModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714' }}
              >
                <Plus size={15} strokeWidth={2.5} /> Nueva experiencia
              </motion.button>
            </motion.div>

            {bucket.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <Star size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>Bucket list vacío</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Agrega experiencias que quieres vivir.</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} className="flex flex-col gap-5">
                {BUCKET_STATUSES.map(status => {
                  const items = bucket.filter(b => b.status === status);
                  if (items.length === 0) return null;
                  return (
                    <motion.div key={status} variants={itemVariants}>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[status], boxShadow: `0 0 8px ${STATUS_COLORS[status]}` }}
                        />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>
                          {status} ({items.length})
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {items.map(item => (
                          <motion.div key={item.id} whileHover={hoverPhysics} className="neo-card flex items-center gap-4 !py-4">
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
                              <p
                                className="font-bold text-sm"
                                style={{
                                  color: SURFACE.text,
                                  textDecoration: item.status === 'Completado' ? 'line-through' : 'none',
                                  opacity: item.status === 'Completado' ? 0.5 : 1,
                                }}
                              >
                                {item.description}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: SURFACE.textMuted }}>{item.category}</p>
                            </div>
                            <motion.button
                              whileTap={tapPhysics}
                              onClick={() => handleDeleteBucket(item.id)}
                              className="shrink-0 p-2 rounded-xl transition-colors"
                              style={{ background: 'rgba(245,239,230,0.05)', color: '#E18B8B' }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
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
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBook ? 'Guardar Cambios' : 'Agregar a Biblioteca'}
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
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
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
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agregar al Bucket List'}
          </motion.button>
        </form>
      </AetherModal>

    </AuraLayout>
  );
}
