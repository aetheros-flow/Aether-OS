import { useEffect, useState } from 'react';
import { getMovie, getTv } from '../lib/tmdb';
import type { MediaType, TmdbMediaItem } from '../types';

/**
 * Resolves a list of `{ tmdbId, mediaType }` pairs to their TMDB details,
 * using the tmdb.ts built-in cache. Returns a TmdbMediaItem projection
 * (enough to render TitleCards) plus a lookup map.
 */
export function useTmdbDetails(refs: Array<{ tmdbId: number; mediaType: MediaType }>) {
  const [items, setItems] = useState<TmdbMediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Serialize the refs into a stable key so the effect only reruns on real changes.
  const key = refs.map(r => `${r.mediaType}:${r.tmdbId}`).join(',');

  useEffect(() => {
    let cancelled = false;
    if (refs.length === 0) { setItems([]); return; }
    setLoading(true);
    Promise.all(refs.map(async (ref): Promise<TmdbMediaItem | null> => {
      try {
        if (ref.mediaType === 'movie') {
          const m = await getMovie(ref.tmdbId);
          return {
            id: m.id, title: m.title, overview: m.overview,
            poster_path: m.poster_path, backdrop_path: m.backdrop_path,
            release_date: m.release_date, vote_average: m.vote_average, vote_count: m.vote_count,
            genre_ids: m.genres.map(g => g.id),
            media_type: 'movie',
          };
        } else {
          const t = await getTv(ref.tmdbId);
          return {
            id: t.id, name: t.name, overview: t.overview,
            poster_path: t.poster_path, backdrop_path: t.backdrop_path,
            first_air_date: t.first_air_date, vote_average: t.vote_average, vote_count: t.vote_count,
            genre_ids: t.genres.map(g => g.id),
            media_type: 'tv',
          };
        }
      } catch {
        return null;
      }
    }))
      .then(results => {
        if (cancelled) return;
        setItems(results.filter((r): r is TmdbMediaItem => r !== null));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, loading };
}
