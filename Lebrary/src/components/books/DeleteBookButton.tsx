import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { triggerDataRefresh } from '@/lib/events';

interface DeleteBookButtonProps {
  bookId: string;
  bookTitle?: string;
}

type Phase = 'idle' | 'confirming' | 'deleting' | 'error';

export function DeleteBookButton({ bookId, bookTitle }: DeleteBookButtonProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (phase !== 'confirming') return;
    const t = window.setTimeout(() => setPhase('idle'), 4_000);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (!import.meta.env.DEV) return null;

  const handleClick = async () => {
    if (phase === 'idle') {
      setPhase('confirming');
      return;
    }
    if (phase === 'confirming') {
      setPhase('deleting');
      setError('');
      try {
        const res = await fetch(`/api/books/${encodeURIComponent(bookId)}`, {
          method: 'DELETE',
        });
        const payload = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !payload.ok) {
          throw new Error(payload.error || `Delete failed (${res.status})`);
        }
        triggerDataRefresh();
        navigate('/', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
  };

  const label =
    phase === 'deleting'
      ? 'Deleting…'
      : phase === 'confirming'
        ? 'Confirm delete'
        : phase === 'error'
          ? 'Try again'
          : 'Delete book';

  const style =
    phase === 'confirming' || phase === 'error'
      ? 'border-red-500/60 bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
      : phase === 'deleting'
        ? 'border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400'
        : 'border-paper-300/70 bg-paper-50/80 text-ink-700 hover:border-red-500/40 hover:text-red-500 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100';

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={phase === 'deleting'}
        title={
          phase === 'idle'
            ? `Remove "${bookTitle ?? bookId}" from the library`
            : phase === 'confirming'
              ? 'Click again to confirm permanent deletion'
              : undefined
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium shadow-soft backdrop-blur-md transition-all ${style}`}
      >
        {phase === 'deleting' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      {phase === 'error' && (
        <span className="max-w-[260px] rounded-md bg-red-500/10 px-2 py-1 text-right text-[10px] leading-snug text-red-700 dark:text-red-300">
          {error}
        </span>
      )}
    </div>
  );
}
