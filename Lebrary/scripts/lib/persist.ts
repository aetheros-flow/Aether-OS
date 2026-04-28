// Persistence layer for ingest / delete / duplicate-detection.
// Backed by Supabase (lebrary_* tables) via the service-role key.
// The legacy public/data/*.json files are no longer the source of truth — they
// stay in the repo as a seed for migrate:catalog, but writes happen here.

import type {
  AuthorRow,
  BookRow,
  ChapterRow,
  QuizQuestionRow,
} from '../../src/lib/supabase-mappers.js';
import { getSupabaseAdmin } from './supabase-admin.js';

interface HasId {
  id: string;
}

interface PersistedAuthor extends HasId {
  name: string;
  image: string;
  bio: { en?: string; es?: string };
  accomplishments: Array<{ en?: string; es?: string }>;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  relatedBookIds: string[];
}

interface PersistedBookChapter {
  id: string;
  order: number;
  title: { en?: string; es?: string };
  keyIdeas?: Array<{ en?: string; es?: string }>;
  content: { en?: string; es?: string };
  estimatedReadingMinutes?: number;
}

interface PersistedBookQuiz {
  id: string;
  chapterId?: string;
  difficulty: 'medium' | 'hard';
  question: { en?: string; es?: string };
  options: Array<{ en?: string; es?: string }>;
  correctOption: number;
  explanation?: { en?: string; es?: string };
}

interface PersistedBook extends HasId {
  title: { en?: string; es?: string };
  authorId: string;
  coverImage: string;
  description: { en?: string; es?: string };
  originalLanguage: 'en' | 'es';
  originalFile?: { path: string; format: 'pdf' | 'epub' | 'mobi' | 'txt'; sizeBytes?: number };
  publicationYear?: number;
  genre?: string[];
  chapters: PersistedBookChapter[];
  quiz: PersistedBookQuiz[];
}

// ─── Upsert helpers  (service_role bypasses RLS) ─────────────────────────

