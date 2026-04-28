import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, NotebookPen, Sparkles, Type } from 'lucide-react';
import { useBook } from '@/hooks/useBooks';
import { useContentLanguage } from '@/context/LanguageContext';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { useHighlights } from '@/hooks/useHighlights';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/common/LoadingState';
import { HighlightedParagraph } from '@/components/reader/HighlightedParagraph';
import { HighlightToolbar } from '@/components/reader/HighlightToolbar';
import { HighlightPopover } from '@/components/reader/HighlightPopover';
import { ChatPanel } from '@/components/reader/ChatPanel';
import type { Highlight, ReaderFontSize } from '@/types';

const FONT_SIZE_CLASS: Record<ReaderFontSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

interface SelectionInfo {
  text: string;
  prefix: string;
  suffix: string;
  paragraphIndex: number;
  rect: DOMRect;
}

type FloatingState =
  | { kind: 'none' }
  | { kind: 'selection'; info: SelectionInfo }
  | { kind: 'highlight'; highlight: Highlight; rect: DOMRect; autoFocusNote: boolean };

interface ToolbarPosition {
  top: number;
  left: number;
  placeAbove: boolean;
}

function computeToolbarPosition(rect: DOMRect, toolbarEstimatedHeight = 48): ToolbarPosition {
  const left = rect.left + rect.width / 2;
  const wouldFitBelow = rect.bottom + toolbarEstimatedHeight + 16 < window.innerHeight;
  if (wouldFitBelow) {
    return { top: rect.bottom + 8, left, placeAbove: false };
  }
  return { top: Math.max(12, rect.top - 8), left, placeAbove: true };
}

