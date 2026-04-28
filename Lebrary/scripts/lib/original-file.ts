import { readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

type Format = 'pdf' | 'epub' | 'mobi' | 'txt';

export interface OriginalFileRef {
  path: string;
  format: Format;
  sizeBytes?: number;
}

const BOOKS_DIR = resolve(process.cwd(), 'public/books');

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function jaccardTokens(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter((t) => t.length > 2));
  const tokensB = new Set(normalize(b).split(' ').filter((t) => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) if (tokensB.has(t)) intersection++;
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function findOriginalFile(txtBasename: string): Promise<OriginalFileRef | undefined> {
  let entries: string[];
  try {
    entries = await readdir(BOOKS_DIR);
  } catch {
    return undefined;
  }

  const candidates = entries.filter((name) => {
    const ext = extname(name).toLowerCase();
    return ext === '.pdf' || ext === '.epub' || ext === '.mobi';
  });

  let best: { name: string; score: number } | undefined;
  for (const name of candidates) {
    const score = jaccardTokens(txtBasename, name);
    if (!best || score > best.score) best = { name, score };
  }

  if (!best || best.score < 0.35) return undefined;

  const ext = extname(best.name).toLowerCase().slice(1) as Format;
  const fullPath = join(BOOKS_DIR, best.name);
  let sizeBytes: number | undefined;
  try {
    const s = await stat(fullPath);
    sizeBytes = s.size;
  } catch {
    // ignore
  }

  return {
    path: `/books/${best.name}`,
    format: ext,
    sizeBytes,
  };
}
