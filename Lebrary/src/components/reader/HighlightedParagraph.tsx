import type { Highlight } from '@/types';

interface HighlightedParagraphProps {
  text: string;
  index: number;
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight, rect: DOMRect) => void;
}

interface Segment {
  text: string;
  highlight?: Highlight;
}

function applyHighlights(paragraph: string, highlights: Highlight[]): Segment[] {
  type Range = { start: number; end: number; highlight: Highlight };
  const ranges: Range[] = [];

  for (const h of highlights) {
    if (!h.text) continue;

    let start = -1;

    if (h.prefix || h.suffix) {
      const needle = h.prefix + h.text + h.suffix;
      const idx = paragraph.indexOf(needle);
      if (idx >= 0) start = idx + h.prefix.length;
    }

    if (start < 0) {
      const idx = paragraph.indexOf(h.text);
      if (idx < 0) continue;
      start = idx;
    }

    ranges.push({ start, end: start + h.text.length, highlight: h });
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) continue;
    merged.push(r);
  }

  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) segments.push({ text: paragraph.slice(cursor, r.start) });
    segments.push({ text: paragraph.slice(r.start, r.end), highlight: r.highlight });
    cursor = r.end;
  }
  if (cursor < paragraph.length) segments.push({ text: paragraph.slice(cursor) });
  return segments;
}

export function HighlightedParagraph({
  text,
  index,
  highlights,
  onHighlightClick,
}: HighlightedParagraphProps) {
  const segments = applyHighlights(text, highlights);

  return (
    <p data-paragraph-index={index}>
      {segments.map((seg, i) => {
        if (!seg.highlight) return <span key={i}>{seg.text}</span>;
        const h = seg.highlight;
        const hasNote = h.note.trim().length > 0;
        return (
          <mark
            key={i}
            data-highlight-id={h.id}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onHighlightClick(h, rect);
            }}
            className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
              hasNote
                ? 'bg-lumen-400/40 hover:bg-lumen-400/60 dark:bg-lumen-400/35 dark:hover:bg-lumen-400/50'
                : 'bg-lumen-400/25 hover:bg-lumen-400/45 dark:bg-lumen-400/20 dark:hover:bg-lumen-400/35'
            } text-inherit`}
          >
            {seg.text}
          </mark>
        );
      })}
    </p>
  );
}
