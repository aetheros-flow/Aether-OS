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
      <Search size={17} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#A8A096' }} />
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
        className="w-full h-11 pl-11 pr-11 rounded-2xl text-[14px] font-medium outline-none transition-colors [&::-webkit-search-cancel-button]:appearance-none"
        style={{
          background: 'rgba(232,221,204,0.05)',
          border: '1px solid rgba(232,221,204,0.09)',
          color: '#F5EFE6',
        }}
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear?.(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full active:scale-90 transition"
          style={{ background: 'rgba(232,221,204,0.07)', color: '#A8A096' }}
          aria-label="Clear search"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
