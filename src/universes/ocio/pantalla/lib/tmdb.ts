// ── TMDB v3 API client ────────────────────────────────────────────────────────
// Docs: https://developer.themoviedb.org/reference/intro/getting-started
// Usage: all calls return parsed JSON. Errors throw. A small in-memory cache
// (5-min TTL) dedupes repeated fetches within the SPA session.

import type {
  MediaType,
  TmdbMediaItem,
  TmdbMovieDetail,
  TmdbTvDetail,
  TmdbSeasonDetail,
  TmdbGenre,
  TmdbPage,
} from '../types';

const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

if (!API_KEY) {
  console.warn('[tmdb] VITE_TMDB_API_KEY is missing. Pantalla will not load.');
}

// ── Image URL helpers ────────────────────────────────────────────────────────
export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';
export type LogoSize = 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original';

export const posterUrl = (path: string | null | undefined, size: PosterSize = 'w342') =>
  path ? `${IMG_BASE}/${size}${path}` : null;
export const backdropUrl = (path: string | null | undefined, size: BackdropSize = 'w780') =>
  path ? `${IMG_BASE}/${size}${path}` : null;
export const profileUrl = (path: string | null | undefined, size: ProfileSize = 'w185') =>
  path ? `${IMG_BASE}/${size}${path}` : null;
export const logoUrl = (path: string | null | undefined, size: LogoSize = 'w92') =>
  path ? `${IMG_BASE}/${size}${path}` : null;

// ── Cache ────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
type CacheEntry = { at: number; data: unknown };
const cache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

// ── Core fetcher ─────────────────────────────────────────────────────────────
async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  opts: { cache?: boolean } = { cache: true }
): Promise<T> {
  if (!API_KEY) throw new Error('Missing VITE_TMDB_API_KEY');
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  if (!params.language) url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const key = url.toString();
  if (opts.cache) {
    const hit = cacheGet<T>(key);
    if (hit) return hit;
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status} ${res.statusText} — ${path}`);
  }
  const data = (await res.json()) as T;
  if (opts.cache) cache.set(key, { at: Date.now(), data });
  return data;
}

// ── Genres ───────────────────────────────────────────────────────────────────
let movieGenres: TmdbGenre[] | null = null;
let tvGenres: TmdbGenre[] | null = null;

export async function getGenres(media: MediaType): Promise<TmdbGenre[]> {
  if (media === 'movie' && movieGenres) return movieGenres;
  if (media === 'tv' && tvGenres) return tvGenres;
  const { genres } = await tmdbFetch<{ genres: TmdbGenre[] }>(`/genre/${media}/list`);
  if (media === 'movie') movieGenres = genres;
  else tvGenres = genres;
  return genres;
}

// ── Trending ─────────────────────────────────────────────────────────────────
export function getTrending(
  media: MediaType | 'all',
  window: 'day' | 'week' = 'week'
): Promise<TmdbPage<TmdbMediaItem>> {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>(`/trending/${media}/${window}`);
}

// ── Discover (filtered lists — used by Streaming + Network Production tiles) ─
export interface DiscoverParams {
  sort_by?: string;                     // e.g. 'popularity.desc'
  with_genres?: string;                 // CSV
  with_watch_providers?: string;        // CSV of provider IDs
  watch_region?: string;                // 2-letter country (default AR fallback US)
  with_networks?: string;               // CSV of network IDs (TV only)
  'vote_count.gte'?: number;
  'primary_release_date.gte'?: string;  // movie
  'primary_release_date.lte'?: string;
  'first_air_date.gte'?: string;        // tv
  'first_air_date.lte'?: string;
  page?: number;
}

export function discover(media: MediaType, params: DiscoverParams = {}) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>(`/discover/${media}`, params as Record<string, string | number>);
}

// ── Search ───────────────────────────────────────────────────────────────────
export function searchMulti(query: string, page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/search/multi', { query, page, include_adult: false }, { cache: false });
}

export function searchMovie(query: string, page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/search/movie', { query, page, include_adult: false }, { cache: false });
}

export function searchTv(query: string, page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/search/tv', { query, page, include_adult: false }, { cache: false });
}

// ── Detail ───────────────────────────────────────────────────────────────────
export function getMovie(id: number) {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: 'credits,watch/providers' });
}

export function getTv(id: number) {
  return tmdbFetch<TmdbTvDetail>(`/tv/${id}`, { append_to_response: 'credits,watch/providers' });
}

export function getSeason(tvId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`);
}

// ── Upcoming / Now Playing / On The Air ──────────────────────────────────────
export function getMoviesNowPlaying(page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/movie/now_playing', { page });
}

export function getMoviesUpcoming(page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/movie/upcoming', { page });
}

export function getTvOnTheAir(page = 1) {
  return tmdbFetch<TmdbPage<TmdbMediaItem>>('/tv/on_the_air', { page });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export function titleOf(item: { title?: string; name?: string }): string {
  return item.title ?? item.name ?? '';
}

export function releaseDateOf(item: { release_date?: string; first_air_date?: string }): string | null {
  return item.release_date ?? item.first_air_date ?? null;
}

export function yearOf(item: { release_date?: string; first_air_date?: string }): string | null {
  const d = releaseDateOf(item);
  return d ? d.slice(0, 4) : null;
}

/** Infer a media type when TMDB omits it (e.g. /discover results). */
export function inferMediaType(item: TmdbMediaItem): MediaType {
  if (item.media_type === 'movie' || item.media_type === 'tv') return item.media_type;
  return item.title || item.release_date ? 'movie' : 'tv';
}
