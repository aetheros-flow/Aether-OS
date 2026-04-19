import type { LucideIcon } from 'lucide-react';

interface BottomNavTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface UniverseBottomNavProps {
  tabs: BottomNavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Hex color for active pill background (e.g. '#A7F38F') */
  activeColor?: string;
  /** Hex background color for the bar (e.g. '#0B2118') */
  bgColor?: string;
}

export default function UniverseBottomNav({
  tabs,
  activeTab,
  onTabChange,
  activeColor = '#A7F38F',
  bgColor = '#0B2118',
}: UniverseBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: `linear-gradient(to top, ${bgColor} 60%, ${bgColor}E8 100%)`,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.06), 0 -12px 32px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="flex items-center justify-around px-2 pt-2 pb-1"
        style={{ gap: tabs.length >= 5 ? '0' : undefined }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 select-none outline-none focus-visible:outline-none"
              style={{
                minWidth: tabs.length >= 5 ? 52 : 60,
                padding: '4px 4px',
              }}
            >
              {/* Pill container */}
              <div
                className="flex flex-col items-center justify-center transition-all duration-200"
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isActive ? activeColor + '28' : 'transparent',
                }}
              >
                <tab.icon
                  size={tabs.length >= 5 ? 18 : 20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  style={{
                    color: isActive ? activeColor : 'rgba(255,255,255,0.38)',
                    filter: isActive ? `drop-shadow(0 0 6px ${activeColor}88)` : 'none',
                    transition: 'color 0.18s, filter 0.18s',
                  }}
                />
              </div>
              {/* Label */}
              <span
                className="leading-none transition-all duration-200"
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 800 : 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isActive ? activeColor : 'rgba(255,255,255,0.30)',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
