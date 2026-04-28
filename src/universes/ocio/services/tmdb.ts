const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string; // TV shows use name
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export interface TMDBDetail extends TMDBMedia {
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  } | null;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  }
}

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('No VITE_TMDB_API_KEY found in .env');
  }
  
  const query = new URLSearchParams({
    api_key: API_KEY,
    language: 'es-ES', // Use Spanish for localized plots like in Aether OS
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB error: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get trending movies and TV shows
 */
export async function getTrending(type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
  const data = await fetchFromTMDB<{ results: TMDBMedia[] }>(`/trending/${type}/${timeWindow}`);
  return data.results;
}

/**
 * Search for movies or TV shows
 */
export async function searchMedia(query: string) {
  const data = await fetchFromTMDB<{ results: TMDBMedia[] }>(`/search/multi`, { query });
  // Filter out people, we only want movies and tv
  return data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
}

/**
 * Get full details for a specific movie or TV show, including cast
 */
export async function getDetails(type: 'movie' | 'tv', id: number) {
  return await fetchFromTMDB<TMDBDetail>(`/${type}/${id}`, {
    append_to_response: 'credits,watch/providers'
  });
}

/**
 * Helper to get the full image URL from a path
 */
export function getImageUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
