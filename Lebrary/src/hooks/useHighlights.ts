import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContentLanguage, Highlight } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

interface HighlightRow {
  id: string;
  book_id: string;
  chapter_id: string;
  text: string;
  language: ContentLanguage;
  prefix: string;
  suffix: string;
  note: string;
  created_at: string;
  updated_at: string | null;
}

interface HighlightsState {
  list: Highlight[];
  loading: boolean;
  error: Error | null;
}

interface CreateHighlightInput {
  bookId: string;
  chapterId: string;
  text: string;
  language: ContentLanguage;
  prefix: string;
  suffix: string;
  note?: string;
}

function rowToHighlight(r: HighlightRow): Highlight {
  return {
    id: r.id,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    text: r.text,
    language: r.language,
    prefix: r.prefix,
    suffix: r.suffix,
    note: r.note ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
  };
}

export function useHighlights() {
  const { user } = useAuth();
  const [state, setState] = useState<HighlightsState>({
    list: [],
    loading: !!user,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ list: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await getSupabase()
        .from('lebrary_highlights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        setState({ list: [], loading: false, error: new Error(error.message) });
      } else {
        setState({
          list: (data as HighlightRow[] | null ?? []).map(rowToHighlight),
          loading: false,
          error: null,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const allHighlights = useMemo(
    () => [...state.list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.list],
  );

  const getForBook = useCallback(
    (bookId: string): Highlight[] =>
      state.list.filter((h) => h.bookId === bookId),
    [state.list],
  );

  const getForChapter = useCallback(
    (bookId: string, chapterId: string): Highlight[] =>
      state.list.filter((h) => h.bookId === bookId && h.chapterId === chapterId),
    [state.list],
  );

  const createHighlight = useCallback(
    async (input: CreateHighlightInput): Promise<Highlight | null> => {
      if (!user) return null;
      const now = new Date().toISOString();
      const { data, error } = await getSupabase()
        .from('lebrary_highlights')
        .insert({
          user_id: user.id,
          book_id: input.bookId,
          chapter_id: input.chapterId,
          text: input.text,
          language: input.language,
          prefix: input.prefix,
          suffix: input.suffix,
          note: input.note ?? '',
          created_at: now,
        })
        .select()
        .single();
      if (error || !data) {
        console.error('[highlights] insert failed:', error?.message);
        return null;
      }
      const created = rowToHighlight(data as HighlightRow);
      setState((s) => ({ ...s, list: [...s.list, created] }));
      return created;
    },
    [user],
  );

  const updateNote = useCallback(
    async (_bookId: string, highlightId: string, note: string) => {
      if (!user) return;
      setState((s) => ({
        ...s,
        list: s.list.map((h) => (h.id === highlightId ? { ...h, note } : h)),
      }));
      const { error } = await getSupabase()
        .from('lebrary_highlights')
        .update({ note })
        .eq('id', highlightId)
        .eq('user_id', user.id);
      if (error) console.warn('[highlights] updateNote failed:', error.message);
    },
    [user],
  );

  const deleteHighlight = useCallback(
    async (_bookId: string, highlightId: string) => {
      if (!user) return;
      setState((s) => ({ ...s, list: s.list.filter((h) => h.id !== highlightId) }));
      const { error } = await getSupabase()
        .from('lebrary_highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', user.id);
      if (error) console.warn('[highlights] delete failed:', error.message);
    },
    [user],
  );

  return {
    allHighlights,
    getForBook,
    getForChapter,
    createHighlight,
    updateNote,
    deleteHighlight,
    loading: state.loading,
    error: state.error,
  };
}
