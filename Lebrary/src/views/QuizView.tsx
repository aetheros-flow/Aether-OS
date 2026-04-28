import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, RotateCcw, X } from 'lucide-react';
import { useBook } from '@/hooks/useBooks';
import { useContentLanguage } from '@/context/LanguageContext';
import { useQuizAttempts } from '@/hooks/useQuizAttempts';
import { useQuizReviews } from '@/hooks/useQuizReviews';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, LoadingState } from '@/components/common/LoadingState';
import type { Book, QuizAttempt } from '@/types';

type Phase = 'selecting' | 'revealed' | 'finished';
type Tier = 'mastered' | 'solid' | 'learning' | 'reread';

const TIER_COPY: Record<Tier, { title: string; hint: string }> = {
  mastered: { title: 'Mastered', hint: 'An exceptional grasp of the material.' },
  solid: { title: 'Solid', hint: 'Good understanding — refine the edges.' },
  learning: { title: 'Learning', hint: 'The foundations are there. Revisit the chapters.' },
  reread: { title: 'Reread recommended', hint: 'Take another pass through the book.' },
};

export function QuizView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading, error } = useBook(bookId);
  const { recordAttempt } = useQuizAttempts();
  const { ingestQuizResult } = useQuizReviews();
  const { t } = useContentLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('selecting');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAttempt, setFinalAttempt] = useState<QuizAttempt | null>(null);

  if (loading) return <LoadingState label="Preparing the quiz…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!book) return <ErrorState message="Book not found." />;
  if (book.quiz.length === 0) {
    return <ErrorState message="This book doesn't have any quiz questions yet." />;
  }

  const questions = book.quiz;
  const question = questions[currentIndex];

  const reset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setPhase('selecting');
    setAnswers({});
    setFinalAttempt(null);
  };

  const submitAnswer = () => {
    if (selectedOption == null) return;
    setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));
    setPhase('revealed');
  };

  const advance = () => {
    const nextIndex = currentIndex + 1;
    const finalAnswers = { ...answers, [question.id]: selectedOption! };
    if (nextIndex >= questions.length) {
      const score = questions.reduce(
        (acc, q) => (finalAnswers[q.id] === q.correctOption ? acc + 1 : acc),
        0,
      );
      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}`,
        bookId: book.id,
        answers: finalAnswers,
        score,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
      };
      recordAttempt(attempt);
      // Seed the spaced-repetition scheduler with this session's outcomes.
      // Correct → card schedules further out; wrong → card comes back tomorrow.
      void Promise.all(
        questions.map((q) => ingestQuizResult(q.id, finalAnswers[q.id] === q.correctOption)),
      );
      setFinalAttempt(attempt);
      setPhase('finished');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setPhase('selecting');
    }
  };

  if (phase === 'finished' && finalAttempt) {
    return (
      <QuizResults
        book={book}
        attempt={finalAttempt}
        onRetake={reset}
        onBack={() => navigate(`/books/${book.id}`)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="flex items-center justify-between">
        <Link
          to={`/books/${book.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Exit quiz
        </Link>
        <p className="tabular-nums text-xs font-semibold uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
          Question {currentIndex + 1} / {questions.length}
        </p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-paper-300 dark:bg-ink-700">
        <div
          className="h-full bg-lumen-400 transition-all duration-500 ease-smooth"
          style={{ width: `${((currentIndex + (phase === 'revealed' ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="space-y-8 p-8 md:p-10">
        <div className="space-y-3">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${
              question.difficulty === 'hard'
                ? 'border-lumen-600/50 bg-lumen-600/10 text-lumen-600 dark:border-lumen-400/40 dark:bg-lumen-400/10 dark:text-lumen-300'
                : 'border-paper-300/70 bg-paper-100/70 text-ink-700 dark:border-ink-700/60 dark:bg-ink-700/30 dark:text-ink-100'
            }`}
          >
            {question.difficulty}
          </span>
          <h2 className="font-serif text-2xl font-semibold leading-snug text-ink-900 dark:text-ink-50 md:text-3xl">
            {t(question.question)}
          </h2>
        </div>

        <ul className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isRight = idx === question.correctOption;
            const revealed = phase === 'revealed';
            const state = revealed
              ? isRight
                ? 'correct'
                : isSelected
                  ? 'incorrect'
                  : 'idle'
              : isSelected
                ? 'selected'
                : 'idle';

            return (
              <li key={idx}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => !revealed && setSelectedOption(idx)}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-base transition-all ${
                    state === 'selected'
                      ? 'border-lumen-400 bg-lumen-400/10 text-ink-900 shadow-soft dark:text-ink-50'
                      : state === 'correct'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/60 dark:text-emerald-100'
                        : state === 'incorrect'
                          ? 'border-red-500/60 bg-red-500/10 text-red-900 dark:border-red-400/60 dark:text-red-100'
                          : 'border-paper-300/70 bg-paper-50/60 text-ink-700 hover:-translate-y-0.5 hover:border-lumen-400/50 hover:bg-paper-50 dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-100 dark:hover:border-lumen-400/40'
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

        {phase === 'revealed' && question.explanation && t(question.explanation) && (
          <div
            className={`rounded-2xl border p-5 ${
              selectedOption === question.correctOption
                ? 'border-emerald-400/40 bg-emerald-400/5 text-emerald-900 dark:text-emerald-100'
                : 'border-lumen-400/40 bg-lumen-400/5 text-ink-700 dark:text-ink-100'
            }`}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
              Explanation
            </p>
            <p className="leading-relaxed">{t(question.explanation)}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {phase === 'selecting' ? (
            <Button disabled={selectedOption == null} onClick={submitAnswer}>
              Submit answer
            </Button>
          ) : (
            <Button onClick={advance} trailingIcon={<ArrowRight className="h-4 w-4" />}>
              {currentIndex + 1 >= questions.length ? 'See results' : 'Next question'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

interface QuizResultsProps {
  book: Book;
  attempt: QuizAttempt;
  onRetake: () => void;
  onBack: () => void;
}

function QuizResults({ book, attempt, onRetake, onBack }: QuizResultsProps) {
  const { t } = useContentLanguage();
  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const tier: Tier =
    percentage >= 80 ? 'mastered' : percentage >= 60 ? 'solid' : percentage >= 40 ? 'learning' : 'reread';
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
          {t(book.title)} · quiz complete
        </p>
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" className="fill-none stroke-paper-300 dark:stroke-ink-700" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none stroke-lumen-400 transition-all duration-700 ease-smooth"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percentage / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl font-semibold tabular-nums text-ink-900 dark:text-ink-50">
              {percentage}%
            </span>
            <span className="text-xs uppercase tracking-widest text-ink-300 dark:text-ink-200">
              {attempt.score} / {attempt.totalQuestions}
            </span>
          </div>
        </div>
        <h2 className="font-serif text-3xl font-semibold text-ink-900 dark:text-ink-50">
          {TIER_COPY[tier].title}
        </h2>
        <p className="mx-auto max-w-md text-ink-700 dark:text-ink-100">{TIER_COPY[tier].hint}</p>
      </div>

      <section className="space-y-3">
        <h3 className="font-serif text-xl font-semibold text-ink-900 dark:text-ink-50">Review</h3>
        {book.quiz.map((q, i) => {
          const answered = attempt.answers[q.id];
          const wasCorrect = answered === q.correctOption;
          return (
            <Card key={q.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="font-serif text-base text-ink-900 dark:text-ink-50">
                  <span className="mr-2 tabular-nums text-lumen-500 dark:text-lumen-400">{i + 1}.</span>
                  {t(q.question)}
                </p>
                {wasCorrect ? (
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <X className="h-5 w-5 shrink-0 text-red-500" />
                )}
              </div>
              <div className="grid gap-1 pl-6 text-sm">
                <p className={wasCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>
                  <span className="opacity-60">Your answer: </span>
                  {answered != null ? t(q.options[answered]) : 'No answer'}
                </p>
                {!wasCorrect && (
                  <p className="text-emerald-700 dark:text-emerald-300">
                    <span className="opacity-60">Correct: </span>
                    {t(q.options[q.correctOption])}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back to book
        </Button>
        <Button variant="primary" leadingIcon={<RotateCcw className="h-4 w-4" />} onClick={onRetake}>
          Retake quiz
        </Button>
      </div>
    </div>
  );
}
