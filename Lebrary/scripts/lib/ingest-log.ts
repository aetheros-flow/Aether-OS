import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const LOG_PATH = resolve(process.cwd(), 'scripts/.ingest-log.json');

export interface LogEntry {
  file: string;
  bookId: string;
  ingestedAt: string;
  sizeBytes: number;
}

export async function readLog(): Promise<LogEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return [];
    throw err;
  }
}

export async function upsertLog(entry: LogEntry): Promise<void> {
  const list = await readLog();
  const idx = list.findIndex((l) => l.file === entry.file);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  await mkdir(dirname(LOG_PATH), { recursive: true });
  await writeFile(LOG_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

export async function findEntry(file: string): Promise<LogEntry | undefined> {
  const list = await readLog();
  return list.find((l) => l.file === file);
}

export async function removeByBookId(bookId: string): Promise<number> {
  const list = await readLog();
  const kept = list.filter((l) => l.bookId !== bookId);
  if (kept.length === list.length) return 0;
  await mkdir(dirname(LOG_PATH), { recursive: true });
  await writeFile(LOG_PATH, JSON.stringify(kept, null, 2) + '\n', 'utf8');
  return list.length - kept.length;
}
