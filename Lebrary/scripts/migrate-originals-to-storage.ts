// One-time migration: uploads every file in public/books/ to the Supabase
// Storage bucket `books` and updates lebrary_books.original_file_path from
// "/books/<name>" to just "<name>" (the storage object key).
//
// Usage: npm run migrate:storage
// Safe to re-run — uses upsert on the bucket and compares before updating rows.

import 'dotenv/config';
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { getSupabaseAdmin } from './lib/supabase-admin.js';

const BUCKET = 'books';
const ORIGINALS_DIR = 'public/books';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.epub': 'application/epub+zip',
  '.mobi': 'application/x-mobipocket-ebook',
  '.azw3': 'application/vnd.amazon.ebook',
};

/** Supabase Storage keys must be ASCII — strip diacritics from the filename. */
function sanitizeStorageKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-() +]/g, '_');
}

async function main() {
  const sb = getSupabaseAdmin();
  const dir = resolve(process.cwd(), ORIGINALS_DIR);

  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    console.log(`[storage] nothing to upload — ${ORIGINALS_DIR} not found.`);
    return;
  }

  const uploadable = files.filter((f) => MIME_BY_EXT[extname(f).toLowerCase()]);
  console.log(`[storage] ${uploadable.length} files to upload into bucket "${BUCKET}"`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const name of uploadable) {
    const full = join(dir, name);
    const mime = MIME_BY_EXT[extname(name).toLowerCase()];
    const key = sanitizeStorageKey(name);
    try {
      const buf = await readFile(full);
      const st = await stat(full);
      const { error } = await sb.storage.from(BUCKET).upload(key, buf, {
        contentType: mime,
        upsert: true,
      });
      if (error) {
        console.warn(`  [fail] ${name} — ${error.message}`);
        failed++;
        continue;
      }
      console.log(`  [ok]   ${name} (${(st.size / 1024).toFixed(0)} KB)`);
      uploaded++;
    } catch (err) {
      console.warn(`  [fail] ${name} —`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  // Update DB paths from "/books/<name>" to "<name>" so the frontend resolves
  // via Storage.getPublicUrl().
  const { data: books, error: listErr } = await sb
    .from('lebrary_books')
    .select('id, original_file_path');
  if (listErr) throw new Error(`Listing books failed: ${listErr.message}`);

  let pathsUpdated = 0;
  for (const book of books ?? []) {
    if (!book.original_file_path) continue;
    const newPath = sanitizeStorageKey(basename(book.original_file_path));
    if (newPath === book.original_file_path) {
      skipped++;
      continue;
    }
    const { error: updErr } = await sb
      .from('lebrary_books')
      .update({ original_file_path: newPath })
      .eq('id', book.id);
    if (updErr) {
      console.warn(`  [fail] updating path for ${book.id}: ${updErr.message}`);
      failed++;
    } else {
      pathsUpdated++;
    }
  }

  console.log(
    `\n[storage] done. uploaded=${uploaded} fail=${failed} path-updates=${pathsUpdated} path-skipped=${skipped}`,
  );
}

main().catch((err) => {
  console.error('[storage] fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
