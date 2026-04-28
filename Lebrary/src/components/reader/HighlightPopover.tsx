import { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { Highlight } from '@/types';

interface HighlightPopoverProps {
  top: number;
  left: number;
  placeAbove: boolean;
  highlight: Highlight;
  autoFocusNote?: boolean;
  onSaveNote: (note: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function HighlightPopover({
  top,
  left,
  placeAbove,
  highlight,
  autoFocusNote = false,
  onSaveNote,
  onDelete,
  onClose,
}: HighlightPopoverProps) {
  const [note, setNote] = useState(highlight.note);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNote(highlight.note);
  }, [highlight.id, highlight.note]);

  useEffect(() => {
    if (autoFocusNote) {
      textareaRef.current?.focus();
    }
  }, [autoFocusNote, highlight.id]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (note !== highlight.note) onSaveNote(note);
        onClose();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [note, highlight.note, onSaveNote, onClose]);

  const translateY = placeAbove ? 'calc(-100% - 8px)' : '8px';

  return (
    <div
      ref={rootRef}
      style={{ top, left, transform: `translate(-50%, ${translateY})` }}
      className="fixed z-50 w-[min(380px,calc(100vw-32px))] rounded-2xl border border-paper-300/70 bg-paper-50/95 shadow-soft-lg backdrop-blur-md dark:border-ink-700/60 dark:bg-ink-800/95"
    >
      <div className="flex items-start justify-between gap-2 border-b border-paper-300/60 p-4 dark:border-ink-700/50">
        <blockquote className="font-serif text-sm italic leading-snug text-ink-800 line-clamp-3 dark:text-ink-50">
          &ldquo;{highlight.text}&rdquo;
        </blockquote>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (confirmingDelete) {
                onDelete();
              } else {
                setConfirmingDelete(true);
              }
            }}
            aria-label={confirmingDelete ? 'Confirm delete' : 'Delete highlight'}
            className={`flex h-7 items-center justify-center gap-1 rounded-full px-2 transition-all ${
              confirmingDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-ink-300 hover:bg-red-500/10 hover:text-red-500 dark:text-ink-200'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmingDelete && <span className="text-[10px] font-semibold uppercase tracking-widest">Confirm</span>}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-ink-700 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== highlight.note) onSaveNote(note);
          }}
          placeholder="Add a note…"
          rows={4}
          className="w-full resize-none rounded-xl border border-paper-300/70 bg-paper-50/70 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-50 dark:placeholder:text-ink-200"
        />

        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-300 dark:text-ink-200">
          {new Date(highlight.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
