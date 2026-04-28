import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  buildDuplicateCheckPrompt,
  buildIngestPrompt,
  buildWebIngestPrompt,
} from './prompt.js';

export interface GeneratedBook {
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  originalLanguage: 'en' | 'es';
  publicationYear?: number;
  genre: string[];
  bookType: 'narrative' | 'concept-dense' | 'reference' | 'short-direct';
  author: {
    name: string;
    bioEn: string;
    bioEs: string;
    accomplishments: { en: string; es: string }[];
    birthYear?: number;
    deathYear?: number;
    nationality?: string;
  };
  chapters: Array<{
    order: number;
    titleEn: string;
    titleEs: string;
    keyIdeasEn: string[];
    keyIdeasEs: string[];
    contentEn: string;
    contentEs: string;
    estimatedReadingMinutes: number;
  }>;
  quiz: Array<{
    chapterOrder: number;
    difficulty: 'medium' | 'hard';
    questionEn: string;
    questionEs: string;
    optionsEn: [string, string, string, string];
    optionsEs: [string, string, string, string];
    correctOption: number;
    explanationEn: string;
    explanationEs: string;
  }>;
}

interface GenerateOptions {
  apiKey: string;
  model?: string;
  fallbackModels?: string[];
  filenameHint?: string;
  maxChars?: number;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_FALLBACKS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash'];
const DEFAULT_MAX_CHARS = 1_500_000;
const DEBUG_DIR = 'scripts/.debug';

export async function generateBookFromText(
  bookText: string,
  opts: GenerateOptions,
): Promise<GeneratedBook> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const primary = opts.model ?? DEFAULT_MODEL;
  const fallbacks = opts.fallbackModels ?? DEFAULT_FALLBACKS;
  const models = [primary, ...fallbacks.filter((m) => m !== primary)];
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;

  let text = bookText;
  if (text.length > maxChars) {
    console.warn(
      `[gemini] book text ${text.length.toLocaleString()} chars exceeds limit ${maxChars.toLocaleString()}; truncating.`,
    );
    text = text.slice(0, maxChars);
  }

  const prompt = buildIngestPrompt({ bookText: text, filenameHint: opts.filenameHint });

  let lastError: unknown;
  for (const model of models) {
    try {
      console.log(`[gemini] trying model: ${model}`);
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            // Google Search grounding lets Gemini verify facts against the live web.
            // Incompatible with responseMimeType:'application/json' — we parse manually.
            tools: [{ googleSearch: {} }],
            temperature: 0.4,
            // Max for Gemini 2.5 Flash family is 65536. Leaving headroom for big books.
            maxOutputTokens: 65_000,
          },
        }),
      );

      const raw = response.text;
      if (!raw) {
        lastError = new Error('Empty response text from Gemini.');
        continue;
      }

      const parsed = await tryParseBookJson(raw, opts.filenameHint);
      if (parsed) return parsed;
      lastError = new Error('Gemini response was not parseable JSON after cleanup.');
    } catch (err) {
      lastError = err;
      const status = extractStatus(err);
      console.warn(`[gemini] model ${model} failed${status ? ` (HTTP ${status})` : ''}; trying next…`);
    }
  }

  throw lastError ?? new Error('All Gemini models failed without an error.');
}

async function tryParseBookJson(raw: string, filenameHint?: string): Promise<GeneratedBook | null> {
  // Strip markdown fences if present.
  const cleaned = stripJsonFencing(raw).trim();

  // Fast path: direct parse.
  try {
    return JSON.parse(cleaned) as GeneratedBook;
  } catch {
    // fall through
  }

  // Recovery path: find the outermost balanced `{...}` and try to parse.
  const candidates = extractJsonCandidates(cleaned);
  for (const cand of candidates) {
    try {
      return JSON.parse(cand) as GeneratedBook;
    } catch {
      // try next candidate
    }
  }

  // Truncation recovery: trim to last closing `}` in a chapter/quiz and rebuild tail.
  const repaired = tryRepairTruncatedJson(cleaned);
  if (repaired) {
    try {
      return JSON.parse(repaired) as GeneratedBook;
    } catch {
      // give up
    }
  }

  // Persist the raw response for inspection.
  await dumpFailedResponse(raw, filenameHint);
  return null;
}

