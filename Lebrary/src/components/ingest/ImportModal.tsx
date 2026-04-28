import { useCallback, useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FileText, Globe, Loader2, RefreshCcw, Sparkles, Trash2, Upload, X, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { triggerDataRefresh } from '@/lib/events';
import { WebImportPanel } from '@/components/ingest/WebImportPanel';
import { getSupabase } from '@/lib/supabase';
import { extractEdgeFunctionError } from '@/lib/edge-errors';

type ImportMode = 'file' | 'web';

type FileState =
  | { kind: 'pending' }
  | { kind: 'reading' }
  | { kind: 'processing'; startedAt: number; elapsed: number }
  | { kind: 'done'; result: ImportResult }
  | { kind: 'error'; message: string };

interface ImportResult {
  status?: 'ingested' | 'skipped' | 'duplicate';
  bookId?: string;
  titleEn?: string;
  chapters?: number;
  quiz?: number;
  elapsedSeconds?: number;
  duplicateReason?: string;
}

interface FileEntry {
  id: string;
  file: File;
  state: FileState;
}

// When a book hits processing, simulated progress advances this fast (0 → 95% linearly).
const SIMULATED_FULL_DURATION_SEC = 75;

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  // File tab works in both dev (Vite plugin) and prod (Supabase Edge Function).
  const defaultMode: ImportMode = 'file';
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<'selecting' | 'running' | 'finished'>('selecting');
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setEntries([]);
      setDragOver(false);
      setPhase('selecting');
      setMode(defaultMode);
      cancelledRef.current = false;
    }
  }, [open, defaultMode]);

  // Tick elapsed time for currently-processing entries.
  useEffect(() => {
    const processingIds = entries
      .filter((e) => e.state.kind === 'processing')
      .map((e) => e.id);
    if (processingIds.length === 0) return;
    const timer = window.setInterval(() => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.state.kind !== 'processing') return e;
          return { ...e, state: { ...e.state, elapsed: (Date.now() - e.state.startedAt) / 1000 } };
        }),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [entries]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'running') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, phase, onClose]);

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const fresh: FileEntry[] = [];
    const errs: FileEntry[] = [];
    for (const f of arr) {
      if (!f.name.toLowerCase().endsWith('.txt')) {
        errs.push({
          id: `${Date.now()}-${f.name}-${Math.random()}`,
          file: f,
          state: { kind: 'error', message: 'Only .txt files are accepted. Convert first with Calibre.' },
        });
      } else {
        fresh.push({
          id: `${Date.now()}-${f.name}-${Math.random()}`,
          file: f,
          state: { kind: 'pending' },
        });
      }
    }
    setEntries((prev) => {
      // De-duplicate by name+size against existing non-errored entries.
      const existingKeys = new Set(
        prev
          .filter((e) => e.state.kind !== 'error')
          .map((e) => `${e.file.name}::${e.file.size}`),
      );
      const deduped = fresh.filter((f) => !existingKeys.has(`${f.file.name}::${f.file.size}`));
      return [...prev, ...deduped, ...errs];
    });
  }, []);

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const runOne = async (id: string, force: boolean) => {
    const entry = entriesRefGet(id);
    if (!entry) return;

    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, state: { kind: 'reading' } } : e)),
    );

    try {
      const text = await entry.file.text();
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, state: { kind: 'processing', startedAt: Date.now(), elapsed: 0 } }
            : e,
        ),
      );

      // In dev the Vite plugin serves /api/import directly. In prod Netlify's
      // 10-26s function timeout can't fit the 30-90s Gemini call, so we route
      // through Supabase Edge Functions (150s timeout).
      let payload: ImportResult & { ok?: boolean; error?: string };
      let ok: boolean;
      if (import.meta.env.DEV) {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: entry.file.name, text, force }),
        });
        payload = (await res.json()) as ImportResult & { ok?: boolean; error?: string };
        ok = res.ok;
      } else {
        const sb = getSupabase();
        const { data, error } = await sb.functions.invoke<ImportResult & { ok?: boolean; error?: string }>(
          'lebrary-web-import',
          { body: { filename: entry.file.name, text, force } },
        );
        if (error) {
          const msg = await extractEdgeFunctionError(error);
          throw new Error(msg);
        }
        payload = data ?? { ok: false };
        ok = Boolean(payload.ok);
      }
      if (!ok || payload.error) {
        throw new Error(payload.error || `Import failed`);
      }
      triggerDataRefresh();
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                state: {
                  kind: 'done',
                  result: {
                    status: payload.status,
                    bookId: payload.bookId,
                    titleEn: payload.titleEn,
                    chapters: payload.chapters,
                    quiz: payload.quiz,
                    elapsedSeconds: payload.elapsedSeconds,
                    duplicateReason: payload.duplicateReason,
                  },
                },
              }
            : e,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, state: { kind: 'error', message } } : e)),
      );
    }
  };

  const processQueue = async () => {
    setPhase('running');
    cancelledRef.current = false;

    const queue = entries.filter((e) => e.state.kind === 'pending').map((e) => e.id);

    for (const id of queue) {
      if (cancelledRef.current) break;
      await runOne(id, false);
    }

    setPhase('finished');
  };

  // Sync ref getter for inside the async loop.
  const entriesRef = useRef<FileEntry[]>([]);
  entriesRef.current = entries;
  const entriesRefGet = (id: string) => entriesRef.current.find((e) => e.id === id);

  const retryEntry = async (id: string) => {
    setPhase('running');
    await runOne(id, false);
    setPhase('finished');
  };

  const forceRetryEntry = async (id: string) => {
    setPhase('running');
    await runOne(id, true);
    setPhase('finished');
  };

  if (!open) return null;

  const pendingCount = entries.filter((e) => e.state.kind === 'pending').length;
  const doneCount = entries.filter((e) => e.state.kind === 'done').length;
  const errorCount = entries.filter((e) => e.state.kind === 'error').length;
  const isRunning = phase === 'running';
  const canStart = pendingCount > 0 && !isRunning;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        onClick={() => !isRunning && onClose()}
      />
      <div className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-paper-300/70 bg-paper-50 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-900">
        <header className="flex items-center justify-between border-b border-paper-300/60 px-6 py-4 dark:border-ink-700/60">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
            <h2 id="import-modal-title" className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
              Import books
            </h2>
          </div>
          <button
            type="button"
            onClick={() => !isRunning && onClose()}
            disabled={isRunning}
            aria-label="Close"
            className="-m-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-ink-700 disabled:opacity-30 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:text-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex items-center gap-1 border-b border-paper-300/60 px-4 pt-3 dark:border-ink-700/60">
          <TabButton
            active={mode === 'file'}
            onClick={() => !isRunning && setMode('file')}
            disabled={isRunning}
            icon={<Upload className="h-3.5 w-3.5" />}
          >
            From file
          </TabButton>
          <TabButton
            active={mode === 'web'}
            onClick={() => !isRunning && setMode('web')}
            disabled={isRunning}
            icon={<Globe className="h-3.5 w-3.5" />}
          >
            From the web
          </TabButton>
        </div>

        {mode === 'web' ? (
          <div className="p-6">
            <WebImportPanel onClose={onClose} />
          </div>
        ) : (
        <div className="flex flex-col gap-5 overflow-hidden p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); if (!isRunning) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { if (!isRunning) onDrop(e); }}
            onClick={() => !isRunning && inputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
              dragOver
                ? 'border-lumen-400/80 bg-lumen-400/10'
                : 'border-paper-300 bg-paper-100/40 hover:border-lumen-400/60 hover:bg-paper-100 dark:border-ink-700 dark:bg-ink-800/40 dark:hover:border-lumen-400/50 dark:hover:bg-ink-800/70'
            } ${isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <Upload className="h-6 w-6 text-ink-300 transition-colors group-hover:text-lumen-500 dark:text-ink-200 dark:group-hover:text-lumen-400" />
            <p className="text-sm font-medium text-ink-900 dark:text-ink-50">
              Drop .txt files here <span className="text-ink-300 dark:text-ink-200">or click to browse</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
              Multiple files supported
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".txt,text/plain"
              multiple
              onChange={onInputChange}
              disabled={isRunning}
              className="sr-only"
            />
          </div>

          {entries.length > 0 && (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <FileRow
                  key={entry.id}
                  entry={entry}
                  isRunning={isRunning}
                  onRemove={() => removeEntry(entry.id)}
                  onRetry={() => retryEntry(entry.id)}
                  onForce={() => forceRetryEntry(entry.id)}
                />
              ))}
            </ul>
          )}

          {phase === 'finished' && (doneCount > 0 || errorCount > 0) && (
            <div className="rounded-2xl border border-paper-300/60 bg-paper-100/50 p-3 text-center text-xs text-ink-700 dark:border-ink-700/50 dark:bg-ink-800/50 dark:text-ink-100">
              {doneCount > 0 && (
                <span className="inline-flex items-center gap-1 text-lumen-600 dark:text-lumen-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {doneCount} imported
                </span>
              )}
              {doneCount > 0 && errorCount > 0 && <span className="mx-2 text-ink-300">·</span>}
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> {errorCount} failed
                </span>
              )}
            </div>
          )}
        </div>
        )}

        {mode === 'file' && (
        <footer className="flex items-center justify-between gap-3 border-t border-paper-300/60 px-6 py-4 dark:border-ink-700/60">
          <div className="text-xs text-ink-300 dark:text-ink-200">
            {isRunning ? (
              <>
                Processing{' '}
                <span className="tabular-nums">
                  {doneCount + errorCount + 1} / {entries.length}
                </span>
              </>
            ) : phase === 'finished' ? (
              pendingCount > 0 ? `${pendingCount} still pending` : 'All done'
            ) : (
              `${entries.length} file${entries.length === 1 ? '' : 's'} · ${pendingCount} pending`
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isRunning}>
              {phase === 'finished' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              disabled={!canStart}
              leadingIcon={
                isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />
              }
              onClick={processQueue}
            >
              {isRunning
                ? 'Importing…'
                : phase === 'finished' && pendingCount > 0
                  ? `Resume · ${pendingCount}`
                  : `Import ${pendingCount > 0 ? `${pendingCount} ` : ''}with Gemini`}
            </Button>
          </div>
        </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface TabButtonProps {
  active: boolean;
  disabled?: boolean;
  tooltip?: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, disabled, tooltip, icon, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`inline-flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
        active
          ? 'border-b-2 border-lumen-400 text-lumen-600 dark:text-lumen-400'
          : 'border-b-2 border-transparent text-ink-300 hover:text-ink-700 dark:text-ink-200 dark:hover:text-ink-50'
      } ${disabled && !active ? 'cursor-not-allowed opacity-40' : ''} disabled:pointer-events-auto`}
    >
      {icon}
      {children}
    </button>
  );
}

interface FileRowProps {
  entry: FileEntry;
  isRunning: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onForce: () => void;
}

function FileRow({ entry, isRunning, onRemove, onRetry, onForce }: FileRowProps) {
  const { file, state } = entry;
  const isDuplicate = state.kind === 'done' && state.result.status !== 'ingested';

  const { progress, stageLabel, color } = (() => {
    switch (state.kind) {
      case 'pending':
        return { progress: 0, stageLabel: 'Queued', color: 'bg-paper-300 dark:bg-ink-700' };
      case 'reading':
        return { progress: 5, stageLabel: 'Reading file…', color: 'bg-lumen-400' };
      case 'processing': {
        const pct = Math.min(95, 10 + (state.elapsed / SIMULATED_FULL_DURATION_SEC) * 85);
        const stage =
          state.elapsed < 6 ? 'Uploading to Gemini…' :
          state.elapsed < 25 ? 'Analysing the text…' :
          state.elapsed < 55 ? 'Curating chapters…' :
          'Generating the quiz…';
        return { progress: pct, stageLabel: stage, color: 'bg-lumen-400' };
      }
      case 'done':
        if (state.result.status === 'ingested') {
          return { progress: 100, stageLabel: 'Done', color: 'bg-emerald-500' };
        }
        return {
          progress: 100,
          stageLabel: state.result.status === 'duplicate' ? 'Already in library' : 'Previously imported',
          color: 'bg-amber-400',
        };
      case 'error':
        return { progress: 100, stageLabel: 'Failed', color: 'bg-red-500' };
    }
  })();

  const isPending = state.kind === 'pending';
  const isError = state.kind === 'error';
  const isDone = state.kind === 'done';
  const isActive = state.kind === 'reading' || state.kind === 'processing';
  const isSuccess = isDone && state.result.status === 'ingested';

  return (
    <li className="rounded-2xl border border-paper-300/60 bg-paper-50/70 px-3 py-2.5 dark:border-ink-700/50 dark:bg-ink-800/60">
      <div className="flex items-center gap-3">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isSuccess
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : isDuplicate
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : isError
                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                : isActive
                  ? 'bg-lumen-400/15 text-lumen-600 dark:text-lumen-400'
                  : 'bg-paper-200 text-ink-300 dark:bg-ink-700 dark:text-ink-200'
        }`}>
          {isSuccess ? <CheckCircle2 className="h-4 w-4" />
            : isDuplicate ? <BookMarked className="h-3.5 w-3.5" />
            : isError ? <AlertCircle className="h-4 w-4" />
            : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileText className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
            {isDone && state.result.titleEn ? state.result.titleEn : file.name}
          </p>
          <p className="text-[11px] text-ink-300 dark:text-ink-200">
            {(file.size / 1024).toFixed(0)} KB
            {isSuccess && state.result.chapters && (
              <> · {state.result.chapters} ch · {state.result.quiz ?? 0} q</>
            )}
            {state.kind === 'processing' && (
              <> · <span className="tabular-nums">{state.elapsed.toFixed(0)}s</span></>
            )}
          </p>
        </div>
        {isPending && !isRunning && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="-m-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-red-500 dark:text-ink-200 dark:hover:bg-ink-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {isError && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-full border border-paper-300/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink-700 transition-colors hover:border-lumen-400/60 hover:text-lumen-600 dark:border-ink-700/60 dark:text-ink-100 dark:hover:text-lumen-400"
          >
            Retry
          </button>
        )}
        {isDone && state.result.bookId && (
          <Link
            to={`/books/${state.result.bookId}`}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-lumen-600 hover:text-lumen-500 dark:text-lumen-400"
          >
            Open →
          </Link>
        )}
      </div>

      {(isActive || isDone || isError) && (
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-start justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
            <span>{stageLabel}</span>
            {isActive && <span className="tabular-nums">{Math.round(progress)}%</span>}
          </div>
        </div>
      )}

      {isDuplicate && state.kind === 'done' && (
        <div className="mt-2 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
            {state.result.duplicateReason ?? 'This file was already imported previously.'}
          </p>
          <button
            type="button"
            onClick={onForce}
            disabled={isRunning}
            className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-300"
          >
            <RefreshCcw className="h-3 w-3" />
            Force re-import
          </button>
        </div>
      )}

      {isError && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
    </li>
  );
}
