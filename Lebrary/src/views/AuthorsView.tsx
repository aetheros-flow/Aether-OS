import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthors } from '@/hooks/useAuthors';
import { useContentLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/LoadingState';

export function AuthorsView() {
  const { authors, loading, error } = useAuthors();
  const { t } = useContentLanguage();
  const [query, setQuery] = useState('');

  const visibleAuthors = useMemo(() => {
    const q = query.trim().toLowerCase();
    const collator = new Intl.Collator('en', { sensitivity: 'base' });
    return [...authors]
      .filter((a) => (q ? a.name.toLowerCase().includes(q) : true))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [authors, query]);

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            The Writers
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
            The minds behind the pages.
          </h1>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search authors…" />
      </section>

      {loading && <LoadingState label="Gathering the authors…" />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && visibleAuthors.length === 0 && (
        <EmptyState title="No authors match your search" />
      )}

      {!loading && !error && visibleAuthors.length > 0 && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAuthors.map((author) => (
            <Link
              key={author.id}
              to={`/authors/${author.id}`}
              className="block focus-visible:outline-none"
            >
              <Card interactive className="flex items-center gap-5 p-5">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-paper-200 dark:bg-ink-700">
                  {author.image && (
                    <img
                      src={author.image}
                      alt={author.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
                    {author.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-100 line-clamp-2">
                    {t(author.bio)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
