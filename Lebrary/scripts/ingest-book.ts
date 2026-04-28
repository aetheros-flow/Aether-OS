import 'dotenv/config';
import { ingestBookFile } from './lib/ingest.js';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const file = args.find((a) => !a.startsWith('--'));

  if (!file) {
    console.error('Usage: npm run ingest -- "public/books-text/<file>.txt" [--force]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY missing. Put it in .env at the project root.');
    process.exit(1);
  }

  await ingestBookFile(file, {
    apiKey,
    model: process.env.GEMINI_MODEL,
    force,
  });
}

main().catch((err) => {
  console.error('[error]', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
