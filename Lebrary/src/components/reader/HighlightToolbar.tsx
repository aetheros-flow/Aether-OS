import { Highlighter, StickyNote } from 'lucide-react';
import { forwardRef } from 'react';

interface HighlightToolbarProps {
  top: number;
  left: number;
  placeAbove: boolean;
  onHighlight: () => void;
  onHighlightWithNote: () => void;
}

export const HighlightToolbar = forwardRef<HTMLDivElement, HighlightToolbarProps>(
  function HighlightToolbar({ top, left, placeAbove, onHighlight, onHighlightWithNote }, ref) {
    const translateY = placeAbove ? '-100%' : '0';
    return (
      <div
        ref={ref}
        role="toolbar"
        style={{ top, left, transform: `translate(-50%, ${translateY})` }}
        className="pointer-events-auto fixed z-50 flex items-center gap-1 rounded-full border border-ink-700/20 bg-ink-900/95 px-1.5 py-1 text-ink-50 shadow-soft-lg backdrop-blur-md"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={onHighlight}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-lumen-400/20 hover:text-lumen-300"
        >
          <Highlighter className="h-3.5 w-3.5" />
          Highlight
        </button>
        <span className="h-4 w-px bg-ink-50/20" />
        <button
          type="button"
          onClick={onHighlightWithNote}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-lumen-400/20 hover:text-lumen-300"
        >
          <StickyNote className="h-3.5 w-3.5" />
          With note
        </button>
      </div>
    );
  },
);
