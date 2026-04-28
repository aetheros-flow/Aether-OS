import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  NotebookPen,
  Trophy,
} from 'lucide-react';
import { useBook } from '@/hooks/useBooks';
import { useAuthor } from '@/hooks/useAuthors';
import { useContentLanguage } from '@/context/LanguageContext';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useQuizAttempts } from '@/hooks/useQuizAttempts';
import { useHighlights } from '@/hooks/useHighlights';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookCover } from '@/components/books/BookCover';
import { FavoriteButton } from '@/components/books/FavoriteButton';
import { DeleteBookButton } from '@/components/books/DeleteBookButton';
import { BookRating } from '@/components/books/BookRating';
import { AddToCollectionMenu } from '@/components/collections/AddToCollectionMenu';
import { ErrorState, LoadingState } from '@/components/common/LoadingState';
import { resolveOriginalFileUrl } from '@/lib/storage-urls';

export function BookDetailView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading: bookLoading, error: bookError } = useBook(bookId);
  const { author } = useAuthor(book?.authorId);
  const { t } = useContentLanguage();
  const { getBookProgress, markBookFinished, unmarkBookFinished } = useReadingProgress();
  const { bestScore } = useQuizAttempts();
  const { getForBook } = useHighlights();

  if (bookLoading) return <LoadingState label="Opening the book…" />;
  if (bookError) return <ErrorState message={bookError.message} />;
  if (!book) return <ErrorState message="Book not found." />;

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const progress = getBookProgress(book.id);
  const completedIds = new Set(progress?.completedChapterIds ?? []);
  const lastReadChapter = progress?.lastReadChapterId
    ? sortedChapters.find((c) => c.id === progress.lastReadChapterId)
    : null;
  const startChapter = lastReadChapter ?? sortedChapters[0] ?? null;
  const completedCount = sortedChapters.filter((c) => completedIds.has(c.id)).length;
  const totalChapters = sortedChapters.length;
  const progressPercent = totalChapters === 0 ? 0 : Math.round((completedCount / totalChapters) * 100);
  const best = bestScore(book.id);
  const hasQuiz = book.quiz.length > 0;
  const bookHighlights = getForBook(book.id);

  const goToReader = (order: number) => navigate(`/books/${book.id}/read/${order}`);

  return (
    <article className="space-y-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to library
      </Link>

      <header className="grid gap-12 lg:grid-cols-[340px,1fr]">
        <div className="mx-auto w-full max-w-[300px] lg:mx-0">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-lumen-400/10 blur-3xl" aria-hidden />
            <div className="relative aspect-[2/3] overflow-hidden rounded-3xl border border-paper-300/70 shadow-soft-lg dark:border-ink-700/60">
              <BookCover
                title={t(book.title)}
                author={author?.name}
                src={book.coverImage || undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-7">
          {book.genre && book.genre.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.genre.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-paper-300/70 bg-paper-50/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-700 dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-100"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink-900 dark:text-ink-50 md:text-5xl lg:text-6xl">
              {t(book.title)}
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <FavoriteButton bookId={book.id} />
              <DeleteBookButton bookId={book.id} bookTitle={t(book.title)} />
            </div>
          </div>

          {author && (
            <Link
              to={`/authors/${author.id}`}
              className="inline-flex items-center gap-2 text-sm text-ink-700 transition-colors hover:text-lumen-500 dark:text-ink-100 dark:hover:text-lumen-400"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">By</span>
              <span className="font-medium">{author.name}</span>
              {(book.publicationYear || book.originalLanguage) && (
                <span className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                  · {[book.publicationYear, book.originalLanguage?.toUpperCase()].filter(Boolean).join(' · ')}
                </span>
              )}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <div className="pl-8 pt-2">
            <p className="epigraph max-w-2xl">{t(book.description)}</p>
          </div>

          <BookRating bookId={book.id} />


          {totalChapters > 0 && (
            <div className="max-w-md space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-ink-300 dark:text-ink-200">
                <span>Reading progress</span>
                <span className="tabular-nums">{completedCount} / {totalChapters}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
                <div
                  className="h-full rounded-full bg-lumen-400 transition-all duration-700 ease-smooth"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progress?.finishedAt ? (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-lumen-400/40 bg-lumen-400/10 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-lumen-600 dark:text-lumen-400" />
                  <span className="flex-1 text-xs font-medium text-lumen-700 dark:text-lumen-300">
                    Finished on {new Date(progress.finishedAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => unmarkBookFinished(book.id)}
                    className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 transition-colors hover:text-red-500 dark:text-ink-200"
                  >
                    Unmark
                  </button>
                </div>
              ) : completedCount >= totalChapters && totalChapters > 0 ? (
                <button
                  type="button"
                  onClick={() => markBookFinished(book.id)}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-lumen-400/40 bg-lumen-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-lumen-700 transition-all hover:bg-lumen-400/15 dark:text-lumen-300"
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark as finished
                </button>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {startChapter && (
              <Button
                variant="primary"
                size="lg"
                leadingIcon={<BookOpen className="h-4 w-4" />}
                onClick={() => goToReader(startChapter.order)}
              >
                {lastReadChapter ? 'Continue reading' : 'Start reading'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<GraduationCap className="h-4 w-4" />}
              disabled={!hasQuiz}
              onClick={() => navigate(`/books/${book.id}/quiz`)}
            >
              {best != null ? `Retake quiz · best ${best}/${book.quiz.length}` : 'Take the quiz'}
            </Button>
            {bookHighlights.length > 0 && (
              <Button
                variant="ghost"
                size="lg"
                leadingIcon={<NotebookPen className="h-4 w-4" />}
                onClick={() => navigate(`/notebook?book=${book.id}`)}
              >
                Notebook · {bookHighlights.length}
              </Button>
            )}
            <AddToCollectionMenu bookId={book.id} />
            {(() => {
              const url = resolveOriginalFileUrl(book);
              if (!url || !book.originalFile) return null;
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-visible:outline-none"
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    leadingIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Open {book.originalFile.format.toUpperCase()}
                  </Button>
                </a>
              );
            })()}
          </div>
        </div>
      </header>

      {best != null && (
        <Card className="flex items-center gap-4 px-6 py-5">
          <Trophy className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
          <div className="text-sm">
            <p className="font-semibold text-ink-900 dark:text-ink-50">
              Best quiz score: {best} / {book.quiz.length}
            </p>
            <p className="text-ink-300 dark:text-ink-200">
              {Math.round((best / book.quiz.length) * 100)}% — retake the quiz to improve it.
            </p>
          </div>
        </Card>
      )}

      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink-900 dark:text-ink-50">
            Chapters
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200 tabular-nums">
            {totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}
          </span>
        </div>

        <div className="space-y-3">
          {sortedChapters.map((chapter) => {
            const isDone = completedIds.has(chapter.id);
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => goToReader(chapter.order)}
                className="group block w-full text-left focus-visible:outline-none"
              >
                <Card interactive className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="flex items-center gap-5">
                    <CompletionRing done={isDone} order={chapter.order} />
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
                        {t(chapter.title)}
                      </h3>
                      {chapter.estimatedReadingMinutes ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                          {chapter.estimatedReadingMinutes} min read
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1 dark:text-ink-200" />
                </Card>
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
}

function CompletionRing({ done, order }: { done: boolean; order: number }) {
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="20"
          className={done ? 'stroke-lumen-400' : 'stroke-paper-300 dark:stroke-ink-700'}
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`font-serif text-lg font-semibold tabular-nums ${
            done ? 'text-lumen-500 dark:text-lumen-400' : 'text-ink-700 dark:text-ink-100'
          }`}
        >
          {String(order).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
