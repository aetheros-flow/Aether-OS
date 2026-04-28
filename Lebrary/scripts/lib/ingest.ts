import { readFile, stat } from 'node:fs/promises';
import { basename, resolve, relative } from 'node:path';
import {
  checkBookDuplicateViaGemini,
  generateBookFromText,
  generateBookFromWebQuery,
  type GeneratedBook,
} from './gemini.js';
import {
  findPotentialDuplicate,
  listAllBooksForDuplicateCheck,
  mergeAuthor,
  mergeBook,
} from './persist.js';
import { findOriginalFile } from './original-file.js';
import { slugify } from './slug.js';
import { findEntry, upsertLog } from './ingest-log.js';

interface LocalizedText {
  en?: string;
  es?: string;
}

interface PersistedChapter {
  id: string;
  order: number;
  title: LocalizedText;
  keyIdeas?: LocalizedText[];
  content: LocalizedText;
  estimatedReadingMinutes?: number;
}

interface PersistedQuizQuestion {
  id: string;
  chapterId?: string;
  difficulty: 'medium' | 'hard';
  question: LocalizedText;
  options: LocalizedText[];
  correctOption: number;
  explanation?: LocalizedText;
}

interface PersistedBook {
  id: string;
  title: LocalizedText;
  authorId: string;
  coverImage: string;
  description: LocalizedText;
  originalLanguage: 'en' | 'es';
  originalFile?: { path: string; format: 'pdf' | 'epub' | 'mobi' | 'txt'; sizeBytes?: number };
  publicationYear?: number;
  genre?: string[];
  chapters: PersistedChapter[];
  quiz: PersistedQuizQuestion[];
}

interface PersistedAuthor {
  id: string;
  name: string;
  image: string;
  bio: LocalizedText;
  accomplishments: LocalizedText[];
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  relatedBookIds: string[];
}

export interface IngestOptions {
  apiKey: string;
  model?: string;
  force?: boolean;
  logger?: (msg: string) => void;
}

