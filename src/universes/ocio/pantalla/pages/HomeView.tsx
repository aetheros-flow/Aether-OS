import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Tv, Bookmark, Play, Plus } from 'lucide-react';

import { usePantalla } from '../context';
import { useTmdbQuery } from '../hooks/useTmdb';
import {
  discover, getTrending, getMoviesNowPlaying, getTv, getMovie, searchMulti,
  backdropUrl, posterUrl,
} from '../lib/tmdb';
import {
  PANTALLA_ACCENT, STREAMING_PROVIDERS, STREAMING_NETWORKS, DEFAULT_REGION,
  type StreamingProviderKey,
} from '../lib/tmdb-constants';

import SearchBar from '../components/SearchBar';
import ProviderFilter from '../components/ProviderFilter';
import SectionHeader from '../components/SectionHeader';
import TitleCard from '../components/TitleCard';
import UpcomingCard from '../components/UpcomingCard';
import HorizontalScroller from '../components/HorizontalScroller';
import SpinnerBlock from '../components/SpinnerBlock';
import EmptyState from '../components/EmptyState';

import type { MediaType, TmdbMediaItem } from '../types';

export default function HomeView() {
  const { watchlist, progress, isInWatchlist, isWatched } = usePantalla();

  // ── Search ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const searching = debouncedQuery.trim().length >= 2;
  const { data: searchResults, loading: searchLoading } = useTmdbQuery(
    () => searching ? searchMulti(debouncedQuery.trim()) : Promise.resolve(null),
    [debouncedQuery, searching]
  );

  // ── Trending ───────────────────────────────────────────────────────────
  const [trendingType, setTrendingType] = useState<MediaType>('movie');
  const { data: trending, loading: trendingLoading } = useTmdbQuery(
    () => getTrending(trendingType, 'week'),
    [trendingType]
  );
  const featured = trending?.results?.[0] ?? null;

  // ── Streaming (discover by provider) ───────────────────────────────────
  const [streamProv, setStreamProv] = useState<StreamingProviderKey>('netflix');
  const streamingProviderId = STREAMING_PROVIDERS.find(p => p.key === streamProv)!.id;
  const { data: streamingResults, loading: streamingLoading } = useTmdbQuery(
    () => discover('tv', {
      with_watch_providers: String(streamingProviderId),
      watch_region: DEFAULT_REGION,
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
    }),
    [streamingProviderId]
  );

  // ── Network production ─────────────────────────────────────────────────
  const [networkProv, setNetworkProv] = useState<StreamingProviderKey>('netflix');
  const networkId = STREAMING_NETWORKS.find(p => p.key === networkProv)!.id;
  const { data: networkResults, loading: networkLoading } = useTmdbQuery(
    () => discover('tv', { with_networks: String(networkId), sort_by: 'popularity.desc' }),
    [networkId]
  );

  // ── Now playing (movies) ───────────────────────────────────────────────
  const { data: nowPlaying, loading: nowPlayingLoading } = useTmdbQuery(
    () => getMoviesNowPlaying(),
    []
  );

  // ── Upcoming schedule ──────────────────────────────────────────────────
  const trackedShowIds = useMemo(() => {
    const fromProgress = progress.map(p => p.tmdb_id);
    const fromWatchlist = watchlist.filter(w => w.media_type === 'tv').map(w => w.tmdb_id);
    return Array.from(new Set([...fromProgress, ...fromWatchlist])).slice(0, 8);
  }, [progress, watchlist]);

  const [upcoming, setUpcoming] = useState<Array<{
    tmdbId: number; posterPath: string | null; title: string;
    airDate: string; episodeLabel: string;
  }>>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadUpcoming() {
      if (trackedShowIds.length === 0) { setUpcoming([]); return; }
      setUpcomingLoading(true);
      try {
        const details = await Promise.all(trackedShowIds.map(id => getTv(id).catch(() => null)));
        const rows = details
          .filter((d): d is NonNullable<typeof d> => d !== null && d.next_episode_to_air !== null)
          .map(d => ({
            tmdbId: d.id,
            posterPath: d.poster_path,
            title: d.name,
            airDate: d.next_episode_to_air!.air_date ?? '',
            episodeLabel: `S${String(d.next_episode_to_air!.season_number).padStart(2, '0')}E${String(d.next_episode_to_air!.episode_number).padStart(2, '0')}`,
          }))
          .filter(r => r.airDate)
          .sort((a, b) => a.airDate.localeCompare(b.airDate));
        if (!cancelled) setUpcoming(rows);
      } finally {
        if (!cancelled) setUpcomingLoading(false);
      }
    }
    loadUpcoming();
    return () => { cancelled = true; };
  }, [trackedShowIds]);

  const watchlistPreview = watchlist.slice(0, 12);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-8 md:gap-10">

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <SearchBar value={query} onChange={setQuery} placeholder="Search movies, shows…" />

      {searching ? (
        <SearchResults loading={searchLoading} results={searchResults?.results ?? null} isInWatchlist={isInWatchlist} isWatched={isWatched} />
      ) : (
        <>
          {/* ── Featured hero (top trending) ─────────────────────────── */}
          {featured && <FeaturedHero item={featured} mediaType={trendingType} />}

          {/* ── Trending ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionHeader title="Trending" eyebrow="This Week" />
              <TrendingToggle value={trendingType} onChange={setTrendingType} />
            </div>
            {trendingLoading ? <SpinnerBlock /> : (
              <HorizontalScroller>
                {trending?.results.slice(1, 20).map(item => (
                  <TitleCard
                    key={item.id}
                    item={item}
                    mediaType={trendingType}
                    fixedWidth
                    inWatchlist={isInWatchlist(item.id, trendingType)}
                    watched={isWatched(item.id, trendingType)}
                  />
                ))}
              </HorizontalScroller>
            )}
          </section>

          {/* ── Upcoming ─────────────────────────────────────────────── */}
          {trackedShowIds.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader title="Upcoming" eyebrow="From Your Shows" />
              {upcomingLoading ? <SpinnerBlock /> : upcoming.length === 0 ? (
                <p className="text-sm" style={{ color: '#A8A096' }}>No upcoming episodes.</p>
              ) : (
                <HorizontalScroller>
                  {upcoming.map(u => (
                    <UpcomingCard
                      key={`${u.tmdbId}-${u.episodeLabel}`}
                      tmdbId={u.tmdbId}
                      mediaType="tv"
                      posterPath={u.posterPath}
                      title={u.title}
                      airDate={u.airDate}
                      episodeLabel={u.episodeLabel}
                    />
                  ))}
                </HorizontalScroller>
              )}
            </section>
          )}

          {/* ── Watchlist ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="Your Watchlist" eyebrow="Saved" to="/ocio/pantalla/movies" />
            {watchlistPreview.length === 0 ? (
              <div className="rounded-3xl py-10" style={{ background: 'rgba(232,221,204,0.03)', border: '1px solid rgba(232,221,204,0.06)' }}>
                <EmptyState icon={Bookmark} title="Nothing saved yet" subtitle="Tap the bookmark on any title to add it here." />
              </div>
            ) : (
              <HorizontalScroller>
                {watchlistPreview.map(row => (
                  <WatchlistPosterLink key={`${row.media_type}-${row.tmdb_id}`} tmdbId={row.tmdb_id} mediaType={row.media_type} />
                ))}
              </HorizontalScroller>
            )}
          </section>

          {/* ── Streaming ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="Streaming Now" eyebrow="Popular on" />
            <ProviderFilter active={streamProv} onChange={setStreamProv} />
            {streamingLoading ? <SpinnerBlock /> : (
              <HorizontalScroller>
                {streamingResults?.results.slice(0, 20).map(item => (
                  <TitleCard
                    key={item.id}
                    item={item}
                    mediaType="tv"
                    fixedWidth
                    inWatchlist={isInWatchlist(item.id, 'tv')}
                    watched={isWatched(item.id, 'tv')}
                  />
                ))}
              </HorizontalScroller>
            )}
          </section>

          {/* ── Network Production ───────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="Network Production" eyebrow="Originals" />
            <ProviderFilter active={networkProv} onChange={setNetworkProv} />
            {networkLoading ? <SpinnerBlock /> : (
              <HorizontalScroller>
                {networkResults?.results.slice(0, 20).map(item => (
                  <TitleCard
                    key={item.id}
                    item={item}
                    mediaType="tv"
                    fixedWidth
                    inWatchlist={isInWatchlist(item.id, 'tv')}
                    watched={isWatched(item.id, 'tv')}
                  />
                ))}
              </HorizontalScroller>
            )}
          </section>

          {/* ── Now Playing (movies) ─────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="Now Playing" eyebrow="In Theaters" />
            {nowPlayingLoading ? <SpinnerBlock /> : (
              <HorizontalScroller>
                {nowPlaying?.results.slice(0, 20).map(item => (
                  <TitleCard
                    key={item.id}
                    item={item}
                    mediaType="movie"
                    fixedWidth
                    inWatchlist={isInWatchlist(item.id, 'movie')}
                    watched={isWatched(item.id, 'movie')}
                  />
                ))}
              </HorizontalScroller>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}

// ── Featured hero ────────────────────────────────────────────────────────────
function FeaturedHero({ item, mediaType }: { item: TmdbMediaItem; mediaType: MediaType }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = usePantalla();
  const navigate = useNavigate();
  const backdrop = backdropUrl(item.backdrop_path, 'w1280');
  const poster = posterUrl(item.poster_path, 'w342');
  const title = item.title ?? item.name ?? '';
  const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4);
  const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
  const saved = isInWatchlist(item.id, mediaType);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) await removeFromWatchlist(item.id, mediaType);
    else await addToWatchlist(item.id, mediaType);
  };

  return (
    <Link
      to={`/ocio/pantalla/${mediaType}/${item.id}`}
      className="group relative block -mx-4 md:mx-0 md:rounded-3xl overflow-hidden"
    >
      <div className="relative aspect-[16/11] md:aspect-[21/9] w-full">
        {backdrop && (
          <img
            src={backdrop}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            fetchPriority="high"
            decoding="async"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1714] via-[#1B1714]/60 to-[#1B1714]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B1714]/70 via-transparent to-transparent" />

        {/* Eyebrow */}
        <div className="absolute top-3 left-4 md:left-6 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.22em] uppercase backdrop-blur-md"
          style={{ background: `${PANTALLA_ACCENT}18`, color: PANTALLA_ACCENT, border: `1px solid ${PANTALLA_ACCENT}40` }}
        >
          #1 Trending
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex items-end gap-4">
          {poster && (
            <img
              src={poster}
              alt=""
              className="hidden md:block w-28 aspect-[2/3] rounded-2xl ring-1 ring-white/10 shadow-xl shadow-black/50 object-cover"
              draggable={false}
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl md:text-4xl font-semibold text-white tracking-tight leading-tight line-clamp-2">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-[12px] md:text-sm" style={{ color: '#C8BFB4' }}>
              {rating && (
                <span className="flex items-center gap-1 font-bold tabular-nums" style={{ color: '#F5EFE6' }}>
                  <span className="text-[10px]" style={{ color: PANTALLA_ACCENT }}>★</span>
                  {rating}
                </span>
              )}
              {year && <><span style={{ color: '#6B6059' }}>·</span><span>{year}</span></>}
              <span style={{ color: '#6B6059' }}>·</span>
              <span className="uppercase tracking-wider text-[10px] font-bold" style={{ color: '#A8A096' }}>
                {mediaType === 'movie' ? 'Movie' : 'TV Show'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5">
              <button
                onClick={(e) => { e.preventDefault(); navigate(`/ocio/pantalla/${mediaType}/${item.id}`); }}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full font-bold text-[13px] active:scale-95 transition-transform"
                style={{ background: PANTALLA_ACCENT, color: '#000', boxShadow: `0 6px 20px ${PANTALLA_ACCENT}45` }}
              >
                <Play size={14} fill="currentColor" />
                Details
              </button>
              <button
                onClick={toggle}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full font-semibold text-[13px] active:scale-95 transition-transform"
                style={{
                  background: 'rgba(232,221,204,0.12)',
                  border: '1px solid rgba(232,221,204,0.18)',
                  color: '#F5EFE6',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {saved ? <Bookmark size={14} fill="currentColor" /> : <Plus size={14} strokeWidth={2.5} />}
                {saved ? 'Saved' : 'Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Trending toggle (Movies / TV) ────────────────────────────────────────────
function TrendingToggle({ value, onChange }: { value: MediaType; onChange: (v: MediaType) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-full" style={{ background: 'rgba(232,221,204,0.06)', border: '1px solid rgba(232,221,204,0.08)' }}>
      {([
        { key: 'movie' as MediaType, icon: Clapperboard, label: 'Movies' },
        { key: 'tv' as MediaType,    icon: Tv,           label: 'TV' },
      ]).map(({ key, icon: Icon, label }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-1 px-3 h-9 rounded-full text-[12px] font-semibold transition-colors active:scale-95"
            style={{
              background: isActive ? PANTALLA_ACCENT : 'transparent',
              color: isActive ? '#1B1714' : '#A8A096',
            }}
          >
            <Icon size={12} strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Search results ───────────────────────────────────────────────────────────
function SearchResults({
  loading, results, isInWatchlist, isWatched,
}: {
  loading: boolean;
  results: TmdbMediaItem[] | null;
  isInWatchlist: (id: number, m: MediaType) => boolean;
  isWatched: (id: number, m: MediaType) => boolean;
}) {
  if (loading) return <SpinnerBlock />;
  if (!results || results.length === 0) {
    return <EmptyState icon={Bookmark} title="No results" subtitle="Try a different title, actor or keyword." />;
  }
  const filtered = results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
  return (
    <section>
      <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4" style={{ color: '#A8A096' }}>
        {filtered.length} {filtered.length === 1 ? 'Result' : 'Results'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
        {filtered.map(item => (
          <TitleCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            inWatchlist={isInWatchlist(item.id, item.media_type as MediaType)}
            watched={isWatched(item.id, item.media_type as MediaType)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Watchlist poster link (resolves TMDB detail, uses cache) ────────────────
function WatchlistPosterLink({ tmdbId, mediaType }: { tmdbId: number; mediaType: MediaType }) {
  const { data: item } = useTmdbQuery<TmdbMediaItem | null>(async () => {
    const detail = mediaType === 'movie' ? await getMovie(tmdbId) : await getTv(tmdbId);
    return {
      id: detail.id,
      title: 'title' in detail ? detail.title : undefined,
      name: 'name' in detail ? detail.name : undefined,
      overview: detail.overview,
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      vote_average: detail.vote_average,
      vote_count: detail.vote_count,
      release_date: 'release_date' in detail ? detail.release_date : undefined,
      first_air_date: 'first_air_date' in detail ? detail.first_air_date : undefined,
    };
  }, [tmdbId, mediaType]);

  if (!item) {
    return (
      <Link
        to={`/ocio/pantalla/${mediaType}/${tmdbId}`}
        className="block w-[132px] md:w-[148px] shrink-0 snap-start aspect-[2/3] rounded-2xl animate-pulse"
        style={{ background: '#221D19' }}
      />
    );
  }
  return <TitleCard item={item} mediaType={mediaType} fixedWidth inWatchlist />;
}

// ── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
