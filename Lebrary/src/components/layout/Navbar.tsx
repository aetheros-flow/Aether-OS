import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Brain, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { CommandPalette } from '@/components/search/CommandPalette';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useQuizReviews } from '@/hooks/useQuizReviews';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 ease-smooth ${
    isActive
      ? 'text-lumen-500 dark:text-lumen-400'
      : 'text-ink-700 hover:text-ink-900 dark:text-ink-100 dark:hover:text-ink-50'
  }`;

export function Navbar() {
  const { status } = useAuth();
  const showAppLinks = status === 'authenticated';
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { dueCount } = useQuizReviews();
  const due = dueCount();

  useKeyboardShortcut({ key: 'k', cmdOrCtrl: true }, () => setPaletteOpen(true), showAppLinks);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-300/50 bg-paper-100/70 backdrop-blur-xl dark:border-ink-700/40 dark:bg-ink-900/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <NavLink
          to="/"
          className="group inline-flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lumen-400 to-lumen-600 text-paper-50 shadow-soft transition-shadow group-hover:shadow-glow">
            <BookOpen className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
              Lumina
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-ink-300 dark:text-ink-200">
              Library
            </span>
          </span>
        </NavLink>

        {showAppLinks && (
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Library
            </NavLink>
            <NavLink to="/authors" className={navLinkClass}>
              Authors
            </NavLink>
            <NavLink to="/notebook" className={navLinkClass}>
              Notebook
            </NavLink>
            <NavLink to="/shelves" className={navLinkClass}>
              Shelves
            </NavLink>
            <NavLink to="/favorites" className={navLinkClass}>
              Favorites
            </NavLink>
            <NavLink to="/finished" className={navLinkClass}>
              Finished
            </NavLink>
            <NavLink to="/review" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Review
                {due > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-lumen-400 px-1 text-[10px] font-bold tabular-nums text-ink-900">
                    {due}
                  </span>
                )}
              </span>
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {showAppLinks && (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
              title="Search (Ctrl/⌘ + K)"
              className="flex h-10 items-center gap-2 rounded-full border border-paper-300/70 bg-paper-50/80 px-3 text-xs font-medium text-ink-700 shadow-soft backdrop-blur-md transition-all hover:border-lumen-400/60 hover:text-lumen-600 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-paper-300/70 bg-paper-100 px-1 text-[10px] text-ink-300 sm:inline dark:border-ink-700/60 dark:bg-ink-900 dark:text-ink-200">
                ⌘K
              </kbd>
            </button>
          )}
          <LanguageToggle />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
