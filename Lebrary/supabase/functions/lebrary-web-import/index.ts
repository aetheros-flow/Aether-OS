// Supabase Edge Function: import for Lebrary (handles both web query AND file upload).
//
// Despite the legacy name ("web-import"), this function handles two sources:
//   A) Web query  → body: { webQuery: string, force?: boolean }
//   B) File upload → body: { filename: string, text: string, force?: boolean }
//
// Flow:
//   1. Verify user via supabase-js auth.getUser() (handles ES256 + HS256 JWTs).
//   2. Dup-check (web only): ask Gemini if the query matches an existing book.
//   3. Call Gemini with the right prompt (text-based vs query-based).
//   4. Upsert author + book + chapters + quiz into lebrary_* tables.
//
// Memory note: we intentionally call Gemini via plain fetch() to the REST API
// instead of `npm:@google/genai`. The SDK pulls ~30 MB of transitive deps which
// pushes the Deno worker over the free-tier memory limit (WORKER_RESOURCE_LIMIT).
// Direct fetch stays well under the cap.
//
// REQUIRED SECRETS (Supabase dashboard → Edge Functions → Secrets):
//   GEMINI_API_KEY               — Google AI Studio key
//
// AUTO-PROVIDED by Supabase runtime:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────

interface GeneratedBook {
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
    accomplishments: Array<{ en: string; es: string }>;
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

interface DuplicateCheckResult {
  isDuplicate: boolean;
  bookId: string | null;
  confidence: number;
  explanation: string;
}

interface ExistingBook {
  id: string;
  titleEn: string;
  titleEs?: string;
  authorName: string;
}

// ─── CORS ─────────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// ─── Caps (conservative, Edge Function free tier = 150 MB) ───────────────

const MAX_TEXT_CHARS = 600_000; // ~150k tokens input
const MAX_OUTPUT_TOKENS = 32_000;
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

// ─── Entry ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  console.log(`[import] ${req.method} ${new URL(req.url).pathname}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  console.log('[import] env check:', {
    hasGemini: Boolean(GEMINI_API_KEY),
    hasSupabaseUrl: Boolean(SUPABASE_URL),
    hasServiceKey: Boolean(SERVICE_KEY),
  });

  if (!GEMINI_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
    return jsonResponse(500, {
      error: 'Server missing secrets (GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse(401, { error: 'Missing Authorization header.' });
  }

  const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return jsonResponse(401, { error: 'Invalid or expired session.' });
  }

  let body: { webQuery?: unknown; filename?: unknown; text?: unknown; force?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse(400, { error: 'Body must be valid JSON.' });
  }

  const webQuery = typeof body.webQuery === 'string' ? body.webQuery.trim() : '';
  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  const fileText = typeof body.text === 'string' ? body.text : '';
  const force = Boolean(body.force);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // ── Branch A: file upload ────────────────────────────────────────────
    if (filename && fileText) {
      if (!filename.toLowerCase().endsWith('.txt')) {
        return jsonResponse(400, {
          error: 'Only .txt files are accepted. Convert PDFs/EPUBs with Calibre first.',
        });
      }
      if (fileText.length < 500) {
        return jsonResponse(400, {
          error: 'File looks empty or too short. Expected at least 500 chars.',
        });
      }

      const normalizedText = normalizeText(fileText);
      console.log(`[file-import] filename="${filename}" chars=${normalizedText.length}`);

      const started = Date.now();
      const prompt = buildFileIngestPrompt(normalizedText, filename);
      const generated = await callGeminiForBook(GEMINI_API_KEY, prompt);
      const elapsed = (Date.now() - started) / 1000;

      const { bookId, titleEn, chaptersCount, quizCount } = await persistBook(admin, generated);
      return jsonResponse(200, {
        ok: true,
        status: 'ingested',
        bookId,
        titleEn,
        chapters: chaptersCount,
        quiz: quizCount,
        elapsedSeconds: elapsed,
        source: 'file',
      });
    }

    // ── Branch B: web query ──────────────────────────────────────────────
    if (!webQuery || webQuery.length < 3) {
      return jsonResponse(400, {
        error: 'Provide either `{ webQuery }` (title + author) or `{ filename, text }` (uploaded .txt).',
      });
    }

    if (!force) {
      const existing = await listExistingBooks(admin);
      const dup = await checkDuplicate(GEMINI_API_KEY, webQuery, existing);
      if (dup.isDuplicate && dup.confidence >= 0.65 && dup.bookId) {
        const matched = existing.find((b) => b.id === dup.bookId);
        return jsonResponse(200, {
          ok: true,
          status: 'duplicate',
          bookId: dup.bookId,
          titleEn: matched?.titleEn,
          duplicateReason: dup.explanation || 'This book is already in your library.',
          source: 'web',
        });
      }
    }

    const started = Date.now();
    const prompt = buildWebIngestPrompt(webQuery);
    const generated = await callGeminiForBook(GEMINI_API_KEY, prompt);
    const elapsed = (Date.now() - started) / 1000;

    const { bookId, titleEn, chaptersCount, quizCount } = await persistBook(admin, generated);
    return jsonResponse(200, {
      ok: true,
      status: 'ingested',
      bookId,
      titleEn,
      chapters: chaptersCount,
      quiz: quizCount,
      elapsedSeconds: elapsed,
      source: 'web',
    });
  } catch (err) {
    console.error('[import] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(500, { error: message });
  }
});

