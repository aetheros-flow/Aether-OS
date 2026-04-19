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
  /** Hex color for the active tab indicator (e.g. '#A7F38F') */
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
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 backdrop-blur-xl"
      style={{
        backgroundColor: bgColor + 'F0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all active:scale-90 min-w-[48px]"
              style={{ color: isActive ? activeColor : 'rgba(255,255,255,0.35)' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[8px] font-black uppercase tracking-wider leading-none mt-0.5">
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: activeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
