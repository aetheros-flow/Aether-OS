import type { Author, Book } from '@/types';
import { getSupabase } from '@/lib/supabase';
import {
  type AuthorRow,
  type BookWithRelatedRow,
  type ChapterRow,
  type QuizQuestionRow,
  authorRowToAuthor,
  bookRowToBook,
  chapterRowToChapter,
  quizRowToQuestion,
} from '@/lib/supabase-mappers';

/**
 * Fetch every book with its chapters + quiz questions, ordered by chapter.
 * One query — Supabase resolves the nested tables via PostgREST joins.
 */
export async function fetchAllBooks(): Promise<Book[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('lebrary_books')
    .select(
      `
      *,
      chapters:lebrary_chapters(*),
      quiz:lebrary_quiz_questions(*)
    `,
    )
    .order('title_en', { ascending: true });

  if (error) throw new Error(`Failed to load books: ${error.message}`);
  if (!data) return [];

  return data.map((row: BookWithRelatedRow) => {
    const chapterRows = (row.chapters ?? []) as ChapterRow[];
    const quizRows = (row.quiz ?? []) as QuizQuestionRow[];

    const chapters = [...chapterRows]
      .sort((a, b) => a.order - b.order)
      .map(chapterRowToChapter);

    const quiz = [...quizRows]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(quizRowToQuestion);

    return bookRowToBook(row, chapters, quiz);
  });
}

/**
 * Fetch all authors. relatedBookIds is derived by joining on
 * lebrary_books.author_id so we don't need a separate column.
 */
export async function fetchAllAuthors(): Promise<Author[]> {
  const sb = getSupabase();
  const [authorsRes, booksRes] = await Promise.all([
    sb.from('lebrary_authors').select('*').order('name', { ascending: true }),
    sb.from('lebrary_books').select('id, author_id'),
  ]);

  if (authorsRes.error) throw new Error(`Failed to load authors: ${authorsRes.error.message}`);
  if (booksRes.error) throw new Error(`Failed to load author-book links: ${booksRes.error.message}`);

  const booksByAuthor = new Map<string, string[]>();
  for (const b of booksRes.data ?? []) {
    if (!b.author_id) continue;
    const list = booksByAuthor.get(b.author_id) ?? [];
    list.push(b.id);
    booksByAuthor.set(b.author_id, list);
  }

  return (authorsRes.data ?? []).map((row: AuthorRow) =>
    authorRowToAuthor(row, booksByAuthor.get(row.id) ?? []),
  );
}
