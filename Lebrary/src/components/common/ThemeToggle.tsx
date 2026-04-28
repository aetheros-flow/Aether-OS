import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative h-10 w-10 rounded-full border border-paper-300/70 bg-paper-50/80 backdrop-blur-md text-ink-700 shadow-soft transition-all duration-300 ease-smooth hover:scale-[1.05] hover:border-lumen-400/60 hover:text-lumen-500 active:scale-95 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400"
    >
      <Sun
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-500 ease-smooth ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        className={`absolute inset-0 m-auto h-4 w-4 transition-all duration-500 ease-smooth ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
