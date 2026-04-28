import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Loader2, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function LoginView() {
  const { status, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-8 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-lumen-400 to-lumen-600 text-paper-50 shadow-soft-lg">
          <BookOpen className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-lumen-500 dark:text-lumen-400">
          Lumina Library
        </p>
      </div>

      {status === 'unconfigured' ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm text-amber-800 dark:text-amber-200">
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and
          <code> VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> and restart the dev server.
        </div>
      ) : sent ? (
        <div className="space-y-4">
          <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-ink-50">
            Check your email
          </h1>
          <p className="text-ink-700 dark:text-ink-100">
            We sent a sign-in link to <strong>{email}</strong>. Click it from the same device.
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setEmail(''); }}
            className="text-xs uppercase tracking-widest text-ink-300 hover:text-lumen-500 dark:text-ink-200"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50">
              Sign in to continue
            </h1>
            <p className="text-ink-700 dark:text-ink-100">
              We'll send you a magic link — no passwords to remember.
            </p>
          </div>

          <form onSubmit={onSubmit} className="w-full space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300 dark:text-ink-200" />
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="w-full rounded-full border border-paper-300/70 bg-paper-50/80 py-3.5 pl-11 pr-5 text-sm text-ink-800 placeholder:text-ink-300 shadow-soft outline-none transition-all focus:border-lumen-400/70 focus:shadow-glow disabled:opacity-50 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-50 dark:placeholder:text-ink-200"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={busy}
              leadingIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            >
              {busy ? 'Sending…' : 'Send magic link'}
            </Button>

            {error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
          </form>

          <p className="max-w-xs text-xs leading-relaxed text-ink-300 dark:text-ink-200">
            Your reading progress, highlights, favorites, and quiz scores sync across every device you sign in from.
          </p>
        </>
      )}
    </div>
  );
}
