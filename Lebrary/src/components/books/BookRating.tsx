import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useBookRating } from '@/hooks/useBookRating';

interface BookRatingProps {
  bookId: string;
}

export function BookRating({ bookId }: BookRatingProps) {
  const { rating, loading, setRating, clearRating } = useBookRating(bookId);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState('');
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    setReviewDraft(rating?.review ?? '');
  }, [rating?.review]);

  if (loading) {
    return (
      <div className="h-7 w-40 animate-pulse rounded-full bg-paper-200 dark:bg-ink-800" />
    );
  }

  const displayStars = hoverStar ?? rating?.stars ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200">
          Your rating
        </span>
        <div
          className="ml-1 flex items-center gap-0.5"
          onMouseLeave={() => setHoverStar(null)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= displayStars;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onMouseEnter={() => setHoverStar(n)}
                onClick={() => setRating(n)}
                className="group p-0.5 transition-transform hover:scale-125"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    active
                      ? 'fill-lumen-400 text-lumen-400'
                      : 'text-ink-300 group-hover:text-lumen-400 dark:text-ink-200'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {rating && (
          <>
            <button
              type="button"
              onClick={() => setShowReview((v) => !v)}
              className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-300 hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
            >
              {rating.review ? 'Edit review' : 'Add review'}
            </button>
            <button
              type="button"
              onClick={clearRating}
              aria-label="Clear rating"
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-ink-200"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {showReview && rating && (
        <div className="max-w-md space-y-2">
          <textarea
            value={reviewDraft}
            onChange={(e) => setReviewDraft(e.target.value)}
            onBlur={() => {
              if (reviewDraft !== rating.review) {
                void setRating(rating.stars, reviewDraft);
              }
            }}
            placeholder="What did this book leave with you?"
            rows={3}
            className="w-full resize-none rounded-xl border border-paper-300/70 bg-paper-50/70 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-50 dark:placeholder:text-ink-200"
          />
          <p className="text-[10px] text-ink-300 dark:text-ink-200">
            Private · only visible to you. Saved automatically.
          </p>
        </div>
      )}
    </div>
  );
}
