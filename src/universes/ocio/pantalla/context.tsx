import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePantallaData } from './hooks/usePantallaData';
import { usePantallaActions } from './hooks/usePantallaActions';
import type { MediaType } from './types';

type DataHook = ReturnType<typeof usePantallaData>;
type ActionsHook = ReturnType<typeof usePantallaActions>;

interface PantallaContextValue extends DataHook, ActionsHook {
  isInWatchlist: (tmdbId: number, mediaType: MediaType) => boolean;
  isWatched: (tmdbId: number, mediaType: MediaType) => boolean;
  isHidden: (tmdbId: number, mediaType: MediaType) => boolean;
  getRating: (tmdbId: number, mediaType: MediaType) => number | null;
  getProgress: (tmdbId: number) => { season: number; episode: number } | null;
}

const PantallaContext = createContext<PantallaContextValue | null>(null);

export function PantallaProvider({ children }: { children: ReactNode }) {
  const data = usePantallaData();
  const actions = usePantallaActions(data.refetch);

  const value = useMemo<PantallaContextValue>(() => {
    const isInWatchlist = (id: number, type: MediaType) =>
      data.watchlist.some(r => r.tmdb_id === id && r.media_type === type);
    const isWatched = (id: number, type: MediaType) =>
      data.history.some(r => r.tmdb_id === id && r.media_type === type);
    const isHidden = (id: number, type: MediaType) =>
      data.hidden.some(r => r.tmdb_id === id && r.media_type === type);
    const getRating = (id: number, type: MediaType) =>
      data.ratings.find(r => r.tmdb_id === id && r.media_type === type)?.stars ?? null;
    const getProgress = (id: number) => {
      const p = data.progress.find(r => r.tmdb_id === id);
      return p ? { season: p.season, episode: p.episode } : null;
    };
    return { ...data, ...actions, isInWatchlist, isWatched, isHidden, getRating, getProgress };
  }, [data, actions]);

  return <PantallaContext.Provider value={value}>{children}</PantallaContext.Provider>;
}

export function usePantalla(): PantallaContextValue {
  const ctx = useContext(PantallaContext);
  if (!ctx) throw new Error('usePantalla must be used inside PantallaProvider');
  return ctx;
}
