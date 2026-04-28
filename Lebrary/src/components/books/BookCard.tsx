import { Link } from 'react-router-dom';
import type { Author, Book } from '@/types';
import { useContentLanguage } from '@/context/LanguageContext';
import { BookCover } from '@/components/books/BookCover';
import { FavoriteButton } from '@/components/books/FavoriteButton';

interface BookCardProps {
  book: Book;
  author?: Author;
}

export function BookCard({ book, author }: BookCardProps) {
  const { t } = useContentLanguage();
  const title = t(book.title);

  return (
    <Link
      to={`/books/${book.id}`}
      className="group block focus-visible:outline-none"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute -inset-2 rounded-[2rem] bg-lumen-400/0 blur-xl transition-all duration-500 group-hover:bg-lumen-400/15" />
          <FavoriteButton bookId={book.id} size="sm" variant="overlay" />
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-paper-300/50 shadow-soft transition-all duration-500 ease-smooth group-hover:-translate-y-1 group-hover:shadow-soft-lg dark:border-ink-700/50">
            <BookCover
              title={title}
              author={author?.name}
              src={book.coverImage || undefined}
            />
          </div>
        </div>

        <div className="space-y-1.5 px-1">
          <h3 className="font-serif text-base font-semibold leading-snug text-ink-900 transition-colors group-hover:text-lumen-600 dark:text-ink-50 dark:group-hover:text-lumen-400 line-clamp-2">
            {title}
          </h3>
          {author && (
            <p className="font-serif text-xs italic text-ink-300 dark:text-ink-200">
              {author.name}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1 text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
            <span>{book.chapters.length} ch</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-40" />
            <span>{book.quiz.length} q</span>
            {book.originalLanguage && (
              <>
                <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                <span>{book.originalLanguage}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