export interface IngestResult {
  status: 'ingested' | 'skipped' | 'duplicate';
  bookId?: string;
  titleEn?: string;
  chapters?: number;
  quiz?: number;
  elapsedSeconds?: number;
  duplicateReason?: string;
  /** Source of truth for where the book came from. */
  source?: 'file' | 'web';
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function ingestBookFile(
  filePath: string,
  opts: IngestOptions,
): Promise<IngestResult> {
  const log = opts.logger ?? ((m: string) => console.log(m));
  const absPath = resolve(process.cwd(), filePath);
  const relPath = relative(process.cwd(), absPath).replace(/\\/g, '/');
  const fileBasename = basename(absPath, '.txt');

  if (!opts.force) {
    const existing = await findEntry(relPath);
    if (existing) {
      log(`[skip] already ingested (file in log): ${relPath}`);
      return { status: 'skipped', bookId: existing.bookId };
    }

    const dup = await findPotentialDuplicate(fileBasename);
    if (dup) {
      const reason = dup.matchedOn === 'originalFile'
        ? `Same original file is already imported as "${dup.titleEn}".`
        : `A book with a similar title ("${dup.titleEn}") is already in the library.`;
      log(`[duplicate] ${reason}`);
      return {
        status: 'duplicate',
        bookId: dup.id,
        titleEn: dup.titleEn,
        duplicateReason: reason,
      };
    }
  }

  const fileStat = await stat(absPath);
  log(`[read] ${relPath}`);
  const raw = await readFile(absPath, 'utf8');
  const text = normalizeText(raw);
  log(`[read] ${text.length.toLocaleString()} characters`);

  log(`[gemini] generating structured book…`);
  const t0 = Date.now();
  const generated = await generateBookFromText(text, {
    apiKey: opts.apiKey,
    filenameHint: fileBasename,
    model: opts.model,
  });
  const elapsed = (Date.now() - t0) / 1000;
  log(`[gemini] done in ${elapsed.toFixed(1)}s · bookType=${generated.bookType} · chapters=${generated.chapters.length} · quiz=${generated.quiz.length}`);

  const authorId = `author-${slugify(generated.author.name)}`;
  const bookId = `book-${slugify(generated.titleEn)}`;

  const originalFile = await findOriginalFile(fileBasename);
  if (originalFile) log(`[link] original file → ${originalFile.path}`);

  const chapters: PersistedChapter[] = generated.chapters.map((c) => ({
    id: `${bookId}-ch-${c.order}`,
    order: c.order,
    title: { en: c.titleEn, es: c.titleEs },
    keyIdeas: c.keyIdeasEn.map((en, i) => ({ en, es: c.keyIdeasEs[i] ?? en })),
    content: { en: c.contentEn, es: c.contentEs },
    estimatedReadingMinutes: c.estimatedReadingMinutes,
  }));

  const chapterIdByOrder = new Map(chapters.map((c) => [c.order, c.id]));

  const quiz: PersistedQuizQuestion[] = generated.quiz.map((q, i) => ({
    id: `${bookId}-q-${i + 1}`,
    chapterId: chapterIdByOrder.get(q.chapterOrder),
    difficulty: q.difficulty,
    question: { en: q.questionEn, es: q.questionEs },
    options: [0, 1, 2, 3].map((idx) => ({ en: q.optionsEn[idx], es: q.optionsEs[idx] })),
    correctOption: q.correctOption,
    explanation: { en: q.explanationEn, es: q.explanationEs },
  }));

  const author: PersistedAuthor = {
    id: authorId,
    name: generated.author.name,
    image: '',
    bio: { en: generated.author.bioEn, es: generated.author.bioEs },
    accomplishments: generated.author.accomplishments.map((a) => ({ en: a.en, es: a.es })),
    birthYear: generated.author.birthYear,
    deathYear: generated.author.deathYear,
    nationality: generated.author.nationality,
    relatedBookIds: [bookId],
  };

  const book: PersistedBook = {
    id: bookId,
    title: { en: generated.titleEn, es: generated.titleEs },
    authorId,
    coverImage: '',
    description: { en: generated.descriptionEn, es: generated.descriptionEs },
    originalLanguage: generated.originalLanguage,
    originalFile,
    publicationYear: generated.publicationYear,
    genre: generated.genre,
    chapters,
    quiz,
  };

  const authorRes = await mergeAuthor(author);
  const bookRes = await mergeBook(book);
  log(`[persist] author: ${authorRes.action} → ${author.id}`);
  log(`[persist] book:   ${bookRes.action} → ${book.id}`);

  await upsertLog({
    file: relPath,
    bookId,
    ingestedAt: new Date().toISOString(),
    sizeBytes: fileStat.size,
  });

  log(`[done] ${generated.titleEn} (${chapters.length} ch, ${quiz.length} q)`);

  return {
    status: 'ingested',
    bookId,
    titleEn: generated.titleEn,
    chapters: chapters.length,
    quiz: quiz.length,
    elapsedSeconds: elapsed,
    source: 'file',
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Web ingest — same output, different input: a free-form query string
// (e.g. "The Power of Now, Eckhart Tolle") instead of a .txt file.
// Runs an LLM-based duplicate check first before the expensive ingest call.
// ──────────────────────────────────────────────────────────────────────────

export interface IngestFromWebOptions extends IngestOptions {
  /** Skip the Gemini-based duplicate check. */
  force?: boolean;
}

export async function ingestBookFromWebQuery(
  query: string,
  opts: IngestFromWebOptions,
): Promise<IngestResult> {
  const log = opts.logger ?? ((m: string) => console.log(m));
  const trimmedQuery = query.trim();
  if (!trimmedQuery) throw new Error('Empty query.');

  log(`[web-ingest] query: "${trimmedQuery}"`);

  // 1. Smart duplicate check via Gemini (cross-language aware).
  if (!opts.force) {
    const existing = await listAllBooksForDuplicateCheck();
    const check = await checkBookDuplicateViaGemini(trimmedQuery, existing, {
      apiKey: opts.apiKey,
    });
    if (check.isDuplicate && check.confidence >= 0.65 && check.bookId) {
      const matched = existing.find((b) => b.id === check.bookId);
      log(`[web-ingest] duplicate (${Math.round(check.confidence * 100)}% confident): ${matched?.titleEn ?? check.bookId}`);
      return {
        status: 'duplicate',
        bookId: check.bookId,
        titleEn: matched?.titleEn,
        duplicateReason: check.explanation || `Already in your library.`,
        source: 'web',
      };
    }
  }

  // 2. Full ingest via Gemini — uses its own knowledge + Google Search.
  log(`[web-ingest] calling Gemini for full ingest…`);
  const t0 = Date.now();
  const generated: GeneratedBook = await generateBookFromWebQuery(trimmedQuery, {
    apiKey: opts.apiKey,
    model: opts.model,
  });
  const elapsed = (Date.now() - t0) / 1000;
  log(`[web-ingest] done in ${elapsed.toFixed(1)}s · "${generated.titleEn}" · bookType=${generated.bookType} · ch=${generated.chapters.length} · q=${generated.quiz.length}`);

  const authorId = `author-${slugify(generated.author.name)}`;
  const bookId = `book-${slugify(generated.titleEn)}`;

  const chapters: PersistedChapter[] = generated.chapters.map((c) => ({
    id: `${bookId}-ch-${c.order}`,
    order: c.order,
    title: { en: c.titleEn, es: c.titleEs },
    keyIdeas: c.keyIdeasEn.map((en, i) => ({ en, es: c.keyIdeasEs[i] ?? en })),
    content: { en: c.contentEn, es: c.contentEs },
    estimatedReadingMinutes: c.estimatedReadingMinutes,
  }));

  const chapterIdByOrder = new Map(chapters.map((c) => [c.order, c.id]));

  const quiz: PersistedQuizQuestion[] = generated.quiz.map((q, i) => ({
    id: `${bookId}-q-${i + 1}`,
    chapterId: chapterIdByOrder.get(q.chapterOrder),
    difficulty: q.difficulty,
    question: { en: q.questionEn, es: q.questionEs },
    options: [0, 1, 2, 3].map((idx) => ({ en: q.optionsEn[idx], es: q.optionsEs[idx] })),
    correctOption: q.correctOption,
    explanation: { en: q.explanationEn, es: q.explanationEs },
  }));

  const author: PersistedAuthor = {
    id: authorId,
    name: generated.author.name,
    image: '',
    bio: { en: generated.author.bioEn, es: generated.author.bioEs },
    accomplishments: generated.author.accomplishments.map((a) => ({ en: a.en, es: a.es })),
    birthYear: generated.author.birthYear,
    deathYear: generated.author.deathYear,
    nationality: generated.author.nationality,
    relatedBookIds: [bookId],
  };

  const book: PersistedBook = {
    id: bookId,
    title: { en: generated.titleEn, es: generated.titleEs },
    authorId,
    coverImage: '',
    description: { en: generated.descriptionEn, es: generated.descriptionEs },
    originalLanguage: generated.originalLanguage,
    // No originalFile for web ingests — there's no file on disk.
    originalFile: undefined,
    publicationYear: generated.publicationYear,
    genre: generated.genre,
    chapters,
    quiz,
  };

  const authorRes = await mergeAuthor(author);
  const bookRes = await mergeBook(book);
  log(`[persist] author: ${authorRes.action} → ${author.id}`);
  log(`[persist] book:   ${bookRes.action} → ${book.id}`);

  return {
    status: 'ingested',
    bookId,
    titleEn: generated.titleEn,
    chapters: chapters.length,
    quiz: quiz.length,
    elapsedSeconds: elapsed,
    source: 'web',
  };
}
