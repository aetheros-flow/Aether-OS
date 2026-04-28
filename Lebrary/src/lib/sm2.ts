// Simplified SM-2 spaced-repetition algorithm.
// Rating scale: 0=again, 1=hard, 2=good, 3=easy.

export interface CardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;   // ISO
  lastReviewedAt: string; // ISO
  lastRating: number | null;
}

const MIN_EASE = 1.3;

export function defaultCard(now: Date = new Date()): CardState {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now.toISOString(),
    lastReviewedAt: now.toISOString(),
    lastRating: null,
  };
}

export function scheduleNext(card: CardState, rating: 0 | 1 | 2 | 3, now: Date = new Date()): CardState {
  const nowIso = now.toISOString();

  if (rating === 0) {
    // Forgot it — send to tomorrow and reduce ease.
    return {
      easeFactor: Math.max(MIN_EASE, card.easeFactor - 0.2),
      intervalDays: 1,
      repetitions: 0,
      lastReviewedAt: nowIso,
      nextReviewAt: addDays(now, 1).toISOString(),
      lastRating: 0,
    };
  }

  const reps = card.repetitions + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.max(1, Math.round(card.intervalDays * card.easeFactor));

  // Ease delta based on rating. rating in {1=hard, 2=good, 3=easy}.
  const grade = rating === 1 ? 3 : rating === 2 ? 4 : 5;
  const delta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  const ease = Math.max(MIN_EASE, card.easeFactor + delta);

  if (rating === 1) interval = Math.max(1, Math.round(interval * 0.7));

  return {
    easeFactor: ease,
    intervalDays: interval,
    repetitions: reps,
    lastReviewedAt: nowIso,
    nextReviewAt: addDays(now, interval).toISOString(),
    lastRating: rating,
  };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
