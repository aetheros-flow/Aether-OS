import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Flame, Sparkles, X } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useQuizReviews } from '@/hooks/useQuizReviews';
import { useContentLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/common/LoadingState';
import type { Book, QuizQuestion } from '@/types';

type Phase = 'selecting' | 'revealed' | 'graded' | 'done';

interface DueQuestion {
  question: QuizQuestion;
  book: Book;
}

export function ReviewView() {
  const { books, loading: booksLoading } = useBooks();
  const { dueNow, gradeCard, loading: reviewsLoading } = useQuizReviews();
  const { t } = useContentLanguage();

  const dueSet = useMemo(() => new Set(dueNow()), [dueNow]);

  const dueQuestions = useMemo<DueQuestion[]>(() => {
    const out: DueQuestion[] = [];
    for (const book of books) {
      for (const q of book.quiz) {
        if (dueSet.has(q.id)) out.push({ question: q, book });
      }
    }
    return out;
  }, [books, dueSet]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('selecting');
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const current = dueQuestions[index];
  const done = index >= dueQuestions.length;

  const loading = booksLoading || reviewsLoading;
  if (loading) return <LoadingState label="Loading today's review…" />;

  if (dueQuestions.length === 0) {
    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
              Daily review
            </span>
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
            Nothing due today
          </h1>
        </section>
        <EmptyState
          title="You're caught up ✨"
          hint="Finish a quiz on a book to seed questions into your review schedule. Wrong answers come back tomorrow, correct ones space out."
        />
      </div>
    );
  }

  if (done) {
    const pct = sessionStats.total === 0 ? 0 : Math.round((sessionStats.correct / sessionStats.total) * 100);
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-6 text-center">
        <Flame className="mx-auto h-10 w-10 text-lumen-500 dark:text-lumen-400" />
        <h1 className="font-serif text-4xl font-semibold text-ink-900 dark:text-ink-50">
          Session complete
        </h1>
        <p className="text-ink-700 dark:text-ink-100">
          You graded <strong>{sessionStats.total}</strong> cards · {pct}% recalled correctly.
          {' '}The deck is re-scheduled based on how each one felt.
        </p>
        <Link to="/stats">
          <Button variant="primary">See your stats</Button>
        </Link>
      </div>
    );
  }

  const submit = () => {
    if (selected == null) return;
    setPhase('revealed');
  };

  const grade = async (rating: 0 | 1 | 2 | 3) => {
    if (!current) return;
    const wasCorrect = rating >= 2;
    setSessionStats((s) => ({ correct: s.correct + (wasCorrect ? 1 : 0), total: s.total + 1 }));
    setPhase('graded');
    await gradeCard(current.question.id, rating);
    setIndex((i) => i + 1);
    setSelected(null);
    setPhase('selecting');
  };

  const q = current!.question;
  const book = current!.book;
  const isCorrect = selected === q.correctOption;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
            Daily review
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200 tabular-nums">
          {index + 1} / {dueQuestions.length}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
        <div
          className="h-full bg-lumen-400 transition-all duration-500"
          style={{ width: `${(index / dueQuestions.length) * 100}%` }}
        />
      </div>

      <Card className="space-y-8 p-8">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
            <Link to={`/books/${book.id}`} className="hover:text-lumen-500 dark:hover:text-lumen-400">
              {t(book.title)}
            </Link>
            {' · '}{q.difficulty}
          </p>
          <h2 className="font-serif text-2xl font-semibold leading-snug text-ink-900 dark:text-ink-50 md:text-3xl">
            {t(q.question)}
          </h2>
        </div>

        <ul className="space-y-3">
          {q.options.map((option, idx) => {
            const isSel = selected === idx;
            const isRight = idx === q.correctOption;
            const revealed = phase === 'revealed' || phase === 'graded';
            const state = revealed
              ? isRight ? 'correct'
              : isSel ? 'incorrect' : 'idle'
              : isSel ? 'selected' : 'idle';
            return (
              <li key={idx}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => !revealed && setSelected(idx)}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-base transition-all ${
                    state === 'selected'
                      ? 'border-lumen-400 bg-lumen-400/10 text-ink-900 dark:text-ink-50'
                      : state === 'correct'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                        : state === 'incorrect'
                          ? 'border-red-500/60 bg-red-500/10 text-red-900 dark:text-red-100'
                          : 'border-paper-300/70 bg-paper-50/60 text-ink-700 hover:border-lumen-400/50 dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-100'
                  }`}
                >
                  <span className="flex-1">{t(option)}</span>
                  {state === 'correct' && <Check className="h-5 w-5 shrink-0" />}
                  {state === 'incorrect' && <X className="h-5 w-5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>

        {phase === 'revealed' && q.explanation && t(q.explanation) && (
          <div className="rounded-2xl border border-lumen-400/40 bg-lumen-400/5 p-5 text-sm leading-relaxed text-ink-700 dark:text-ink-100">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Explanation</p>
            <p>{t(q.explanation)}</p>
          </div>
        )}

        {phase === 'selecting' && (
          <div className="flex justify-end">
            <Button disabled={selected == null} onClick={submit} trailingIcon={<ArrowRight className="h-4 w-4" />}>
              Reveal answer
            </Button>
          </div>
        )}

        {phase === 'revealed' && (
          <div className="space-y-2">
            <p className="text-center text-xs text-ink-300 dark:text-ink-200">
              How well did you recall this?
            </p>
            <div className="grid grid-cols-4 gap-2">
              <GradeButton
                tone="red"
                label="Again"
                hint="< 1 day"
                onClick={() => grade(0)}
              />
              <GradeButton
                tone="amber"
                label="Hard"
                hint={isCorrect ? 'shorter' : 'lapse'}
                onClick={() => grade(1)}
              />
              <GradeButton
                tone="lumen"
                label="Good"
                hint="normal"
                onClick={() => grade(2)}
              />
              <GradeButton
                tone="emerald"
                label="Easy"
                hint="longer"
                onClick={() => grade(3)}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function GradeButton({
  tone,
  label,
  hint,
  onClick,
}: {
  tone: 'red' | 'amber' | 'lumen' | 'emerald';
  label: string;
  hint: string;
  onClick: () => void;
}) {
  const base = 'flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-all hover:-translate-y-0.5';
  const styles: Record<typeof tone, string> = {
    red: 'border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300',
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300',
    lumen: 'border-lumen-400/50 bg-lumen-400/15 text-lumen-700 hover:bg-lumen-400/25 dark:text-lumen-300',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300',
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles[tone]}`}>
      <span>{label}</span>
      <span className="text-[10px] font-normal opacity-70">{hint}</span>
    </button>
  );
}
