// ── Pantalla Types ────────────────────────────────────────────────────────────
// TMDB response subsets (only the fields we use) + Supabase row shapes.

export type MediaType = 'movie' | 'tv';

// ── TMDB shared ──────────────────────────────────────────────────────────────
export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

// ── TMDB search / list items (discover, trending, search/multi) ──────────────
export interface TmdbMediaItem {
  id: number;
  media_type?: MediaType;            // present on /search/multi + /trending, inferred elsewhere
  title?: string;                    // movie
  name?: string;                     // tv
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;             // movie
  first_air_date?: string;           // tv
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  popularity?: number;
}

// ── TMDB movie detail (/movie/{id}?append_to_response=credits,watch/providers) ─
export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: TmdbGenre[];
  vote_average: number;
  vote_count: number;
  status: string;
  original_language: string;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  credits?: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] };
  'watch/providers'?: TmdbWatchProvidersResponse;
}

// ── TMDB TV detail (/tv/{id}?append_to_response=credits,watch/providers) ─────
export interface TmdbTvDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: TmdbGenre[];
  vote_average: number;
  vote_count: number;
  status: string;
  in_production: boolean;
  next_episode_to_air: TmdbEpisodeSummary | null;
  last_episode_to_air: TmdbEpisodeSummary | null;
  networks: { id: number; name: string; logo_path: string | null }[];
  seasons: TmdbSeasonSummary[];
  credits?: { cast: TmdbCastMember[]; crew: TmdbCrewMember[] };
  'watch/providers'?: TmdbWatchProvidersResponse;
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
}

export interface TmdbEpisodeSummary {
  id: number;
  season_number: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  runtime?: number | null;
  vote_average?: number;
}

export interface TmdbSeasonDetail extends TmdbSeasonSummary {
  episodes: TmdbEpisodeSummary[];
}

// ── Credits ──────────────────────────────────────────────────────────────────
export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}
export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

// ── Watch providers (scoped by region) ───────────────────────────────────────
export interface TmdbWatchProvidersResponse {
  results: Record<string, {
    link?: string;
    flatrate?: TmdbProvider[];
    rent?: TmdbProvider[];
    buy?: TmdbProvider[];
    free?: TmdbProvider[];
    ads?: TmdbProvider[];
  }>;
}

// ── Paginated response ───────────────────────────────────────────────────────
export interface TmdbPage<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

// ── Supabase row shapes ──────────────────────────────────────────────────────
export interface PantallaWatchlistRow {
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
}

export interface PantallaHistoryRow {
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  watched_at: string;
}

export interface PantallaShowProgressRow {
  user_id: string;
  tmdb_id: number;
  season: number;
  episode: number;
  updated_at: string;
}

export interface PantallaEpisodeHistoryRow {
  user_id: string;
  tmdb_id: number;
  season: number;
  episode: number;
  watched_at: string;
}

export interface PantallaRatingRow {
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  stars: number;
  rated_at: string;
}

export interface PantallaHiddenRow {
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  hidden_at: string;
}
