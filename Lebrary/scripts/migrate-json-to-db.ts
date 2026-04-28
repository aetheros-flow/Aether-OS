// One-time migration: reads public/data/books.json + authors.json and upserts
// everything into the lebrary_* tables in Supabase via the service-role key.
//
// Safe to run repeatedly — all writes use upsert on primary key.
//
// Usage: npm run migrate:catalog

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  authorToRow,
  bookToRow,
  chapterToRow,
  quizQuestionToRow,
} from '../src/lib/supabase-mappers.js';
import type { Author, Book, LocalizedText } from '../src/types/index.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[migrate] Missing env var ${name} (put it in .env)`);
    process.exit(1);
  }
  return v;
}

async function readJsonArray<T>(path: string): Promise<T[]> {
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected array in ${path}, got ${typeof parsed}`);
  }
  return parsed as T[];
}

async function upsertInChunks<TRow>(
  sb: SupabaseClient,
  table: string,
  rows: TRow[],
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await sb.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`Upsert into ${table} failed: ${error.message}`);
  }
}

interface RawAuthor extends Omit<Author, 'bio' | 'accomplishments'> {
  bio: LocalizedText;
  accomplishments: LocalizedText[];
}

async function main() {
  const url = requireEnv('VITE_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const projectRoot = process.cwd();
  const authorsJsonPath = resolve(projectRoot, 'public/data/authors.json');
  const booksJsonPath = resolve(projectRoot, 'public/data/books.json');

  console.log('[migrate] reading JSON files…');
  const authors = await readJsonArray<RawAuthor>(authorsJsonPath);
  const books = await readJsonArray<Book>(booksJsonPath);

  console.log(`[migrate] ${authors.length} authors · ${books.length} books`);

  // 1. Authors first (books FK to authors).
  const authorRows = authors.map((a) => authorToRow(a as Author));
  await upsertInChunks(sb, 'lebrary_authors', authorRows);
  console.log(`[migrate] ✓ upserted ${authorRows.length} authors`);

  // 2. Books (without chapters/quiz — those go separately).
  const bookRows = books.map((b) => bookToRow(b));
  await upsertInChunks(sb, 'lebrary_books', bookRows);
  console.log(`[migrate] ✓ upserted ${bookRows.length} books`);

  // 3. Chapters (flattened across all books).
  const chapterRows = books.flatMap((b) =>
    b.chapters.map((c) => chapterToRow(c, b.id)),
  );
  if (chapterRows.length > 0) {
    await upsertInChunks(sb, 'lebrary_chapters', chapterRows);
    console.log(`[migrate] ✓ upserted ${chapterRows.length} chapters`);
  }

  // 4. Quiz questions (flattened), preserving original order inside each book.
  const quizRows = books.flatMap((b) =>
    b.quiz.map((q, idx) => quizQuestionToRow(q, b.id, idx + 1)),
  );
  if (quizRows.length > 0) {
    await upsertInChunks(sb, 'lebrary_quiz_questions', quizRows);
    console.log(`[migrate] ✓ upserted ${quizRows.length} quiz questions`);
  }

  // 5. Quick sanity check.
  const [{ count: aCount }, { count: bCount }, { count: cCount }, { count: qCount }] =
    await Promise.all([
      sb.from('lebrary_authors').select('*', { count: 'exact', head: true }),
      sb.from('lebrary_books').select('*', { count: 'exact', head: true }),
      sb.from('lebrary_chapters').select('*', { count: 'exact', head: true }),
      sb.from('lebrary_quiz_questions').select('*', { count: 'exact', head: true }),
    ]);

  console.log('\n[migrate] DB counts after migration:');
  console.log(`  lebrary_authors        : ${aCount}`);
  console.log(`  lebrary_books          : ${bCount}`);
  console.log(`  lebrary_chapters       : ${cCount}`);
  console.log(`  lebrary_quiz_questions : ${qCount}`);
  console.log('\n[migrate] done.');
}

main().catch((err) => {
  console.error('[migrate] error:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
