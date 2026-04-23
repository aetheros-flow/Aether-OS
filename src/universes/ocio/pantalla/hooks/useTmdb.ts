import { useEffect, useState } from 'react';

/**
 * Generic async-state hook for TMDB calls. Pass a factory that returns a
 * promise; reruns whenever `deps` change. Returns `{ data, loading, error }`.
 */
export function useTmdbQuery<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    factory()
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
