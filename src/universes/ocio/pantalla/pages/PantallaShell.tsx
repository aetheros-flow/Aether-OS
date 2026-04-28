import { useNavigate, useLocation, Outlet, Link, matchPath } from 'react-router-dom';
import { Home, Clapperboard, Tv, User, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PantallaProvider } from '../context';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';

const TABS = [
  { id: 'home',    label: 'Home',    icon: Home,         path: '/ocio/pantalla' },
  { id: 'movies',  label: 'Movies',  icon: Clapperboard, path: '/ocio/pantalla/movies' },
  { id: 'shows',   label: 'TV',      icon: Tv,           path: '/ocio/pantalla/shows' },
  { id: 'profile', label: 'Profile', icon: User,         path: '/ocio/pantalla/profile' },
] as const;

function activeTabId(pathname: string): typeof TABS[number]['id'] {
  if (pathname.startsWith('/ocio/pantalla/movies')) return 'movies';
  if (pathname.startsWith('/ocio/pantalla/shows')) return 'shows';
  if (pathname.startsWith('/ocio/pantalla/profile')) return 'profile';
  return 'home';
}

function NavBtn({ icon: Icon, label, active, onClick }: {
  icon: LucideIcon; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-all duration-300 active:scale-95"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
        style={active ? {
          background: `${PANTALLA_ACCENT}18`,
          border: `1px solid ${PANTALLA_ACCENT}35`,
          boxShadow: `0 0 18px ${PANTALLA_ACCENT}30`,
        } : { border: '1px solid transparent' }}
      >
        <Icon size={20} style={{ color: active ? PANTALLA_ACCENT : 'rgba(245,239,230,0.32)' }} />
      </div>
      <span
        className="text-[9px] font-black uppercase tracking-[0.14em] transition-colors duration-300"
        style={{ color: active ? PANTALLA_ACCENT : 'rgba(245,239,230,0.25)' }}
      >
        {label}
      </span>
    </button>
  );
}

export default function PantallaShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = activeTabId(location.pathname);

  const isDetail = Boolean(matchPath('/ocio/pantalla/:mediaType/:tmdbId', location.pathname));

  return (
    <PantallaProvider>
      <div
        className="min-h-screen flex flex-col relative"
        style={{ background: '#1B1714', color: '#F5EFE6' }}
      >
        {/* ── Ambient background glow ────────────────────────────────────── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-[0.12] blur-[140px]"
            style={{ background: `radial-gradient(circle, ${PANTALLA_ACCENT}, transparent 65%)` }}
          />
        </div>

        {/* ── TOP HEADER ────────────────────────────────────────────────── */}
        {!isDetail && (
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b"
            style={{
              background: 'rgba(27,23,20,0.85)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderColor: 'rgba(232,221,204,0.06)',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/ocio')}
                className="p-2 rounded-full active:scale-90 transition-transform"
                style={{
                  background: 'rgba(232,221,204,0.06)',
                  border: '1px solid rgba(232,221,204,0.10)',
                  color: '#A8A096',
                }}
                aria-label="Back to Ocio"
              >
                <ArrowLeft size={16} strokeWidth={2.25} />
              </button>
              <div className="leading-tight">
                <h1 className="font-serif text-lg md:text-xl tracking-tight" style={{ color: '#F5EFE6' }}>Pantalla</h1>
                <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#A8A096' }}>
                  Movies & TV
                </p>
              </div>
            </div>

            {/* Desktop inline tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(tab => {
                const isActive = active === tab.id;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                    style={{
                      color: isActive ? PANTALLA_ACCENT : '#A8A096',
                      background: isActive ? `${PANTALLA_ACCENT}14` : 'transparent',
                      border: `1px solid ${isActive ? `${PANTALLA_ACCENT}35` : 'transparent'}`,
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.4 : 1.9} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </header>
        )}

        {/* ── MAIN OUTLET ───────────────────────────────────────────────── */}
        <main className="flex-1 relative z-10 pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-6">
          <div className={isDetail ? '' : 'px-4 md:px-8 pt-5 md:pt-8'}>
            <Outlet />
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-6 pt-4"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 20px)',
            background: 'rgba(22,18,15,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(232,221,204,0.06)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {TABS.map(tab => (
            <NavBtn
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={active === tab.id}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </nav>
      </div>
    </PantallaProvider>
  );
}
