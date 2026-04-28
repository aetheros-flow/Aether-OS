import { useState, useEffect } from 'react';
import {
  BookOpen, Tv, Puzzle, Star, Plus,
  Loader2, Trash2, CheckCircle2, Circle, Clock, Edit3, Sparkles,
  ArrowRight, Play, TrendingUp, MoreVertical, Library, LayoutDashboard,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { toast } from 'sonner';

import { useOcioData } from '../hooks/useOcioData';
import { useOcioInsight } from '../hooks/useOcioInsight';
import { usePantallaData } from '../pantalla/hooks/usePantallaData';
import { useVideosData } from '../videos/hooks/useVideosData';
import { getMovie, getTv, posterUrl } from '../pantalla/lib/tmdb';
import type {
  NewBookInput, NewHobbyInput, NewBucketInput,
  BookStatus, BucketStatus, OcioBook,
} from '../types';
import AetherModal from '../../../core/components/AetherModal';
import AuraLayout, { type TabItem } from '../../../components/layout/AuraLayout';
import { SURFACE, UNIVERSE_ACCENT } from '../../../lib/universe-palette';
import { useAuth } from '../../../core/contexts/AuthContext';

// External Lebrary app — landing URL. The Library button hands the user off
// here with a magic-link fragment so they arrive already authenticated.
const LEBRARY_URL = 'https://lebrary.netlify.app/';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'biblioteca' | 'hobbies' | 'bucket';

// ── Ocio identity — coral clay (Soft Cosmos desaturated) ─────────────────────
const ACCENT = UNIVERSE_ACCENT.ocio;

// Yearly reading goal — used by the Books Read stat card progress bar.
const READING_GOAL_PER_YEAR = 24;

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

// ── Status enum values stay as DB strings (Spanish) — display labels are English
const BOOK_STATUSES: BookStatus[] = ['Por leer', 'Leyendo', 'Leído'];
const BUCKET_STATUSES: BucketStatus[] = ['Pendiente', 'En progreso', 'Completado'];

const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  'Por leer': 'To Read',
  'Leyendo': 'Reading',
  'Leído': 'Read',
};
const BUCKET_STATUS_LABEL: Record<BucketStatus, string> = {
  'Pendiente': 'Pending',
  'En progreso': 'In Progress',
  'Completado': 'Completed',
};

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
  { id: 'dashboard',  label: 'Hub',     icon: <LayoutDashboard size={16} />, mobileLabel: 'Hub'     },
  { id: 'movies',     label: 'Movies',  icon: <Tv size={16} />,              mobileLabel: 'Movies'  },
  { id: 'videos',     label: 'Videos',  icon: <Play size={16} />,            mobileLabel: 'Videos'  },
  { id: 'biblioteca', label: 'Library', icon: <BookOpen size={16} />,        mobileLabel: 'Library' },
  { id: 'hobbies',    label: 'Hobbies', icon: <Puzzle size={16} />,          mobileLabel: 'Hobbies' },
  { id: 'bucket',     label: 'Bucket',  icon: <Star size={16} />,            mobileLabel: 'Bucket'  },
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