export async function mergeAuthor(
  author: PersistedAuthor,
): Promise<{ action: 'inserted' | 'updated' }> {
  const sb = getSupabaseAdmin();

  const { data: existing } = await sb
    .from('lebrary_authors')
    .select('id')
    .eq('id', author.id)
    .maybeSingle();

  const row: Omit<AuthorRow, never> = {
    id: author.id,
    name: author.name,
    image: author.image || null,
    bio_en: author.bio.en ?? null,
    bio_es: author.bio.es ?? null,
    accomplishments: author.accomplishments.length > 0
      ? author.accomplishments.map((a) => ({ en: a.en, es: a.es }))
      : null,
    birth_year: author.birthYear ?? null,
    death_year: author.deathYear ?? null,
    nationality: author.nationality ?? null,
  };

  const { error } = await sb.from('lebrary_authors').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Author upsert failed: ${error.message}`);

  return { action: existing ? 'updated' : 'inserted' };
}

export async function mergeBook(
  book: PersistedBook,
): Promise<{ action: 'inserted' | 'updated' }> {
  const sb = getSupabaseAdmin();

  const { data: existing } = await sb
    .from('lebrary_books')
    .select('id')
    .eq('id', book.id)
    .maybeSingle();

  const bookRow: Omit<BookRow, never> = {
    id: book.id,
    title_en: book.title.en ?? null,
    title_es: book.title.es ?? null,
    author_id: book.authorId || null,
    cover_image: book.coverImage || null,
    description_en: book.description.en ?? null,
    description_es: book.description.es ?? null,
    original_language: book.originalLanguage,
    original_file_path: book.originalFile?.path ?? null,
    original_file_format: book.originalFile?.format ?? null,
    original_file_size_bytes: book.originalFile?.sizeBytes ?? null,
    publication_year: book.publicationYear ?? null,
    genre: book.genre && book.genre.length > 0 ? book.genre : null,
  };

  const { error: bookErr } = await sb
    .from('lebrary_books')
    .upsert(bookRow, { onConflict: 'id' });
  if (bookErr) throw new Error(`Book upsert failed: ${bookErr.message}`);

  // Replace chapters + quiz for this book.
  // Delete existing rows for the book, then insert the new set. `on delete cascade`
  // on quiz.chapter_id FK means we must delete quiz first (or rely on `set null`).
  // Schema uses `set null` on quiz→chapter, so chapters can be deleted freely.
  const { error: delChaptersErr } = await sb
    .from('lebrary_chapters')
    .delete()
    .eq('book_id', book.id);
  if (delChaptersErr) throw new Error(`Chapter cleanup failed: ${delChaptersErr.message}`);

  const { error: delQuizErr } = await sb
    .from('lebrary_quiz_questions')
    .delete()
    .eq('book_id', book.id);
  if (delQuizErr) throw new Error(`Quiz cleanup failed: ${delQuizErr.message}`);

  if (book.chapters.length > 0) {
    const chapterRows: Array<Omit<ChapterRow, never>> = book.chapters.map((c) => ({
      id: c.id,
      book_id: book.id,
      order: c.order,
      title_en: c.title.en ?? null,
      title_es: c.title.es ?? null,
      content_en: c.content.en ?? null,
      content_es: c.content.es ?? null,
      key_ideas: c.keyIdeas && c.keyIdeas.length > 0
        ? c.keyIdeas.map((k) => ({ en: k.en, es: k.es }))
        : null,
      estimated_reading_minutes: c.estimatedReadingMinutes ?? null,
    }));
    const { error: insChErr } = await sb.from('lebrary_chapters').insert(chapterRows);
    if (insChErr) throw new Error(`Chapter insert failed: ${insChErr.message}`);
  }

  if (book.quiz.length > 0) {
    const quizRows: Array<Omit<QuizQuestionRow, never>> = book.quiz.map((q, idx) => ({
      id: q.id,
      book_id: book.id,
      chapter_id: q.chapterId ?? null,
      order: idx + 1,
      difficulty: q.difficulty,
      question_en: q.question.en ?? null,
      question_es: q.question.es ?? null,
      options: q.options.map((o) => ({ en: o.en, es: o.es })),
      correct_option: q.correctOption,
      explanation_en: q.explanation?.en ?? null,
      explanation_es: q.explanation?.es ?? null,
    }));
    const { error: insQErr } = await sb.from('lebrary_quiz_questions').insert(quizRows);
    if (insQErr) throw new Error(`Quiz insert failed: ${insQErr.message}`);
  }

  return { action: existing ? 'updated' : 'inserted' };
}

// ─── Duplicate detection ─────────────────────────────────────────────────

export interface DuplicateMatch {
  id: string;
  titleEn: string;
  matchedOn: 'originalFile' | 'title';
  similarity: number;
}

export interface BookSummaryForDuplicateCheck {
  id: string;
  titleEn: string;
  titleEs?: string;
  authorName: string;
}

/**
 * Lightweight list of every book in the catalog (EN+ES titles + author name)
 * used by the Gemini duplicate-check prompt.
 */
export async function listAllBooksForDuplicateCheck(): Promise<BookSummaryForDuplicateCheck[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lebrary_books')
    .select('id, title_en, title_es, lebrary_authors(name)');
  if (error) throw new Error(`Book list failed: ${error.message}`);
  return (data ?? []).map((b: {
    id: string;
    title_en: string | null;
    title_es: string | null;
    lebrary_authors: { name?: string } | Array<{ name?: string }> | null;
  }) => {
    const authorNode = Array.isArray(b.lebrary_authors) ? b.lebrary_authors[0] : b.lebrary_authors;
    return {
      id: b.id,
      titleEn: b.title_en ?? b.id,
      titleEs: b.title_es ?? undefined,
      authorName: authorNode?.name ?? '',
    };
  });
}

export async function findPotentialDuplicate(
  filenameBase: string,
): Promise<DuplicateMatch | null> {
  const sb = getSupabaseAdmin();

  const { data, error } = await sb
    .from('lebrary_books')
    .select('id, title_en, title_es, original_file_path');
  if (error) throw new Error(`Duplicate scan failed: ${error.message}`);

  const books = data ?? [];
  if (books.length === 0) return null;

  const needle = normalizeTokens(filenameBase);
  if (needle.size === 0) return null;

  let best: DuplicateMatch | null = null;

  for (const book of books) {
    const titleEn = book.title_en ?? book.id;

    // Strong signal: same original file path base.
    if (book.original_file_path) {
      const origBase = basenameNoExt(book.original_file_path);
      if (normalizeKey(origBase) === normalizeKey(filenameBase)) {
        return { id: book.id, titleEn, matchedOn: 'originalFile', similarity: 1 };
      }
    }

    // Fuzzy signal: Jaccard similarity on title tokens (EN + ES).
    const titleTokens = new Set<string>();
    for (const tok of normalizeTokens(book.title_en ?? '')) titleTokens.add(tok);
    for (const tok of normalizeTokens(book.title_es ?? '')) titleTokens.add(tok);
    if (titleTokens.size === 0) continue;

    let intersection = 0;
    for (const tok of needle) if (titleTokens.has(tok)) intersection++;
    const union = needle.size + titleTokens.size - intersection;
    const sim = union === 0 ? 0 : intersection / union;
    if (sim >= 0.5 && (!best || sim > best.similarity)) {
      best = { id: book.id, titleEn, matchedOn: 'title', similarity: sim };
    }
  }

  return best;
}

// ─── Delete ──────────────────────────────────────────────────────────────

export async function deleteBookById(
  bookId: string,
): Promise<
  | { ok: true; bookTitle?: string; removedAuthor?: string }
  | { ok: false; reason: string }
> {
  const sb = getSupabaseAdmin();

  const { data: book, error: fetchErr } = await sb
    .from('lebrary_books')
    .select('id, title_en, title_es, author_id')
    .eq('id', bookId)
    .maybeSingle();

  if (fetchErr) return { ok: false, reason: `Lookup failed: ${fetchErr.message}` };
  if (!book) return { ok: false, reason: `Book "${bookId}" not found.` };

  // cascade deletes chapters + quiz via ON DELETE CASCADE in the schema.
  const { error: delErr } = await sb.from('lebrary_books').delete().eq('id', bookId);
  if (delErr) return { ok: false, reason: `Delete failed: ${delErr.message}` };

  let removedAuthor: string | undefined;
  if (book.author_id) {
    const { data: siblings, error: sibErr } = await sb
      .from('lebrary_books')
      .select('id', { count: 'exact', head: false })
      .eq('author_id', book.author_id)
      .limit(1);
    if (!sibErr && (!siblings || siblings.length === 0)) {
      const { error: delAErr } = await sb
        .from('lebrary_authors')
        .delete()
        .eq('id', book.author_id);
      if (!delAErr) removedAuthor = book.author_id;
    }
  }

  return {
    ok: true,
    bookTitle: book.title_en ?? book.title_es ?? book.id,
    removedAuthor,
  };
}

// ─── String utilities (kept local) ───────────────────────────────────────

function basenameNoExt(p: string): string {
  const lastSlash = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
  const afterSlash = lastSlash >= 0 ? p.slice(lastSlash + 1) : p;
  const dot = afterSlash.lastIndexOf('.');
  return dot > 0 ? afterSlash.slice(0, dot) : afterSlash;
}

function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeTokens(s: string): Set<string> {
  const set = new Set<string>();
  const normalized = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  for (const t of normalized.split(' ')) {
    if (t.length >= 3) set.add(t);
  }
  return set;
}
