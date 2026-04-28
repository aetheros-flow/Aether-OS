import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  bookId: string;
  size?: 'sm' | 'md';
  variant?: 'overlay' | 'inline';
  onToggle?: (nextState: boolean) => void;
}

export function FavoriteButton({ bookId, size = 'md', variant = 'inline', onToggle }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(bookId);
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const padding = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  const baseClass =
    variant === 'overlay'
      ? `absolute right-3 top-3 z-10 flex ${padding} items-center justify-center rounded-full border transition-all duration-200 backdrop-blur-md active:scale-90`
      : `inline-flex ${padding} items-center justify-center rounded-full border transition-all duration-200 active:scale-90`;

  const stateClass = active
    ? 'border-lumen-400/60 bg-lumen-400/15 text-lumen-600 dark:text-lumen-400 hover:bg-lumen-400/25'
    : variant === 'overlay'
      ? 'border-paper-300/60 bg-paper-50/80 text-ink-300 hover:text-lumen-500 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:text-lumen-400'
      : 'border-paper-300/70 bg-paper-50/80 text-ink-300 hover:text-lumen-500 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-200 dark:hover:text-lumen-400';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(bookId);
        onToggle?.(!active);
      }}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      className={`${baseClass} ${stateClass}`}
    >
      <Heart className={iconSize} fill={active ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}
