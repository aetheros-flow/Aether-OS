import { STREAMING_PROVIDERS, type StreamingProviderKey, PANTALLA_ACCENT } from '../lib/tmdb-constants';

interface ProviderFilterProps {
  active: StreamingProviderKey;
  onChange: (key: StreamingProviderKey) => void;
}

export default function ProviderFilter({ active, onChange }: ProviderFilterProps) {
  return (
    <div className="-mx-4 md:mx-0">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth px-4 md:px-0">
        {STREAMING_PROVIDERS.map(p => {
          const isActive = active === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onChange(p.key)}
              className="relative flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 active:scale-95"
              style={{
                background: isActive ? `${PANTALLA_ACCENT}18` : 'rgba(255,255,255,0.045)',
                border: `1px solid ${isActive ? `${PANTALLA_ACCENT}55` : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? PANTALLA_ACCENT : '#d4d4d8',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: p.color,
                  boxShadow: isActive ? `0 0 6px ${p.color}` : 'none',
                }}
              />
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
