import { useEffect, useState } from 'react';
import type { Author } from '@/types';
import { DATA_REFRESH } from '@/lib/events';
import { fetchAllAuthors } from '@/lib/catalog';

interface UseAuthorsResult {
  authors: Author[];
  loading: boolean;
  error: Error | null;
}

export function useAuthors(): UseAuthorsResult {
  const [state, setState] = useState<UseAuthorsResult>({ authors: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchAllAuthors();
        if (!cancelled) setState({ authors: data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({
            authors: [],
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    load();
    const onRefresh = () => load();
    window.addEventListener(DATA_REFRESH, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(DATA_REFRESH, onRefresh);
    };
  }, []);

  return state;
}

export function useAuthor(authorId: string | undefined) {
  const { authors, loading, error } = useAuthors();
  const author = authorId ? authors.find((a) => a.id === authorId) ?? null : null;
  return { author, loading, error };
}
