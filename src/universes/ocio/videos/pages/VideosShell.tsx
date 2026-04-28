import { useNavigate, useLocation, Outlet, Link, matchPath } from 'react-router-dom';
import { Home, ListVideo, PlaySquare, User, ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import UniverseBottomNav from '../../../../core/components/UniverseBottomNav';
import { VideosProvider } from '../context';
import { VIDEOS_ACCENT } from '../lib/platforms';
import AddVideoSheet from '../components/AddVideoSheet';

const TABS = [
  { id: 'home',    label: 'Home',    icon: Home,        path: '/ocio/videos' },
  { id: 'lists',   label: 'Lists',   icon: ListVideo,   path: '/ocio/videos/lists' },
  { id: 'watched', label: 'Watched', icon: PlaySquare,  path: '/ocio/videos/watched' },
  { id: 'profile', label: 'Profile', icon: User,        path: '/ocio/videos/profile' },
] as const;

function activeTabId(pathname: string): typeof TABS[number]['id'] {
  if (pathname.startsWith('/ocio/videos/lists')) return 'lists';
  if (pathname.startsWith('/ocio/videos/watched')) return 'watched';
  if (pathname.startsWith('/ocio/videos/profile')) return 'profile';
  if (pathname.startsWith('/ocio/videos/list/')) return 'lists';
  return 'home';
}

export default function VideosShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = activeTabId(location.pathname);
  const [addOpen, setAddOpen] = useState(false);

  const isListDetail = Boolean(matchPath('/ocio/videos/list/:listId', location.pathname));

  return (
    <VideosProvider>
      <div className="min-h-screen flex flex-col text-white relative" style={{ background: '#1B1714' }}>
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-[0.10] blur-[140px]"
            style={{ background: `radial-gradient(circle, ${VIDEOS_ACCENT}, transparent 65%)` }}
          />
        </div>

        {/* Top header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b"
          style={{
            background: 'rgba(27,23,20,0.78)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            borderBottomColor: 'rgba(232,221,204,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => isListDetail ? navigate('/ocio/videos/lists') : navigate('/ocio')}
              className="p-2 rounded-full bg-white/5 ring-1 ring-white/10 text-zinc-300 active:scale-90 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft size={16} strokeWidth={2.25} />
            </button>
            <div className="leading-tight">
              <h1 className="font-serif text-lg md:text-xl text-white tracking-tight">Videos</h1>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">
                Saved & Curated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12px] font-bold active:scale-95 transition-transform"
              style={{
                background: VIDEOS_ACCENT,
                color: '#1B1714',
                boxShadow: `0 4px 14px ${VIDEOS_ACCENT}45`,
              }}
            >
              <Plus size={13} strokeWidth={2.75} />
              Add
            </button>

            <nav className="hidden md:flex items-center gap-1 ml-2">
              {TABS.map(tab => {
                const isActive = active === tab.id;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                    style={{
                      color: isActive ? VIDEOS_ACCENT : '#a1a1aa',
                      background: isActive ? `${VIDEOS_ACCENT}14` : 'transparent',
                      border: `1px solid ${isActive ? `${VIDEOS_ACCENT}35` : 'transparent'}`,
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.4 : 1.9} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 relative z-10 pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-6">
          <div className="px-4 md:px-8 pt-5 md:pt-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <UniverseBottomNav
            tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
            activeTab={active}
            onTabChange={(id) => {
              const tab = TABS.find(t => t.id === id);
              if (tab) navigate(tab.path);
            }}
            activeColor={VIDEOS_ACCENT}
            bgColor="#1B1714"
          />
        </div>

        <AddVideoSheet open={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    </VideosProvider>
  );
}
