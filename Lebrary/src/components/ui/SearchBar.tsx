import { Search, X } from 'lucide-react';
import type { ChangeEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div className="relative group">
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-ink-200 pointer-events-none transition-colors group-focus-within:text-lumen-500 dark:group-focus-within:text-lumen-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-paper-300/70 bg-paper-50/80 backdrop-blur-md py-3.5 pl-12 pr-12 text-sm text-ink-800 placeholder:text-ink-200 shadow-soft outline-none transition-all focus:border-lumen-400/70 focus:shadow-glow dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-50 dark:placeholder:text-ink-300"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-300 hover:text-ink-700 dark:text-ink-200 dark:hover:text-ink-50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