// ─── Gemini REST (direct fetch, no SDK) ───────────────────────────────────

interface GeminiRequestBody {
  contents: Array<{ role: 'user'; parts: Array<{ text: string }> }>;
  tools?: Array<{ googleSearch: Record<string, never> }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType?: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { code?: number; message?: string; status?: string };
}

class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'GeminiError';
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  body: GeminiRequestBody,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new GeminiError(res.status, text);
  }
  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(text) as GeminiResponse;
  } catch {
    throw new GeminiError(res.status, `Non-JSON response: ${text.slice(0, 200)}`);
  }
  if (parsed.error) {
    throw new GeminiError(parsed.error.code ?? 500, parsed.error.message ?? 'unknown');
  }
  const replyText = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!replyText) throw new GeminiError(500, 'Empty response from Gemini.');
  return replyText;
}

async function callGeminiForBook(apiKey: string, prompt: string): Promise<GeneratedBook> {
  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[gemini] trying ${model}`);
      const raw = await callGemini(apiKey, model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      const cleaned = stripJsonFencing(raw).trim();

      if (/^\{\s*"error"/.test(cleaned)) {
        const errJson = JSON.parse(cleaned) as { error: string; reason?: string };
        if (errJson.error === 'unknown-book') {
          throw new Error(errJson.reason ?? "Couldn't identify that book.");
        }
      }

      try {
        return JSON.parse(cleaned) as GeneratedBook;
      } catch {
        const candidate = extractOutermostJson(cleaned);
        if (candidate) {
          try {
            return JSON.parse(candidate) as GeneratedBook;
          } catch {
            // fall through
          }
        }
        throw new Error('Gemini response was not parseable JSON after cleanup.');
      }
    } catch (err) {
      lastErr = err;
      const status = err instanceof GeminiError ? err.status : 0;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[gemini] ${model} failed${status ? ` (HTTP ${status})` : ''}: ${msg.slice(0, 300)}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All Gemini models failed.');
}

// ─── Duplicate check ──────────────────────────────────────────────────────

async function checkDuplicate(
  apiKey: string,
  query: string,
  existing: ExistingBook[],
): Promise<DuplicateCheckResult> {
  if (existing.length === 0) {
    return { isDuplicate: false, bookId: null, confidence: 0, explanation: 'Library is empty.' };
  }
  const list = existing
    .map(
      (b, i) =>
        `  ${i + 1}. id="${b.id}" · EN: "${b.titleEn}"${b.titleEs ? ` · ES: "${b.titleEs}"` : ''} · author: ${b.authorName}`,
    )
    .join('\n');

  const prompt = `Decide if the book the user wants to import is ALREADY in their library.

Query: "${query}"

Library contains:
${list}

Match if titles refer to the same work (even across languages) or author matches + title is a variation.

Respond with STRICT JSON:
{
  "isDuplicate": boolean,
  "bookId": string | null,
  "confidence": number (0-1),
  "explanation": string
}`;

  try {
    const raw = await callGemini(apiKey, 'gemini-2.5-flash-lite', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });
    const parsed = JSON.parse(stripJsonFencing(raw).trim()) as DuplicateCheckResult;
    return {
      isDuplicate: Boolean(parsed.isDuplicate),
      bookId: parsed.bookId && existing.some((b) => b.id === parsed.bookId) ? parsed.bookId : null,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    };
  } catch (err) {
    console.warn('[dup-check] failed, defaulting to no-dup:', err instanceof Error ? err.message : err);
    return { isDuplicate: false, bookId: null, confidence: 0, explanation: '' };
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────

const OUTPUT_SHAPE = `{
  "titleEn": string, "titleEs": string,
  "descriptionEn": string, "descriptionEs": string,
  "originalLanguage": "en" | "es",
  "publicationYear": number (optional),
  "genre": string[],
  "bookType": "narrative" | "concept-dense" | "reference" | "short-direct",
  "author": {
    "name": string, "bioEn": string, "bioEs": string,
    "accomplishments": [{"en": string, "es": string}],
    "birthYear": number (optional),
    "deathYear": number (optional),
    "nationality": string (optional)
  },
  "chapters": [{
    "order": number,
    "titleEn": string, "titleEs": string,
    "keyIdeasEn": string[], "keyIdeasEs": string[],
    "contentEn": string, "contentEs": string,
    "estimatedReadingMinutes": number
  }],
  "quiz": [{
    "chapterOrder": number,
    "difficulty": "medium" | "hard",
    "questionEn": string, "questionEs": string,
    "optionsEn": [string, string, string, string],
    "optionsEs": [string, string, string, string],
    "correctOption": number,
    "explanationEn": string, "explanationEs": string
  }]
}`;

const COMMON_RULES = `HARD RULES:
1. Output valid JSON only — no markdown fences, no preamble.
2. Every narrative field in BOTH en and es. Neutral international Spanish.
3. Chapter content is a curated synthesis, NOT a retelling.
4. HARD CAP: 5 to 12 chapters. Group thematically if the source has more.
5. Quiz 8-20 questions, mix of medium and hard.

bookType:
- concept-dense (Kahneman, Frankl): 800-1500 words/ch, 15-20 quiz.
- narrative: 400-700 words/ch, 10-12 quiz.
- reference: 300-500 words/ch, 8-12 quiz.
- short-direct (essays): 300-500 words/ch, 8-10 quiz.`;

function buildFileIngestPrompt(bookText: string, filenameHint: string): string {
  return `You are an expert literary curator building study material for Lumina Library. Given the FULL TEXT of a book, produce a JSON ingest.

${COMMON_RULES}

Use Google Search only if uncertain about factual metadata.

OUTPUT SHAPE:
${OUTPUT_SHAPE}

FILENAME HINT: ${filenameHint}

BOOK TEXT:
<<<BEGIN_BOOK>>>
${bookText}
<<<END_BOOK>>>

Produce the JSON now.`;
}

function buildWebIngestPrompt(query: string): string {
  return `You are an expert literary curator building study material for Lumina Library. The user typed a title/author query WITHOUT providing text. Identify the book, then produce a JSON ingest using your knowledge + Google Search.

${COMMON_RULES}

Extra rules for web mode:
- If the query is ambiguous, pick the most widely-cited edition; mention it in descriptionEn.
- If you cannot identify the book, respond with: {"error": "unknown-book", "reason": "..."} and nothing else.
- Use Google Search to verify publicationYear, author birth/death, nationality.

OUTPUT SHAPE:
${OUTPUT_SHAPE}

USER QUERY: ${query}

Produce the JSON now.`;
}

// ─── Text normalization ──────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

// ─── Supabase persistence ─────────────────────────────────────────────────

async function listExistingBooks(sb: ReturnType<typeof createClient>): Promise<ExistingBook[]> {
  const { data, error } = await sb
    .from('lebrary_books')
    .select('id, title_en, title_es, lebrary_authors(name)');
  if (error) throw new Error(`Listing books failed: ${error.message}`);
  return (data ?? []).map((b: {
    id: string;
    title_en: string | null;
    title_es: string | null;
    lebrary_authors: { name?: string } | Array<{ name?: string }> | null;
  }) => {
    const authorNode = Array.isArray(b.lebrary_authors) ? b.lebrary_authors[0] : b.lebrary_authors;
    return {
      id: b.id,
      titleEn: b.title_en ?? b.id,
      titleEs: b.title_es ?? undefined,
      authorName: authorNode?.name ?? '',
    };
  });
}

async function persistBook(
  admin: ReturnType<typeof createClient>,
  generated: GeneratedBook,
): Promise<{ bookId: string; titleEn: string; chaptersCount: number; quizCount: number }> {
  const authorId = `author-${slugify(generated.author.name)}`;
  const bookId = `book-${slugify(generated.titleEn)}`;

  await admin.from('lebrary_authors').upsert(
    {
      id: authorId,
      name: generated.author.name,
      image: '',
      bio_en: generated.author.bioEn,
      bio_es: generated.author.bioEs,
      accomplishments:
        generated.author.accomplishments.length > 0
          ? generated.author.accomplishments.map((a) => ({ en: a.en, es: a.es }))
          : null,
      birth_year: generated.author.birthYear ?? null,
      death_year: generated.author.deathYear ?? null,
      nationality: generated.author.nationality ?? null,
    },
    { onConflict: 'id' },
  );

  const { error: bookErr } = await admin.from('lebrary_books').upsert(
    {
      id: bookId,
      title_en: generated.titleEn,
      title_es: generated.titleEs,
      author_id: authorId,
      cover_image: '',
      description_en: generated.descriptionEn,
      description_es: generated.descriptionEs,
      original_language: generated.originalLanguage,
      original_file_path: null,
      original_file_format: null,
      original_file_size_bytes: null,
      publication_year: generated.publicationYear ?? null,
      genre: generated.genre && generated.genre.length > 0 ? generated.genre : null,
    },
    { onConflict: 'id' },
  );
  if (bookErr) throw new Error(`Book upsert failed: ${bookErr.message}`);

  await admin.from('lebrary_chapters').delete().eq('book_id', bookId);
  await admin.from('lebrary_quiz_questions').delete().eq('book_id', bookId);

  if (generated.chapters.length > 0) {
    const chapterRows = generated.chapters.map((c) => ({
      id: `${bookId}-ch-${c.order}`,
      book_id: bookId,
      order: c.order,
      title_en: c.titleEn,
      title_es: c.titleEs,
      content_en: c.contentEn,
      content_es: c.contentEs,
      key_ideas: c.keyIdeasEn.map((en, i) => ({ en, es: c.keyIdeasEs[i] ?? en })),
      estimated_reading_minutes: c.estimatedReadingMinutes,
    }));
    const { error: chErr } = await admin.from('lebrary_chapters').insert(chapterRows);
    if (chErr) throw new Error(`Chapter insert failed: ${chErr.message}`);
  }

  if (generated.quiz.length > 0) {
    const chapterIdByOrder = new Map(generated.chapters.map((c) => [c.order, `${bookId}-ch-${c.order}`]));
    const quizRows = generated.quiz.map((q, i) => ({
      id: `${bookId}-q-${i + 1}`,
      book_id: bookId,
      chapter_id: chapterIdByOrder.get(q.chapterOrder) ?? null,
      order: i + 1,
      difficulty: q.difficulty,
      question_en: q.questionEn,
      question_es: q.questionEs,
      options: [0, 1, 2, 3].map((idx) => ({ en: q.optionsEn[idx], es: q.optionsEs[idx] })),
      correct_option: q.correctOption,
      explanation_en: q.explanationEn,
      explanation_es: q.explanationEs,
    }));
    const { error: qErr } = await admin.from('lebrary_quiz_questions').insert(quizRows);
    if (qErr) throw new Error(`Quiz insert failed: ${qErr.message}`);
  }

  return {
    bookId,
    titleEn: generated.titleEn,
    chaptersCount: generated.chapters.length,
    quizCount: generated.quiz.length,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"`’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function stripJsonFencing(input: string): string {
  const t = input.trim();
  if (t.startsWith('```')) {
    const firstLineEnd = t.indexOf('\n');
    const withoutOpen = firstLineEnd >= 0 ? t.slice(firstLineEnd + 1) : t;
    const lastFence = withoutOpen.lastIndexOf('```');
    return lastFence >= 0 ? withoutOpen.slice(0, lastFence) : withoutOpen;
  }
  return t;
}

function extractOutermostJson(input: string): string | null {
  const start = input.indexOf('{');
  if (start < 0) return null;
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
      if (depth === 0) return input.slice(start, i + 1);
    }
  }
  return null;
}
