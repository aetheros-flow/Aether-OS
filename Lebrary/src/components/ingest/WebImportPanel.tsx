import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  Globe,
  Loader2,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { triggerDataRefresh } from '@/lib/events';
import { getSupabase } from '@/lib/supabase';
import { extractEdgeFunctionError } from '@/lib/edge-errors';

type Phase =
  | { kind: 'idle' }
  | { kind: 'checking'; startedAt: number; elapsed: number }
  | { kind: 'ingesting'; startedAt: number; elapsed: number }
  | { kind: 'duplicate'; bookId?: string; titleEn?: string; reason?: string }
  | {
      kind: 'done';
      bookId?: string;
      titleEn?: string;
      chapters?: number;
      quiz?: number;
      elapsedSeconds?: number;
    }
  | { kind: 'error'; message: string };

interface Props {
  /** Called when an import completes successfully. */
  onClose: () => void;
}

export function WebImportPanel({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tick elapsed time while busy.
  useEffect(() => {
    if (phase.kind !== 'checking' && phase.kind !== 'ingesting') return;
    const id = window.setInterval(() => {
      setPhase((p) =>
        p.kind === 'checking' || p.kind === 'ingesting'
          ? { ...p, elapsed: (Date.now() - p.startedAt) / 1000 }
          : p,
      );
    }, 500);
    return () => window.clearInterval(id);
  }, [phase.kind]);

  const submit = async (e: FormEvent | null, force = false) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // Phase 1: dup-check (server runs it first before full ingest). We show
    // "checking" for ~5s then transition to "ingesting" visually — the actual
    // server call is one request.
    setPhase({ kind: 'checking', startedAt: Date.now(), elapsed: 0 });
    const ingestPhaseTimer = window.setTimeout(() => {
      setPhase((p) =>
        p.kind === 'checking' ? { kind: 'ingesting', startedAt: p.startedAt, elapsed: p.elapsed } : p,
      );
    }, 4_000);

    try {
      // In dev, the Vite plugin at /api/import handles this. In production
      // (Netlify), Netlify Functions can't run for 30-90s so we call the
      // Supabase Edge Function directly (150s timeout, carries the user's JWT
      // automatically via supabase-js).
      type Payload = {
        ok?: boolean;
        error?: string;
        status?: 'ingested' | 'duplicate';
        bookId?: string;
        titleEn?: string;
        chapters?: number;
        quiz?: number;
        elapsedSeconds?: number;
        duplicateReason?: string;
      };

      let payload: Payload;
      let ok: boolean;

      if (import.meta.env.DEV) {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webQuery: q, force }),
        });
        payload = (await res.json()) as Payload;
        ok = res.ok;
      } else {
        const sb = getSupabase();
        const { data, error } = await sb.functions.invoke<Payload>(
          'lebrary-web-import',
          { body: { webQuery: q, force } },
        );
        if (error) {
          const msg = await extractEdgeFunctionError(error);
          throw new Error(msg);
        }
        payload = data ?? { ok: false };
        ok = Boolean(payload.ok);
      }

      window.clearTimeout(ingestPhaseTimer);

      if (!ok || payload.error) {
        throw new Error(payload.error || `Import failed`);
      }

      triggerDataRefresh();

      if (payload.status === 'duplicate') {
        setPhase({
          kind: 'duplicate',
          bookId: payload.bookId,
          titleEn: payload.titleEn,
          reason: payload.duplicateReason,
        });
      } else {
        setPhase({
          kind: 'done',
          bookId: payload.bookId,
          titleEn: payload.titleEn,
          chapters: payload.chapters,
          quiz: payload.quiz,
          elapsedSeconds: payload.elapsedSeconds,
        });
      }
    } catch (err) {
      window.clearTimeout(ingestPhaseTimer);
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const resetToIdle = () => {
    setPhase({ kind: 'idle' });
    setQuery('');
    inputRef.current?.focus();
  };

  const isBusy = phase.kind === 'checking' || phase.kind === 'ingesting';

  return (
    <div className="space-y-5">
      {phase.kind === 'idle' || isBusy ? (
        <form onSubmit={submit} className="space-y-3">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200">
              Book title and author
            </span>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 dark:text-ink-200" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Meditations, Marcus Aurelius"
                disabled={isBusy}
                required
                className="w-full rounded-full border border-paper-300/70 bg-paper-50/80 py-3 pl-11 pr-5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-all focus:border-lumen-400/70 focus:shadow-glow disabled:opacity-60 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-50 dark:placeholder:text-ink-200"
              />
            </div>
          </label>

          <p className="text-[11px] leading-relaxed text-ink-300 dark:text-ink-200">
            Gemini identifies the book, checks it against your existing library (even across
            languages), then synthesizes chapters + quiz from its knowledge with live web
            verification.
          </p>

          {isBusy && (
            <div className="space-y-3 rounded-2xl border border-lumen-400/30 bg-lumen-400/5 p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-lumen-500 dark:text-lumen-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                    {phase.kind === 'checking'
                      ? 'Checking if the book is already in your library…'
                      : 'Gemini is writing chapters and quiz…'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink-300 dark:text-ink-200 tabular-nums">
                    {phase.elapsed.toFixed(0)}s
                  </p>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
                <div
                  className="h-full rounded-full bg-lumen-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(95, phase.kind === 'checking' ? (phase.elapsed / 6) * 30 : 30 + (phase.elapsed / 75) * 65)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!query.trim() || isBusy}
              leadingIcon={
                isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />
              }
            >
              {isBusy ? 'Importing…' : 'Import with Gemini'}
            </Button>
          </div>
        </form>
      ) : phase.kind === 'duplicate' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
            <BookMarked className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Already in your library
              </p>
              {phase.titleEn && (
                <p className="font-serif italic text-sm text-ink-800 dark:text-ink-100">
                  &ldquo;{phase.titleEn}&rdquo;
                </p>
              )}
              {phase.reason && (
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  {phase.reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={resetToIdle}>
              New search
            </Button>
            <Button
              variant="ghost"
              leadingIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => submit(null, true)}
            >
              Force re-import
            </Button>
            {phase.bookId && (
              <Link to={`/books/${phase.bookId}`} onClick={onClose}>
                <Button variant="primary">Open existing</Button>
              </Link>
            )}
          </div>
        </div>
      ) : phase.kind === 'done' ? (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lumen-400/15">
              <CheckCircle2 className="h-7 w-7 text-lumen-500 dark:text-lumen-400" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-xl font-semibold text-ink-900 dark:text-ink-50">
                Added to your library
              </p>
              {phase.titleEn && (
                <p className="font-serif italic text-ink-700 dark:text-ink-100">&ldquo;{phase.titleEn}&rdquo;</p>
              )}
              {(phase.chapters || phase.quiz) && (
                <p className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                  {phase.chapters ?? 0} chapters · {phase.quiz ?? 0} questions
                  {phase.elapsedSeconds ? ` · ${phase.elapsedSeconds.toFixed(0)}s` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {phase.bookId && (
              <Link to={`/books/${phase.bookId}`} onClick={onClose}>
                <Button variant="primary">Open the book</Button>
              </Link>
            )}
            <Button variant="secondary" onClick={resetToIdle}>
              Import another
            </Button>
          </div>
        </div>
      ) : phase.kind === 'error' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/5 p-4 text-red-700 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Import failed</p>
              <p className="mt-1 text-[11px] leading-relaxed opacity-80">{phase.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetToIdle}>
              Start over
            </Button>
            <Button variant="primary" onClick={() => submit(null, false)}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
