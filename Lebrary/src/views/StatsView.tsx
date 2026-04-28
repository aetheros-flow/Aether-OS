import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Flame,
  GraduationCap,
  Heart,
  Highlighter,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBooks } from '@/hooks/useBooks';
import { useFavorites } from '@/hooks/useFavorites';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useQuizAttempts } from '@/hooks/useQuizAttempts';
import { useHighlights } from '@/hooks/useHighlights';
import { useQuizReviews } from '@/hooks/useQuizReviews';
import { useContentLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/common/LoadingState';
import type { Book } from '@/types';

export function StatsView() {
  const { user } = useAuth();
  const { books, loading: booksLoading } = useBooks();
  const { favoriteSet } = useFavorites();
  const { progress } = useReadingProgress();
  const { attempts } = useQuizAttempts();
  const { allHighlights } = useHighlights();
  const { dueCount } = useQuizReviews();
  const { t } = useContentLanguage();

  const loading = booksLoading;

  const stats = useMemo(() => {
    const chaptersReadByDate = new Map<string, number>(); // YYYY-MM-DD → count
    let chaptersReadTotal = 0;
    const genreCounts = new Map<string, number>();
    let booksStarted = 0;
    let booksCompleted = 0;

    for (const book of books) {
      const p = progress[book.id];
      if (!p) continue;
      booksStarted++;
      chaptersReadTotal += p.completedChapterIds.length;

      // Prefer explicit finishedAt (AetherOS-queryable source of truth).
      // Fall back to derived completion for books finished before schema-v4.
      if (p.finishedAt || (book.chapters.length > 0 && p.completedChapterIds.length >= book.chapters.length)) {
        booksCompleted++;
      }

      const day = p.lastReadAt.slice(0, 10);
      chaptersReadByDate.set(day, (chaptersReadByDate.get(day) ?? 0) + p.completedChapterIds.length);

      for (const g of book.genre ?? []) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      }
    }

    // Reading streak — consecutive days ending today with activity.
    const streak = computeStreak(chaptersReadByDate);

    // Quiz stats.
    const allAttempts = Object.values(attempts).flat();
    const totalAttempts = allAttempts.length;
    const avgScorePct =
      totalAttempts === 0
        ? null
        : Math.round(
            (allAttempts.reduce((s, a) => s + a.score / a.totalQuestions, 0) / totalAttempts) *
              100,
          );

    const bestAttempt = allAttempts.reduce<{ book: Book; score: number; total: number } | null>(
      (acc, a) => {
        const book = books.find((b) => b.id === a.bookId);
        if (!book) return acc;
        const pct = a.score / a.totalQuestions;
        if (!acc || pct > acc.score / acc.total) {
          return { book, score: a.score, total: a.totalQuestions };
        }
        return acc;
      },
      null,
    );

    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      chaptersReadTotal,
      booksStarted,
      booksCompleted,
      streak,
      totalAttempts,
      avgScorePct,
      bestAttempt,
      topGenres,
      totalHighlights: allHighlights.length,
      totalFavorites: favoriteSet.size,
      totalBooks: books.length,
    };
  }, [books, progress, attempts, allHighlights, favoriteSet]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-ink-300 dark:text-ink-200">Sign in to see your stats.</p>
      </div>
    );
  }

  if (loading) return <LoadingState label="Measuring your library…" />;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Your reading
          </span>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          How you've been reading
        </h1>
        <p className="max-w-xl text-ink-700 dark:text-ink-100">
          A quiet summary of your time with books on Lumina. Everything private, everything yours.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Current streak"
          value={stats.streak === 0 ? '—' : `${stats.streak}`}
          hint={stats.streak === 1 ? 'day' : 'days'}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Chapters read"
          value={stats.chaptersReadTotal.toString()}
          hint={`in ${stats.booksStarted} ${stats.booksStarted === 1 ? 'book' : 'books'}`}
        />
        <StatCard
          icon={<Award className="h-4 w-4" />}
          label="Books finished"
          value={stats.booksCompleted.toString()}
          hint={`of ${stats.totalBooks} in library`}
        />
        <StatCard
          icon={<Highlighter className="h-4 w-4" />}
          label="Highlights saved"
          value={stats.totalHighlights.toString()}
          hint={`${stats.totalFavorites} favorites`}
        />
      </section>

      {dueCount() > 0 && (
        <Link
          to="/review"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-lumen-400/40 bg-lumen-400/10 p-5 transition-all hover:border-lumen-400/60 hover:shadow-glow"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lumen-400/20 text-lumen-600 dark:text-lumen-400">
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
                {dueCount()} question{dueCount() === 1 ? '' : 's'} due today
              </p>
              <p className="text-xs text-ink-700 dark:text-ink-100">
                Spaced repetition keeps what you've read from slipping away.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lumen-600 dark:text-lumen-400">
            Start review →
          </span>
        </Link>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
            <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
              Quiz performance
            </h2>
          </div>
          {stats.totalAttempts === 0 ? (
            <p className="text-sm text-ink-300 dark:text-ink-200">
              You haven't taken any quizzes yet. Finish a chapter and try one.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-semibold tabular-nums text-ink-900 dark:text-ink-50">
                  {stats.avgScorePct}%
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
                  average · {stats.totalAttempts} {stats.totalAttempts === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              {stats.bestAttempt && (
                <div className="rounded-2xl border border-lumen-400/30 bg-lumen-400/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lumen-600 dark:text-lumen-300">
                    Best attempt
                  </p>
                  <p className="mt-1 font-serif text-sm text-ink-900 dark:text-ink-50">
                    <Link
                      to={`/books/${stats.bestAttempt.book.id}`}
                      className="hover:text-lumen-600 dark:hover:text-lumen-400"
                    >
                      {t(stats.bestAttempt.book.title)}
                    </Link>{' '}
                    — {stats.bestAttempt.score} / {stats.bestAttempt.total}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
            <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">
              Genres you read
            </h2>
          </div>
          {stats.topGenres.length === 0 ? (
            <p className="text-sm text-ink-300 dark:text-ink-200">
              No genres yet. Start a book to populate this.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.topGenres.map(([name, count]) => {
                const pct = Math.round((count / stats.booksStarted) * 100);
                return (
                  <li key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-900 dark:text-ink-50">{name}</span>
                      <span className="tabular-nums text-ink-300 dark:text-ink-200">{count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
                      <div
                        className="h-full rounded-full bg-lumen-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {stats.totalFavorites > 0 && (
        <section className="space-y-2 text-center">
          <Heart className="mx-auto h-4 w-4 fill-current text-lumen-500 dark:text-lumen-400" />
          <p className="text-sm text-ink-700 dark:text-ink-100">
            You've pinned{' '}
            <Link to="/favorites" className="font-semibold text-lumen-600 hover:underline dark:text-lumen-400">
              {stats.totalFavorites} favorite{stats.totalFavorites === 1 ? '' : 's'}
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5 text-lumen-500 dark:text-lumen-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 font-serif text-4xl font-semibold tabular-nums text-ink-900 dark:text-ink-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-ink-300 dark:text-ink-200">{hint}</p>
      )}
    </Card>
  );
}

function computeStreak(activityByDay: Map<string, number>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((activityByDay.get(key) ?? 0) > 0) {
      streak++;
    } else if (i === 0) {
      // no activity today → still check yesterday in case "today" hasn't happened yet.
      continue;
    } else {
      break;
    }
  }
  return streak;
}
