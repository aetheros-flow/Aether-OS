import 'dotenv/config';
import chokidar from 'chokidar';
import { extname, relative } from 'node:path';
import { ingestBookFile } from './lib/ingest.js';

const BOOKS_TEXT_DIR = 'public/books-text';
const DELAY_BETWEEN_BOOKS_MS = 3_000;

function toRel(absPath: string): string {
  return relative(process.cwd(), absPath).replace(/\\/g, '/');
}

async function main() {
  const apiKeyFromEnv = process.env.GEMINI_API_KEY;
  if (!apiKeyFromEnv) {
    console.error('GEMINI_API_KEY missing. Put it in .env at the project root.');
    process.exit(1);
  }
  const apiKey: string = apiKeyFromEnv;

  const queue: string[] = [];
  let processing = false;

  async function drain() {
    if (processing) return;
    processing = true;
    try {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) break;
        console.log(`\n── processing: ${file} ──`);
        try {
          const result = await ingestBookFile(file, {
            apiKey,
            model: process.env.GEMINI_MODEL,
          });
          if (result.status === 'ingested') {
            console.log(`[watch] ingested "${result.titleEn}"`);
          }
        } catch (err) {
          console.error('[watch] ingest failed:', err instanceof Error ? err.message : err);
        }
        if (queue.length > 0) {
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BOOKS_MS));
        }
      }
    } finally {
      processing = false;
    }
  }

  function enqueue(absPath: string, reason: string) {
    if (extname(absPath).toLowerCase() !== '.txt') return;
    const rel = toRel(absPath);
    if (queue.includes(rel)) return;
    console.log(`[watch] ${reason}: ${rel}  → queued (${queue.length + 1} pending)`);
    queue.push(rel);
    drain();
  }

  const watcher = chokidar.watch(`${BOOKS_TEXT_DIR}/*.txt`, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 2_000,
      pollInterval: 200,
    },
  });

  watcher
    .on('add', (path) => enqueue(path, 'add'))
    .on('change', (path) => enqueue(path, 'change'))
    .on('ready', () => {
      console.log(`\n[watch] watching ${BOOKS_TEXT_DIR}/*.txt`);
      console.log('[watch] drop .txt files into that folder and they will be ingested automatically.');
      console.log('[watch] already-ingested files are skipped (tracked in scripts/.ingest-log.json).');
      console.log('[watch] press Ctrl+C to stop.\n');
    })
    .on('error', (err) => {
      console.error('[watch] error:', err);
    });

  process.on('SIGINT', async () => {
    console.log('\n[watch] shutting down…');
    await watcher.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[error]', err instanceof Error ? err.message : err);
  process.exit(1);
});
