import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, SlidersHorizontal, BrainCircuit, LogOut, Home } from 'lucide-react';
import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
  mobileLabel?: string;
}

interface AuraLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  headerActions?: ReactNode;
  isDashboard?: boolean;
  onTuneClick?: () => void;
}

// ── Reusable bottom nav button ────────────────────────────────────────────────
function NavBtn({
  icon,
  label,
  active = false,
  onClick,
  accentColor = '#8B5CF6',
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-all duration-300 group active:scale-95"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
        style={active ? {
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}35`,
          boxShadow: `0 0 18px ${accentColor}30`,
        } : {
          border: '1px solid transparent',
        }}
      >
        <span
          className="transition-colors duration-300"
          style={{ color: active ? accentColor : 'rgba(255,255,255,0.32)' }}
        >
          {icon}
        </span>
      </div>
      <span
        className="text-[9px] font-black uppercase tracking-[0.14em] transition-colors duration-300"
        style={{ color: active ? accentColor : 'rgba(255,255,255,0.25)' }}
      >
        {label}
      </span>
    </button>
  );
}

export default function AuraLayout({
  children,
  title,
  subtitle,
  accentColor = '#8B5CF6',
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  isDashboard = false,
  onTuneClick,
}: AuraLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex overflow-hidden font-sans" style={{ background: '#0f0c16', color: '#F0EBF8' }}>

      {/* ══ AMBIENT BACKGROUND ══════════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-25"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0a50 50 0 1 0 0 100A50 50 0 1 0 50 0zm0 95a45 45 0 1 1 0-90 45 45 0 1 1 0 90z' fill='rgba(255,255,255,0.025)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {!isDashboard && (
        <>
          <div aria-hidden className="pointer-events-none fixed -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-[0.18]" style={{ background: accentColor, filter: 'blur(140px)' }} />
          <div aria-hidden className="pointer-events-none fixed -bottom-60 right-0 w-[600px] h-[600px] rounded-full opacity-[0.09]" style={{ background: accentColor, filter: 'blur(160px)' }} />
        </>
      )}

      {/* ══ DESKTOP SIDE NAV ════════════════════════════════════════════════ */}
      <nav
        className="hidden md:flex fixed left-0 top-0 h-full flex-col py-8 z-40 w-60"
        style={{
          background: 'rgba(12,9,20,0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Wordmark */}
        <div className="px-7 mb-10">
          <h1 className="font-serif text-[18px] font-medium tracking-tight text-white/90 mb-0.5">Aether OS</h1>
          <p className="text-[10px] font-black tracking-[0.28em] uppercase" style={{ color: 'rgba(160,140,255,0.50)' }}>
            Digital Sanctuary
          </p>
        </div>

        {/* Nav items */}
        <ul className="flex flex-col flex-1 gap-1 px-4">
          {[
            { icon: <LayoutGrid size={18} />, label: 'Universes', action: () => navigate('/'), active: isDashboard },
            { icon: <SlidersHorizontal size={18} />, label: 'Tune Frequencies', action: onTuneClick, active: false },
            { icon: <BrainCircuit size={18} />, label: 'AI Oracle', action: () => navigate('/diagnostics'), active: false },
          ].map(item => (
            <li key={item.label}>
              <button
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left group"
                style={item.active ? {
                  background: `${accentColor}18`,
                  color: accentColor,
                  boxShadow: `inset 0 0 0 1px ${accentColor}25`,
                } : {
                  color: 'rgba(255,255,255,0.40)',
                }}
              >
                <span className="group-hover:scale-110 transition-transform duration-200 shrink-0">{item.icon}</span>
                <span className="text-[13px] font-semibold tracking-tight">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <ul className="flex flex-col gap-1 px-4">
          <li>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              <LogOut size={18} />
              <span className="text-[13px] font-semibold tracking-tight">Exit Realm</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* ══ MOBILE BOTTOM NAV ═══════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-6 pt-4"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 20px)',
          background: 'rgba(10,7,18,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {isDashboard ? (
          <>
            <NavBtn
              icon={<SlidersHorizontal size={20} />}
              label="Tune"
              onClick={onTuneClick}
            />
            <NavBtn
              icon={<LayoutGrid size={22} />}
              label="Home"
              active
              accentColor={accentColor}
            />
            <NavBtn
              icon={<BrainCircuit size={20} />}
              label="Oracle"
              onClick={() => navigate('/diagnostics')}
            />
          </>
        ) : (
          <>
            <NavBtn
              icon={<Home size={20} />}
              label="Home"
              onClick={() => navigate('/')}
            />
            {tabs?.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <NavBtn
                  key={tab.id}
                  icon={React.isValidElement(tab.icon)
                    ? React.cloneElement(tab.icon as React.ReactElement<any>, { size: 20 })
                    : tab.icon}
                  label={tab.mobileLabel ?? tab.label}
                  active={isActive}
                  onClick={() => onTabChange?.(tab.id)}
                  accentColor={accentColor}
                />
              );
            })}
          </>
        )}
      </nav>

      {/* ══ MAIN CANVAS ═════════════════════════════════════════════════════ */}
      <main className="flex-1 ml-0 md:ml-60 overflow-y-auto h-screen relative z-10 custom-scrollbar"
        style={{ paddingBottom: isDashboard ? '100px' : '96px' }}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10 pt-6 md:pt-8">

          {/* Universe page header */}
          {!isDashboard && (title || subtitle || tabs) && (
            <header className="mb-6 md:mb-8 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  {subtitle && (
                    <p className="text-[10px] font-black tracking-[0.24em] uppercase mb-1.5" style={{ color: accentColor }}>
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h2 className="font-sans text-white font-bold tracking-tight text-3xl md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                      {title}
                    </h2>
                  )}
                </div>
                {headerActions && (
                  <div className="flex items-center gap-3">{headerActions}</div>
                )}
              </div>

              {/* Desktop tab pills */}
              {tabs && tabs.length > 0 && (
                <div className="hidden md:flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        className="px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 whitespace-nowrap"
                        style={{
                          color: isActive ? '#000' : 'rgba(255,255,255,0.50)',
                          backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.04)',
                          boxShadow: isActive ? `0 0 20px ${accentColor}50` : 'none',
                          border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {React.isValidElement(tab.icon)
                          ? React.cloneElement(tab.icon as React.ReactElement<any>, { size: 13 })
                          : tab.icon}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </header>
          )}

          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
