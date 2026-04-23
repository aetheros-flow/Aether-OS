import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useVideosData } from './hooks/useVideosData';
import { useVideosActions } from './hooks/useVideosActions';
import type { VideoItem, VideoList } from './types';

type DataHook = ReturnType<typeof useVideosData>;
type ActionsHook = ReturnType<typeof useVideosActions>;

interface VideosContextValue extends DataHook, ActionsHook {
  /** Get a list row by id (or null if missing). */
  getList: (id: string | null) => VideoList | null;
  /** Items belonging to a specific list (or unassigned if listId is null). */
  itemsForList: (listId: string | null) => VideoItem[];
  /** Watched / unwatched filters. */
  unwatchedItems: VideoItem[];
  watchedItems: VideoItem[];
}

const VideosContext = createContext<VideosContextValue | null>(null);

export function VideosProvider({ children }: { children: ReactNode }) {
  const data = useVideosData();
  const actions = useVideosActions(data.refetch);

  const value = useMemo<VideosContextValue>(() => {
    const getList = (id: string | null) =>
      id ? data.lists.find(l => l.id === id) ?? null : null;
    const itemsForList = (listId: string | null) =>
      data.items.filter(i => i.list_id === listId);
    const unwatchedItems = data.items.filter(i => !i.watched_at);
    const watchedItems = data.items.filter(i => Boolean(i.watched_at));
    return { ...data, ...actions, getList, itemsForList, unwatchedItems, watchedItems };
  }, [data, actions]);

  return <VideosContext.Provider value={value}>{children}</VideosContext.Provider>;
}

export function useVideos(): VideosContextValue {
  const ctx = useContext(VideosContext);
  if (!ctx) throw new Error('useVideos must be used inside VideosProvider');
  return ctx;
}
