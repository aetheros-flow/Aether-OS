import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bookmark, BookmarkCheck, CheckCircle2, Circle, Star, ArrowLeft, ExternalLink,
  Loader2, ChevronDown, EyeOff, Share2, Play, X,
} from 'lucide-react';

import { usePantalla } from '../context';
import { useTmdbQuery } from '../hooks/useTmdb';
import {
  getMovie, getTv, getSeason, backdropUrl, posterUrl, profileUrl, logoUrl,
} from '../lib/tmdb';
import { PANTALLA_ACCENT, DEFAULT_REGION } from '../lib/tmdb-constants';

import SpinnerBlock from '../components/SpinnerBlock';

import type { MediaType } from '../types';

export default function TitleDetailView() {
  const { mediaType, tmdbId } = useParams<{ mediaType: MediaType; tmdbId: string }>();
  const id = Number(tmdbId);

  if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !Number.isFinite(id)) {
    return <div className="p-10 text-center text-zinc-400">Invalid title.</div>;
  }

  return mediaType === 'movie' ? <MovieDetail id={id} /> : <TvDetail id={id} />;
}

// ── Movie detail ─────────────────────────────────────────────────────────────
function MovieDetail({ id }: { id: number }) {
  const { data: movie, loading, error } = useTmdbQuery(() => getMovie(id), [id]);
  if (loading) return <FullPageSpinner />;
  if (error || !movie) return <ErrorScreen />;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const providers = movie['watch/providers']?.results?.[DEFAULT_REGION]?.flatrate ?? [];

  return (
    <DetailShell
      tmdbId={movie.id}
      mediaType="movie"
      title={movie.title}
      tagline={movie.tagline}
      overview={movie.overview}
      backdropPath={movie.backdrop_path}
      posterPath={movie.poster_path}
      voteAverage={movie.vote_average}
      voteCount={movie.vote_count}
      year={year}
      metaRight={runtime ?? undefined}
      genres={movie.genres}
      cast={movie.credits?.cast ?? []}
      providers={providers}
    />
  );
}

// ── TV detail ────────────────────────────────────────────────────────────────
function TvDetail({ id }: { id: number }) {
  const { data: show, loading, error } = useTmdbQuery(() => getTv(id), [id]);
  if (loading) return <FullPageSpinner />;
  if (error || !show) return <ErrorScreen />;

  const year = show.first_air_date ? show.first_air_date.slice(0, 4) : '';
  const providers = show['watch/providers']?.results?.[DEFAULT_REGION]?.flatrate ?? [];

  return (
    <DetailShell
      tmdbId={show.id}
      mediaType="tv"
      title={show.name}
      tagline={show.tagline}
      overview={show.overview}
      backdropPath={show.backdrop_path}
      posterPath={show.poster_path}
      voteAverage={show.vote_average}
      voteCount={show.vote_count}
      year={year}
      metaRight={`${show.number_of_seasons} season${show.number_of_seasons === 1 ? '' : 's'}`}
      genres={show.genres}
      cast={show.credits?.cast ?? []}
      providers={providers}
      tvExtras={{
        seasons: show.seasons.filter(s => s.season_number > 0),
        networks: show.networks,
        nextEpisode: show.next_episode_to_air,
      }}
    />
  );
}

// ── Shared shell ─────────────────────────────────────────────────────────────
interface DetailShellProps {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  tagline: string | null;
  overview: string;
  backdropPath: string | null;
  posterPath: string | null;
  voteAverage: number;
  voteCount: number;
  year: string;
  metaRight?: string;
  genres: { id: number; name: string }[];
  cast: { id: number; name: string; character: string; profile_path: string | null }[];
  providers: { provider_id: number; provider_name: string; logo_path: string | null }[];
  tvExtras?: {
    seasons: { season_number: number; name: string; episode_count: number; poster_path: string | null; air_date: string | null }[];
    networks: { id: number; name: string; logo_path: string | null }[];
    nextEpisode: { season_number: number; episode_number: number; name: string; air_date: string | null } | null;
  };
}

