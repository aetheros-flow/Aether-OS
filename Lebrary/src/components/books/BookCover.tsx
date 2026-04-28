import { useMemo } from 'react';

interface BookCoverProps {
  title: string;
  author?: string;
  src?: string;
  className?: string;
}

const PALETTES = [
  { from: '#2A241A', to: '#6B5437', accent: '#E8C17A' },
  { from: '#1C1A15', to: '#3A342A', accent: '#D4A75D' },
  { from: '#231E15', to: '#8B6F47', accent: '#E8C17A' },
  { from: '#2B2620', to: '#5B4A33', accent: '#B8860B' },
  { from: '#1F1C18', to: '#4A3F2C', accent: '#E8C17A' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function BookCover({ title, author, src, className = '' }: BookCoverProps) {
  const palette = useMemo(() => PALETTES[hashString(title) % PALETTES.length], [title]);
  const initial = (title.trim().charAt(0) || '·').toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={title}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden p-5 ${className}`}
      style={{
        background: `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
      aria-label={title}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-2"
        style={{ background: `linear-gradient(180deg, ${palette.accent}26 0%, transparent 100%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-20 blur-2xl"
        style={{ background: palette.accent }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: palette.accent }}
        >
          Lumina
        </span>
        <span
          className="h-px w-10"
          style={{ background: palette.accent, opacity: 0.5 }}
        />
      </div>

      <div className="relative z-10">
        <span
          className="font-serif text-7xl font-semibold leading-none"
          style={{ color: palette.accent }}
        >
          {initial}
        </span>
      </div>

      <div className="relative z-10 space-y-2">
        <p
          className="font-serif text-sm font-semibold leading-snug line-clamp-3"
          style={{ color: '#F5EFE0' }}
        >
          {title}
        </p>
        {author && (
          <p
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ color: palette.accent, opacity: 0.8 }}
          >
            {author}
          </p>
        )}
      </div>
    </div>
  );
}
