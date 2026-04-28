import { useEffect, useState } from 'react';
import type { Book } from '@/types';
import { DATA_REFRESH } from '@/lib/events';
import { fetchAllBooks } from '@/lib/catalog';

interface UseBooksResult {
  books: Book[];
  loading: boolean;
  error: Error | null;
}

export function useBooks(): UseBooksResult {
  const [state, setState] = useState<UseBooksResult>({ books: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchAllBooks();
        if (!cancelled) setState({ books: data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ books: [], loading: false, error: err instanceof Error ? err : new Error(String(err)) });
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

export function useBook(bookId: string | undefined) {
  const { books, loading, error } = useBooks();
  const book = bookId ? books.find((b) => b.id === bookId) ?? null : null;
  return { book, loading, error };
}
