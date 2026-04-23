import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../core/contexts/AuthContext';
import type { VideoItem, VideoList } from '../types';

/**
 * Loads all user-scoped video data in parallel. Returns raw rows plus
 * convenience lookups (lists-by-id, items-by-list).
 */
export function useVideosData() {
  const { user } = useAuth();

  const [lists, setLists] = useState<VideoList[]>([]);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const uid = user.id;
      const [l, i] = await Promise.all([
        supabase.from('Ocio_videos_lists').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('Ocio_videos_items').select('*').eq('user_id', uid).order('added_at', { ascending: false }),
      ]);
      if (l.error) throw l.error;
      if (i.error) throw i.error;
      setLists((l.data ?? []) as VideoList[]);
      setItems((i.data ?? []) as VideoItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando videos');
      console.error('[useVideosData]', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { lists, items, loading, error, refetch: fetchAll };
}
