import 'dotenv/config';
import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { ingestBookFile } from './lib/ingest.js';
import { readLog } from './lib/ingest-log.js';

const BOOKS_TEXT_DIR = 'public/books-text';
const DELAY_BETWEEN_BOOKS_MS = 4_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY missing. Put it in .env at the project root.');
    process.exit(1);
  }

  const entries = await readdir(BOOKS_TEXT_DIR);
  const candidates = entries
    .filter((n) => extname(n).toLowerCase() === '.txt')
    .sort((a, b) => a.localeCompare(b));

  const processed = new Set((await readLog()).map((l) => l.file));

  const queue: string[] = [];
  for (const name of candidates) {
    const rel = `${BOOKS_TEXT_DIR}/${name}`.replace(/\\/g, '/');
    if (!force && processed.has(rel)) continue;
    queue.push(rel);
  }

  console.log(`[batch] ${candidates.length} total files, ${queue.length} pending.`);
  if (queue.length === 0) {
    console.log('[batch] nothing to do. Use --force to re-ingest.');
    return;
  }

  let success = 0;
  let failed = 0;
  for (let i = 0; i < queue.length; i++) {
    const file = queue[i];
    console.log(`\n─── ${i + 1} / ${queue.length} · ${file} ───`);
    try {
      const result = await ingestBookFile(file, {
        apiKey,
        model: process.env.GEMINI_MODEL,
        force,
      });
      if (result.status === 'ingested') success++;
    } catch (err) {
      failed++;
      console.error('[fail]', err instanceof Error ? err.message : err);
    }

    if (i < queue.length - 1) {
      await sleep(DELAY_BETWEEN_BOOKS_MS);
    }
  }

  console.log(`\n[batch] done. success=${success} · failed=${failed} · total=${queue.length}`);
}

main().catch((err) => {
  console.error('[error]', err instanceof Error ? err.message : err);
  process.exit(1);
});
