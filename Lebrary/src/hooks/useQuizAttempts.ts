import { useCallback, useEffect, useState } from 'react';
import type { QuizAttempt } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

type AttemptsByBook = Record<string, QuizAttempt[]>;

interface AttemptsState {
  attempts: AttemptsByBook;
  loading: boolean;
  error: Error | null;
}

export function useQuizAttempts() {
  const { user } = useAuth();
  const [state, setState] = useState<AttemptsState>({
    attempts: {},
    loading: !!user,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ attempts: {}, loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await getSupabase()
        .from('lebrary_quiz_attempts')
        .select('id, book_id, answers, score, total_questions, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setState({ attempts: {}, loading: false, error: new Error(error.message) });
      } else {
        const byBook: AttemptsByBook = {};
        for (const row of data ?? []) {
          const list = byBook[row.book_id] ?? [];
          list.push({
            id: row.id,
            bookId: row.book_id,
            answers: (row.answers ?? {}) as Record<string, number>,
            score: row.score,
            totalQuestions: row.total_questions,
            completedAt: row.completed_at,
          });
          byBook[row.book_id] = list;
        }
        setState({ attempts: byBook, loading: false, error: null });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const getBookAttempts = useCallback(
    (bookId: string) => state.attempts[bookId] ?? [],
    [state.attempts],
  );

  const recordAttempt = useCallback(
    async (attempt: QuizAttempt) => {
      if (!user) return;
      setState((prev) => ({
        ...prev,
        attempts: {
          ...prev.attempts,
          [attempt.bookId]: [attempt, ...(prev.attempts[attempt.bookId] ?? [])],
        },
      }));
      await getSupabase().from('lebrary_quiz_attempts').insert({
        id: attempt.id,
        user_id: user.id,
        book_id: attempt.bookId,
        answers: attempt.answers,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        completed_at: attempt.completedAt,
      });
    },
    [user],
  );

  const bestScore = useCallback(
    (bookId: string): number | null => {
      const list = state.attempts[bookId];
      if (!list || list.length === 0) return null;
      return Math.max(...list.map((a) => a.score));
    },
    [state.attempts],
  );

  return {
    attempts: state.attempts,
    loading: state.loading,
    error: state.error,
    getBookAttempts,
    recordAttempt,
    bestScore,
  };
}
