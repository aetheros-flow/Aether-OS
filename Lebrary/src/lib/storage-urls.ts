import { getSupabase } from '@/lib/supabase';
import type { Book } from '@/types';

const BUCKET = 'books';

/**
 * Resolve a book's original-file path to a URL.
 *
 * Handles three path shapes for backwards-compat:
 *   - "/books/<name>"  → legacy local public folder
 *   - "https://…"      → already absolute (pass through)
 *   - "<name>"         → storage object key → public URL via Supabase
 */
export function resolveOriginalFileUrl(book: Book): string | null {
  const path = book.originalFile?.path;
  if (!path) return null;

  if (/^https?:\/\//.test(path)) return path;

  if (path.startsWith('/')) {
    // Legacy local path. With the files gitignored, this will 404 on Netlify.
    return path;
  }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
