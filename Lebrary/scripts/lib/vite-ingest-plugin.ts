import 'dotenv/config';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { ingestBookFile, ingestBookFromWebQuery } from './ingest.js';
import { deleteBookById } from './persist.js';
import { removeByBookId } from './ingest-log.js';

const BOOKS_TEXT_DIR = 'public/books-text';
const MAX_BODY_BYTES = 20 * 1024 * 1024; // 20 MB guard

interface ImportBody {
  /** File source */
  filename?: unknown;
  text?: unknown;
  /** Web source — free-form query like "Meditations, Marcus Aurelius" */
  webQuery?: unknown;
  force?: unknown;
}

export function ingestApiPlugin(): Plugin {
  return {
    name: 'lumina-ingest-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/books/', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'DELETE') {
          next();
          return;
        }
        try {
          const url = req.url ?? '';
          const bookId = decodeURIComponent(url.replace(/^\/+/, '').split(/[?#]/)[0]).trim();
          if (!bookId) {
            return respond(res, 400, { error: 'Missing book id in URL.' });
          }
          console.log(`[delete-api] removing book: ${bookId}`);
          const result = await deleteBookById(bookId);
          if (!result.ok) {
            return respond(res, 404, { error: result.reason });
          }
          const logEntriesRemoved = await removeByBookId(bookId);
          console.log(
            `[delete-api] removed "${result.bookTitle}"${result.removedAuthor ? ` + orphan author ${result.removedAuthor}` : ''} · ${logEntriesRemoved} log entries cleared`,
          );
          return respond(res, 200, {
            ok: true,
            bookId,
            bookTitle: result.bookTitle,
            removedAuthor: result.removedAuthor,
            logEntriesRemoved,
          });
        } catch (err) {
          console.error('[delete-api] error:', err);
          const message = err instanceof Error ? err.message : String(err);
          return respond(res, 500, { error: message });
        }
      });

      server.middlewares.use('/api/import', async (req, res, next) => {
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
          const body = (await readJsonBody(req)) as ImportBody;
          const force = Boolean(body.force);
          const webQuery = typeof body.webQuery === 'string' ? body.webQuery.trim() : '';

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return respond(res, 500, {
              error: 'GEMINI_API_KEY not configured in .env at the project root.',
            });
          }

          // ── WEB INGEST branch ──
          if (webQuery) {
            if (webQuery.length < 3) {
              return respond(res, 400, { error: 'Web query is too short — try "Title, Author".' });
            }
            console.log(`[ingest-api] web query: "${webQuery}"${force ? ' [force]' : ''}`);
            const result = await ingestBookFromWebQuery(webQuery, {
              apiKey,
              model: process.env.GEMINI_MODEL,
              force,
            });
            console.log(`[ingest-api] web-ingest done: ${result.status} → ${result.bookId}`);
            return respond(res, 200, { ok: true, ...result });
          }

          // ── FILE INGEST branch (default) ──
          const rawName = typeof body.filename === 'string' ? body.filename : '';
          const text = typeof body.text === 'string' ? body.text : '';

          if (!rawName || !text) {
            return respond(res, 400, {
              error: 'Provide either "webQuery" or both "filename" + "text".',
            });
          }

          const safeName = sanitizeFilename(rawName);
          if (!safeName.toLowerCase().endsWith('.txt')) {
            return respond(res, 400, {
              error: 'Only .txt files are accepted. Convert PDFs/EPUBs with Calibre first.',
            });
          }

          const booksTextDir = resolve(process.cwd(), BOOKS_TEXT_DIR);
          await mkdir(booksTextDir, { recursive: true });
          const destPath = resolve(booksTextDir, safeName);
          await writeFile(destPath, text, 'utf8');

          console.log(`[ingest-api] saved ${safeName} (${text.length.toLocaleString()} chars); starting ingest…`);
          const result = await ingestBookFile(`${BOOKS_TEXT_DIR}/${safeName}`, {
            apiKey,
            model: process.env.GEMINI_MODEL,
            force,
          });
          console.log(`[ingest-api] done: ${result.status} → ${result.bookId}`);

          return respond(res, 200, { ok: true, ...result });
        } catch (err) {
          console.error('[ingest-api] error:', err);
          const message = err instanceof Error ? err.message : String(err);
          return respond(res, 500, { error: message });
        }
      });
    },
  };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        rejectBody(new Error(`Request body exceeds ${MAX_BODY_BYTES} bytes.`));
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

function sanitizeFilename(name: string): string {
  const base = basename(name);
  return base
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, 200);
}

function respond(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
