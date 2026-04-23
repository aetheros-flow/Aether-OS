import { useEffect, useMemo, useState } from 'react';
import { Tv, ChevronRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { usePantalla } from '../context';
import { useTmdbDetails } from '../hooks/useTmdbDetails';
import { getTv, posterUrl } from '../lib/tmdb';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';

import TitleCard from '../components/TitleCard';
import SpinnerBlock from '../components/SpinnerBlock';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';

import type { PantallaShowProgressRow } from '../types';

type SubTab = 'progress' | 'upcoming' | 'watchlist' | 'history';
const TABS: { id: SubTab; label: string }[] = [
  { id: 'progress',  label: 'Progress' },
  { id: 'upcoming',  label: 'Upcoming' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'history',   label: 'Watched' },
];

export default function ShowsView() {
  const { watchlist, history, progress } = usePantalla();
  const [tab, setTab] = useState<SubTab>('progress');
  const [search, setSearch] = useState('');

  const watchlistRefs = useMemo(
    () => watchlist.filter(r => r.media_type === 'tv').map(r => ({ tmdbId: r.tmdb_id, mediaType: 'tv' as const })),
    [watchlist]
  );
  const historyRefs = useMemo(
    () => history.filter(r => r.media_type === 'tv').map(r => ({ tmdbId: r.tmdb_id, mediaType: 'tv' as const })),
    [history]
  );

  const { items: watchlistItems, loading: wlLoading } = useTmdbDetails(watchlistRefs);
  const { items: historyItems,   loading: hLoading }  = useTmdbDetails(historyRefs);

  const applySearch = <T extends { name?: string; title?: string }>(items: T[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => (i.name ?? i.title ?? '').toLowerCase().includes(q));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Library</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight leading-none mt-1">
            TV Shows
          </h1>
        </div>
      </div>

      <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search in this list" />

      {tab === 'progress'  && <ProgressTab progressRows={progress} search={search} />}
      {tab === 'upcoming'  && <UpcomingTab progressRows={progress} watchlistRefs={watchlistRefs} search={search} />}

      {tab === 'watchlist' && (
        wlLoading ? <SpinnerBlock /> : watchlistItems.length === 0 ? (
          <div className="py-8"><EmptyState icon={Tv} title="Your TV watchlist is empty" subtitle="Tap the bookmark on any show to add it." /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {applySearch(watchlistItems).map(item => (
              <TitleCard key={item.id} item={item} mediaType="tv" inWatchlist />
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        hLoading ? <SpinnerBlock /> : historyItems.length === 0 ? (
          <div className="py-8"><EmptyState icon={Tv} title="No watched shows yet" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {applySearch(historyItems).map(item => (
              <TitleCard key={item.id} item={item} mediaType="tv" watched />
            ))}
          </div>
        )
      )}
    </motion.div>
  );
}

// ── Segmented tabs (shared style) ────────────────────────────────────────────
function SegmentedTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.05] border border-white/5 overflow-x-auto hide-scrollbar scroll-smooth">
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 min-w-[80px] h-9 rounded-xl text-[13px] font-bold transition-all active:scale-[0.97] whitespace-nowrap px-3"
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

// ── Progress tab: next episode to watch per tracked show ─────────────────────
function ProgressTab({ progressRows, search }: {
  progressRows: PantallaShowProgressRow[]; search: string;
}) {
  const [rows, setRows] = useState<Array<{
    tmdbId: number; name: string; posterPath: string | null;
    nextSeason: number; nextEpisode: number; nextTitle: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (progressRows.length === 0) { setRows([]); return; }
      setLoading(true);
      const details = await Promise.all(progressRows.map(p => getTv(p.tmdb_id).catch(() => null)));
      if (cancelled) return;
      const next = details
        .map((d, i) => {
          if (!d) return null;
          const prog = progressRows[i];
          const season = d.seasons.find(s => s.season_number === prog.season);
          let ns = prog.season, ne = prog.episode + 1;
          if (!season || ne > season.episode_count) {
            ns = prog.season + 1; ne = 1;
          }
          return {
            tmdbId: d.id, name: d.name, posterPath: d.poster_path,
            nextSeason: ns, nextEpisode: ne,
            nextTitle: `S${String(ns).padStart(2, '0')}E${String(ne).padStart(2, '0')}`,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      setRows(next);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [progressRows]);

  const filtered = search.trim()
    ? rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  if (loading) return <SpinnerBlock />;
  if (filtered.length === 0) {
    return <div className="py-8"><EmptyState icon={Tv} title="No shows in progress" subtitle="Mark an episode as watched to start tracking a show." /></div>;
  }
  return (
    <div className="flex flex-col gap-3">
      {filtered.map(r => (
        <Link
          key={r.tmdbId}
          to={`/ocio/pantalla/tv/${r.tmdbId}`}
          className="flex gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all"
        >
          <div className="w-14 md:w-16 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-zinc-900 ring-1 ring-white/5">
            {r.posterPath && (
              <img src={posterUrl(r.posterPath, 'w185') ?? ''} alt={r.name} className="w-full h-full object-cover" draggable={false} />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: PANTALLA_ACCENT }}>
                Next Up
              </p>
              <p className="text-sm font-bold text-white mt-0.5 tabular-nums">{r.nextTitle}</p>
              <p className="text-xs text-zinc-400 truncate">{r.name}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 self-center shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ── Upcoming tab: next_episode_to_air across tracked shows ──────────────────
function UpcomingTab({ progressRows, watchlistRefs, search }: {
  progressRows: PantallaShowProgressRow[];
  watchlistRefs: Array<{ tmdbId: number; mediaType: 'tv' }>;
  search: string;
}) {
  const [rows, setRows] = useState<Array<{
    tmdbId: number; name: string; posterPath: string | null;
    airDate: string; season: number; episode: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = Array.from(new Set([
        ...progressRows.map(p => p.tmdb_id),
        ...watchlistRefs.map(w => w.tmdbId),
      ]));
      if (ids.length === 0) { setRows([]); return; }
      setLoading(true);
      const details = await Promise.all(ids.map(id => getTv(id).catch(() => null)));
      if (cancelled) return;
      const list = details
        .filter((d): d is NonNullable<typeof d> => d !== null && d.next_episode_to_air !== null)
        .map(d => ({
          tmdbId: d.id, name: d.name, posterPath: d.poster_path,
          airDate: d.next_episode_to_air!.air_date ?? '',
          season: d.next_episode_to_air!.season_number,
          episode: d.next_episode_to_air!.episode_number,
        }))
        .filter(r => r.airDate)
        .sort((a, b) => a.airDate.localeCompare(b.airDate));
      setRows(list);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [progressRows, watchlistRefs]);

  const filtered = search.trim()
    ? rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  if (loading) return <SpinnerBlock />;
  if (filtered.length === 0) {
    return <div className="py-8"><EmptyState icon={CalendarDays} title="No upcoming episodes" subtitle="Add shows to your watchlist to see their schedule." /></div>;
  }
  return (
    <div className="flex flex-col gap-3">
      {filtered.map(r => (
        <Link
          key={`${r.tmdbId}-${r.season}-${r.episode}`}
          to={`/ocio/pantalla/tv/${r.tmdbId}`}
          className="flex gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all"
        >
          <div className="w-14 md:w-16 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-zinc-900 ring-1 ring-white/5">
            {r.posterPath && (
              <img src={posterUrl(r.posterPath, 'w185') ?? ''} alt={r.name} className="w-full h-full object-cover" draggable={false} />
            )}
          </div>
          <div className="flex-1 min-w-0 self-center">
            <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: PANTALLA_ACCENT }}>
              {new Date(r.airDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm font-bold text-white mt-0.5 tabular-nums">
              S{String(r.season).padStart(2, '0')}E{String(r.episode).padStart(2, '0')}
            </p>
            <p className="text-xs text-zinc-400 truncate">{r.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