function DetailShell(props: DetailShellProps) {
  const {
    tmdbId, mediaType, title, tagline, overview, backdropPath, posterPath,
    voteAverage, voteCount, year, metaRight, genres, cast, providers, tvExtras,
  } = props;

  const navigate = useNavigate();
  const {
    isInWatchlist, isWatched, isHidden, getRating, getProgress,
    addToWatchlist, removeFromWatchlist, markWatched, unmarkWatched,
    rateTitle, unrateTitle, hideTitle, unhideTitle,
  } = usePantalla();

  const inWatchlist = isInWatchlist(tmdbId, mediaType);
  const watched = isWatched(tmdbId, mediaType);
  const hidden = isHidden(tmdbId, mediaType);
  const rating = getRating(tmdbId, mediaType);
  const progress = mediaType === 'tv' ? getProgress(tmdbId) : null;

  const [busy, setBusy] = useState<string | null>(null);
  const [showRate, setShowRate] = useState(false);

  const action = async (key: string, fn: () => Promise<void>, successMsg: string) => {
    setBusy(key);
    try { await fn(); toast.success(successMsg); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(null); }
  };

  const backdrop = backdropUrl(backdropPath, 'w1280');
  const poster = posterUrl(posterPath, 'w500');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] overflow-hidden">
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
              fetchPriority="high"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Floating top bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-full bg-black/55 backdrop-blur-md ring-1 ring-white/15 text-white active:scale-90 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft size={16} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => action('share', async () => {
                const url = `${window.location.origin}/ocio/pantalla/${mediaType}/${tmdbId}`;
                if (navigator.share) await navigator.share({ title, url });
                else await navigator.clipboard.writeText(url);
              }, 'Link copied')}
              className="p-2.5 rounded-full bg-black/55 backdrop-blur-md ring-1 ring-white/15 text-white active:scale-90 transition-transform"
              aria-label="Share"
            >
              {busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} strokeWidth={2.25} />}
            </button>
          </div>

          {/* Poster + title over the hero, bottom-aligned */}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
            <div className="flex items-end gap-4">
              {poster && (
                <img
                  src={poster}
                  alt={title}
                  className="w-24 md:w-36 aspect-[2/3] rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/70 object-cover shrink-0"
                  draggable={false}
                />
              )}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-serif text-2xl md:text-4xl font-semibold text-white tracking-tight leading-tight line-clamp-3">
                  {title}
                </h1>
                {tagline && (
                  <p className="text-[12px] md:text-sm italic text-zinc-400 mt-1 line-clamp-2">{tagline}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-[12px] md:text-sm text-zinc-200">
                  {voteAverage > 0 && (
                    <span className="flex items-center gap-1 font-bold tabular-nums">
                      <Star size={11} fill={PANTALLA_ACCENT} stroke={PANTALLA_ACCENT} />
                      {voteAverage.toFixed(1)}
                      <span className="text-[11px] text-zinc-500 font-medium ml-0.5">({formatCount(voteCount)})</span>
                    </span>
                  )}
                  {year && <><span className="text-zinc-600">·</span><span>{year}</span></>}
                  {metaRight && <><span className="text-zinc-600">·</span><span>{metaRight}</span></>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ActionButton
            primary
            icon={watched ? CheckCircle2 : Play}
            label={watched ? 'Watched' : 'Mark Watched'}
            active={watched}
            busy={busy === 'wd'}
            onClick={() => action(
              'wd',
              () => watched ? unmarkWatched(tmdbId, mediaType) : markWatched(tmdbId, mediaType),
              watched ? 'Removed from history' : 'Marked as watched'
            )}
          />
          <ActionButton
            icon={inWatchlist ? BookmarkCheck : Bookmark}
            label={inWatchlist ? 'Saved' : 'Save'}
            active={inWatchlist}
            busy={busy === 'wl'}
            onClick={() => action(
              'wl',
              () => inWatchlist ? removeFromWatchlist(tmdbId, mediaType) : addToWatchlist(tmdbId, mediaType),
              inWatchlist ? 'Removed from watchlist' : 'Added to watchlist'
            )}
          />
          <ActionButton
            icon={Star}
            label={rating ? `${rating}/10` : 'Rate'}
            active={rating !== null}
            onClick={() => setShowRate(true)}
          />
          <ActionButton
            icon={EyeOff}
            label={hidden ? 'Unhide' : 'Hide'}
            active={hidden}
            busy={busy === 'h'}
            onClick={() => action(
              'h',
              () => hidden ? unhideTitle(tmdbId, mediaType) : hideTitle(tmdbId, mediaType),
              hidden ? 'Title visible' : 'Title hidden'
            )}
          />
        </div>
      </div>

      {/* ── Genres ─────────────────────────────────────────────────── */}
      {genres.length > 0 && (
        <div className="px-4 md:px-8 mt-5 flex flex-wrap gap-2">
          {genres.map(g => (
            <span key={g.id} className="px-3 h-7 inline-flex items-center rounded-full text-[11px] font-semibold bg-white/[0.05] border border-white/8 text-zinc-300">
              {g.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Overview ───────────────────────────────────────────────── */}
      {overview && (
        <ExpandableOverview text={overview} />
      )}

      {/* ── Providers ──────────────────────────────────────────────── */}
      {providers.length > 0 && (
        <section className="px-4 md:px-8 mt-7">
          <SectionTitle eyebrow={`Available in · ${DEFAULT_REGION}`}>Where to watch</SectionTitle>
          <div className="flex gap-2 flex-wrap mt-3">
            {providers.map(p => (
              <div key={p.provider_id} className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/[0.04] border border-white/8">
                {p.logo_path && (
                  <img src={logoUrl(p.logo_path, 'w92') ?? ''} alt={p.provider_name} className="w-7 h-7 rounded-lg" />
                )}
                <span className="text-[12px] font-semibold text-zinc-200">{p.provider_name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TV seasons ─────────────────────────────────────────────── */}
      {tvExtras && <Seasons tmdbId={tmdbId} seasons={tvExtras.seasons} progress={progress} />}

      {/* ── Cast ───────────────────────────────────────────────────── */}
      {cast.length > 0 && (
        <section className="mt-7">
          <div className="px-4 md:px-8">
            <SectionTitle eyebrow="Starring">Cast</SectionTitle>
          </div>
          <div className="-mx-4 md:-mx-8 mt-3">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-2 snap-x scroll-smooth">
              {cast.slice(0, 24).map(c => (
                <div key={c.id} className="shrink-0 w-[88px] snap-start">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 ring-1 ring-white/5">
                    {c.profile_path ? (
                      <img src={profileUrl(c.profile_path, 'w185') ?? ''} alt={c.name} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] text-center px-2">
                        {c.name}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-white mt-2 leading-tight line-clamp-2">{c.name}</p>
                  <p className="text-[11px] text-zinc-500 leading-tight line-clamp-1">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TMDB footer ────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 mt-8 pb-12">
        <a
          href={`https://www.themoviedb.org/${mediaType}/${tmdbId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View on TMDB <ExternalLink size={11} />
        </a>
      </div>

      {/* ── Rating bottom sheet ────────────────────────────────────── */}
      <RateSheet
        open={showRate}
        onClose={() => setShowRate(false)}
        rating={rating}
        onRate={async (n) => {
          setShowRate(false);
          await action('r', () => rateTitle(tmdbId, mediaType, n), `Rated ${n}/10`);
        }}
        onClear={async () => {
          setShowRate(false);
          await action('r', () => unrateTitle(tmdbId, mediaType), 'Rating cleared');
        }}
      />
    </motion.div>
  );
}

// ── Action button ────────────────────────────────────────────────────────────
function ActionButton({ icon: Icon, label, active, busy, onClick, primary }: {
  icon: typeof Bookmark; label: string; active?: boolean; busy?: boolean; onClick?: () => void;
  primary?: boolean;
}) {
  if (primary) {
    const bg = active ? PANTALLA_ACCENT : '#ffffff';
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 h-11 rounded-full text-[13px] font-bold transition-transform active:scale-95 disabled:opacity-60"
        style={{
          background: bg,
          color: '#000',
          boxShadow: active ? `0 6px 18px ${PANTALLA_ACCENT}50` : '0 4px 14px rgba(255,255,255,0.15)',
        }}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} fill={active ? 'currentColor' : 'none'} strokeWidth={2.25} />}
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-1.5 px-3.5 h-11 rounded-full text-[12px] font-semibold transition-colors active:scale-95 disabled:opacity-60"
      style={{
        background: active ? `${PANTALLA_ACCENT}15` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? `${PANTALLA_ACCENT}50` : 'rgba(255,255,255,0.08)'}`,
        color: active ? PANTALLA_ACCENT : '#e4e4e7',
      }}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} strokeWidth={2.25} />}
      {label}
    </button>
  );
}

// ── Expandable overview ──────────────────────────────────────────────────────
function ExpandableOverview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 220;
  return (
    <section className="px-4 md:px-8 mt-6">
      <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-2">Overview</p>
      <p className={`text-[14px] leading-relaxed text-zinc-200 ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 text-[12px] font-bold"
          style={{ color: PANTALLA_ACCENT }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  );
}

// ── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {eyebrow && (
        <span className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">{eyebrow}</span>
      )}
      <h2 className="font-serif text-xl md:text-2xl text-white font-semibold tracking-tight leading-none">
        {children}
      </h2>
    </div>
  );
}

// ── Rate bottom sheet ────────────────────────────────────────────────────────
function RateSheet({ open, onClose, rating, onRate, onClear }: {
  open: boolean;
  onClose: () => void;
  rating: number | null;
  onRate: (n: number) => void;
  onClear: () => void;
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
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-zinc-950 border-t border-white/8 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] touch-pan-y"
          >
            <div className="pt-3 pb-2 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-3 flex items-center justify-between">
              <h3 className="font-serif text-xl text-white tracking-tight">Rate this</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400 active:scale-90 transition-transform" aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 pt-2">
              <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-3">Your rating · 1–10</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                  const isSelected = rating === n;
                  const isBelow = rating !== null && n <= rating;
                  return (
                    <button
                      key={n}
                      onClick={() => onRate(n)}
                      className="h-12 rounded-xl text-base font-bold tabular-nums transition-all active:scale-95"
                      style={{
                        background: isSelected ? PANTALLA_ACCENT : isBelow ? `${PANTALLA_ACCENT}20` : 'rgba(255,255,255,0.04)',
                        color: isSelected ? '#000' : isBelow ? PANTALLA_ACCENT : '#e4e4e7',
                        border: `1px solid ${isSelected || isBelow ? `${PANTALLA_ACCENT}45` : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              {rating !== null && (
                <button
                  onClick={onClear}
                  className="mt-4 w-full h-11 rounded-xl text-[13px] font-semibold text-red-400 bg-red-500/5 border border-red-500/10 active:scale-[0.98] transition-transform"
                >
                  Clear rating
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Seasons (collapsible per-season episode list) ───────────────────────────
type SeasonSummary = NonNullable<DetailShellProps['tvExtras']>['seasons'][number];

function Seasons({ tmdbId, seasons, progress }: {
  tmdbId: number;
  seasons: SeasonSummary[];
  progress: { season: number; episode: number } | null;
}) {
  const initial = progress?.season ?? seasons[0]?.season_number ?? 1;
  const [openSeason, setOpenSeason] = useState<number | null>(initial);

  return (
    <section className="px-4 md:px-8 mt-7">
      <SectionTitle eyebrow="Episodes">Seasons</SectionTitle>
      <div className="flex flex-col gap-2 mt-3">
        {seasons.map(s => (
          <div key={s.season_number} className="rounded-2xl bg-white/[0.04] border border-white/5 overflow-hidden">
            <button
              onClick={() => setOpenSeason(openSeason === s.season_number ? null : s.season_number)}
              className="w-full flex items-center gap-3 p-3 text-left active:bg-white/[0.02] transition-colors"
            >
              <div className="w-10 md:w-12 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                {s.poster_path && (
                  <img src={posterUrl(s.poster_path, 'w92') ?? ''} alt={s.name} className="w-full h-full object-cover" draggable={false} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {s.episode_count} ep{s.episode_count === 1 ? '' : 's'}
                  {s.air_date && ` · ${s.air_date.slice(0, 4)}`}
                </p>
              </div>
              <ChevronDown
                size={16}
                className="text-zinc-400 shrink-0 transition-transform"
                style={{ transform: openSeason === s.season_number ? 'rotate(180deg)' : 'rotate(0)' }}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSeason === s.season_number && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SeasonEpisodes tmdbId={tmdbId} seasonNumber={s.season_number} progress={progress} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

function SeasonEpisodes({ tmdbId, seasonNumber, progress }: {
  tmdbId: number; seasonNumber: number; progress: { season: number; episode: number } | null;
}) {
  const { data: season, loading } = useTmdbQuery(() => getSeason(tmdbId, seasonNumber), [tmdbId, seasonNumber]);
  const { episodes: watchedEps, markEpisodeWatched, unmarkEpisodeWatched } = usePantalla();
  const [busyEp, setBusyEp] = useState<number | null>(null);

  const isWatched = (ep: number) =>
    (progress && progress.season === seasonNumber && ep <= progress.episode) ||
    watchedEps.some(w => w.tmdb_id === tmdbId && w.season === seasonNumber && w.episode === ep);

  const toggle = async (ep: number) => {
    setBusyEp(ep);
    try {
      if (isWatched(ep)) await unmarkEpisodeWatched(tmdbId, seasonNumber, ep);
      else await markEpisodeWatched(tmdbId, seasonNumber, ep);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusyEp(null);
    }
  };

  if (loading) return <div className="py-4"><SpinnerBlock size={18} /></div>;
  if (!season) return null;

  return (
    <div className="border-t border-white/5">
      {season.episodes.map(ep => {
        const w = isWatched(ep.episode_number);
        return (
          <div key={ep.id} className="flex items-center gap-1 pl-1 pr-3 border-b border-white/5 last:border-0">
            <button
              onClick={() => toggle(ep.episode_number)}
              disabled={busyEp === ep.episode_number}
              className="shrink-0 p-3 rounded-full active:scale-90 active:bg-white/5 transition-all"
              aria-label={w ? 'Mark as unwatched' : 'Mark as watched'}
            >
              {busyEp === ep.episode_number ? (
                <Loader2 size={18} className="animate-spin" style={{ color: PANTALLA_ACCENT }} />
              ) : w ? (
                <CheckCircle2 size={18} style={{ color: PANTALLA_ACCENT }} />
              ) : (
                <Circle size={18} className="text-zinc-600" />
              )}
            </button>
            <div className="flex-1 min-w-0 py-2.5">
              <p className="text-[13px] font-semibold text-white">
                <span className="text-zinc-500 mr-2 tabular-nums">E{String(ep.episode_number).padStart(2, '0')}</span>
                {ep.name}
              </p>
              {ep.air_date && <p className="text-[12px] text-zinc-500 mt-0.5 tabular-nums">{ep.air_date}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────
function FullPageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin" style={{ color: PANTALLA_ACCENT }} />
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-base font-bold text-zinc-300">Couldn't load this title.</p>
      <p className="text-sm text-zinc-500">Check your connection and try again.</p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}
