import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  ChevronRight,
  Highlighter,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useAuthors } from '@/hooks/useAuthors';
import { useHighlights } from '@/hooks/useHighlights';
import { useContentLanguage } from '@/context/LanguageContext';
import type { Author, Book, Chapter, Highlight } from '@/types';

type Result =
  | { kind: 'book'; book: Book; author?: Author; score: number }
  | { kind: 'chapter'; book: Book; chapter: Chapter; score: number }
  | { kind: 'author'; author: Author; score: number }
  | { kind: 'highlight'; highlight: Highlight; book?: Book; chapter?: Chapter; score: number };

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 24;

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { books } = useBooks();
  const { authors } = useAuthors();
  const { allHighlights } = useHighlights();
  const { t } = useContentLanguage();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlightIdx(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const authorById = new Map(authors.map((a) => [a.id, a]));
    const bookById = new Map(books.map((b) => [b.id, b]));
    const chapterById = new Map<string, { book: Book; chapter: Chapter }>();
    for (const b of books) {
      for (const c of b.chapters) chapterById.set(c.id, { book: b, chapter: c });
    }

    const out: Result[] = [];

    for (const book of books) {
      const title = `${t(book.title)} ${book.title.en ?? ''} ${book.title.es ?? ''}`.toLowerCase();
      const s = scoreOf(title, q);
      if (s > 0) out.push({ kind: 'book', book, author: authorById.get(book.authorId), score: s });
    }

    for (const author of authors) {
      const s = scoreOf(author.name.toLowerCase(), q);
      if (s > 0) out.push({ kind: 'author', author, score: s });
    }

    for (const b of books) {
      for (const ch of b.chapters) {
        const title = `${t(ch.title)} ${ch.title.en ?? ''} ${ch.title.es ?? ''}`.toLowerCase();
        const s = scoreOf(title, q);
        if (s > 0) out.push({ kind: 'chapter', book: b, chapter: ch, score: s * 0.8 });
      }
    }

    for (const h of allHighlights) {
      const hay = `${h.text} ${h.note}`.toLowerCase();
      const s = scoreOf(hay, q);
      if (s > 0) {
        out.push({
          kind: 'highlight',
          highlight: h,
          book: bookById.get(h.bookId),
          chapter: chapterById.get(h.chapterId)?.chapter,
          score: s * 0.9,
        });
      }
    }

    out.sort((a, b) => b.score - a.score);
    return out.slice(0, MAX_RESULTS);
  }, [query, books, authors, allHighlights, t]);

  useEffect(() => {
    setHighlightIdx((idx) => Math.min(idx, Math.max(results.length - 1, 0)));
  }, [results.length]);

  const go = (r: Result) => {
    onClose();
    switch (r.kind) {
      case 'book': navigate(`/books/${r.book.id}`); break;
      case 'author': navigate(`/authors/${r.author.id}`); break;
      case 'chapter': navigate(`/books/${r.book.id}/read/${r.chapter.order}`); break;
      case 'highlight':
        if (r.book && r.chapter) {
          navigate(`/books/${r.book.id}/read/${r.chapter.order}?highlight=${r.highlight.id}`);
        }
        break;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[highlightIdx];
      if (r) go(r);
    }
  };

  if (!open) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-paper-300/70 bg-paper-50 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-900">
        <div className="flex items-center gap-3 border-b border-paper-300/60 px-5 py-3 dark:border-ink-700/60">
          <Search className="h-4 w-4 text-ink-300 dark:text-ink-200" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search books, authors, chapters, highlights…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-ink-300 dark:placeholder:text-ink-200"
          />
          <kbd className="hidden items-center rounded border border-paper-300/70 bg-paper-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-300 sm:inline-flex dark:border-ink-700/60 dark:bg-ink-800 dark:text-ink-200">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <EmptyHint />
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-300 dark:text-ink-200">
              No matches for <strong>{query}</strong>.
            </div>
          ) : (
            <ul className="space-y-0.5">
              {results.map((r, i) => (
                <li key={resultKey(r)}>
                  <ResultRow
                    result={r}
                    active={i === highlightIdx}
                    onSelect={() => go(r)}
                    onHover={() => setHighlightIdx(i)}
                    tLocalize={t}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-paper-300/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:border-ink-700/60 dark:text-ink-200">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-paper-300/70 px-1">↑↓</kbd> navigate
            <kbd className="ml-2 rounded border border-paper-300/70 px-1">↵</kbd> open
          </span>
          <span>{results.length} matches</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EmptyHint() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 text-xs text-ink-300 dark:text-ink-200">
      <Hint icon={<BookMarked className="h-3.5 w-3.5" />} label="Books & chapters" />
      <Hint icon={<User className="h-3.5 w-3.5" />} label="Authors" />
      <Hint icon={<Highlighter className="h-3.5 w-3.5" />} label="Highlights & notes" />
      <Hint icon={<Sparkles className="h-3.5 w-3.5" />} label="Fuzzy match across all" />
    </div>
  );
}

function Hint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-paper-300/60 px-3 py-2 dark:border-ink-700/60">
      <span className="text-lumen-500 dark:text-lumen-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

interface ResultRowProps {
  result: Result;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  tLocalize: (x: { en?: string; es?: string }) => string;
}

function ResultRow({ result, active, onSelect, onHover, tLocalize }: ResultRowProps) {
  const base = `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
    active ? 'bg-lumen-400/15 text-ink-900 dark:text-ink-50' : 'hover:bg-paper-200/60 dark:hover:bg-ink-800/50'
  }`;

  if (result.kind === 'book') {
    return (
      <button onClick={onSelect} onMouseEnter={onHover} className={base}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lumen-400/15 text-lumen-600 dark:text-lumen-400">
          <BookMarked className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tLocalize(result.book.title)}</p>
          <p className="truncate text-[11px] text-ink-300 dark:text-ink-200">
            Book{result.author ? ` · ${result.author.name}` : ''}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-200" />
      </button>
    );
  }

  if (result.kind === 'author') {
    return (
      <button onClick={onSelect} onMouseEnter={onHover} className={base}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-ink-700 dark:bg-ink-700 dark:text-ink-50">
          <User className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{result.author.name}</p>
          <p className="text-[11px] text-ink-300 dark:text-ink-200">Author</p>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-200" />
      </button>
    );
  }

  if (result.kind === 'chapter') {
    return (
      <button onClick={onSelect} onMouseEnter={onHover} className={base}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-ink-700 dark:bg-ink-700 dark:text-ink-50 text-[10px] font-semibold tabular-nums">
          {String(result.chapter.order).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{tLocalize(result.chapter.title)}</p>
          <p className="truncate text-[11px] text-ink-300 dark:text-ink-200">
            Chapter · {tLocalize(result.book.title)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-200" />
      </button>
    );
  }

  // highlight
  return (
    <button onClick={onSelect} onMouseEnter={onHover} className={base}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lumen-400/15 text-lumen-600 dark:text-lumen-400">
        <Highlighter className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-sm italic">&ldquo;{result.highlight.text}&rdquo;</p>
        <p className="truncate text-[11px] text-ink-300 dark:text-ink-200">
          Highlight{result.book ? ` · ${tLocalize(result.book.title)}` : ''}
          {result.chapter ? ` · ch. ${result.chapter.order}` : ''}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-200" />
    </button>
  );
}

function resultKey(r: Result): string {
  switch (r.kind) {
    case 'book': return `book:${r.book.id}`;
    case 'author': return `author:${r.author.id}`;
    case 'chapter': return `chapter:${r.chapter.id}`;
    case 'highlight': return `hl:${r.highlight.id}`;
  }
}

// Simple substring + prefix scorer. Higher = more relevant.
function scoreOf(haystack: string, needle: string): number {
  if (haystack.startsWith(needle)) return 100;
  const idx = haystack.indexOf(needle);
  if (idx >= 0) return 50 - Math.min(idx, 45);
  // Multi-word match (all tokens present)
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((tok) => haystack.includes(tok))) return 30;
  return 0;
}
