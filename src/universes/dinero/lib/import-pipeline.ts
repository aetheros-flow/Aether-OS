// ── AI-powered import pipeline ──────────────────────────────────────────────
// Two-phase: analyze (parse + categorize + dedupe) → commit (insert + remember).
// The preview UI sits between the two phases so the user can audit/fix before
// writing to the DB.
//
// Data flow:
//   file ──► parseFile ──► autoCategorize (rule-based fallback)
//                    ──► memory lookup per row ──► remaining go to Gemini
//                    ──► merge: file > memory > AI > fallback
//                    ──► dedupe against existing transactions
//                    ──► PreparedRow[] (the preview payload)
//
//   user edits categories / toggles duplicate-skip in PreviewSheet
//
//   commitImport ──► supabase insert ──► rememberCategory for overrides

import { supabase } from '../../../lib/supabase';
import { parseFile, autoCategorize } from './dinero-io';
import { categorizeTransactions } from '../../../lib/ai-service';
import { CANONICAL_CATEGORIES } from './category-icons';
import {
  fetchCategoryMemory,
  matchFromMemory,
  rememberCategory,
  type MemoryEntry,
} from './category-memory';
import type { Category, Transaction } from '../types';

export type RowSource = 'file' | 'memory' | 'ai' | 'fallback';

export interface PreparedRow {
  /** Local temp key used in the preview UI. */
  key: string;
  /** ISO date string. */
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  /** What the AI *initially* suggested (for detecting user overrides on commit). */
  originalCategory: string;
  /** Which pipeline stage assigned the category. */
  source: RowSource;
  /** AI confidence 0-1 when source === 'ai', otherwise null. */
  confidence: number | null;
  /** True if this row matches an existing transaction (same date + amount + normalized description). */
  isDuplicate: boolean;
  /** User's choice to include this row on commit. Starts true, auto-false for duplicates. */
  selected: boolean;
}

export interface AnalysisResult {
  rows: PreparedRow[];
  counts: {
    total: number;
    fromFile: number;
    fromMemory: number;
    fromAI: number;
    fromFallback: number;
    duplicates: number;
  };
  /** If the AI call failed gracefully we bubble a soft warning for the UI. */
  aiWarning: string | null;
}

// ── Deduplication key ────────────────────────────────────────────────────────
function dedupeKey(date: string, amount: number, description: string): string {
  const dateOnly = date.slice(0, 10);
  const cents = Math.round(amount * 100);
  const desc = description.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
  return `${dateOnly}|${cents}|${desc}`;
}

