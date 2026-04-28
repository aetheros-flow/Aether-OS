import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthors';
import { useBooks } from '@/hooks/useBooks';
import { useContentLanguage } from '@/context/LanguageContext';
import { BookCard } from '@/components/books/BookCard';
import { ErrorState, LoadingState } from '@/components/common/LoadingState';

export function AuthorProfileView() {
  const { authorId } = useParams<{ authorId: string }>();
  const { author, loading, error } = useAuthor(authorId);
  const { books } = useBooks();
  const { t } = useContentLanguage();

  if (loading) return <LoadingState label="Gathering the author's archive…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!author) return <ErrorState message="Author not found." />;

  const relatedBooks = books.filter((b) => b.authorId === author.id);
  const yearsLabel = formatYears(author.birthYear, author.deathYear);

  return (
    <article className="space-y-14">
      <Link
        to="/authors"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All authors
      </Link>

      <header className="grid gap-10 lg:grid-cols-[280px,1fr]">
        <div className="mx-auto w-full max-w-[240px] lg:mx-0">
          <div className="aspect-square overflow-hidden rounded-3xl border border-paper-300/70 bg-paper-200 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-800">
            {author.image && (
              <img src={author.image} alt={author.name} className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
              Author
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
              {author.name}
            </h1>
            {(yearsLabel || author.nationality) && (
              <p className="text-sm text-ink-300 dark:text-ink-200">
                {[yearsLabel, author.nationality].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <p className="reading-body max-w-2xl text-ink-700 dark:text-ink-100">{t(author.bio)}</p>
        </div>
      </header>

      {author.accomplishments.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-ink-900 dark:text-ink-50">
            <Award className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
            Accomplishments
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {author.accomplishments.map((item, idx) => (
              <li
                key={idx}
                className="rounded-2xl border border-paper-300/70 bg-paper-50/60 p-5 text-sm leading-relaxed text-ink-700 dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-100"
              >
                {t(item)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink-900 dark:text-ink-50">
            Works in the library
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedBooks.map((book) => (
              <BookCard key={book.id} book={book} author={author} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function formatYears(birth?: number, death?: number): string | null {
  if (!birth && !death) return null;
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `b. ${birth}`;
  return `d. ${death}`;
}
