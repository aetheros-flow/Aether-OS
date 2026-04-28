import 'dotenv/config';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const MAX_BODY = 2 * 1024 * 1024;
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACKS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash'];

interface ChatBody {
  bookId?: string;
  chapterId?: string;
  message?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  accessToken?: string;
  language?: 'en' | 'es';
}

/**
 * Dev-only Vite middleware that proxies chat requests to Gemini. Accepts the
 * authenticated user's JWT, looks up the chapter content + their highlights,
 * builds a contextual system prompt and streams back the reply.
 *
 * For production you'd replace this with a Netlify Function or Supabase Edge
 * Function; the frontend contract is identical.
 */
export function chatApiPlugin(): Plugin {
  return {
    name: 'lebrary-chat-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          next();
          return;
        }
        try {
          const body = (await readJsonBody(req)) as ChatBody;
          const message = typeof body.message === 'string' ? body.message.trim() : '';
          const bookId = typeof body.bookId === 'string' ? body.bookId : '';
          const chapterId = typeof body.chapterId === 'string' ? body.chapterId : '';
          const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
          const language = body.language === 'es' ? 'es' : 'en';
          const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

          if (!message || !bookId || !chapterId) {
            return respond(res, 400, { error: 'message, bookId and chapterId are required.' });
          }
          if (!accessToken) {
            return respond(res, 401, { error: 'Missing auth token.' });
          }

          const supabaseUrl = process.env.VITE_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const geminiKey = process.env.GEMINI_API_KEY;
          if (!supabaseUrl || !serviceKey || !geminiKey) {
            return respond(res, 500, { error: 'Server missing Supabase or Gemini credentials.' });
          }

          // Verify user from the access token (so highlights are theirs).
          const userClient = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          });
          const { data: userRes, error: userErr } = await userClient.auth.getUser(accessToken);
          if (userErr || !userRes.user) {
            return respond(res, 401, { error: 'Invalid session.' });
          }
          const userId = userRes.user.id;

          // Load chapter content and user highlights via service-role client.
          const svc = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const [bookRes, chapterRes, hlRes] = await Promise.all([
            svc.from('lebrary_books').select('title_en, title_es').eq('id', bookId).maybeSingle(),
            svc
              .from('lebrary_chapters')
              .select('title_en, title_es, content_en, content_es, key_ideas, "order"')
              .eq('id', chapterId)
              .maybeSingle(),
            svc
              .from('lebrary_highlights')
              .select('text, note')
              .eq('user_id', userId)
              .eq('chapter_id', chapterId)
              .order('created_at', { ascending: true }),
          ]);

          if (chapterRes.error || !chapterRes.data) {
            return respond(res, 404, { error: 'Chapter not found.' });
          }

          const systemPrompt = buildSystemPrompt({
            bookTitle:
              language === 'es'
                ? (bookRes.data?.title_es ?? bookRes.data?.title_en ?? 'this book')
                : (bookRes.data?.title_en ?? bookRes.data?.title_es ?? 'this book'),
            chapterTitle:
              language === 'es'
                ? (chapterRes.data.title_es ?? chapterRes.data.title_en ?? '')
                : (chapterRes.data.title_en ?? chapterRes.data.title_es ?? ''),
            chapterOrder: chapterRes.data.order,
            chapterContent:
              language === 'es'
                ? (chapterRes.data.content_es ?? chapterRes.data.content_en ?? '')
                : (chapterRes.data.content_en ?? chapterRes.data.content_es ?? ''),
            highlights: (hlRes.data ?? []).map((h) => ({ text: h.text, note: h.note ?? '' })),
            language,
          });

          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const contents = [
            ...history.map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }],
            })),
            { role: 'user' as const, parts: [{ text: message }] },
          ];

          const models = [DEFAULT_MODEL, ...FALLBACKS];
          let replyText = '';
          let lastErr: unknown;
          for (const model of models) {
            try {
              const r = await ai.models.generateContent({
                model,
                contents,
                config: {
                  systemInstruction: systemPrompt,
                  temperature: 0.6,
                  maxOutputTokens: 1500,
                },
              });
              if (r.text) {
                replyText = r.text;
                break;
              }
            } catch (err) {
              lastErr = err;
            }
          }

          if (!replyText) {
            return respond(res, 502, {
              error: `Gemini call failed: ${lastErr instanceof Error ? lastErr.message : 'unknown'}`,
            });
          }

          return respond(res, 200, { reply: replyText });
        } catch (err) {
          console.error('[chat-api] error:', err);
          return respond(res, 500, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    },
  };
}

interface PromptContext {
  bookTitle: string;
  chapterTitle: string;
  chapterOrder: number;
  chapterContent: string;
  highlights: Array<{ text: string; note: string }>;
  language: 'en' | 'es';
}

function buildSystemPrompt(ctx: PromptContext): string {
  const highlightsSection = ctx.highlights.length
    ? `\n\nPassages the reader marked as meaningful in this chapter:\n` +
      ctx.highlights
        .map((h, i) => `${i + 1}. "${h.text}"${h.note ? `\n   Their note: ${h.note}` : ''}`)
        .join('\n')
    : '';

  const langDirective =
    ctx.language === 'es'
      ? 'Respondé en español neutro, con un tono cálido pero preciso.'
      : 'Respond in English, warm but precise.';

  return (
    `You are Lumina, an AI reading companion embedded in a deep-reading app.
The reader is currently on chapter ${ctx.chapterOrder} ("${ctx.chapterTitle}") of "${ctx.bookTitle}".

Your job is to help them think about this chapter — not summarise it. Answer their questions, ` +
    `point to connections with earlier chapters they've read, propose analogies, and challenge ` +
    `them when their reading might be too quick. Keep replies short (2–5 short paragraphs unless ` +
    `they ask for more). Quote passages when you reference them.

${langDirective}

Full curated chapter content (ground truth — do not contradict):
---
${ctx.chapterContent}
---${highlightsSection}`
  );
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY) {
        rejectBody(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch (e) {
        rejectBody(e);
      }
    });
    req.on('error', rejectBody);
  });
}

function respond(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