export function ReaderView() {
  const { bookId, chapterOrder } = useParams<{ bookId: string; chapterOrder: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { book, loading, error } = useBook(bookId);
  const { t, language } = useContentLanguage();
  const { fontSize, setFontSize } = useReaderSettings();
  const { getBookProgress, markChapterCompleted, setLastReadChapter, markBookFinished } = useReadingProgress();
  const { getForChapter, createHighlight, updateNote, deleteHighlight } = useHighlights();
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState<FloatingState>({ kind: 'none' });
  const [scrollPercent, setScrollPercent] = useState(0);

  const orderNum = chapterOrder ? Number(chapterOrder) : NaN;
  const sortedChapters = useMemo(
    () => (book ? [...book.chapters].sort((a, b) => a.order - b.order) : []),
    [book],
  );
  const chapterIndex = useMemo(
    () => sortedChapters.findIndex((c) => c.order === orderNum),
    [sortedChapters, orderNum],
  );
  const chapter = chapterIndex >= 0 ? sortedChapters[chapterIndex] : null;

  const chapterHighlights = useMemo(
    () => (book && chapter ? getForChapter(book.id, chapter.id) : []),
    [book, chapter, getForChapter],
  );

  useEffect(() => {
    if (book && chapter) setLastReadChapter(book.id, chapter.id);
  }, [book, chapter, setLastReadChapter]);

  useEffect(() => {
    if (!book || !chapter || !sentinelRef.current) return;
    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) markChapterCompleted(book.id, chapter.id);
        }
      },
      { rootMargin: '0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [book, chapter, markChapterCompleted]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [chapter?.id]);

  // Auto-detect book completion. Once every chapter is in completedChapterIds
  // and finishedAt hasn't been set yet, stamp it. This keeps the finished list
  // + AetherOS KPIs in sync without requiring an explicit user action.
  useEffect(() => {
    if (!book) return;
    const p = getBookProgress(book.id);
    if (!p || p.finishedAt) return;
    const completed = new Set(p.completedChapterIds);
    const allDone =
      sortedChapters.length > 0 &&
      sortedChapters.every((c) => completed.has(c.id));
    if (allDone) markBookFinished(book.id);
  }, [book, sortedChapters, getBookProgress, markBookFinished]);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percent = height <= 0 ? 100 : Math.min(100, Math.max(0, (window.scrollY / height) * 100));
      setScrollPercent(percent);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [chapter?.id]);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setFloating((prev) => (prev.kind === 'selection' ? { kind: 'none' } : prev));
      return;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setFloating((prev) => (prev.kind === 'selection' ? { kind: 'none' } : prev));
      return;
    }

    const range = selection.getRangeAt(0);
    const contentNode = contentRef.current;
    if (!contentNode || !contentNode.contains(range.commonAncestorContainer)) return;

    const anchor = selection.anchorNode;
    const anchorEl: Element | null = !anchor
      ? null
      : anchor.nodeType === Node.ELEMENT_NODE
        ? (anchor as Element)
        : anchor.parentElement;
    const paragraphEl = anchorEl?.closest('p[data-paragraph-index]') as HTMLElement | null;
    if (!paragraphEl) return;

    const paragraphIndex = Number(paragraphEl.dataset.paragraphIndex);
    const paragraphText = paragraphEl.textContent ?? '';
    const idx = paragraphText.indexOf(selectedText);
    if (idx < 0) return;

    const prefix = paragraphText.slice(Math.max(0, idx - 24), idx);
    const suffix = paragraphText.slice(
      idx + selectedText.length,
      Math.min(paragraphText.length, idx + selectedText.length + 24),
    );

    setFloating({
      kind: 'selection',
      info: { text: selectedText, prefix, suffix, paragraphIndex, rect: range.getBoundingClientRect() },
    });
  }, []);

  useEffect(() => {
    const onUp = () => {
      window.setTimeout(handleSelection, 10);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, [handleSelection]);

  const handleCreateHighlight = useCallback(
    async (withNote: boolean) => {
      if (!book || !chapter || floating.kind !== 'selection') return;
      const { info } = floating;

      // De-dupe: same text in the same chapter → open the existing highlight instead
      // of appending a duplicate to the notebook.
      const normalized = info.text.trim().toLowerCase();
      const existing = chapterHighlights.find(
        (h) => h.text.trim().toLowerCase() === normalized,
      );

      window.getSelection()?.removeAllRanges();

      if (existing) {
        setFloating({
          kind: 'highlight',
          highlight: existing,
          rect: info.rect,
          autoFocusNote: withNote,
        });
        return;
      }

      const created = await createHighlight({
        bookId: book.id,
        chapterId: chapter.id,
        text: info.text,
        language,
        prefix: info.prefix,
        suffix: info.suffix,
      });
      if (withNote && created) {
        setFloating({
          kind: 'highlight',
          highlight: created,
          rect: info.rect,
          autoFocusNote: true,
        });
      } else {
        setFloating({ kind: 'none' });
      }
    },
    [book, chapter, floating, chapterHighlights, createHighlight, language],
  );

  const handleHighlightClick = useCallback((highlight: Highlight, rect: DOMRect) => {
    setFloating({ kind: 'highlight', highlight, rect, autoFocusNote: false });
  }, []);

  // Deep-link: when opening the chapter with ?highlight=<id>, scroll to the
  // matching <mark> element and play a flash animation once content is painted.
  useEffect(() => {
    if (!book || !chapter) return;
    const hlId = searchParams.get('highlight');
    if (!hlId) return;

    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-highlight-id="${hlId}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash-highlight');
      window.setTimeout(() => el.classList.remove('flash-highlight'), 2400);

      // Clear the query param once consumed, so a second navigation to the same
      // URL re-triggers the effect but a manual refresh doesn't re-flash forever.
      const next = new URLSearchParams(searchParams);
      next.delete('highlight');
      setSearchParams(next, { replace: true });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [book, chapter, searchParams, setSearchParams]);

  if (loading) return <LoadingState label="Opening the chapter…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!book) return <ErrorState message="Book not found." />;
  if (!chapter) return <Navigate to={`/books/${bookId}`} replace />;

  const progress = getBookProgress(book.id);
  const completedIds = new Set(progress?.completedChapterIds ?? []);
  const isCompleted = completedIds.has(chapter.id);
  const prev = chapterIndex > 0 ? sortedChapters[chapterIndex - 1] : null;
  const next = chapterIndex < sortedChapters.length - 1 ? sortedChapters[chapterIndex + 1] : null;
  const paragraphs = t(chapter.content).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const keyIdeas = (chapter.keyIdeas ?? []).map((k) => t(k)).filter(Boolean);

  return (
    <div className="relative">
      <div className="sticky top-[64px] z-30 -mx-6 mb-6 border-b border-paper-300/40 bg-paper-100/80 px-6 py-3 backdrop-blur-xl lg:-mx-10 lg:px-10 dark:border-ink-700/40 dark:bg-ink-900/80">
        <div className="mx-auto flex max-w-[68ch] items-center justify-between gap-4">
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="line-clamp-1 max-w-[180px] md:max-w-none">{t(book.title)}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden tabular-nums text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200 sm:inline">
              {Math.round(scrollPercent)}%
            </span>
            <FontSizeControl value={fontSize} onChange={setFontSize} />
          </div>
        </div>
      </div>

      <ChapterProgress
        chapters={sortedChapters}
        currentIndex={chapterIndex}
        completed={completedIds}
        onJump={(order) => navigate(`/books/${book.id}/read/${order}`)}
      />

      <article className="mx-auto max-w-[68ch] pt-12">
        <header className="space-y-3 pb-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-lumen-500 dark:text-lumen-400">
              Chapter {chapter.order}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-lumen-400/50 to-transparent" />
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
            {t(chapter.title)}
          </h1>
          {chapter.estimatedReadingMinutes ? (
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
              {chapter.estimatedReadingMinutes} min read
            </p>
          ) : null}
        </header>

        {keyIdeas.length > 0 && (
          <aside className="mb-12 rounded-3xl border border-lumen-400/25 bg-lumen-400/5 p-6">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lumen-600 dark:text-lumen-300">
              <Sparkles className="h-3.5 w-3.5" />
              Key ideas
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-ink-700 dark:text-ink-100">
              {keyIdeas.map((idea, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lumen-400" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div
          ref={contentRef}
          className={`reading-body select-text ${FONT_SIZE_CLASS[fontSize]} text-ink-800 dark:text-ink-50`}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <HighlightedParagraph
                key={`${chapter.id}-${i}`}
                index={i}
                text={p}
                highlights={chapterHighlights}
                onHighlightClick={handleHighlightClick}
              />
            ))
          ) : (
            <p className="italic text-ink-300 dark:text-ink-200">
              This chapter has no content yet.
            </p>
          )}
        </div>

        <div ref={sentinelRef} aria-hidden className="h-px" />

        <footer className="mt-16 flex flex-col items-center gap-6 border-t border-paper-300/60 pt-10 dark:border-ink-700/60">
          {isCompleted ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-lumen-400/40 bg-lumen-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-lumen-600 dark:text-lumen-300">
              <Check className="h-3.5 w-3.5" /> Chapter complete
            </span>
          ) : (
            <Button variant="secondary" onClick={() => markChapterCompleted(book.id, chapter.id)}>
              Mark as read
            </Button>
          )}

          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              leadingIcon={<ArrowLeft className="h-4 w-4" />}
              disabled={!prev}
              onClick={() => prev && navigate(`/books/${book.id}/read/${prev.order}`)}
            >
              {prev ? <span className="line-clamp-1 max-w-[180px] md:max-w-[240px]">{t(prev.title)}</span> : 'No previous chapter'}
            </Button>
            <Button
              variant="primary"
              size="md"
              trailingIcon={<ArrowRight className="h-4 w-4" />}
              disabled={!next}
              onClick={() => next && navigate(`/books/${book.id}/read/${next.order}`)}
            >
              {next ? <span className="line-clamp-1 max-w-[180px] md:max-w-[240px]">{t(next.title)}</span> : 'End of book'}
            </Button>
          </div>

          {chapterHighlights.length > 0 && (
            <Link
              to={`/notebook?book=${book.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
            >
              <NotebookPen className="h-3.5 w-3.5" />
              {chapterHighlights.length} highlight{chapterHighlights.length === 1 ? '' : 's'} on this chapter
            </Link>
          )}
        </footer>
      </article>

      {floating.kind === 'selection' && (() => {
        const pos = computeToolbarPosition(floating.info.rect, 48);
        return (
          <HighlightToolbar
            top={pos.top}
            left={pos.left}
            placeAbove={pos.placeAbove}
            onHighlight={() => handleCreateHighlight(false)}
            onHighlightWithNote={() => handleCreateHighlight(true)}
          />
        );
      })()}

      <ChatPanel book={book} chapter={chapter} />

      {floating.kind === 'highlight' && (() => {
        const pos = computeToolbarPosition(floating.rect, 260);
        return (
          <HighlightPopover
            top={pos.placeAbove ? floating.rect.top : floating.rect.bottom}
            left={pos.left}
            placeAbove={pos.placeAbove}
            highlight={floating.highlight}
            autoFocusNote={floating.autoFocusNote}
            onSaveNote={(note) => updateNote(book.id, floating.highlight.id, note)}
            onDelete={() => {
              deleteHighlight(book.id, floating.highlight.id);
              setFloating({ kind: 'none' });
            }}
            onClose={() => setFloating({ kind: 'none' })}
          />
        );
      })()}
    </div>
  );
}

interface FontSizeControlProps {
  value: ReaderFontSize;
  onChange: (value: ReaderFontSize) => void;
}

function FontSizeControl({ value, onChange }: FontSizeControlProps) {
  const sizes: ReaderFontSize[] = ['sm', 'md', 'lg', 'xl'];
  return (
    <div className="flex items-center gap-1 rounded-full border border-paper-300/70 bg-paper-50/80 px-2 py-1.5 shadow-soft backdrop-blur-md dark:border-ink-700/60 dark:bg-ink-800/70">
      <Type className="mx-1 h-3.5 w-3.5 text-ink-300 dark:text-ink-200" />
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-label={`Font size ${s}`}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
            value === s
              ? 'bg-lumen-400 text-ink-900'
              : 'text-ink-700 hover:text-ink-900 dark:text-ink-100 dark:hover:text-ink-50'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

interface ChapterProgressProps {
  chapters: { id: string; order: number }[];
  currentIndex: number;
  completed: Set<string>;
  onJump: (order: number) => void;
}

function ChapterProgress({ chapters, currentIndex, completed, onJump }: ChapterProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {chapters.map((c, idx) => {
        const isCurrent = idx === currentIndex;
        const isDone = completed.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onJump(c.order)}
            aria-label={`Go to chapter ${c.order}`}
            className={`h-1.5 flex-1 rounded-full transition-all hover:h-2 ${
              isCurrent
                ? 'bg-lumen-400'
                : isDone
                  ? 'bg-lumen-400/50 dark:bg-lumen-400/40'
                  : 'bg-paper-300 dark:bg-ink-700'
            }`}
          />
        );
      })}
    </div>
  );
}
