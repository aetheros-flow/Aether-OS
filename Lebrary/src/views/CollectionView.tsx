import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Layers, Pencil } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useContentLanguage } from '@/context/LanguageContext';
import { BookCard } from '@/components/books/BookCard';
import { EmptyState, LoadingState } from '@/components/common/LoadingState';
import type { Author } from '@/types';

export function CollectionView() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { collections, loading, rename } = useCollections();
  const { books } = useBooks();
  const { authors } = useAuthors();
  const { t, language } = useContentLanguage();

  const collection = collections.find((c) => c.id === collectionId);

  const authorById = useMemo(() => {
    const m = new Map<string, Author>();
    authors.forEach((a) => m.set(a.id, a));
    return m;
  }, [authors]);

  const booksInCollection = useMemo(() => {
    if (!collection) return [];
    const idSet = new Set(collection.bookIds);
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    return books
      .filter((b) => idSet.has(b.id))
      .sort((a, b) => collator.compare(t(a.title), t(b.title)));
  }, [collection, books, language, t]);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  if (loading) return <LoadingState label="Opening the shelf…" />;
  if (!collection) return <Navigate to="/shelves" replace />;

  const startEdit = () => {
    setDraftName(collection.name);
    setDraftDesc(collection.description);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!draftName.trim()) return;
    await rename(collection.id, draftName.trim(), draftDesc);
    setEditing(false);
  };

  return (
    <div className="space-y-10">
      <Link
        to="/shelves"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All shelves
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <Layers className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Shelf
          </span>
        </div>

        {editing ? (
          <div className="max-w-2xl space-y-3">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Shelf name"
              className="w-full bg-transparent border-b-2 border-lumen-400/60 font-serif text-4xl font-semibold leading-tight text-ink-900 outline-none focus:border-lumen-400 dark:text-ink-50 md:text-5xl"
            />
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              placeholder="A short description (optional)"
              rows={2}
              className="w-full resize-none rounded-xl border border-paper-300/70 bg-paper-50/70 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 outline-none focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-50 dark:placeholder:text-ink-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="inline-flex items-center gap-1.5 rounded-full bg-lumen-500 px-4 py-2 text-sm font-medium text-paper-50 hover:bg-lumen-400 dark:bg-lumen-400 dark:text-ink-900"
              >
                <Check className="h-4 w-4" /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full px-4 py-2 text-sm text-ink-300 hover:text-ink-700 dark:text-ink-200 dark:hover:text-ink-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
                {collection.name}
              </h1>
              <button
                type="button"
                onClick={startEdit}
                aria-label="Edit shelf"
                className="mt-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-lumen-500 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:text-lumen-400"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            {collection.description && (
              <p className="max-w-2xl text-ink-700 dark:text-ink-100">{collection.description}</p>
            )}
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
              {booksInCollection.length} {booksInCollection.length === 1 ? 'book' : 'books'}
            </p>
          </div>
        )}
      </header>

      {booksInCollection.length === 0 ? (
        <EmptyState
          title="This shelf is empty"
          hint="From a book's detail page, use 'Add to shelf…' to place it here."
        />
      ) : (
        <section className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {booksInCollection.map((book) => (
            <BookCard key={book.id} book={book} author={authorById.get(book.authorId)} />
          ))}
        </section>
      )}
    </div>
  );
}
