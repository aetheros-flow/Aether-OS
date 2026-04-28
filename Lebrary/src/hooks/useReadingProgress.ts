import { useCallback, useEffect, useState } from 'react';
import type { ReadingProgress } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

type ProgressMap = Record<string, ReadingProgress>;

interface ProgressState {
  progress: ProgressMap;
  loading: boolean;
  error: Error | null;
}

export function useReadingProgress() {
  const { user } = useAuth();
  const [state, setState] = useState<ProgressState>({
    progress: {},
    loading: !!user,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ progress: {}, loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await getSupabase()
        .from('lebrary_reading_progress')
        .select('book_id, completed_chapter_ids, last_read_chapter_id, last_read_at, finished_at')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (error) {
        setState({ progress: {}, loading: false, error: new Error(error.message) });
      } else {
        const map: ProgressMap = {};
        for (const row of data ?? []) {
          map[row.book_id] = {
            bookId: row.book_id,
            completedChapterIds: row.completed_chapter_ids ?? [],
            lastReadChapterId: row.last_read_chapter_id ?? null,
            lastReadAt: row.last_read_at ?? new Date().toISOString(),
            finishedAt: row.finished_at ?? null,
          };
        }
        setState({ progress: map, loading: false, error: null });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const getBookProgress = useCallback(
    (bookId: string): ReadingProgress | undefined => state.progress[bookId],
    [state.progress],
  );

  const upsertRemote = useCallback(
    async (entry: ReadingProgress) => {
      if (!user) return;
      await getSupabase().from('lebrary_reading_progress').upsert(
        {
          user_id: user.id,
          book_id: entry.bookId,
          completed_chapter_ids: entry.completedChapterIds,
          last_read_chapter_id: entry.lastReadChapterId,
          last_read_at: entry.lastReadAt,
          finished_at: entry.finishedAt ?? null,
        },
        { onConflict: 'user_id,book_id' },
      );
    },
    [user],
  );

  const markChapterCompleted = useCallback(
    (bookId: string, chapterId: string) => {
      if (!user) return;
      setState((prev) => {
        const existing = prev.progress[bookId];
        if (existing?.completedChapterIds.includes(chapterId)) return prev;
        const next: ReadingProgress = {
          bookId,
          completedChapterIds: [...(existing?.completedChapterIds ?? []), chapterId],
          lastReadChapterId: chapterId,
          lastReadAt: new Date().toISOString(),
          finishedAt: existing?.finishedAt ?? null,
        };
        void upsertRemote(next);
        return { ...prev, progress: { ...prev.progress, [bookId]: next } };
      });
    },
    [user, upsertRemote],
  );

  const setLastReadChapter = useCallback(
    (bookId: string, chapterId: string) => {
      if (!user) return;
      setState((prev) => {
        const existing = prev.progress[bookId];
        if (existing?.lastReadChapterId === chapterId) return prev;
        const next: ReadingProgress = {
          bookId,
          completedChapterIds: existing?.completedChapterIds ?? [],
          lastReadChapterId: chapterId,
          lastReadAt: new Date().toISOString(),
          finishedAt: existing?.finishedAt ?? null,
        };
        void upsertRemote(next);
        return { ...prev, progress: { ...prev.progress, [bookId]: next } };
      });
    },
    [user, upsertRemote],
  );

  /** Explicitly mark a book as finished. Idempotent: does nothing if already finished. */
  const markBookFinished = useCallback(
    (bookId: string) => {
      if (!user) return;
      setState((prev) => {
        const existing = prev.progress[bookId];
        if (existing?.finishedAt) return prev;
        const now = new Date().toISOString();
        const next: ReadingProgress = {
          bookId,
          completedChapterIds: existing?.completedChapterIds ?? [],
          lastReadChapterId: existing?.lastReadChapterId ?? null,
          lastReadAt: existing?.lastReadAt ?? now,
          finishedAt: now,
        };
        void upsertRemote(next);
        return { ...prev, progress: { ...prev.progress, [bookId]: next } };
      });
    },
    [user, upsertRemote],
  );

  /** Unmark finished (in case it was completed by mistake). */
  const unmarkBookFinished = useCallback(
    (bookId: string) => {
      if (!user) return;
      setState((prev) => {
        const existing = prev.progress[bookId];
        if (!existing?.finishedAt) return prev;
        const next: ReadingProgress = { ...existing, finishedAt: null };
        void upsertRemote(next);
        return { ...prev, progress: { ...prev.progress, [bookId]: next } };
      });
    },
    [user, upsertRemote],
  );

  return {
    progress: state.progress,
    loading: state.loading,
    error: state.error,
    getBookProgress,
    markChapterCompleted,
    setLastReadChapter,
    markBookFinished,
    unmarkBookFinished,
  };
}
