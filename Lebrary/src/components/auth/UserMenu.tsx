import { useEffect, useRef, useState } from 'react';
import { LogOut, User as UserIcon, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function UserMenu() {
  const { user, signOut, status } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status !== 'authenticated' || !user) return null;

  const email = user.email ?? '';
  const initial = (email[0] ?? '·').toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-paper-300/70 bg-paper-50/80 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur-md transition-all duration-200 hover:scale-[1.05] hover:border-lumen-400/60 active:scale-95 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-50"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-paper-300/70 bg-paper-50 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-900">
          <div className="flex items-center gap-3 border-b border-paper-300/60 px-4 py-3 dark:border-ink-700/60">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lumen-400/15 text-sm font-semibold text-lumen-600 dark:text-lumen-400">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink-900 dark:text-ink-50">
                {email || 'Signed in'}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                Reader
              </p>
            </div>
          </div>

          <div className="p-1">
            <Link
              to="/stats"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-paper-200/70 hover:text-ink-900 dark:text-ink-100 dark:hover:bg-ink-800 dark:hover:text-ink-50"
            >
              <BarChart3 className="h-4 w-4" />
              Your stats
            </Link>
            <Link
              to="/notebook"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-paper-200/70 hover:text-ink-900 dark:text-ink-100 dark:hover:bg-ink-800 dark:hover:text-ink-50"
            >
              <UserIcon className="h-4 w-4" />
              My notebook
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); void signOut(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
