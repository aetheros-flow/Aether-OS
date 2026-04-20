import { supabase } from './supabase';

/**
 * Thin client for the `gemini-proxy` edge function.
 *
 * The Gemini API key is NEVER present in the browser. All calls route through
 * the deployed Supabase edge function, which injects the server-side key.
 */

export interface GeminiRequest {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: 'text/plain' | 'application/json';
  model?: string;
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  raw: unknown;
}

export async function callGemini(req: GeminiRequest): Promise<GeminiResponse> {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', { body: req });
  if (error) throw new Error(error.message || 'Gemini proxy error');
  if (!data || typeof data.text !== 'string') {
    throw new Error('Gemini proxy returned unexpected payload.');
  }
  return data as GeminiResponse;
}

// ─── Auto-categorization ─────────────────────────────────────────────────────

export interface CategorizableTxn {
  id?: string;
  description: string;
  amount: number;
  date?: string;
}

export interface CategorizedTxn extends CategorizableTxn {
  category: string;
  type: 'income' | 'expense';
  confidence: number;
}

/**
 * Send a batch of imported transactions to Gemini and receive back a structured
 * list with inferred category + income/expense classification.
 *
 * Gemini is asked to only pick from `allowedCategories` so the output integrates
 * cleanly with the existing category system.
 */
export interface CategoryExample {
  description_pattern: string;
  category: string;
  type: 'income' | 'expense';
}

export async function categorizeTransactions(
  txns: CategorizableTxn[],
  allowedCategories: string[],
  examples: CategoryExample[] = [],
): Promise<CategorizedTxn[]> {
  if (txns.length === 0) return [];

  const baseSystem = [
    'You are a personal finance classifier.',
    'You receive a list of raw bank/credit-card transactions and must assign each one:',
    '  - "category": MUST be one of the allowed categories exactly.',
    '  - "type": either "income" or "expense", inferred from sign/context.',
    '  - "confidence": a number 0.0-1.0 reflecting how sure you are.',
    'Return ONLY valid JSON matching this TypeScript type:',
    '{ "results": Array<{ "index": number, "category": string, "type": "income"|"expense", "confidence": number }> }',
    'Do not include explanations, commentary, or any text outside the JSON.',
  ].join(' ');

  // If the user has previously corrected similar transactions, inject those
  // mappings as few-shot examples so the model follows their conventions.
  const examplesBlock = examples.length
    ? '\n\nThe user has previously corrected these patterns — follow the same mapping when descriptions contain these tokens (case-insensitive):\n' +
      examples.slice(0, 40)
        .map(e => `- "${e.description_pattern}" → ${e.category} (${e.type})`)
        .join('\n')
    : '';

  const system = baseSystem + examplesBlock;

  const prompt = JSON.stringify({
    allowedCategories,
    transactions: txns.map((t, i) => ({ index: i, description: t.description, amount: t.amount, date: t.date })),
  });

  const { text } = await callGemini({
    prompt,
    systemInstruction: system,
    responseMimeType: 'application/json',
    temperature: 0.1,
  });

  let parsed: any;
  try { parsed = JSON.parse(text); } catch {
    throw new Error('Gemini returned non-JSON in categorization response.');
  }
  const results = Array.isArray(parsed?.results) ? parsed.results : [];

  return txns.map((t, i) => {
    const match = results.find((r: any) => r.index === i);
    const category = allowedCategories.includes(match?.category) ? match.category : 'General';
    const type: 'income' | 'expense' = match?.type === 'income' ? 'income' : 'expense';
    const confidence = Number.isFinite(match?.confidence) ? Math.max(0, Math.min(1, match.confidence)) : 0;
    return { ...t, category, type, confidence };
  });
}

// ─── Generic insight ─────────────────────────────────────────────────────────

export async function askInsight(context: string, question: string): Promise<string> {
  const { text } = await callGemini({
    prompt: `Context:\n${context}\n\nQuestion: ${question}`,
    systemInstruction: 'You are a concise personal-finance assistant. Reply in one paragraph, max 60 words. Use plain language, no markdown.',
    temperature: 0.3,
  });
  return text.trim();
}
