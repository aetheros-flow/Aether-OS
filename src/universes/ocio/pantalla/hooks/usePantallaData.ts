import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../core/contexts/AuthContext';
import type {
  PantallaWatchlistRow,
  PantallaHistoryRow,
  PantallaShowProgressRow,
  PantallaEpisodeHistoryRow,
  PantallaRatingRow,
  PantallaHiddenRow,
} from '../types';

/**
 * Loads all user-scoped Pantalla state in parallel. Returns raw rows — merge
 * with live TMDB metadata at the view layer.
 */
export function usePantallaData() {
  const { user } = useAuth();

  const [watchlist, setWatchlist] = useState<PantallaWatchlistRow[]>([]);
  const [history, setHistory] = useState<PantallaHistoryRow[]>([]);
  const [progress, setProgress] = useState<PantallaShowProgressRow[]>([]);
  const [episodes, setEpisodes] = useState<PantallaEpisodeHistoryRow[]>([]);
  const [ratings, setRatings] = useState<PantallaRatingRow[]>([]);
  const [hidden, setHidden] = useState<PantallaHiddenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const uid = user.id;
      const [w, h, p, e, r, hi] = await Promise.all([
        supabase.from('Ocio_pantalla_watchlist').select('*').eq('user_id', uid).order('added_at', { ascending: false }),
        supabase.from('Ocio_pantalla_history').select('*').eq('user_id', uid).order('watched_at', { ascending: false }),
        supabase.from('Ocio_pantalla_show_progress').select('*').eq('user_id', uid),
        supabase.from('Ocio_pantalla_episode_history').select('*').eq('user_id', uid).order('watched_at', { ascending: false }),
        supabase.from('Ocio_pantalla_ratings').select('*').eq('user_id', uid),
        supabase.from('Ocio_pantalla_hidden').select('*').eq('user_id', uid),
      ]);
      if (w.data)  setWatchlist(w.data as PantallaWatchlistRow[]);
      if (h.data)  setHistory(h.data as PantallaHistoryRow[]);
      if (p.data)  setProgress(p.data as PantallaShowProgressRow[]);
      if (e.data)  setEpisodes(e.data as PantallaEpisodeHistoryRow[]);
      if (r.data)  setRatings(r.data as PantallaRatingRow[]);
      if (hi.data) setHidden(hi.data as PantallaHiddenRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading Pantalla data');
      console.error('[usePantallaData]', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    watchlist, history, progress, episodes, ratings, hidden,
    loading, error, refetch: fetchAll,
  };
}
