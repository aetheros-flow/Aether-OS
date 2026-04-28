import type {
  Author,
  Book,
  Chapter,
  LocalizedText,
  OriginalFile,
  OriginalLanguage,
  QuizQuestion,
} from '../types';

// ─── DB row shapes (matching the Supabase SQL schema) ────────────────────

export interface AuthorRow {
  id: string;
  name: string;
  image: string | null;
  bio_en: string | null;
  bio_es: string | null;
  accomplishments: Array<{ en?: string; es?: string }> | null;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
}

export interface BookRow {
  id: string;
  title_en: string | null;
  title_es: string | null;
  author_id: string | null;
  cover_image: string | null;
  description_en: string | null;
  description_es: string | null;
  original_language: OriginalLanguage | null;
  original_file_path: string | null;
  original_file_format: OriginalFile['format'] | null;
  original_file_size_bytes: number | null;
  publication_year: number | null;
  genre: string[] | null;
}

export interface ChapterRow {
  id: string;
  book_id: string;
  order: number;
  title_en: string | null;
  title_es: string | null;
  content_en: string | null;
  content_es: string | null;
  key_ideas: Array<{ en?: string; es?: string }> | null;
  estimated_reading_minutes: number | null;
}

export interface QuizQuestionRow {
  id: string;
  book_id: string;
  chapter_id: string | null;
  order: number | null;
  difficulty: 'medium' | 'hard';
  question_en: string | null;
  question_es: string | null;
  options: Array<{ en?: string; es?: string }> | null;
  correct_option: number;
  explanation_en: string | null;
  explanation_es: string | null;
}

// Join shape when selecting book with nested tables.
export interface BookWithRelatedRow extends BookRow {
  chapters?: ChapterRow[] | null;
  quiz?: QuizQuestionRow[] | null;
}

// ─── Small utilities ─────────────────────────────────────────────────────

function localized(en: string | null | undefined, es: string | null | undefined): LocalizedText {
  const t: LocalizedText = {};
  if (en != null && en !== '') t.en = en;
  if (es != null && es !== '') t.es = es;
  return t;
}

function localizedArray(arr: Array<{ en?: string; es?: string }> | null | undefined): LocalizedText[] {
  if (!arr) return [];
  return arr.map((item) => ({
    en: item.en ?? undefined,
    es: item.es ?? undefined,
  }));
}

// ─── Row → App ───────────────────────────────────────────────────────────

export function authorRowToAuthor(row: AuthorRow, relatedBookIds: string[] = []): Author {
  return {
    id: row.id,
    name: row.name,
    image: row.image ?? '',
    bio: localized(row.bio_en, row.bio_es),
    accomplishments: localizedArray(row.accomplishments),
    birthYear: row.birth_year ?? undefined,
    deathYear: row.death_year ?? undefined,
    nationality: row.nationality ?? undefined,
    relatedBookIds,
  };
}

export function chapterRowToChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    order: row.order,
    title: localized(row.title_en, row.title_es),
    content: localized(row.content_en, row.content_es),
    keyIdeas: localizedArray(row.key_ideas).length > 0 ? localizedArray(row.key_ideas) : undefined,
    estimatedReadingMinutes: row.estimated_reading_minutes ?? undefined,
  };
}

export function quizRowToQuestion(row: QuizQuestionRow): QuizQuestion {
  const options = localizedArray(row.options);
  return {
    id: row.id,
    chapterId: row.chapter_id ?? undefined,
    difficulty: row.difficulty,
    question: localized(row.question_en, row.question_es),
    options,
    correctOption: row.correct_option,
    explanation: localized(row.explanation_en, row.explanation_es),
  };
}

export function bookRowToBook(
  row: BookWithRelatedRow,
  chapters: Chapter[] = [],
  quiz: QuizQuestion[] = [],
): Book {
  const originalFile: OriginalFile | undefined =
    row.original_file_path && row.original_file_format
      ? {
          path: row.original_file_path,
          format: row.original_file_format,
          sizeBytes: row.original_file_size_bytes ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    title: localized(row.title_en, row.title_es),
    authorId: row.author_id ?? '',
    coverImage: row.cover_image ?? '',
    description: localized(row.description_en, row.description_es),
    originalLanguage: (row.original_language ?? 'en') as OriginalLanguage,
    originalFile,
    publicationYear: row.publication_year ?? undefined,
    genre: row.genre ?? [],
    chapters,
    quiz,
  };
}

// ─── App → DB row  (for inserts/updates) ─────────────────────────────────

export function bookToRow(book: Book): Omit<BookRow, never> {
  return {
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
}

export function authorToRow(author: Author): Omit<AuthorRow, never> {
  return {
    id: author.id,
    name: author.name,
    image: author.image || null,
    bio_en: author.bio.en ?? null,
    bio_es: author.bio.es ?? null,
    accomplishments: author.accomplishments.length > 0
      ? author.accomplishments.map((a) => ({
          en: a.en,
          es: a.es,
        }))
      : null,
    birth_year: author.birthYear ?? null,
    death_year: author.deathYear ?? null,
    nationality: author.nationality ?? null,
  };
}

export function chapterToRow(chapter: Chapter, bookId: string): Omit<ChapterRow, never> {
  return {
    id: chapter.id,
    book_id: bookId,
    order: chapter.order,
    title_en: chapter.title.en ?? null,
    title_es: chapter.title.es ?? null,
    content_en: chapter.content.en ?? null,
    content_es: chapter.content.es ?? null,
    key_ideas: chapter.keyIdeas && chapter.keyIdeas.length > 0
      ? chapter.keyIdeas.map((k) => ({ en: k.en, es: k.es }))
      : null,
    estimated_reading_minutes: chapter.estimatedReadingMinutes ?? null,
  };
}

export function quizQuestionToRow(
  q: QuizQuestion,
  bookId: string,
  order: number,
): Omit<QuizQuestionRow, never> {
  return {
    id: q.id,
    book_id: bookId,
    chapter_id: q.chapterId ?? null,
    order,
    difficulty: q.difficulty,
    question_en: q.question.en ?? null,
    question_es: q.question.es ?? null,
    options: q.options.map((o) => ({ en: o.en, es: o.es })),
    correct_option: q.correctOption,
    explanation_en: q.explanation?.en ?? null,
    explanation_es: q.explanation?.es ?? null,
  };
}