// ── Phase 1: analyze ─────────────────────────────────────────────────────────
export async function analyzeImport(params: {
  file: File;
  userId: string;
  categories: Category[];
  /** Recent transactions to dedupe against. Pass the user's current list. */
  existingTransactions: Array<Pick<Transaction, 'date' | 'amount' | 'description' | 'type'>>;
}): Promise<AnalysisResult> {
  const { file, userId, categories, existingTransactions } = params;

  // 1. Parse
  const rawRecords = await parseFile(file);
  if (rawRecords.length === 0) {
    throw new Error('No readable transactions found in the file.');
  }

  // 2. Rule-based fallback (guarantees every row has a category)
  const fallbackRows = autoCategorize(rawRecords, categories) as Array<{
    amount: number; type: 'income' | 'expense'; date: string; description: string;
    suggestedCategory: string; category?: string;
  }>;

  // 3. Memory
  const memory: MemoryEntry[] = await fetchCategoryMemory(userId, 100);

  // 4. Build allowed-category universe
  const allowed = Array.from(new Set([
    ...CANONICAL_CATEGORIES,
    ...categories.map(c => c.name),
  ]));

  // 5. Decide per row which source to use
  const prepared: PreparedRow[] = rawRecords.map((r, i) => ({
    key: `row-${i}-${Date.now()}`,
    date: r.date,
    description: r.description,
    amount: r.amount,
    type: r.type,
    category: '',
    originalCategory: '',
    source: 'fallback' as RowSource,
    confidence: null,
    isDuplicate: false,
    selected: true,
  }));

  const needsAI: number[] = [];
  let fromFile = 0, fromMemory = 0, fromAI = 0, fromFallback = 0;

  rawRecords.forEach((r, i) => {
    // Source priority: explicit file category → memory → AI → fallback
    if (r.category && r.category !== 'General' && allowed.includes(r.category)) {
      prepared[i].category = r.category;
      prepared[i].originalCategory = r.category;
      prepared[i].source = 'file';
      fromFile++;
      return;
    }
    const mem = matchFromMemory(r.description, memory);
    if (mem && allowed.includes(mem.category)) {
      prepared[i].category = mem.category;
      prepared[i].originalCategory = mem.category;
      prepared[i].type = mem.type;
      prepared[i].source = 'memory';
      fromMemory++;
      return;
    }
    needsAI.push(i);
  });

  // 6. AI call for remaining
  let aiWarning: string | null = null;
  if (needsAI.length > 0) {
    try {
      const aiResults = await categorizeTransactions(
        needsAI.map(i => ({
          description: rawRecords[i].description,
          amount: rawRecords[i].amount,
          date: rawRecords[i].date,
        })),
        allowed,
        memory.slice(0, 40).map(m => ({
          description_pattern: m.description_pattern,
          category: m.category,
          type: m.type,
        })),
      );
      aiResults.forEach((res, k) => {
        const i = needsAI[k];
        const useAI = res.confidence >= 0.4;
        if (useAI) {
          prepared[i].category = res.category;
          prepared[i].originalCategory = res.category;
          prepared[i].type = res.type;
          prepared[i].source = 'ai';
          prepared[i].confidence = res.confidence;
          fromAI++;
        } else {
          prepared[i].category = fallbackRows[i].suggestedCategory;
          prepared[i].originalCategory = fallbackRows[i].suggestedCategory;
          prepared[i].type = fallbackRows[i].type;
          prepared[i].source = 'fallback';
          prepared[i].confidence = res.confidence;
          fromFallback++;
        }
      });
    } catch (err) {
      console.warn('[analyzeImport] AI failed, using fallback:', err);
      aiWarning = 'AI service unavailable — using rule-based categories. Review each row.';
      needsAI.forEach(i => {
        prepared[i].category = fallbackRows[i].suggestedCategory;
        prepared[i].originalCategory = fallbackRows[i].suggestedCategory;
        prepared[i].type = fallbackRows[i].type;
        prepared[i].source = 'fallback';
        fromFallback++;
      });
    }
  }

  // 7. Dedupe against existing
  const existingKeys = new Set(
    existingTransactions.map(t =>
      dedupeKey(String(t.date), Number(t.amount), String(t.description ?? '')),
    ),
  );
  let duplicates = 0;
  prepared.forEach(p => {
    if (existingKeys.has(dedupeKey(p.date, p.amount, p.description))) {
      p.isDuplicate = true;
      p.selected = false;
      duplicates++;
    }
  });

  return {
    rows: prepared,
    counts: {
      total: prepared.length,
      fromFile, fromMemory, fromAI, fromFallback,
      duplicates,
    },
    aiWarning,
  };
}

// ── Phase 2: commit ──────────────────────────────────────────────────────────
export async function commitImport(params: {
  rows: PreparedRow[];
  userId: string;
  accountId: string;
  /** Whether to remember user overrides (category changes) for future imports. */
  rememberOverrides?: boolean;
}): Promise<{ inserted: number; remembered: number }> {
  const { rows, userId, accountId, rememberOverrides = true } = params;

  const kept = rows.filter(r => r.selected);
  if (kept.length === 0) {
    return { inserted: 0, remembered: 0 };
  }

  const records = kept.map(r => ({
    user_id: userId,
    account_id: accountId,
    amount: r.amount,
    type: r.type,
    date: r.date,
    description: r.description,
    category: r.category,
  }));

  const { error } = await supabase.from('Finanzas_transactions').insert(records);
  if (error) throw error;

  // Persist user overrides → memory, so future imports auto-apply the correction.
  let remembered = 0;
  if (rememberOverrides) {
    const overridden = kept.filter(r =>
      r.category && r.originalCategory && r.category !== r.originalCategory,
    );
    await Promise.all(
      overridden.map(r =>
        rememberCategory(userId, r.description, r.category, r.type)
          .then(() => { remembered++; })
          .catch(err => console.warn('[rememberCategory] failed:', err)),
      ),
    );
  }

  return { inserted: kept.length, remembered };
}