function extractJsonCandidates(input: string): string[] {
  const out: string[] = [];
  const start = input.indexOf('{');
  if (start < 0) return out;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        out.push(input.slice(start, i + 1));
      }
    }
  }

  // Largest (outermost) first.
  out.sort((a, b) => b.length - a.length);
  return out;
}

function tryRepairTruncatedJson(input: string): string | null {
  // Find the last syntactically valid chapter or quiz entry and close the JSON shape.
  // Strategy: walk forward tracking depth; remember the last position at depth=1
  // immediately after a `}` (i.e. an object ended inside the top-level object).
  // Then trim to that position and append closing brackets/braces.
  const start = input.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let lastSafeEnd = -1; // index of closing brace that left us at depth 1
  let inChapters = false;
  let inQuiz = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 1 && (inChapters || inQuiz)) {
        lastSafeEnd = i;
      }
    } else if (ch === '[') {
      // detect which array we are entering by looking back
      const before = input.slice(Math.max(0, i - 20), i);
      if (/"chapters"\s*:\s*$/.test(before)) inChapters = true;
      else if (/"quiz"\s*:\s*$/.test(before)) inQuiz = true;
      depth++;
    } else if (ch === ']') {
      if (inChapters && depth === 2) inChapters = false;
      if (inQuiz && depth === 2) inQuiz = false;
      depth--;
    }
  }

  if (lastSafeEnd < 0) return null;

  // Rebuild: keep everything up to lastSafeEnd+1, close the array, close the object.
  const body = input.slice(start, lastSafeEnd + 1);
  const suffix = inQuiz || /"quiz"/.test(body.slice(-2000))
    ? ']}'
    : body.includes('"quiz"')
      ? ']}'
      : '],"quiz":[]}'; // no quiz array yet — append empty
  return body + suffix;
}

async function dumpFailedResponse(raw: string, hint?: string): Promise<void> {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = (hint ?? 'response').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 60);
    const file = resolve(process.cwd(), DEBUG_DIR, `${stamp}_${name}.txt`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, raw, 'utf8');
    console.warn(`[gemini] raw (unparseable) response saved to ${file}`);
  } catch (err) {
    console.warn('[gemini] could not persist failed response:', err);
  }
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = extractStatus(err);
      const isLast = attempt === maxAttempts;
      if (isLast || (status != null && !RETRYABLE_STATUS.has(status))) {
        throw err;
      }
      const delayMs = Math.min(30_000, 2_000 * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 500);
      const totalDelay = delayMs + jitter;
      console.warn(
        `[gemini] attempt ${attempt}/${maxAttempts} failed${status ? ` (HTTP ${status})` : ''}; retrying in ${(totalDelay / 1000).toFixed(1)}s…`,
      );
      await sleep(totalDelay);
    }
  }
  throw lastError;
}

