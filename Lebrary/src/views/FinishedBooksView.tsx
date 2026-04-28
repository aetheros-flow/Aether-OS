import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useContentLanguage } from '@/context/LanguageContext';
import { BookCover } from '@/components/books/BookCover';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/LoadingState';
import type { Author, Book, ReadingProgress } from '@/types';

interface FinishedEntry {
  book: Book;
  author?: Author;
  progress: ReadingProgress;
  finishedAt: Date;
}

export function FinishedBooksView() {
  const { books, loading: booksLoading, error: booksError } = useBooks();
  const { authors, loading: authorsLoading, error: authorsError } = useAuthors();
  const { progress, loading: progressLoading } = useReadingProgress();
  const { t } = useContentLanguage();

  const authorById = useMemo(() => {
    const m = new Map<string, Author>();
    authors.forEach((a) => m.set(a.id, a));
    return m;
  }, [authors]);

  const finished = useMemo<FinishedEntry[]>(() => {
    const out: FinishedEntry[] = [];
    for (const book of books) {
      const p = progress[book.id];
      if (!p?.finishedAt) continue;
      out.push({
        book,
        author: authorById.get(book.authorId),
        progress: p,
        finishedAt: new Date(p.finishedAt),
      });
    }
    out.sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime());
    return out;
  }, [books, progress, authorById]);

  const loading = booksLoading || authorsLoading || progressLoading;
  const error = booksError ?? authorsError;

  // Compute bucket stats
  const { thisMonth, thisYear, totalPages } = useMemo(() => {
    const now = new Date();
    let thisMonth = 0;
    let thisYear = 0;
    let totalPages = 0;
    for (const e of finished) {
      const d = e.finishedAt;
      if (d.getFullYear() === now.getFullYear()) thisYear++;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) thisMonth++;
      totalPages += e.book.chapters.reduce(
        (acc, c) => acc + (c.estimatedReadingMinutes ?? 3),
        0,
      );
    }
    return { thisMonth, thisYear, totalPages };
  }, [finished]);

  if (loading) return <LoadingState label="Gathering your finished books…" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Finished
          </span>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          Books you've read through
        </h1>
        <p className="max-w-xl text-ink-700 dark:text-ink-100">
          {finished.length === 0
            ? "Your finished shelf is empty. Reach the last chapter of a book and it'll appear here automatically."
            : `${finished.length} book${finished.length === 1 ? '' : 's'} fully read. Your archive of completed journeys.`}
        </p>
      </section>

      {finished.length > 0 && (
        <section className="grid grid-cols-3 gap-4">
          <StatPill icon={<Award className="h-4 w-4" />} label="Total read" value={finished.length} />
          <StatPill icon={<Calendar className="h-4 w-4" />} label="This month" value={thisMonth} />
          <StatPill icon={<CheckCircle2 className="h-4 w-4" />} label="This year" value={thisYear} hint={`~${totalPages} min read`} />
        </section>
      )}

      {finished.length === 0 ? (
        <EmptyState
          title="No finished books yet"
          hint="The shelf fills itself — when you read the last chapter of any book, it lands here with a timestamp."
        />
      ) : (
        <section className="space-y-8">
          {groupByPeriod(finished).map(([label, entries]) => (
            <div key={label} className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-300 dark:text-ink-200">
                <span className="h-px flex-1 bg-paper-300 dark:bg-ink-700" />
                <span>{label}</span>
                <span className="tabular-nums text-ink-400">· {entries.length}</span>
                <span className="h-px flex-1 bg-paper-300 dark:bg-ink-700" />
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {entries.map(({ book, author, finishedAt }) => (
                  <li key={book.id}>
                    <Link to={`/books/${book.id}`} className="block">
                      <Card interactive className="flex gap-4 p-4">
                        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg shadow-soft">
                          <BookCover
                            title={t(book.title)}
                            author={author?.name}
                            src={book.coverImage || undefined}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                          <div className="space-y-0.5">
                            <h3 className="font-serif text-sm font-semibold leading-tight text-ink-900 line-clamp-2 dark:text-ink-50">
                              {t(book.title)}
                            </h3>
                            {author && (
                              <p className="font-serif text-xs italic text-ink-300 dark:text-ink-200">
                                {author.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-lumen-500 dark:text-lumen-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="tabular-nums">
                              {finishedAt.toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {(book.genre?.[0]) && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                                <span className="normal-case tracking-normal text-ink-300 dark:text-ink-200">
                                  {book.genre[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-lumen-500 dark:text-lumen-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-ink-900 dark:text-ink-50">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-ink-300 dark:text-ink-200">
          <Clock className="h-2.5 w-2.5" /> {hint}
        </p>
      )}
    </Card>
  );
}

function groupByPeriod(entries: FinishedEntry[]): Array<[string, FinishedEntry[]]> {
  const now = new Date();
  const thisYear = now.getFullYear();
  const groups = new Map<string, FinishedEntry[]>();

  for (const e of entries) {
    const d = e.finishedAt;
    const label =
      d.getFullYear() === thisYear
        ? d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : String(d.getFullYear());
    const arr = groups.get(label) ?? [];
    arr.push(e);
    groups.set(label, arr);
  }
  return [...groups.entries()];
}
