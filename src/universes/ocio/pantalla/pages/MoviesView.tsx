import { useMemo, useState } from 'react';
import { Clapperboard, ArrowUpDown, Tag, Check } from 'lucide-react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';

import { usePantalla } from '../context';
import { useTmdbDetails } from '../hooks/useTmdbDetails';
import { useTmdbQuery } from '../hooks/useTmdb';
import { getMoviesUpcoming, getGenres } from '../lib/tmdb';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';

import TitleCard from '../components/TitleCard';
import SpinnerBlock from '../components/SpinnerBlock';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';

import type { TmdbMediaItem } from '../types';

type SubTab = 'watchlist' | 'upcoming' | 'history';
type Sort = 'recent' | 'rating' | 'title';

const TABS: { id: SubTab; label: string }[] = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'history',   label: 'Watched' },
];

export default function MoviesView() {
  const { watchlist, history } = usePantalla();
  const [tab, setTab] = useState<SubTab>('watchlist');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [genreFilter, setGenreFilter] = useState<number | null>(null);
  const [genreSheetOpen, setGenreSheetOpen] = useState(false);

  const { data: genres } = useTmdbQuery(() => getGenres('movie'), []);

  const watchlistRefs = useMemo(
    () => watchlist.filter(r => r.media_type === 'movie').map(r => ({ tmdbId: r.tmdb_id, mediaType: 'movie' as const })),
    [watchlist]
  );
  const historyRefs = useMemo(
    () => history.filter(r => r.media_type === 'movie').map(r => ({ tmdbId: r.tmdb_id, mediaType: 'movie' as const })),
    [history]
  );

  const { items: watchlistItems, loading: wlLoading } = useTmdbDetails(watchlistRefs);
  const { items: historyItems,   loading: hLoading }  = useTmdbDetails(historyRefs);
  const { data: upcoming,        loading: upLoading } = useTmdbQuery(() => getMoviesUpcoming(), []);

  const list: TmdbMediaItem[] = useMemo(() => {
    let source: TmdbMediaItem[] =
      tab === 'watchlist' ? watchlistItems
      : tab === 'history' ? historyItems
      : upcoming?.results ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      source = source.filter(i => (i.title ?? i.name ?? '').toLowerCase().includes(q));
    }
    if (genreFilter) {
      source = source.filter(i => i.genre_ids?.includes(genreFilter));
    }
    const sorted = [...source];
    if (sort === 'rating') sorted.sort((a, b) => b.vote_average - a.vote_average);
    else if (sort === 'title') sorted.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    return sorted;
  }, [tab, watchlistItems, historyItems, upcoming, search, genreFilter, sort]);

  const loading = tab === 'watchlist' ? wlLoading : tab === 'history' ? hLoading : upLoading;

  const activeGenre = genreFilter ? genres?.find(g => g.id === genreFilter) : null;
  const sortLabel = sort === 'recent' ? 'Recent' : sort === 'rating' ? 'Rating' : 'Title';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Library</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight leading-none mt-1">
            Movies
          </h1>
        </div>
        <p className="text-[11px] font-semibold text-zinc-500 pb-1 tabular-nums">
          {list.length} {list.length === 1 ? 'title' : 'titles'}
        </p>
      </div>

      {/* Segmented tabs */}
      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Toolbar: search + sort + genre */}
      <div className="flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search in this list" />
        <div className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth -mx-4 md:mx-0 px-4 md:px-0">
          {tab !== 'upcoming' && (
            <Chip
              icon={ArrowUpDown}
              label={sortLabel}
              onClick={() => setSort(sort === 'recent' ? 'rating' : sort === 'rating' ? 'title' : 'recent')}
            />
          )}
          <Chip
            icon={Tag}
            label={activeGenre?.name ?? 'Genre'}
            active={Boolean(activeGenre)}
            onClick={() => setGenreSheetOpen(true)}
          />
          {activeGenre && (
            <button
              onClick={() => setGenreFilter(null)}
              className="flex items-center px-3 h-9 rounded-full text-[12px] font-semibold text-zinc-400 hover:text-white active:scale-95 active:text-white transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? <SpinnerBlock /> : list.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={Clapperboard}
            title={
              tab === 'watchlist' ? 'Your movie watchlist is empty' :
              tab === 'history'   ? 'No watched movies yet' :
                                    'No upcoming movies available'
            }
            subtitle={tab !== 'upcoming' ? 'Tap the bookmark on any movie to add it.' : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {list.map(item => (
            <TitleCard
              key={item.id}
              item={item}
              mediaType="movie"
              inWatchlist={tab === 'watchlist'}
              watched={tab === 'history'}
            />
          ))}
        </div>
      )}

      {/* Genre bottom sheet */}
      <GenreSheet
        open={genreSheetOpen}
        onClose={() => setGenreSheetOpen(false)}
        genres={genres ?? []}
        selected={genreFilter}
        onSelect={(id) => { setGenreFilter(id); setGenreSheetOpen(false); }}
      />
    </motion.div>
  );
}

// ── Segmented tabs ───────────────────────────────────────────────────────────
function SegmentedTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.05] border border-white/5">
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 h-9 rounded-xl text-[13px] font-bold transition-all active:scale-[0.97]"
            style={{
              background: isActive ? PANTALLA_ACCENT : 'transparent',
              color: isActive ? '#000' : '#a1a1aa',
              boxShadow: isActive ? `0 2px 10px ${PANTALLA_ACCENT}40` : 'none',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Toolbar chip ─────────────────────────────────────────────────────────────
function Chip({ icon: Icon, label, active, onClick }: {
  icon: typeof Clapperboard; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0 active:scale-95"
      style={{
        background: active ? `${PANTALLA_ACCENT}18` : 'rgba(255,255,255,0.045)',
        border: `1px solid ${active ? `${PANTALLA_ACCENT}55` : 'rgba(255,255,255,0.08)'}`,
        color: active ? PANTALLA_ACCENT : '#d4d4d8',
      }}
    >
      <Icon size={13} strokeWidth={2.25} />
      {label}
    </button>
  );
}

// ── Genre sheet ─────────────────────────────────────────────────────────────
function GenreSheet({ open, onClose, genres, selected, onSelect }: {
  open: boolean;
  onClose: () => void;
  genres: { id: number; name: string }[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-[28px] bg-zinc-950 border-t border-white/8 flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+8px)] touch-pan-y"
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-3 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-xl text-white tracking-tight">Filter by Genre</h3>
              <button onClick={() => onSelect(null)} className="px-3 h-8 rounded-full text-[12px] font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
                Reset
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-8 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {genres.map(g => {
                  const isSelected = selected === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => onSelect(g.id)}
                      className="flex items-center justify-between px-4 h-11 rounded-xl text-[13px] font-semibold transition-colors"
                      style={{
                        background: isSelected ? `${PANTALLA_ACCENT}18` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? `${PANTALLA_ACCENT}55` : 'rgba(255,255,255,0.06)'}`,
                        color: isSelected ? PANTALLA_ACCENT : '#e4e4e7',
                      }}
                    >
                      {g.name}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
