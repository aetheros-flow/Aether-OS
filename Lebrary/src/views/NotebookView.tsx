import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Download, NotebookPen, StickyNote, Trash2 } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useHighlights } from '@/hooks/useHighlights';
import { useContentLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/common/LoadingState';
import { buildHighlightsMarkdown, downloadTextFile } from '@/lib/highlight-export';
import type { Author, Book, Chapter, Highlight } from '@/types';

export function NotebookView() {
  const { books, loading: booksLoading } = useBooks();
  const { authors } = useAuthors();
  const { allHighlights, getForBook, updateNote, deleteHighlight } = useHighlights();
  const { t, language } = useContentLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterBookId = searchParams.get('book');

  const handleExport = () => {
    const authorsById = new Map<string, Author>(authors.map((a) => [a.id, a]));
    const filtered = filterBookId
      ? allHighlights.filter((h) => h.bookId === filterBookId)
      : allHighlights;
    const md = buildHighlightsMarkdown({
      books,
      authorsById,
      highlights: filtered,
      language,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    const bookSlug = filterBookId
      ? books.find((b) => b.id === filterBookId)?.id ?? 'book'
      : 'all';
    downloadTextFile(`lumina-highlights-${bookSlug}-${stamp}.md`, md);
  };

  const bookById = useMemo(() => {
    const m = new Map<string, Book>();
    books.forEach((b) => m.set(b.id, b));
    return m;
  }, [books]);

  const authorNameByBookId = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of books) {
      const author = authors.find((a) => a.id === b.authorId);
      if (author) m.set(b.id, author.name);
    }
    return m;
  }, [books, authors]);

  const booksWithHighlights = useMemo(() => {
    const bookIds = Array.from(new Set(allHighlights.map((h) => h.bookId)));
    return bookIds
      .map((id) => bookById.get(id))
      .filter((b): b is Book => !!b);
  }, [allHighlights, bookById]);

  const visibleBooks = filterBookId
    ? booksWithHighlights.filter((b) => b.id === filterBookId)
    : booksWithHighlights;

  if (booksLoading) return <LoadingState label="Opening the notebook…" />;

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <NotebookPen className="h-5 w-5 text-lumen-500 dark:text-lumen-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
              Notebook
            </span>
          </div>
          {allHighlights.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              title={filterBookId ? 'Export this book to Markdown' : 'Export all highlights to Markdown'}
              className="inline-flex items-center gap-1.5 rounded-full border border-paper-300/70 bg-paper-50/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-700 shadow-soft transition-all hover:border-lumen-400/60 hover:text-lumen-600 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400"
            >
              <Download className="h-3 w-3" />
              Export {filterBookId ? 'book' : 'all'}
            </button>
          )}
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
          {filterBookId ? t(bookById.get(filterBookId)?.title ?? { en: 'Notebook' }) : 'Your highlights & notes'}
        </h1>
        <p className="max-w-xl text-ink-700 dark:text-ink-100">
          {allHighlights.length === 0
            ? 'Select any passage while you read to save it here.'
            : `${allHighlights.length} passage${allHighlights.length === 1 ? '' : 's'} saved across ${booksWithHighlights.length} book${booksWithHighlights.length === 1 ? '' : 's'}.`}
        </p>
      </section>

      {filterBookId && (
        <Link
          to="/notebook"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All books
        </Link>
      )}

      {booksWithHighlights.length > 1 && !filterBookId && (
        <BookFilter
          books={booksWithHighlights}
          onSelect={(id) => setSearchParams({ book: id })}
        />
      )}

      {allHighlights.length === 0 ? (
        <EmptyState
          title="Your notebook is empty"
          hint="Highlights and notes you save while reading will appear here, grouped by book and chapter."
        />
      ) : (
        <div className="space-y-12">
          {visibleBooks.map((book) => (
            <BookSection
              key={book.id}
              book={book}
              authorName={authorNameByBookId.get(book.id)}
              highlights={getForBook(book.id)}
              onUpdateNote={(hlId, note) => updateNote(book.id, hlId, note)}
              onDelete={(hlId) => deleteHighlight(book.id, hlId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BookFilterProps {
  books: Book[];
  onSelect: (bookId: string) => void;
}

function BookFilter({ books, onSelect }: BookFilterProps) {
  const { t } = useContentLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          onClick={() => onSelect(book.id)}
          className="rounded-full border border-paper-300/70 bg-paper-50/60 px-3.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-lumen-400/60 hover:text-lumen-600 dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-100 dark:hover:text-lumen-400"
        >
          {t(book.title)}
        </button>
      ))}
    </div>
  );
}

interface BookSectionProps {
  book: Book;
  authorName?: string;
  highlights: Highlight[];
  onUpdateNote: (highlightId: string, note: string) => void;
  onDelete: (highlightId: string) => void;
}

function BookSection({ book, authorName, highlights, onUpdateNote, onDelete }: BookSectionProps) {
  const { t } = useContentLanguage();

  const byChapter = useMemo(() => {
    const groups = new Map<string, Highlight[]>();
    for (const h of highlights) {
      const list = groups.get(h.chapterId) ?? [];
      list.push(h);
      groups.set(h.chapterId, list);
    }
    return groups;
  }, [highlights]);

  const sortedChapters = useMemo(
    () => [...book.chapters].sort((a, b) => a.order - b.order),
    [book],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-paper-300/60 pb-4 dark:border-ink-700/60">
        <div className="space-y-1">
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-center gap-2 font-serif text-2xl font-semibold text-ink-900 transition-colors hover:text-lumen-600 dark:text-ink-50 dark:hover:text-lumen-400"
          >
            <BookOpen className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />
            {t(book.title)}
          </Link>
          {authorName && (
            <p className="font-serif text-sm italic text-ink-300 dark:text-ink-200">
              {authorName}
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200 tabular-nums">
          {highlights.length} {highlights.length === 1 ? 'passage' : 'passages'}
        </span>
      </div>

      <div className="space-y-10">
        {sortedChapters.map((chapter) => {
          const chapterHighlights = byChapter.get(chapter.id);
          if (!chapterHighlights || chapterHighlights.length === 0) return null;
          return (
            <ChapterHighlights
              key={chapter.id}
              book={book}
              chapter={chapter}
              highlights={chapterHighlights}
              onUpdateNote={onUpdateNote}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </section>
  );
}

interface ChapterHighlightsProps {
  book: Book;
  chapter: Chapter;
  highlights: Highlight[];
  onUpdateNote: (highlightId: string, note: string) => void;
  onDelete: (highlightId: string) => void;
}

function ChapterHighlights({ book, chapter, highlights, onUpdateNote, onDelete }: ChapterHighlightsProps) {
  const { t } = useContentLanguage();
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-lg font-semibold tabular-nums text-lumen-500 dark:text-lumen-400">
          {String(chapter.order).padStart(2, '0')}
        </span>
        <Link
          to={`/books/${book.id}/read/${chapter.order}`}
          className="font-serif text-lg font-medium text-ink-900 transition-colors hover:text-lumen-600 dark:text-ink-50 dark:hover:text-lumen-400"
        >
          {t(chapter.title)}
        </Link>
      </div>

      <ul className="space-y-3">
        {highlights.map((h) => (
          <HighlightItem
            key={h.id}
            book={book}
            chapter={chapter}
            highlight={h}
            onSaveNote={(note) => onUpdateNote(h.id, note)}
            onDelete={() => onDelete(h.id)}
          />
        ))}
      </ul>
    </div>
  );
}

interface HighlightItemProps {
  book: Book;
  chapter: Chapter;
  highlight: Highlight;
  onSaveNote: (note: string) => void;
  onDelete: () => void;
}

function HighlightItem({ book, chapter, highlight, onSaveNote, onDelete }: HighlightItemProps) {
  const [note, setNote] = useState(highlight.note);
  const passageHref = `/books/${book.id}/read/${chapter.order}?highlight=${highlight.id}`;

  return (
    <li>
      <Card className="space-y-4 p-5">
        <Link
          to={passageHref}
          className="group block"
          title="Open at this passage in the book"
        >
          <blockquote className="relative border-l-2 border-lumen-400 pl-4 font-serif text-base italic leading-relaxed text-ink-800 transition-colors group-hover:text-lumen-700 dark:text-ink-50 dark:group-hover:text-lumen-300">
            &ldquo;{highlight.text}&rdquo;
          </blockquote>
        </Link>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== highlight.note) onSaveNote(note);
          }}
          placeholder="Add a note…"
          rows={2}
          className="w-full resize-none rounded-xl border border-transparent bg-paper-50/60 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-lumen-400/50 focus:bg-paper-50 dark:bg-ink-900/40 dark:text-ink-50 dark:placeholder:text-ink-200 dark:focus:bg-ink-900/70"
        />

        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
          <span className="inline-flex items-center gap-1.5">
            {highlight.note.trim().length > 0 && <StickyNote className="h-3 w-3 text-lumen-500 dark:text-lumen-400" />}
            {new Date(highlight.createdAt).toLocaleDateString()} · {highlight.language.toUpperCase()}
          </span>
          <div className="flex items-center gap-1">
            <Link
              to={passageHref}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-lumen-600 transition-colors hover:bg-lumen-400/10 dark:text-lumen-400"
            >
              <ArrowUpRight className="h-3 w-3" />
              Open
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      </Card>
    </li>
  );
}
