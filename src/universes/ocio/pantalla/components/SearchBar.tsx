import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = 'Search Pantalla', onClear, autoFocus }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search size={17} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inputMode="search"
        enterKeyHint="search"
        autoCorrect="off"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full h-11 pl-11 pr-11 rounded-2xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none transition-colors focus:bg-white/[0.08] focus:ring-1 focus:ring-white/15 [&::-webkit-search-cancel-button]:appearance-none"
        style={{
          background: 'rgba(255,255,255,0.045)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear?.(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/8 hover:bg-white/15 text-zinc-300 active:scale-90 transition"
          aria-label="Clear search"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
