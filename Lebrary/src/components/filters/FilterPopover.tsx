import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

interface FilterPopoverProps {
  genres: string[];
  selectedGenre: string | null;
  onGenreChange: (g: string | null) => void;
  selectedLanguage: 'en' | 'es' | null;
  onLanguageChange: (lang: 'en' | 'es' | null) => void;
  onClearAll: () => void;
}

export function FilterPopover({
  genres,
  selectedGenre,
  onGenreChange,
  selectedLanguage,
  onLanguageChange,
  onClearAll,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeCount = (selectedGenre ? 1 : 0) + (selectedLanguage ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeSummary =
    [selectedGenre, selectedLanguage === 'en' ? 'EN' : selectedLanguage === 'es' ? 'ES' : null]
      .filter(Boolean)
      .join(' · ') || null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={activeSummary ?? 'Filter library'}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-medium shadow-soft backdrop-blur-md transition-all duration-200 ${
          activeCount > 0
            ? 'border-lumen-400/60 bg-lumen-400/15 text-lumen-600 dark:text-lumen-300'
            : 'border-paper-300/70 bg-paper-50/80 text-ink-700 hover:border-lumen-400/40 hover:text-lumen-600 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-lumen-400 px-1 text-[10px] font-bold tabular-nums text-ink-900">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter options"
          className="absolute right-0 top-full z-40 mt-2 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-paper-300/70 bg-paper-50 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-900"
        >
          <div className="flex items-center justify-between border-b border-paper-300/60 px-4 py-3 dark:border-ink-700/60">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-700 dark:text-ink-100">
              Filter library
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setOpen(false);
                }}
                className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 transition-colors hover:text-lumen-500 dark:text-ink-200 dark:hover:text-lumen-400"
              >
                Clear all
              </button>
            )}
          </div>

          {genres.length > 0 && (
            <FilterSection title="Genre">
              {genres.map((g) => (
                <FilterChip
                  key={g}
                  active={selectedGenre === g}
                  onClick={() => onGenreChange(selectedGenre === g ? null : g)}
                >
                  {g}
                </FilterChip>
              ))}
            </FilterSection>
          )}

          <FilterSection title="Original language">
            <FilterChip
              active={selectedLanguage === 'en'}
              onClick={() => onLanguageChange(selectedLanguage === 'en' ? null : 'en')}
            >
              English
            </FilterChip>
            <FilterChip
              active={selectedLanguage === 'es'}
              onClick={() => onLanguageChange(selectedLanguage === 'es' ? null : 'es')}
            >
              Spanish
            </FilterChip>
          </FilterSection>

          <p className="border-t border-paper-300/60 bg-paper-100/50 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:border-ink-700/60 dark:bg-ink-800/50 dark:text-ink-200">
            Tip: combine filters — click chips to toggle
          </p>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-paper-300/40 p-4 last:border-b-0 dark:border-ink-700/40">
      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full border whitespace-nowrap transition-all duration-300 ease-smooth ${
        active
          ? 'scale-100 border-lumen-400/70 bg-lumen-400/15 px-3 py-1 text-xs font-semibold text-lumen-600 dark:text-lumen-300'
          : 'scale-95 border-paper-300/60 bg-transparent px-2.5 py-0.5 text-[11px] font-medium text-ink-700 hover:scale-100 hover:border-paper-300 hover:text-ink-900 dark:border-ink-700/50 dark:text-ink-100 dark:hover:border-ink-700 dark:hover:text-ink-50'
      }`}
    >
      <Check className={`h-3 w-3 transition-all duration-300 ${active ? 'opacity-100' : 'w-0 opacity-0'}`} />
      <span>{children}</span>
    </button>
  );
}
