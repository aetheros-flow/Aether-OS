import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../core/contexts/AuthContext';
import type { MediaType } from '../types';

/**
 * All Pantalla mutations. Receives `refetch` from usePantallaData — every
 * action calls it on success so views re-render with fresh state. Optimistic
 * updates live in the views themselves if we want them; these are truth.
 */
export function usePantallaActions(refetch: () => Promise<void>) {
  const { user } = useAuth();

  const requireUser = () => {
    if (!user) throw new Error('Not authenticated');
    return user.id as string;
  };

  // ── Watchlist ─────────────────────────────────────────────────────────────
  const addToWatchlist = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_watchlist').upsert(
      { user_id: uid, tmdb_id: tmdbId, media_type: mediaType },
      { onConflict: 'user_id,tmdb_id,media_type' }
    );
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  const removeFromWatchlist = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_watchlist').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('media_type', mediaType);
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  // ── History (whole-title watched) ─────────────────────────────────────────
  const markWatched = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_history').upsert(
      { user_id: uid, tmdb_id: tmdbId, media_type: mediaType, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,tmdb_id,media_type' }
    );
    if (error) throw error;
    // Also remove from watchlist if present (matches Moviebase behavior).
    await supabase.from('Ocio_pantalla_watchlist').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('media_type', mediaType);
    await refetch();
  }, [refetch, user]);

  const unmarkWatched = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_history').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('media_type', mediaType);
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  // ── TV progress ───────────────────────────────────────────────────────────
  const setShowProgress = useCallback(async (tmdbId: number, season: number, episode: number) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_show_progress').upsert(
      { user_id: uid, tmdb_id: tmdbId, season, episode, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,tmdb_id' }
    );
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  const markEpisodeWatched = useCallback(async (tmdbId: number, season: number, episode: number) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_episode_history').upsert(
      { user_id: uid, tmdb_id: tmdbId, season, episode, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,tmdb_id,season,episode' }
    );
    if (error) throw error;
    // Advance progress pointer if this episode is ahead of the current one.
    await supabase.from('Ocio_pantalla_show_progress').upsert(
      { user_id: uid, tmdb_id: tmdbId, season, episode, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,tmdb_id' }
    );
    await refetch();
  }, [refetch, user]);

  const unmarkEpisodeWatched = useCallback(async (tmdbId: number, season: number, episode: number) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_episode_history').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('season', season).eq('episode', episode);
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  // ── Ratings ───────────────────────────────────────────────────────────────
  const rateTitle = useCallback(async (tmdbId: number, mediaType: MediaType, stars: number) => {
    const uid = requireUser();
    const clamped = Math.max(1, Math.min(10, Math.round(stars)));
    const { error } = await supabase.from('Ocio_pantalla_ratings').upsert(
      { user_id: uid, tmdb_id: tmdbId, media_type: mediaType, stars: clamped, rated_at: new Date().toISOString() },
      { onConflict: 'user_id,tmdb_id,media_type' }
    );
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  const unrateTitle = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_ratings').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('media_type', mediaType);
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  // ── Hidden ────────────────────────────────────────────────────────────────
  const hideTitle = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_hidden').upsert(
      { user_id: uid, tmdb_id: tmdbId, media_type: mediaType },
      { onConflict: 'user_id,tmdb_id,media_type' }
    );
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  const unhideTitle = useCallback(async (tmdbId: number, mediaType: MediaType) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_pantalla_hidden').delete()
      .eq('user_id', uid).eq('tmdb_id', tmdbId).eq('media_type', mediaType);
    if (error) throw error;
    await refetch();
  }, [refetch, user]);

  return {
    addToWatchlist, removeFromWatchlist,
    markWatched, unmarkWatched,
    setShowProgress, markEpisodeWatched, unmarkEpisodeWatched,
    rateTitle, unrateTitle,
    hideTitle, unhideTitle,
  };
}
