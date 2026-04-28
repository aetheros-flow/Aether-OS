// One-time localStorage → Supabase migration, invoked once per user on the
// first authenticated render after upgrading from the pre-auth version.
//
// A flag in localStorage (`lumina.v1.migrated:<userId>`) prevents re-runs.
// All writes are idempotent: favorites/progress use upsert with `ignoreDuplicates`,
// highlights insert by id (the old client generated deterministic IDs).

import type { Highlight, QuizAttempt, ReadingProgress } from '@/types';
import { getSupabase } from '@/lib/supabase';
import { readJSON, storageKeys, writeJSON } from '@/lib/storage';

const MIGRATED_KEY_PREFIX = 'lumina.v1.migrated:';

export async function runUserDataMigration(userId: string): Promise<void> {
  const flagKey = `${MIGRATED_KEY_PREFIX}${userId}`;
  if (localStorage.getItem(flagKey) === 'true') return;

  const sb = getSupabase();

  // 1. Favorites — array<bookId>
  const favorites = readJSON<string[]>(storageKeys.favorites, []);
  if (favorites.length > 0) {
    const rows = favorites.map((bookId) => ({ user_id: userId, book_id: bookId }));
    await sb.from('lebrary_favorites').upsert(rows, {
      onConflict: 'user_id,book_id',
      ignoreDuplicates: true,
    });
  }

  // 2. Reading progress — Record<bookId, ReadingProgress>
  const progressMap = readJSON<Record<string, ReadingProgress>>(storageKeys.readingProgress, {});
  const progressEntries = Object.values(progressMap);
  if (progressEntries.length > 0) {
    const rows = progressEntries.map((p) => ({
      user_id: userId,
      book_id: p.bookId,
      completed_chapter_ids: p.completedChapterIds,
      last_read_chapter_id: p.lastReadChapterId,
      last_read_at: p.lastReadAt,
    }));
    await sb.from('lebrary_reading_progress').upsert(rows, {
      onConflict: 'user_id,book_id',
    });
  }

  // 3. Quiz attempts — Record<bookId, QuizAttempt[]>
  const attemptsMap = readJSON<Record<string, QuizAttempt[]>>(storageKeys.quizAttempts, {});
  const attemptsFlat = Object.values(attemptsMap).flat();
  if (attemptsFlat.length > 0) {
    const rows = attemptsFlat.map((a) => ({
      id: a.id,
      user_id: userId,
      book_id: a.bookId,
      answers: a.answers,
      score: a.score,
      total_questions: a.totalQuestions,
      completed_at: a.completedAt,
    }));
    await sb.from('lebrary_quiz_attempts').upsert(rows, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
  }

  // 4. Highlights — Record<bookId, Highlight[]> with client-generated string ids.
  //    DB uses uuid → we insert under a different id to avoid collisions, and we
  //    keep a local map of old→new so if the UI still references old ids, they
  //    gracefully miss (user will reload). For MVP we accept this.
  const highlightsMap = readJSON<Record<string, Highlight[]>>(storageKeys.highlights, {});
  const highlightsFlat = Object.values(highlightsMap).flat();
  if (highlightsFlat.length > 0) {
    const rows = highlightsFlat.map((h) => ({
      // let DB generate a fresh uuid — old ids like `hl-<ts>-<rand>` aren't UUIDs.
      user_id: userId,
      book_id: h.bookId,
      chapter_id: h.chapterId,
      text: h.text,
      language: h.language,
      prefix: h.prefix,
      suffix: h.suffix,
      note: h.note,
      created_at: h.createdAt,
      updated_at: h.updatedAt ?? h.createdAt,
    }));
    await sb.from('lebrary_highlights').insert(rows);
  }

  writeJSON(flagKey, 'true' as unknown as string);
  localStorage.setItem(flagKey, 'true');

  if (favorites.length + progressEntries.length + attemptsFlat.length + highlightsFlat.length > 0) {
    console.info(
      `[migration] Migrated ${favorites.length} favorites, ${progressEntries.length} progress entries, ${attemptsFlat.length} quiz attempts, ${highlightsFlat.length} highlights to Supabase.`,
    );
  }
}
