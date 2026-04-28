import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Layers, Plus, Trash2 } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useBooks } from '@/hooks/useBooks';
import { useContentLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/common/LoadingState';
import { BookCover } from '@/components/books/BookCover';

export function CollectionsView() {
  const { collections, loading, create, remove } = useCollections();
  const { books } = useBooks();
  const { t } = useContentLanguage();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const bookById = new Map(books.map((b) => [b.id, b]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await create(newName.trim());
    setCreating(false);
    setNewName('');
    setShowForm(false);
  };

  if (loading) return <LoadingState label="Loading your shelves…" />;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Shelves
          </span>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          Your custom shelves
        </h1>
        <p className="max-w-xl text-ink-700 dark:text-ink-100">
          Group books by mood, theme, or plan. A book can live on many shelves at once — unlike
          Favorites, which is a single pinned list.
        </p>
      </section>

      <section className="space-y-4">
        {showForm ? (
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New shelf name (e.g. Summer 2026)"
              className="flex-1 rounded-full border border-paper-300/70 bg-paper-50/80 px-5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-50 dark:placeholder:text-ink-200"
            />
            <Button type="submit" variant="primary" disabled={creating || !newName.trim()}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowForm(false); setNewName(''); }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            variant="secondary"
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
          >
            New shelf
          </Button>
        )}
      </section>

      {collections.length === 0 ? (
        <EmptyState
          title="No shelves yet"
          hint="Create your first shelf above — pick a theme that matters to you."
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const coverBooks = c.bookIds
              .map((id) => bookById.get(id))
              .filter((b): b is NonNullable<typeof b> => Boolean(b))
              .slice(0, 3);
            return (
              <Card key={c.id} className="group relative overflow-hidden p-5">
                <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`Delete shelf "${c.name}"? Books stay in your library.`)) {
                        void remove(c.id);
                      }
                    }}
                    aria-label="Delete shelf"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-100/90 text-ink-300 backdrop-blur transition-colors hover:text-red-500 dark:bg-ink-900/80 dark:text-ink-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Link to={`/shelves/${c.id}`} className="block space-y-4">
                  <div className="flex h-32 items-end justify-center gap-1 overflow-hidden rounded-xl bg-paper-100 px-3 dark:bg-ink-800">
                    {coverBooks.length === 0 ? (
                      <div className="flex h-full w-full items-center justify-center text-ink-300 dark:text-ink-200">
                        <BookMarked className="h-6 w-6" />
                      </div>
                    ) : (
                      coverBooks.map((b, i) => (
                        <div
                          key={b.id}
                          className="h-24 w-16 overflow-hidden rounded-md shadow-soft transition-transform group-hover:-translate-y-1"
                          style={{ transitionDelay: `${i * 40}ms` }}
                        >
                          <BookCover
                            title={t(b.title)}
                            src={b.coverImage || undefined}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
                      {c.name}
                    </h3>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                      {c.bookIds.length} {c.bookIds.length === 1 ? 'book' : 'books'}
                    </p>
                    {c.description && (
                      <p className="line-clamp-2 pt-1 text-sm text-ink-700 dark:text-ink-100">
                        {c.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
