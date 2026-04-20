import { supabase } from '../../../lib/supabase';

/**
 * Personalised category memory. Every time the user re-categorises an
 * imported transaction, we store a normalised pattern → category mapping.
 * Future imports consult this memory BEFORE calling Gemini (exact match)
 * and pass the top-N as few-shot examples in the system prompt.
 */

export interface MemoryEntry {
  description_pattern: string;
  category: string;
  type: 'income' | 'expense';
  hits: number;
}

/**
 * Normalise a raw transaction description into a stable pattern key.
 * Strips digits, long IDs, punctuation, dates, and collapses whitespace —
 * so "UBER TRIP 2342 2025-11-04" and "UBER TRIP 9918 2025-12-10" collapse
 * to the same pattern "UBER TRIP".
 */
export function normalisePattern(description: string): string {
  if (!description) return '';
  return description
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g, ' ')        // iso dates
    .replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, ' ')      // dmy/mdy dates
    .replace(/\b\d{4,}\b/g, ' ')                         // long numeric ids
    .replace(/[^A-Z0-9 &]/g, ' ')                        // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchCategoryMemory(
  userId: string,
  limit = 50,
): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('Finanzas_category_memory')
    .select('description_pattern, category, type, hits')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[category-memory] fetch failed:', error.message);
    return [];
  }
  return (data ?? []) as MemoryEntry[];
}

/**
 * Upserts a correction. Increments `hits` if the pattern already exists,
 * otherwise inserts a new row. No-op when the normalised pattern is empty.
 */
export async function rememberCategory(
  userId: string,
  description: string,
  category: string,
  type: 'income' | 'expense',
): Promise<void> {
  const pattern = normalisePattern(description);
  if (!pattern) return;

  const { data: existing } = await supabase
    .from('Finanzas_category_memory')
    .select('id, hits')
    .eq('user_id', userId)
    .eq('description_pattern', pattern)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('Finanzas_category_memory')
      .update({ category, type, hits: (existing.hits ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('Finanzas_category_memory').insert({
      user_id: userId,
      description_pattern: pattern,
      category,
      type,
      hits: 1,
    });
  }
}

/**
 * Exact-match lookup against the memory set. Returns the entry if found.
 */
export function matchFromMemory(
  description: string,
  memory: MemoryEntry[],
): MemoryEntry | null {
  const pattern = normalisePattern(description);
  if (!pattern) return null;
  return memory.find(m => m.description_pattern === pattern) ?? null;
}
