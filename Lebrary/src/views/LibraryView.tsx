import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useContentLanguage } from '@/context/LanguageContext';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { BookCard } from '@/components/books/BookCard';
import { BookCover } from '@/components/books/BookCover';
import { SearchBar } from '@/components/ui/SearchBar';
import { ImportButton } from '@/components/ingest/ImportButton';
import { FilterPopover } from '@/components/filters/FilterPopover';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/LoadingState';
import type { Author, Book, ReadingProgress } from '@/types';

type SortKey = 'title-asc' | 'title-desc' | 'author-asc';

export function LibraryView() {
  const { books, loading: booksLoading, error: booksError } = useBooks();
  const { authors, loading: authorsLoading, error: authorsError } = useAuthors();
  const { t, language } = useContentLanguage();
  const { progress } = useReadingProgress();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('title-asc');
  const [genre, setGenre] = useState<string | null>(null);
  const [originalLang, setOriginalLang] = useState<'en' | 'es' | null>(null);

  const authorById = useMemo(() => {
    const map = new Map<string, Author>();
    authors.forEach((a) => map.set(a.id, a));
    return map;
  }, [authors]);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      for (const g of b.genre ?? []) set.add(g);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [books]);

  const inProgress = useMemo(() => {
    const entries = Object.values(progress) as ReadingProgress[];
    return entries
      .map((p) => {
        const book = books.find((b) => b.id === p.bookId);
        if (!book) return null;
        const done = p.completedChapterIds.length;
        const total = book.chapters.length;
        if (done === 0 && !p.lastReadChapterId) return null;
        if (done >= total && total > 0) return null;
        return { book, progress: p, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
      })
      .filter((x): x is { book: Book; progress: ReadingProgress; percent: number } => x !== null)
      .sort((a, b) => b.progress.lastReadAt.localeCompare(a.progress.lastReadAt));
  }, [books, progress]);

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = books.filter((book) => {
      if (genre && !(book.genre ?? []).includes(genre)) return false;
      if (originalLang && book.originalLanguage !== originalLang) return false;
      if (!q) return true;
      const titleMatch = t(book.title).toLowerCase().includes(q);
      const author = authorById.get(book.authorId);
      const authorMatch = author ? author.name.toLowerCase().includes(q) : false;
      return titleMatch || authorMatch;
    });

    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'title-asc') return collator.compare(t(a.title), t(b.title));
      if (sort === 'title-desc') return collator.compare(t(b.title), t(a.title));
      const nameA = authorById.get(a.authorId)?.name ?? '';
      const nameB = authorById.get(b.authorId)?.name ?? '';
      return collator.compare(nameA, nameB);
    });
    return sorted;
  }, [books, authorById, query, sort, genre, originalLang, t, language]);

  const loading = booksLoading || authorsLoading;
  const error = booksError ?? authorsError;
  const activeFilterCount = (genre ? 1 : 0) + (originalLang ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0 || query.length > 0;

  const clearAllFilters = () => {
    setGenre(null);
    setOriginalLang(null);
  };

  const activeLabel = genre ?? (originalLang ? `${originalLang.toUpperCase()} originals` : 'All works');

  return (
    <div className="space-y-16">
      <section className="relative space-y-8 pt-6">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-lumen-400/60" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-lumen-500 dark:text-lumen-400">
            The Collection
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-lumen-400/60 via-lumen-400/20 to-transparent" />
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50 md:text-6xl lg:text-7xl">
            Read deeply.<br />
            <span className="italic text-lumen-600 dark:text-lumen-400">Remember more.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink-700 dark:text-ink-100">
            A curated library of long-form works, each paired with detailed chapters and a
            challenging quiz to test your understanding.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-4 md:flex-row md:items-center md:gap-2">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search by title or author…"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterPopover
              genres={availableGenres}
              selectedGenre={genre}
              onGenreChange={setGenre}
              selectedLanguage={originalLang}
              onLanguageChange={setOriginalLang}
              onClearAll={clearAllFilters}
            />
            <SortControl value={sort} onChange={setSort} />
            <ImportButton />
          </div>
        </div>
      </section>

      {inProgress.length > 0 && !hasActiveFilters && (
        <ContinueReading items={inProgress.slice(0, 3)} authorById={authorById} />
      )}

      {loading && <LoadingState label="Gathering the shelves…" />}
      {error && <ErrorState message={error.message} />}

      {!loading && !error && visibleBooks.length === 0 && (
        <EmptyState
          title="No books match your filters"
          hint="Try clearing some filters or searching differently."
        />
      )}

      {!loading && !error && visibleBooks.length > 0 && (
        <section className="space-y-8">
          <SectionHeader
            label={activeFilterCount > 0 ? activeLabel : 'All works'}
            count={visibleBooks.length}
          />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} author={authorById.get(book.authorId)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface ContinueReadingProps {
  items: { book: Book; progress: ReadingProgress; percent: number }[];
  authorById: Map<string, Author>;
}

function ContinueReading({ items, authorById }: ContinueReadingProps) {
  const { t } = useContentLanguage();
  return (
    <section className="space-y-6">
      <SectionHeader
        label="Continue reading"
        icon={<Sparkles className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ book, progress, percent }) => {
          const author = authorById.get(book.authorId);
          const lastChapter = book.chapters.find((c) => c.id === progress.lastReadChapterId);
          const resumeOrder = lastChapter?.order ?? 1;
          return (
            <Link
              key={book.id}
              to={`/books/${book.id}/read/${resumeOrder}`}
              className="group flex items-stretch gap-4 rounded-2xl border border-paper-300/50 bg-paper-50/60 p-3 shadow-soft backdrop-blur-md transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-lumen-400/40 hover:shadow-soft-lg dark:border-ink-700/50 dark:bg-ink-800/50"
            >
              <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-soft">
                <BookCover
                  title={t(book.title)}
                  author={author?.name}
                  src={book.coverImage || undefined}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-lumen-500 dark:text-lumen-400">
                    Resume
                  </p>
                  <h3 className="font-serif text-sm font-semibold leading-tight text-ink-900 line-clamp-2 dark:text-ink-50">
                    {t(book.title)}
                  </h3>
                  {lastChapter && (
                    <p className="text-xs text-ink-300 dark:text-ink-200 line-clamp-1">
                      Ch. {lastChapter.order} · {t(lastChapter.title)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
                    <div
                      className="h-full bg-lumen-400 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-ink-300 dark:text-ink-200">
                    {percent}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 dark:text-ink-200" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  label,
  count,
  icon,
}: {
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon ?? <BookOpen className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />}
        <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-ink-50">{label}</h2>
      </div>
      {count != null && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200 tabular-nums">
          {count} {count === 1 ? 'work' : 'works'}
        </span>
      )}
    </div>
  );
}

function SortControl({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-paper-300/70 bg-paper-50/80 px-3.5 py-2.5 text-xs font-medium text-ink-700 shadow-soft backdrop-blur-md transition-colors focus-within:border-lumen-400/60 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100">
      <span className="uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="bg-transparent outline-none"
      >
        <option value="title-asc">A–Z</option>
        <option value="title-desc">Z–A</option>
        <option value="author-asc">Author</option>
      </select>
    </label>
  );
}
