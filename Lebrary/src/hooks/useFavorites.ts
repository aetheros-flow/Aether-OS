import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

interface FavoritesState {
  ids: string[];
  loading: boolean;
  error: Error | null;
}

export function useFavorites() {
  const { user } = useAuth();
  const [state, setState] = useState<FavoritesState>({
    ids: [],
    loading: !!user,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ ids: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await getSupabase()
        .from('lebrary_favorites')
        .select('book_id')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (error) {
        setState({ ids: [], loading: false, error: new Error(error.message) });
      } else {
        setState({ ids: (data ?? []).map((r) => r.book_id), loading: false, error: null });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const favoriteSet = useMemo(() => new Set(state.ids), [state.ids]);

  const isFavorite = useCallback((bookId: string) => favoriteSet.has(bookId), [favoriteSet]);

  const toggle = useCallback(
    async (bookId: string) => {
      if (!user) return;
      const sb = getSupabase();
      const currentlyFav = favoriteSet.has(bookId);
      setState((s) => ({
        ...s,
        ids: currentlyFav ? s.ids.filter((id) => id !== bookId) : [...s.ids, bookId],
      }));
      if (currentlyFav) {
        const { error } = await sb.from('lebrary_favorites').delete()
          .eq('user_id', user.id).eq('book_id', bookId);
        if (error) setState((s) => ({ ...s, ids: [...s.ids, bookId] })); // rollback
      } else {
        const { error } = await sb.from('lebrary_favorites').insert({
          user_id: user.id,
          book_id: bookId,
        });
        if (error) setState((s) => ({ ...s, ids: s.ids.filter((id) => id !== bookId) })); // rollback
      }
    },
    [user, favoriteSet],
  );

  return {
    favorites: state.ids,
    favoriteSet,
    isFavorite,
    toggle,
    count: state.ids.length,
    loading: state.loading,
    error: state.error,
  };
}
