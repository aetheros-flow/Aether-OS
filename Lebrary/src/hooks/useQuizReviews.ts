import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { defaultCard, scheduleNext, type CardState } from '@/lib/sm2';

interface ReviewRow {
  user_id: string;
  question_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  last_rating: number | null;
}

function rowToCard(r: ReviewRow): CardState {
  return {
    easeFactor: r.ease_factor,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    lastReviewedAt: r.last_reviewed_at ?? r.next_review_at,
    nextReviewAt: r.next_review_at,
    lastRating: r.last_rating,
  };
}

function cardToRow(userId: string, questionId: string, c: CardState): ReviewRow {
  return {
    user_id: userId,
    question_id: questionId,
    ease_factor: c.easeFactor,
    interval_days: c.intervalDays,
    repetitions: c.repetitions,
    last_reviewed_at: c.lastReviewedAt,
    next_review_at: c.nextReviewAt,
    last_rating: c.lastRating,
  };
}

export function useQuizReviews() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Map<string, CardState>>(new Map());
  const [loading, setLoading] = useState(!!user);

  const load = useCallback(async () => {
    if (!user) {
      setCards(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getSupabase()
      .from('lebrary_quiz_card_reviews')
      .select('*')
      .eq('user_id', user.id);
    const map = new Map<string, CardState>();
    for (const row of (data ?? []) as ReviewRow[]) {
      map.set(row.question_id, rowToCard(row));
    }
    setCards(map);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  /**
   * Record a grading: if the card doesn't exist yet, seed with defaults;
   * then apply SM-2 and upsert.
   */
  const gradeCard = useCallback(
    async (questionId: string, rating: 0 | 1 | 2 | 3): Promise<CardState | null> => {
      if (!user) return null;
      const existing = cards.get(questionId) ?? defaultCard();
      const next = scheduleNext(existing, rating);
      setCards((prev) => {
        const copy = new Map(prev);
        copy.set(questionId, next);
        return copy;
      });
      await getSupabase().from('lebrary_quiz_card_reviews').upsert(
        cardToRow(user.id, questionId, next),
        { onConflict: 'user_id,question_id' },
      );
      return next;
    },
    [user, cards],
  );

  /**
   * Seed a card from a quiz attempt. Called after the user completes a quiz
   * in QuizView; wrong answers become due for review, right ones schedule out.
   */
  const ingestQuizResult = useCallback(
    async (questionId: string, wasCorrect: boolean) => {
      return gradeCard(questionId, wasCorrect ? 2 : 0);
    },
    [gradeCard],
  );

  const dueNow = useCallback((): string[] => {
    const now = new Date();
    const due: string[] = [];
    for (const [qid, card] of cards) {
      if (new Date(card.nextReviewAt) <= now) due.push(qid);
    }
    return due;
  }, [cards]);

  const dueCount = () => dueNow().length;

  return {
    cards,
    loading,
    gradeCard,
    ingestQuizResult,
    dueNow,
    dueCount,
    refresh: load,
  };
}