function extractStatus(err: unknown): number | undefined {
  if (!err) return undefined;
  const message = err instanceof Error ? err.message : String(err);
  const match = message.match(/"code"\s*:\s*(\d{3})/);
  if (match) return Number(match[1]);
  const anyErr = err as { status?: number; code?: number };
  if (typeof anyErr.status === 'number') return anyErr.status;
  if (typeof anyErr.code === 'number') return anyErr.code;
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ────────────────────────────────────────────────────────────────────────
// Web ingest — same output as file ingest, but the source is a query string.
// ────────────────────────────────────────────────────────────────────────

interface GenerateFromWebOptions {
  apiKey: string;
  model?: string;
  fallbackModels?: string[];
}

export async function generateBookFromWebQuery(
  query: string,
  opts: GenerateFromWebOptions,
): Promise<GeneratedBook> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const primary = opts.model ?? DEFAULT_MODEL;
  const fallbacks = opts.fallbackModels ?? DEFAULT_FALLBACKS;
  const models = [primary, ...fallbacks.filter((m) => m !== primary)];

  const prompt = buildWebIngestPrompt({ query });
  let lastError: unknown;
  let raw: string | undefined;

  for (const model of models) {
    try {
      console.log(`[gemini] web-ingest trying model: ${model}`);
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.4,
            maxOutputTokens: 65_000,
          },
        }),
      );
      raw = response.text;
      if (raw) break;
    } catch (err) {
      lastError = err;
      const status = extractStatus(err);
      console.warn(`[gemini] web-ingest model ${model} failed${status ? ` (HTTP ${status})` : ''}; trying next…`);
    }
  }
  if (!raw) throw lastError ?? new Error('All models failed on web ingest.');

  // Handle the special "error: unknown-book" response.
  const cleaned = stripJsonFencing(raw).trim();
  if (/^\{\s*"error"/.test(cleaned)) {
    try {
      const errJson = JSON.parse(cleaned) as { error: string; reason?: string };
      throw new Error(
        errJson.error === 'unknown-book'
          ? `Couldn't identify that book. ${errJson.reason ?? 'Try adding the author name or a more specific title.'}`
          : `Gemini returned error: ${errJson.error}`,
      );
    } catch {
      // fall through to normal parse
    }
  }

  const parsed = await tryParseBookJson(raw, `web-${slug(query)}`);
  if (!parsed) throw new Error('Gemini response was not parseable JSON after cleanup.');
  return parsed;
}

// ────────────────────────────────────────────────────────────────────────
// Duplicate check — LLM call that handles cross-language matches.
// ────────────────────────────────────────────────────────────────────────

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  bookId: string | null;
  confidence: number;
  explanation: string;
}

interface DuplicateCheckOptions {
  apiKey: string;
  model?: string;
}

export async function checkBookDuplicateViaGemini(
  query: string,
  existingBooks: Array<{ id: string; titleEn: string; titleEs?: string; authorName: string }>,
  opts: DuplicateCheckOptions,
): Promise<DuplicateCheckResult> {
  if (existingBooks.length === 0) {
    return { isDuplicate: false, bookId: null, confidence: 0, explanation: 'Library is empty.' };
  }

  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  // Flash-lite is perfect for this — small prompt, structured JSON output.
  const model = opts.model ?? 'gemini-2.5-flash-lite';
  const prompt = buildDuplicateCheckPrompt({ query, existingBooks });

  try {
    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0,
          maxOutputTokens: 500,
        },
      }),
    );
    const raw = response.text;
    if (!raw) throw new Error('Empty response on duplicate check.');
    const cleaned = stripJsonFencing(raw).trim();
    const parsed = JSON.parse(cleaned) as DuplicateCheckResult;
    // Minimal validation.
    return {
      isDuplicate: Boolean(parsed.isDuplicate),
      bookId: parsed.bookId && existingBooks.some((b) => b.id === parsed.bookId) ? parsed.bookId : null,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    };
  } catch (err) {
    console.warn('[gemini] duplicate check failed — defaulting to no-dup:', err instanceof Error ? err.message : err);
    // If the check fails, err on the side of letting the import proceed.
    return { isDuplicate: false, bookId: null, confidence: 0, explanation: '' };
  }
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60);
}

function stripJsonFencing(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('```')) {
    const firstLineEnd = trimmed.indexOf('\n');
    const withoutOpen = firstLineEnd >= 0 ? trimmed.slice(firstLineEnd + 1) : trimmed;
    const lastFence = withoutOpen.lastIndexOf('```');
    return lastFence >= 0 ? withoutOpen.slice(0, lastFence) : withoutOpen;
  }
  return trimmed;
}
