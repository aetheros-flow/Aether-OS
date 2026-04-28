import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useFavorites } from '@/hooks/useFavorites';
import { useContentLanguage } from '@/context/LanguageContext';
import { BookCard } from '@/components/books/BookCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/LoadingState';
import type { Author } from '@/types';

export function FavoritesView() {
  const { books, loading: booksLoading, error: booksError } = useBooks();
  const { authors, loading: authorsLoading, error: authorsError } = useAuthors();
  const { favoriteSet, count } = useFavorites();
  const { t, language } = useContentLanguage();

  const authorById = useMemo(() => {
    const map = new Map<string, Author>();
    authors.forEach((a) => map.set(a.id, a));
    return map;
  }, [authors]);

  const favoriteBooks = useMemo(() => {
    const list = books.filter((b) => favoriteSet.has(b.id));
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    return list.sort((a, b) => collator.compare(t(a.title), t(b.title)));
  }, [books, favoriteSet, t, language]);

  const loading = booksLoading || authorsLoading;
  const error = booksError ?? authorsError;

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 fill-current text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Favorites
          </span>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          Your shelf of keepers
        </h1>
        <p className="max-w-xl text-ink-700 dark:text-ink-100">
          {count === 0
            ? 'Tap the heart on any book cover to add it here — the ones you want within reach.'
            : `${count} book${count === 1 ? '' : 's'} marked. Tap a heart on any cover to add or remove.`}
        </p>
      </section>

      {loading && <LoadingState label="Finding your favorites…" />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && favoriteBooks.length === 0 && (
        <EmptyState
          title="No favorites yet"
          hint="Every book cover has a heart icon in the top-right corner. Tap it to pin the book here."
        />
      )}

      {!loading && !error && favoriteBooks.length > 0 && (
        <section className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favoriteBooks.map((book) => (
            <BookCard key={book.id} book={book} author={authorById.get(book.authorId)} />
          ))}
        </section>
      )}
    </div>
  );
}
