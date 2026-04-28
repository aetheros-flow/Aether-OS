import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { runUserDataMigration } from '@/lib/user-migration';
import { useEffect, useRef } from 'react';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { status, user } = useAuth();
  const location = useLocation();
  const migratedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !user || migratedRef.current) return;
    migratedRef.current = true;
    runUserDataMigration(user.id).catch((err) => {
      console.warn('[migration] localStorage → Supabase migration failed:', err);
    });
  }, [status, user]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-300 dark:text-ink-200">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="font-serif italic text-sm">Opening your library…</p>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
