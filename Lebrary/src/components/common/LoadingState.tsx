import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-300 dark:text-ink-200">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="font-serif text-sm italic">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-300/40 bg-red-50/60 p-10 text-center text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
      <p className="font-serif text-lg">Something went wrong.</p>
      <p className="mt-2 text-sm opacity-80">{message}</p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-paper-300 bg-paper-50/40 py-20 text-center dark:border-ink-700 dark:bg-ink-800/40">
      <p className="font-serif text-xl text-ink-700 dark:text-ink-100">{title}</p>
      {hint && <p className="max-w-md text-sm text-ink-300 dark:text-ink-200">{hint}</p>}
    </div>
  );
}
