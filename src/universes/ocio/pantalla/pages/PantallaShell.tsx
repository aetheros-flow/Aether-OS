import { useNavigate, useLocation, Outlet, Link, matchPath } from 'react-router-dom';
import { Home, Clapperboard, Tv, User, ArrowLeft } from 'lucide-react';
import UniverseBottomNav from '../../../../core/components/UniverseBottomNav';
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

export default function PantallaShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = activeTabId(location.pathname);

  // Detail pages render their own full-bleed header — suppress the shell header there.
  const isDetail = Boolean(matchPath('/ocio/pantalla/:mediaType/:tmdbId', location.pathname));

  return (
    <PantallaProvider>
      <div className="min-h-screen flex flex-col bg-black text-white relative">

        {/* ── Ambient background glow (subtle, behind everything) ────────── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-[0.08] blur-[140px]"
            style={{ background: `radial-gradient(circle, ${PANTALLA_ACCENT}, transparent 65%)` }}
          />
        </div>

        {/* ── TOP HEADER (hidden on detail pages — they draw their own) ──── */}
        {!isDetail && (
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/5"
            style={{
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/ocio')}
                className="p-2 rounded-full bg-white/5 ring-1 ring-white/10 text-zinc-300 active:scale-90 transition-transform"
                aria-label="Back to Ocio"
              >
                <ArrowLeft size={16} strokeWidth={2.25} />
              </button>
              <div className="leading-tight">
                <h1 className="font-serif text-lg md:text-xl text-white tracking-tight">Pantalla</h1>
                <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">
                  Movies & TV
                </p>
              </div>
            </div>

            {/* Desktop inline tabs (mobile uses bottom nav) */}
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
                      color: isActive ? PANTALLA_ACCENT : '#a1a1aa',
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
        <main className="flex-1 relative z-10 pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-6">
          <div className={isDetail ? '' : 'px-4 md:px-8 pt-5 md:pt-8'}>
            <Outlet />
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
        <div className="md:hidden">
          <UniverseBottomNav
            tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
            activeTab={active}
            onTabChange={(id) => {
              const tab = TABS.find(t => t.id === id);
              if (tab) navigate(tab.path);
            }}
            activeColor={PANTALLA_ACCENT}
            bgColor="#000000"
          />
        </div>
      </div>
    </PantallaProvider>
  );
}