// ── Featured Pantalla item (resolved from TMDB) ──────────────────────────────
type FeaturedShow = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  subtitle: string;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function OcioDashboard() {
  const navigate = useNavigate();
  const {
    books, hobbies, bucket, loading,
    createBook, updateBook, deleteBook,
    createHobby, deleteHobby,
    createBucketItem, updateBucketItem, deleteBucketItem,
  } = useOcioData();

  // Pantalla + Videos data feed the Dashboard tab's featured grids.
  const { watchlist, progress } = usePantallaData();
  const { items: videoItems } = useVideosData();

  // Hand off the current Supabase session to Lebrary as a URL fragment so the
  // external app can adopt it via magic-link without a second login. Falls
  // back to the bare URL when no session is available.
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

  // ── Featured TV — first 2 watchlist items resolved from TMDB ─────────────
  const [featured, setFeatured] = useState<FeaturedShow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const top = watchlist.slice(0, 2);
    if (top.length === 0) { setFeatured([]); return; }

    (async () => {
      try {
        const results = await Promise.all(top.map(async (item): Promise<FeaturedShow> => {
          if (item.media_type === 'movie') {
            const movie = await getMovie(item.tmdb_id);
            const subtitle = movie.runtime ? `MOVIE • ${Math.floor(movie.runtime / 60)}:${String(movie.runtime % 60).padStart(2, '0')}` : 'MOVIE';
            return { tmdb_id: item.tmdb_id, media_type: 'movie', title: movie.title, posterPath: movie.poster_path, subtitle };
          } else {
            const show = await getTv(item.tmdb_id);
            const prog = progress.find(p => p.tmdb_id === item.tmdb_id);
            const subtitle = prog
              ? `S${prog.season} • E${String(prog.episode).padStart(2, '0')}`
              : 'TV SHOW';
            return { tmdb_id: item.tmdb_id, media_type: 'tv', title: show.name, posterPath: show.poster_path, subtitle };
          }
        }));
        if (!cancelled) setFeatured(results);
      } catch (err) {
        console.warn('[OcioDashboard] TMDB fetch failed; falling back to empty state', err);
        if (!cancelled) setFeatured([]);
      }
    })();

    return () => { cancelled = true; };
  }, [watchlist, progress]);

  const featuredVideo = videoItems[0] ?? null;

  // Derived KPIs
  const booksRead = books.filter(b => b.status === 'Leído').length;
  const activeHobbies = hobbies.length;
  const bucketDone = bucket.filter(b => b.status === 'Completado').length;
  const readingProgress = Math.min(100, Math.round((booksRead / READING_GOAL_PER_YEAR) * 100));

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
      if (editingBook) { await updateBook(editingBook.id, newBook); toast.success('Book updated'); }
      else { await createBook(newBook); toast.success('Book added to library'); }
      closeBookModal();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error saving'); }
    finally { setIsSubmitting(false); }
  };
  const handleHobbySubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newHobby.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createHobby(newHobby);
      toast.success('Hobby registered');
      setHobbyModalOpen(false);
      setNewHobby(DEFAULT_HOBBY);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error saving'); }
    finally { setIsSubmitting(false); }
  };
  const handleBucketSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newBucket.description.trim()) return;
    setIsSubmitting(true);
    try {
      await createBucketItem(newBucket);
      toast.success('Experience added to bucket list');
      setBucketModalOpen(false);
      setNewBucket(DEFAULT_BUCKET);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error saving'); }
    finally { setIsSubmitting(false); }
  };
  const handleDeleteBook   = async (id: string) => { try { await deleteBook(id);       toast.success('Book deleted');       } catch { toast.error('Error deleting'); } };
  const handleDeleteHobby  = async (id: string) => { try { await deleteHobby(id);      toast.success('Hobby deleted');      } catch { toast.error('Error deleting'); } };
  const handleDeleteBucket = async (id: string) => { try { await deleteBucketItem(id); toast.success('Experience deleted'); } catch { toast.error('Error deleting'); } };
  const handleBucketStatus = async (id: string, status: BucketStatus) => { try { await updateBucketItem(id, status); } catch { toast.error('Error updating'); } };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SURFACE.bg }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <AuraLayout
      tabs={auraTabs}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === 'movies') navigate('/ocio/pantalla');
        else if (tab === 'videos') navigate('/ocio/videos');
        else setActiveTab(tab as TabType);
      }}
      accentColor={ACCENT}
      title="Leisure & Hobbies"
      subtitle="Entertainment & Pastimes"
    >
        {/* ── DASHBOARD (OVERVIEW) ── */}
        {activeTab === 'dashboard' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 w-full max-w-2xl mx-auto"
          >
            {/* Hero tagline — title is provided by AuraLayout */}
            <motion.p
              variants={itemVariants}
              className="font-serif italic text-base md:text-[17px] -mt-2"
              style={{ color: SURFACE.textMuted }}
            >
              Curate your mental space and digital consumption.
            </motion.p>

            {/* AI Insight — left-bordered alert with corner glow */}
            <motion.section
              variants={itemVariants}
              whileHover={{ scale: 1.005 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative overflow-hidden rounded-2xl p-4 md:p-5"
              style={{
                background: 'rgba(33,29,25,0.60)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: `1px solid ${SURFACE.border}`,
                borderLeft: `4px solid ${ACCENT}`,
              }}
            >
              <div className="relative flex items-start gap-3">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}30` }}
                >
                  <Sparkles size={16} style={{ color: ACCENT }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-[10px] uppercase font-black tracking-[0.2em]" style={{ color: ACCENT }}>Aether AI Insight</p>
                    {!insight.loading && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                        style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}45` }}
                      >
                        Suggested {insight.suggestedScore.toFixed(1)}
                        {insight.delta != null && insight.delta !== 0 && (
                          <span className="ml-1 opacity-80">
                            ({insight.delta > 0 ? '+' : ''}{insight.delta.toFixed(1)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] leading-relaxed" style={{ color: SURFACE.text, opacity: 0.9 }}>
                    {insight.reasoning}
                  </p>
                </div>
              </div>
              {/* corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-2xl"
                style={{ background: `${ACCENT}26` }}
              />
            </motion.section>

            {/* TV Shows & Movies — 2-col poster grid */}
            <motion.section variants={itemVariants} className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <h3 className="font-sans text-2xl font-semibold tracking-tight" style={{ color: SURFACE.text }}>TV Shows &amp; Movies</h3>
                <Link
                  to="/ocio/pantalla"
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] active:opacity-70 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  Open <ArrowRight size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featured.length > 0 ? (
                  featured.map((show) => (
                    <Link
                      key={`${show.media_type}-${show.tmdb_id}`}
                      to={`/ocio/pantalla/${show.media_type}/${show.tmdb_id}`}
                      className="group relative rounded-xl overflow-hidden aspect-[3/4] block"
                      style={{
                        background: 'rgba(33,29,25,0.6)',
                        border: `1px solid ${SURFACE.border}`,
                      }}
                    >
                      {show.posterPath ? (
                        <img
                          src={posterUrl(show.posterPath, 'w342') ?? ''}
                          alt={show.title}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: `${ACCENT}1A` }}>
                          <Tv size={32} style={{ color: ACCENT, opacity: 0.6 }} />
                        </div>
                      )}
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to top, ${SURFACE.bg} 0%, transparent 60%)` }}
                      />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[12px] font-medium leading-snug line-clamp-2" style={{ color: SURFACE.text }}>{show.title}</p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: SURFACE.textMuted }}>{show.subtitle}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  // Empty state — 2 placeholder tiles inviting to open Pantalla
                  Array.from({ length: 2 }).map((_, i) => (
                    <Link
                      key={`empty-${i}`}
                      to="/ocio/pantalla"
                      className="group relative rounded-xl overflow-hidden aspect-[3/4] block flex items-center justify-center"
                      style={{
                        background: 'rgba(33,29,25,0.5)',
                        border: `1px dashed ${SURFACE.border}`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 px-4 text-center">
                        <Tv size={28} style={{ color: ACCENT, opacity: 0.7 }} />
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: SURFACE.textMuted }}>
                          {i === 0 ? 'Add to watchlist' : 'Discover titles'}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.section>

            {/* YouTube & more — featured video card */}
            <motion.section variants={itemVariants} className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <h3 className="font-sans text-2xl font-semibold tracking-tight" style={{ color: SURFACE.text }}>YouTube &amp; more</h3>
                <Link
                  to="/ocio/videos"
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] active:opacity-70 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  Open <ArrowRight size={13} />
                </Link>
              </div>
              {featuredVideo ? (
                <a
                  href={featuredVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(33,29,25,0.60)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: `1px solid ${SURFACE.border}`,
                  }}
                >
                  <div className="relative aspect-video w-full">
                    {featuredVideo.thumbnail_url ? (
                      <img
                        src={featuredVideo.thumbnail_url}
                        alt={featuredVideo.title ?? 'Video'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: `${ACCENT}14` }} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform group-active:scale-95"
                        style={{ background: ACCENT, color: '#1B1714' }}
                      >
                        <Play size={22} fill="#1B1714" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: SURFACE.text }}>
                        {featuredVideo.title ?? 'Untitled video'}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] truncate" style={{ color: SURFACE.textMuted }}>
                        {featuredVideo.author_name ?? featuredVideo.platform}
                        {featuredVideo.duration_sec ? ` • ${Math.floor(featuredVideo.duration_sec / 60)}:${String(featuredVideo.duration_sec % 60).padStart(2, '0')}` : ''}
                      </p>
                    </div>
                    {!insight.loading && (
                      <span
                        className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black tabular-nums"
                        style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}45` }}
                      >
                        SUGGESTED {insight.suggestedScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </a>
              ) : (
                <Link
                  to="/ocio/videos"
                  className="block rounded-xl overflow-hidden p-6 flex flex-col items-center gap-3 text-center"
                  style={{
                    background: 'rgba(33,29,25,0.5)',
                    border: `1px dashed ${SURFACE.border}`,
                  }}
                >
                  <Play size={28} style={{ color: ACCENT, opacity: 0.7 }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: SURFACE.textMuted }}>
                    Save your first video
                  </p>
                </Link>
              )}
            </motion.section>

            {/* Library Controls — primary ADD + secondary LIBRARY */}
            <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={tapPhysics}
                onClick={() => setBookModalOpen(true)}
                className="h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.15em]"
                style={{
                  background: ACCENT,
                  color: '#1B1714',
                  boxShadow: `0 0 24px ${ACCENT}33`,
                }}
              >
                <Plus size={16} strokeWidth={3} /> Add Book
              </motion.button>
              <motion.a
                whileTap={tapPhysics}
                href={authLebraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.15em]"
                style={{
                  background: '#D4A75D',
                  color: '#1B1714',
                  boxShadow: '0 0 24px #D4A75D33',
                }}
              >
                <Library size={16} /> Library
              </motion.a>
            </motion.section>

            {/* Books Read This Year — stat card with progress */}
            <motion.section
              variants={itemVariants}
              className="rounded-2xl p-5 md:p-6 flex flex-col gap-4"
              style={{
                background: 'rgba(33,29,25,0.55)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: `1px solid ${SURFACE.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: SURFACE.textMuted }}>
                  Books Read This Year
                </h3>
                <TrendingUp size={18} style={{ color: ACCENT }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums tracking-tight" style={{ color: ACCENT }}>{booksRead}</span>
                <span className="text-base" style={{ color: SURFACE.textMuted }}>/ {READING_GOAL_PER_YEAR} goal</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${readingProgress}%`,
                    background: ACCENT,
                    boxShadow: `0 0 10px ${ACCENT}60`,
                  }}
                />
              </div>
            </motion.section>

            {/* Virtual Library list — recent books */}
            <motion.section variants={itemVariants} className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <h3 className="font-sans text-2xl font-semibold tracking-tight" style={{ color: SURFACE.text }}>Your virtual library</h3>
                {books.length > 4 && (
                  <button
                    onClick={() => setActiveTab('biblioteca')}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] active:opacity-70 transition-opacity"
                    style={{ color: ACCENT }}
                  >
                    View all <ArrowRight size={13} />
                  </button>
                )}
              </div>
              {books.length === 0 ? (
                <div
                  className="rounded-xl p-5 flex items-center gap-3"
                  style={{
                    background: 'rgba(33,29,25,0.5)',
                    border: `1px dashed ${SURFACE.border}`,
                  }}
                >
                  <BookOpen size={20} style={{ color: ACCENT, opacity: 0.7 }} />
                  <p className="text-[13px]" style={{ color: SURFACE.textMuted }}>
                    Your library is empty — add your first book.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {books.slice(0, 5).map((book, idx) => (
                    <button
                      key={book.id}
                      onClick={() => openEditBook(book)}
                      className="group flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/[0.04] text-left"
                    >
                      {/* Stylized cover thumbnail (initials) */}
                      <div
                        className="w-12 h-16 rounded shrink-0 flex items-center justify-center overflow-hidden relative"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT}33, ${ACCENT}10)`,
                          border: `1px solid ${ACCENT}30`,
                        }}
                      >
                        <span className="font-serif text-lg font-bold" style={{ color: ACCENT }}>
                          {book.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div
                        className={`flex-1 min-w-0 ${idx < Math.min(books.length, 5) - 1 ? 'border-b' : ''} pb-2`}
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <p className="text-[13px] font-medium truncate" style={{ color: SURFACE.text }}>{book.title}</p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] truncate" style={{ color: SURFACE.textMuted }}>
                          {book.author || BOOK_STATUS_LABEL[book.status]}
                        </p>
                      </div>
                      <MoreVertical
                        size={18}
                        className="shrink-0 transition-colors"
                        style={{ color: SURFACE.textMuted }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.section>

            {/* Quick KPI strip — keeps universe metrics visible */}
            <motion.section variants={itemVariants} className="grid grid-cols-3 gap-3">
              {[
                { label: 'Hobbies', value: activeHobbies, icon: Puzzle },
                { label: 'Bucket',  value: bucketDone,    icon: Star   },
                { label: 'Books',   value: booksRead,     icon: BookOpen },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 flex flex-col gap-1.5"
                  style={{
                    background: 'rgba(33,29,25,0.5)',
                    border: `1px solid ${SURFACE.border}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: ACCENT }} />
                    <span className="text-[9px] font-black tracking-[0.18em] uppercase" style={{ color: SURFACE.textMuted }}>{label}</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: SURFACE.text }}>{value}</span>
                </div>
              ))}
            </motion.section>
          </motion.div>
        )}

        {/* ── LIBRARY ── */}
        {activeTab === 'biblioteca' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-2xl mx-auto"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="font-sans text-3xl md:text-[32px] font-bold tracking-tight" style={{ color: SURFACE.text, letterSpacing: '-0.02em' }}>
                  {books.length > 0 ? `${books.length} Books` : 'Library'}
                </h1>
                <p className="font-serif italic text-base md:text-[17px]" style={{ color: SURFACE.textMuted }}>
                  Track what you read and the highlights that stay with you.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setBookModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 24px ${ACCENT}33` }}
              >
                <Plus size={14} strokeWidth={3} /> New book
              </motion.button>
            </motion.div>

            {books.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <BookOpen size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>No books yet</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Add your first book to the library.</p>
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
                        {BOOK_STATUS_LABEL[book.status]}
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
                        <Edit3 size={14} /> Edit
                      </motion.button>
                      <motion.button
                        whileTap={tapPhysics}
                        onClick={() => handleDeleteBook(book.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(245,239,230,0.05)', color: '#E18B8B' }}
                      >
                        <Trash2 size={14} /> Delete
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
            className="flex flex-col gap-6 w-full max-w-2xl mx-auto"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="font-sans text-3xl md:text-[32px] font-bold tracking-tight" style={{ color: SURFACE.text, letterSpacing: '-0.02em' }}>
                  Hobbies
                </h1>
                <p className="font-serif italic text-base md:text-[17px]" style={{ color: SURFACE.textMuted }}>
                  Practices that fuel curiosity and craft.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setHobbyModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 24px ${ACCENT}33` }}
              >
                <Plus size={14} strokeWidth={3} /> New hobby
              </motion.button>
            </motion.div>

            {hobbies.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <Puzzle size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>No hobbies registered</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Add your favorite activities.</p>
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
                          Last time: {new Date(hobby.last_practiced).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                        <Trash2 size={14} /> Delete
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
            className="flex flex-col gap-6 w-full max-w-2xl mx-auto"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="font-sans text-3xl md:text-[32px] font-bold tracking-tight" style={{ color: SURFACE.text, letterSpacing: '-0.02em' }}>
                  Bucket List
                </h1>
                <p className="font-serif italic text-base md:text-[17px]" style={{ color: SURFACE.textMuted }}>
                  Experiences worth chasing — one at a time.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={tapPhysics}
                onClick={() => setBucketModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] self-start md:self-auto"
                style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 24px ${ACCENT}33` }}
              >
                <Plus size={14} strokeWidth={3} /> New experience
              </motion.button>
            </motion.div>

            {bucket.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center h-48 rounded-[28px] border-2 border-dashed"
                style={{ borderColor: SURFACE.border, background: 'rgba(245,239,230,0.02)' }}
              >
                <Star size={40} style={{ color: SURFACE.textMuted, opacity: 0.6 }} />
                <p className="mt-4 font-bold text-base" style={{ color: SURFACE.textMuted }}>Bucket list empty</p>
                <p className="text-sm mt-1" style={{ color: SURFACE.textMuted, opacity: 0.7 }}>Add experiences you want to live.</p>
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
                          {BUCKET_STATUS_LABEL[status]} ({items.length})
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
      {/* ── MODAL: BOOK ───────────────────────────────────────────────────── */}
      <AetherModal isOpen={bookModalOpen} onClose={closeBookModal} title={editingBook ? 'Edit Book' : 'New Book'}>
        <form onSubmit={handleBookSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Title</label>
            <input type="text" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="neo-input" placeholder="Book title" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Author</label>
            <input type="text" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="neo-input" placeholder="Author name" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Status</label>
            <select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value as BookStatus })} className="neo-input appearance-none">
              {BOOK_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{BOOK_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Rating</label>
            <StarRating value={newBook.rating} onChange={v => setNewBook({ ...newBook, rating: v })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notes</label>
            <textarea value={newBook.notes} onChange={e => setNewBook({ ...newBook, notes: e.target.value })} className="neo-input resize-none h-24" placeholder="Reflections, highlights..." />
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingBook ? 'Save Changes' : 'Add to Library'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: HOBBY ─────────────────────────────────────────────────── */}
      <AetherModal isOpen={hobbyModalOpen} onClose={() => { setHobbyModalOpen(false); setNewHobby(DEFAULT_HOBBY); }} title="New Hobby">
        <form onSubmit={handleHobbySubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Name</label>
            <input type="text" required value={newHobby.name} onChange={e => setNewHobby({ ...newHobby, name: e.target.value })} className="neo-input" placeholder="Photography, Guitar, Chess..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Frequency</label>
            <input type="text" value={newHobby.frequency} onChange={e => setNewHobby({ ...newHobby, frequency: e.target.value })} className="neo-input" placeholder="Daily, Weekly, Monthly..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Last practiced</label>
            <input type="date" value={newHobby.last_practiced} onChange={e => setNewHobby({ ...newHobby, last_practiced: e.target.value })} className="neo-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Notes</label>
            <textarea value={newHobby.notes} onChange={e => setNewHobby({ ...newHobby, notes: e.target.value })} className="neo-input resize-none h-20" placeholder="Goal, current level..." />
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Hobby'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: BUCKET ────────────────────────────────────────────────── */}
      <AetherModal isOpen={bucketModalOpen} onClose={() => { setBucketModalOpen(false); setNewBucket(DEFAULT_BUCKET); }} title="New Experience">
        <form onSubmit={handleBucketSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Description</label>
            <textarea required value={newBucket.description} onChange={e => setNewBucket({ ...newBucket, description: e.target.value })} className="neo-input resize-none h-24" placeholder="Run a marathon, Learn to surf..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Category</label>
            <input type="text" value={newBucket.category} onChange={e => setNewBucket({ ...newBucket, category: e.target.value })} className="neo-input" placeholder="Travel, Sports, Creativity..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Initial status</label>
            <select value={newBucket.status} onChange={e => setNewBucket({ ...newBucket, status: e.target.value as BucketStatus })} className="neo-input appearance-none">
              {BUCKET_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{BUCKET_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <motion.button
            whileTap={tapPhysics}
            type="submit"
            disabled={isSubmitting}
            className="mt-2 px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, color: '#1B1714', boxShadow: `0 0 32px ${ACCENT}50` }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Bucket List'}
          </motion.button>
        </form>
      </AetherModal>

    </AuraLayout>
  );
}
