import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

export interface BookRating {
  bookId: string;
  stars: number;
  review: string;
  updatedAt: string;
}

interface State {
  rating: BookRating | null;
  loading: boolean;
  error: Error | null;
}

export function useBookRating(bookId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ rating: null, loading: !!(user && bookId), error: null });

  useEffect(() => {
    if (!user || !bookId) {
      setState({ rating: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await getSupabase()
        .from('lebrary_book_ratings')
        .select('book_id, stars, review, updated_at')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setState({ rating: null, loading: false, error: new Error(error.message) });
      } else {
        setState({
          rating: data
            ? {
                bookId: data.book_id,
                stars: data.stars,
                review: data.review ?? '',
                updatedAt: data.updated_at,
              }
            : null,
          loading: false,
          error: null,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [user, bookId]);

  const setRating = useCallback(
    async (stars: number, review?: string) => {
      if (!user || !bookId) return;
      const payload = {
        user_id: user.id,
        book_id: bookId,
        stars,
        review: review ?? state.rating?.review ?? '',
      };
      setState((s) => ({
        ...s,
        rating: {
          bookId,
          stars,
          review: payload.review,
          updatedAt: new Date().toISOString(),
        },
      }));
      const { error } = await getSupabase()
        .from('lebrary_book_ratings')
        .upsert(payload, { onConflict: 'user_id,book_id' });
      if (error) console.warn('[rating] upsert failed:', error.message);
    },
    [user, bookId, state.rating?.review],
  );

  const clearRating = useCallback(async () => {
    if (!user || !bookId) return;
    setState((s) => ({ ...s, rating: null }));
    await getSupabase()
      .from('lebrary_book_ratings')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);
  }, [user, bookId]);

  return { ...state, setRating, clearRating };
}
